var _cachedToken = null;
var _tokenExpiry = 0;
var BUFFER_MS = 60000;
var CONFIG_CLIENT_ID = 'oauthClientId';
var CONFIG_CLIENT_SECRET = 'oauthClientSecret';
var CONFIG_API_BASE_URL = 'apiBaseUrl';

function handle(httpPath, req) {
  try {
    var subPath = (httpPath || '').replace(/^\//, '');
    if (subPath.indexOf('flights/') === 0) subPath = subPath.substring(8);
    return _proxy(subPath, req);
  } catch (e) {
    return _error(req, 500, e.message || 'Internal server error');
  }
}

/**
 * Idempotent setup: registers an OAuthApplication and stores credentials
 * + API base URL in C3 Config. Skips if credentials already exist.
 */
function setup(roleName) {
  var cfg = FlightApiProxy.getConfig();
  var existingId = cfg.configValue(CONFIG_CLIENT_ID);
  if (existingId) {
    return 'Already configured. clientId: ' + existingId;
  }

  try {
    var oAuthApp = OAuthApplication.make({
      name: 'flightpricetrackerui-oauth-client',
      redirectUri: 'https://localhost/oauth/callback'
    });
    var creds = oAuthApp.register([roleName]);

    cfg.setConfigValue(CONFIG_CLIENT_ID, creds.clientId);
    cfg.setConfigValue(CONFIG_CLIENT_SECRET, creds.clientSecret);

    var apiBaseUrl = _deriveApiBaseUrl();
    cfg.setConfigValue(CONFIG_API_BASE_URL, apiBaseUrl);

    _cachedToken = null;
    _tokenExpiry = 0;

    return 'OAuth client registered. clientId: ' + creds.clientId +
           ', apiBaseUrl: ' + apiBaseUrl;
  } catch (e) {
    var msg = 'setup() failed: ' + (e.message || e) +
              '. Ensure the API app is provisioned first.';
    Log.warn(msg);
    return msg;
  }
}

function _proxy(subPath, req) {
  var token = _getToken();
  var targetUrl = _buildTargetUrl(subPath, req);

  var outbound = HttpRequest.make({
    method: req.method,
    url: targetUrl
  }).withHeaders({
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  });

  if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') {
    var body = req.readBodyString();
    if (body) {
      outbound = outbound.withBodyString(body);
    }
  }

  var apiResp;
  try {
    apiResp = outbound.send();
  } catch (e) {
    return _error(req, 502, 'API unavailable: ' + (e.message || e));
  }

  var respBody = apiResp.string();
  if (!respBody || respBody.length === 0) {
    return req.emptyResponse();
  }

  var resp = req.responseFromText(respBody);
  resp.statusCode = apiResp.statusCode;
  resp.headers = { 'Content-Type': 'application/json' };
  return resp;
}

function _getToken() {
  var now = new Date().getTime();

  if (_cachedToken && now < _tokenExpiry) {
    return _cachedToken;
  }

  var cfg = FlightApiProxy.getConfig();
  var clientId = cfg.configValue(CONFIG_CLIENT_ID);
  var clientSecret = cfg.configValue(CONFIG_CLIENT_SECRET);

  if (!clientId || !clientSecret) {
    throw new Error(
      'OAuth not configured. Run FlightApiProxy.setup("FlightApi.Client") or re-provision.'
    );
  }

  var params = UrlQuery.make().withStringParameters({
    grant_type:    'client_credentials',
    client_id:     clientId,
    client_secret: clientSecret
  });
  var tokenReq = HttpRequest.make({ method: 'POST' }).withBodyString(params.encode());
  var tokenResp = OAuth.token(tokenReq);
  var parsed = JSON.parse(tokenResp.json());

  _cachedToken = parsed.access_token;
  _tokenExpiry = now + (parsed.expires_in ? parsed.expires_in * 1000 : 3600000) - BUFFER_MS;

  return _cachedToken;
}

function _buildTargetUrl(subPath, req) {
  var cfg = FlightApiProxy.getConfig();
  var baseUrl = cfg.configValue(CONFIG_API_BASE_URL);
  if (!baseUrl) {
    throw new Error('apiBaseUrl not configured. Run FlightApiProxy.setup() first.');
  }

  var url = baseUrl;
  if (subPath) {
    url += '/' + subPath;
  }

  var queryParams = req.queryParams();
  if (queryParams && queryParams.size() > 0) {
    var parts = [];
    var keys = queryParams.keySet().toArray();
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var values = queryParams.get(key);
      if (values) {
        var valArr = values.toArray();
        for (var j = 0; j < valArr.length; j++) {
          parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(valArr[j]));
        }
      }
    }
    if (parts.length > 0) {
      url += '?' + parts.join('&');
    }
  }

  return url;
}

/**
 * Derives the API app's flights endpoint URL from the current app's URL,
 * swapping the app name segment.
 */
function _deriveApiBaseUrl() {
  var currentUrl = Url.current().toString();
  var uiApp = 'flightpricetrackerui';
  var apiApp = 'flightpricetrackerapi';
  var idx = currentUrl.indexOf(uiApp);
  if (idx === -1) {
    throw new Error(
      'Cannot derive API base URL: "' + uiApp + '" not found in ' + currentUrl
    );
  }
  var base = currentUrl.substring(0, idx) + apiApp;
  return base + '/flights';
}

function _error(req, status, message) {
  var resp = req.responseFromText(JSON.stringify({ error: message, status: status }));
  resp.statusCode = status;
  resp.headers = { 'Content-Type': 'application/json' };
  return resp;
}
