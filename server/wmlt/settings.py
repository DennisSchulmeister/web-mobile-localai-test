# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from django.templatetags.static import static
from django.urls                import reverse_lazy
from django.utils.translation   import gettext_lazy as _
from pathlib                    import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/6.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = "django-insecure-x0t%jjv2p3i)fo@9#u6p39c127wtcjt-kq2f4r9g6(0ss#n6bj"

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = []

# Application definition
INSTALLED_APPS = [
    # Local applications
    "wmlt.auth",
    "wmlt.testlogs",

    # Django REST Framework
    "rest_framework",

    # Django Unfold (Modern Admin)
    "unfold.apps.BasicAppConfig",            # before django.contrib.admin
    "unfold.contrib.filters",                # optional, if special filters are needed
    "unfold.contrib.forms",                  # optional, if special form elements are needed
    "unfold.contrib.inlines",                # optional, if special inlines are needed
    "crispy_forms",                          # Better forms for custom admin views

    # Django built-in apps
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "wmlt.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "wmlt.wsgi.application"

# Database
# https://docs.djangoproject.com/en/6.1/ref/settings/#databases
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# Password validation
# https://docs.djangoproject.com/en/6.1/ref/settings/#auth-password-validators
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

AUTH_USER_MODEL = "wmlt_auth.User"

REST_FRAMEWORK = {
    # Use Django's standard `django.contrib.auth` permissions,
    # or allow read-only access for unauthenticated users.
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.DjangoModelPermissionsOrAnonReadOnly",
    ]
}

# Read the project version. Try the following order:
#
#   1. Installed version via importlib
#   2. Parsing pyproject.toml
#   3. Using dummy string as fallback
try:
    from importlib.metadata import version
    PROJECT_VERSION = version("wmlt")
except Exception:
    try:
        import tomllib

        with open(BASE_DIR / "pyproject.toml", "rb") as f:
            pyproject_data = tomllib.load(f)
            PROJECT_VERSION = pyproject_data["project"]["version"]
    except Exception:
        PROJECT_VERSION = "0.0.0"

# Django Unfold Admin
CRISPY_TEMPLATE_PACK = "unfold_crispy"
CRISPY_ALLOWED_TEMPLATE_PACKS = ["unfold_crispy"]

UNFOLD = {
    "SITE_TITLE":  _(f"Test Log {PROJECT_VERSION}: Admin"),
    "SITE_HEADER": _(f"Test Log {PROJECT_VERSION}: Admin"),

    "SIDEBAR": {
        "show_search": True,
    },
}

# Internationalization
# https://docs.djangoproject.com/en/6.1/topics/i18n/
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.1/howto/static-files/
STATIC_URL = "static/"

# Email
# https://docs.djangoproject.com/en/6.1/topics/email/#topic-email-configuration
MAILERS = {
    "default": {
        "BACKEND": "django.core.mail.backends.console.EmailBackend",
    },
}

# Import deployment-specific local settings which can override single values here
try:
    from .local_settings import * # type: ignore
except ImportError:
    pass
