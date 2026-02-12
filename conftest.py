import pytest
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bookofmonth_backend.settings')


@pytest.fixture(scope='session')
def django_db_setup():
    import django
    from django.conf import settings

    # Use SQLite for tests
    settings.DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
        'ATOMIC_REQUESTS': False,
    }

    # Disable caching during tests
    settings.CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
        }
    }

    django.setup()
    from django.core.management import call_command
    call_command('migrate', '--run-syncdb', verbosity=0)


@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    pass
