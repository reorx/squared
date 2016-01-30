#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import re
import time
import json
import logging
from torext.app import TorextApp
from torext.handlers import BaseHandler
from tornado.httpclient import AsyncHTTPClient
from tornado.web import StaticFileHandler
from tornado import gen
from squared.auth import SpotifyMixin
import settings


app = TorextApp(settings)
app.update_settings({
    'STATIC_PATH': None
})


app.route_many([
    (r'/bower_components/(.*)', StaticFileHandler, {'path': os.path.join(app.root_path, '../bower_components')}),
    (r'/js/(.*)', StaticFileHandler, {'path': os.path.join(app.root_path, '../js')}),
    (r'/css/(.*)', StaticFileHandler, {'path': os.path.join(app.root_path, '../css')}),
])


@app.route('/')
class IndexHandler(BaseHandler):
    def get(self):
        index_path = os.path.join(self.app.root_path, '../index.html')
        self.write_file(index_path)


@app.route('/favicon.ico')
class FaviconHandler(BaseHandler):
    def get(self):
        index_path = os.path.join(self.app.root_path, '../images/favicon.ico')
        self.write_file(index_path)


SPOTIFY_PLAYLIST_URL_REGEX = re.compile(r'^https:\/\/\w+.spotify.com\/user\/(\w+)\/playlist\/(\w+)$')


def match_user_and_id(url):
    rv = SPOTIFY_PLAYLIST_URL_REGEX.search(url)
    if not rv:
        return None
    return rv.groups()


@app.route('/api/get_spotify_playlist')
class SpotifyPlaylistHandler(BaseHandler):
    @gen.coroutine
    def post(self):
        playlist_url = self.get_argument('playlist_url')
        url_args = match_user_and_id(playlist_url)
        if not url_args:
            raise ValueError('Could not match from playlist url')
        url = 'https://api.spotify.com/v1/users/%s/playlists/%s' % url_args

        token = yield get_client_token()
        headers = {
            'Authorization': 'Bearer ' + token
        }

        resp = yield async_request(url, headers=headers)

        # print 'resp', resp.body
        data = self.json_decode(resp.body)
        self.write_json(format_spotify_playlist(data))


def format_spotify_playlist(data):
    """
    API: https://api.spotify.com/v1/users/:username/playlists/:id
    """
    d = []
    for item in data['tracks']['items']:
        _track = item['track']
        track = {
            'name': _track['name'],
            'album': _track['album'],
            'artists': _track['artists'],
        }
        d.append(track)
    return d


class HTTPRequestFailed(Exception):
    pass


client_credentails_holder = []


@gen.coroutine
def get_client_token(timeout=settings.REQUEST_TIMEOUT):
    global client_credentails_holder
    token = None
    now = int(time.time())
    if client_credentails_holder:
        token, expires_at = client_credentails_holder[0]
        if now >= expires_at:
            logging.info('token expired')
            token = None

    if not token:
        url = 'https://accounts.spotify.com/api/token'
        headers = {
            'Authorization': 'Basic ' + SpotifyMixin.generate_basic_auth(
                settings.SPOTIFY_CLIENT_ID, settings.SPOTIFY_CLIENT_SECRET)
        }
        body = 'grant_type=client_credentials'

        resp = yield async_request(url, method='POST', headers=headers, body=body, max_success_code=200)

        access = json.loads(resp.body)
        token = access['access_token']
        expires_at = now + access['expires_in']
        client_credentails_holder = [(token, expires_at)]

    raise gen.Return(token)


@gen.coroutine
def async_request(url, client=None, timeout=5, max_success_code=299, **kwargs):
    if not client:
        client = AsyncHTTPClient()

    if 'method' not in kwargs:
        kwargs['method'] = 'GET'

    logging.info('Async request: {method} {url}'.format(url=url, **kwargs))

    try:
        resp = yield client.fetch(
            url,
            request_timeout=timeout,
            connect_timeout=timeout,
            raise_error=False,
            **kwargs)
    except Exception as e:
        raise HTTPRequestFailed(error=str(e))

    if resp.code > max_success_code:
        raise HTTPRequestFailed(resp.code, resp.body or str(resp.error))

    raise gen.Return(resp)


if '__main__' == __name__:
    app.command_line_config()
    app.run()
