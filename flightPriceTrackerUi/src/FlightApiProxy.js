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
    return req.responseFromJson({ error: e.message || 'Internal server error', status: 500 });
  }
}

function verify() {
  var report = [];
  try {
    var cfg = FlightApiProxyConfig.getConfig();

    var clientId = cfg.configValue(CONFIG_CLIENT_ID);
    report.push('oauthClientId: ' + (clientId ? clientId : 'MISSING'));

    var hasSecret = false;
    try {
      hasSecret = !!cfg.secretValue(CONFIG_CLIENT_SECRET);
    } catch (e) {
      hasSecret = false;
    }
    report.push('oauthClientSecret: ' + (hasSecret ? 'SET' : 'MISSING'));

    var apiBaseUrl = cfg.configValue(CONFIG_API_BASE_URL);
    report.push('apiBaseUrl: ' + (apiBaseUrl ? apiBaseUrl : 'MISSING'));

    var allPresent = clientId && hasSecret && apiBaseUrl;
    report.push('status: ' + (allPresent ? 'READY' : 'NOT CONFIGURED'));

    if (!allPresent) {
      report.push('action: See secret-config.md');
    }
  } catch (e) {
    report.push('verify error: ' + (e.message || e));
  }
  return report.join('\n');
}

// ── Proxy ──────────────────────────────────────────────────

function _proxy(subPath, req) {
  var token = _getToken();
  var targetUrl = _targetUrl(subPath, req);

  // Verified API: HttpRequest.make({method, url}).withHeader().sendSync() → HttpResponse
  var outbound = HttpRequest.make({
    method: req.method,
    url:    targetUrl
  }).withHeader('Authorization', 'Bearer ' + token)
    .withHeader('Content-Type', 'application/json');

  if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') {
    var body = req.readBodyString();
    if (body) {
      outbound = outbound.withBodyString(body, 'application/json');
    }
  }

  var apiResp;
  try {
    // Verified API: sendSync() returns HttpResponse
    apiResp = outbound.sendSync();
  } catch (e) {
    return req.responseFromJson({ error: 'API unavailable: ' + (e.message || e), status: 502 });
  }

  // Verified API: HttpResponse.string() returns body as string
  var respBody = apiResp.string();
  if (!respBody || respBody.length === 0) {
    return req.emptyResponse();
  }

  // responseFromJson sets Content-Type: application/json so axios auto-parses.
  // responseFromText would return plain text causing axios to leave r.data as a string.
  try {
    return req.responseFromJson(JSON.parse(respBody));
  } catch (e) {
    return req.responseFromText(respBody);
  }
}

// ── Token ──────────────────────────────────────────────────

function _getToken() {
  var now = new Date().getTime();
  if (_cachedToken && now < _tokenExpiry) {
    return _cachedToken;
  }

  var cfg = FlightApiProxyConfig.getConfig();
  var clientId     = cfg.configValue(CONFIG_CLIENT_ID);
  var clientSecret = cfg.secretValue(CONFIG_CLIENT_SECRET);
  var apiBaseUrl   = cfg.configValue(CONFIG_API_BASE_URL);

  if (!clientId || !clientSecret || !apiBaseUrl) {
    throw new Error('OAuth not configured. See secret-config.md.');
  }

  var formBody = 'grant_type=client_credentials'
    + '&client_id=' + encodeURIComponent(clientId)
    + '&client_secret=' + encodeURIComponent(clientSecret);

  var tokenUrl = apiBaseUrl.replace(/\/flights\/?$/, '') + '/oauth/token';

  // C3's /oauth/token requires HTTP Basic Auth (client_id:client_secret)
  // in addition to the form body. Without it the request gets a 302 redirect.
  var basicBytes = new java.lang.String(clientId + ':' + clientSecret).getBytes('UTF-8');
  var basicCred  = java.util.Base64.getEncoder().encodeToString(basicBytes);

  var tokenReq = HttpRequest.make({
    method: 'POST',
    url:    tokenUrl
  }).withHeader('Authorization', 'Basic ' + basicCred)
    .withBodyString(formBody, 'application/x-www-form-urlencoded');

  var tokenResp;
  try {
    tokenResp = tokenReq.sendSync();
  } catch (e) {
    throw new Error('Token request failed: ' + (e.message || e) + ' url=' + tokenUrl);
  }

  // Verified API: HttpResponse.string()
  var raw = tokenResp.string();
  if (!raw) {
    throw new Error('Token response empty. url=' + tokenUrl);
  }

  var parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error('Token response not JSON. raw=' + raw);
  }

  if (!parsed.access_token) {
    throw new Error(
      'No access_token. keys=' + Object.keys(parsed).join(',')
      + ' raw=' + raw + ' url=' + tokenUrl
    );
  }

  _cachedToken = parsed.access_token;
  _tokenExpiry = now
    + (parsed.expires_in ? parsed.expires_in * 1000 : 3600000)
    - BUFFER_MS;

  return _cachedToken;
}

// ── Helpers ────────────────────────────────────────────────

function _targetUrl(subPath, req) {
  var cfg = FlightApiProxyConfig.getConfig();
  var base = cfg.configValue(CONFIG_API_BASE_URL);
  if (!base) throw new Error('apiBaseUrl not configured.');

  var url = base;
  if (subPath) url += '/' + subPath;

  // Forward query string from original request
  var reqUrl = req.url || '';
  var qIdx = reqUrl.indexOf('?');
  if (qIdx !== -1) url += reqUrl.substring(qIdx);

  return url;
}
