var _cachedToken = null;
var _tokenExpiry = 0;
var BUFFER_MS = 60000;
var CONFIG_CLIENT_ID = 'oauthClientId';
var CONFIG_CLIENT_SECRET = 'oauthClientSecret';

function handle(httpPath, req) {
  try {
    var path = (httpPath || '').replace(/^\//, '');
    if (path.indexOf('auth/') === 0) path = path.substring(5);

    if (req.method === 'GET' && (path === 'token' || path === '')) {
      return _getToken(req);
    }
    return _error(req, 404, 'Not found: ' + req.method + ' /' + path);
  } catch (e) {
    return _error(req, 500, e.message || 'Internal server error');
  }
}

/**
 * One-time setup run from C3 Console.
 * Registers an OAuthApplication, stores credentials in C3 Config.
 *
 * Usage: AuthTokenService.setup("FlightApi.Client")
 */
function setup(roleName) {
  var appName = 'flightpricetrackerui-oauth-client';
  var oAuthApp = OAuthApplication.make({
    name: appName,
    redirectUri: 'https://localhost/oauth/callback'
  });
  var creds = oAuthApp.register([roleName]);

  var cfg = AuthTokenService.getConfig();
  cfg.setConfigValue(CONFIG_CLIENT_ID, creds.clientId);
  cfg.setConfigValue(CONFIG_CLIENT_SECRET, creds.clientSecret);

  _cachedToken = null;
  _tokenExpiry = 0;

  return 'OAuth client registered. clientId: ' + creds.clientId;
}

function _getToken(req) {
  var now = new Date().getTime();

  if (_cachedToken && now < _tokenExpiry) {
    return req.responseFromText(JSON.stringify({ access_token: _cachedToken }));
  }

  var cfg = AuthTokenService.getConfig();
  var clientId = cfg.configValue(CONFIG_CLIENT_ID);
  var clientSecret = cfg.configValue(CONFIG_CLIENT_SECRET);

  if (!clientId || !clientSecret) {
    return _error(req, 500,
      'OAuth not configured. Run AuthTokenService.setup("FlightApi.Client") in the C3 Console.');
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

  return req.responseFromText(JSON.stringify({ access_token: _cachedToken }));
}

function _error(req, status, message) {
  return req.responseFromText(JSON.stringify({ error: message, status: status }));
}
