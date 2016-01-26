import base64
import functools
from tornado.auth import OAuth2Mixin, _auth_return_future, urllib_parse


class AuthError(Exception):
    pass


class SpotifyMixin(OAuth2Mixin):
    """
    https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow

    Usage:

    .. testcode::

        @app.route('/auth/spotify')
        class AuthSpotifyHandler(BaseHandler, SpotifyMixin):
            @gen.coroutine
            def get(self):
                code = self.get_argument('code', None)
                if code:
                    access = yield self.get_authenticated_user(
                        redirect_uri=settings.SPOTIFY_OAUTH_REDIRECT,
                        code=code)
                    print 'access', access
                    self.write_json(access)
                else:
                    yield self.authorize_redirect(
                        redirect_uri=settings.SPOTIFY_OAUTH_REDIRECT + '/callback',
                        client_id=settings.SPOTIFY_CLIENT_ID,
                        response_type='code')
    """
    _OAUTH_AUTHORIZE_URL = 'https://accounts.spotify.com/authorize'
    _OAUTH_ACCESS_TOKEN_URL = 'https://accounts.spotify.com/api/token'

    @_auth_return_future
    def get_authenticated_user(self, client_id, client_secret, redirect_uri, code, callback):
        http = self.get_auth_http_client()
        body = urllib_parse.urlencode({
            "redirect_uri": redirect_uri,
            "code": code,
            "grant_type": "authorization_code",
        })
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + SpotifyMixin.generate_basic_auth(client_id, client_secret)
        }

        http.fetch(self._OAUTH_ACCESS_TOKEN_URL,
                   functools.partial(self._on_access_token, callback),
                   method="POST", headers=headers, body=body)

    def _on_access_token(self, future, response):
        """Callback function for the exchange to the access token."""
        if response.error:
            future.set_exception(AuthError('Google auth error: %s' % str(response)))
            return

        args = self.json_decode(response.body)
        future.set_result(args)

    @classmethod
    def generate_basic_auth(cls, client_id, client_secret):
        return base64.b64encode('{}:{}'.format(client_id, client_secret))
