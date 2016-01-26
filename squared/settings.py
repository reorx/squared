PROJECT = 'squared'

LOCALE = 'en_US'

PROCESSES = 1

PORT = 8000

DEBUG = True

LOGGERS = {
    '': {
        'level': 'INFO',
        'fmt': '%(color)s[%(fixed_levelname)s %(asctime)s %(module)s:%(lineno)d]%(end_color)s %(message)s',
        #'fmt': '[%(fixed_levelname)s %(asctime)s %(module)s:%(lineno)d] %(message)s',
        'datefmt': '%Y-%m-%d %H:%M:%S',
    }
}

LOG_REQUEST = True

LOG_RESPONSE = False

TIME_ZONE = 'Asia/Shanghai'

STATIC_PATH = '..'

TEMPLATE_PATH = '..'

# You can use jinja2 instead
TEMPLATE_ENGINE = 'tornado'

LOGGING_IGNORE_URLS = [
    '/favicon.ico',
]

REQUEST_TIMEOUT = 8

try:
    from local_settings import *
    print 'local_settings.py involved'
except ImportError:
    pass
