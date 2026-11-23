#!/bin/sh
set -eu

cd /workspace/server

if [ ! -f wmlt/local_settings.py ]; then
    echo "Missing server/wmlt/local_settings.py." >&2
    echo "Copy server/wmlt/local_settings.py.template and configure it before starting Compose." >&2
    exit 1
fi

database_driver="${DATABASE_DRIVER:-postgres}"
case "$database_driver" in
    postgres) poetry_groups=main,daphne,postgres ;;
    mysql) poetry_groups=main,daphne,mysql ;;
    *)
        echo "Unsupported DATABASE_DRIVER: $database_driver (choose postgres or mysql)." >&2
        exit 1
        ;;
esac

lock_hash="$({ printf '%s\n' "$database_driver"; sha256sum pyproject.toml poetry.lock; } | sha256sum | cut -d ' ' -f 1)"
lock_marker=/opt/poetry/dependencies.sha256

if [ ! -f "$lock_marker" ] || [ "$(cat "$lock_marker")" != "$lock_hash" ]; then
    poetry sync --only "$poetry_groups" --no-root --no-ansi
    printf '%s\n' "$lock_hash" > "$lock_marker"
fi

poetry run python manage.py migrate --noinput

superuser_marker=/opt/poetry/superuser-created
fixtures_marker=/opt/poetry/fixtures-imported
create_superuser="${DJANGO_CREATE_SUPERUSER:-false}"
fixtures="${DJANGO_FIXTURES-wmlt/ai/fixtures/prompt_templates.yaml}"

case "$create_superuser" in
    1|true|yes) create_superuser=true ;;
    0|false|no|"") create_superuser=false ;;
    *)
        echo "Unsupported DJANGO_CREATE_SUPERUSER: $create_superuser (choose true or false)." >&2
        exit 1
        ;;
esac

if [ "$create_superuser" = true ] && [ ! -f "$superuser_marker" ]; then
    if [ -z "${DJANGO_SUPERUSER_USERNAME:-}" ] ||
       [ -z "${DJANGO_SUPERUSER_EMAIL:-}" ] ||
       [ -z "${DJANGO_SUPERUSER_PASSWORD:-}" ]; then
        echo "Set DJANGO_SUPERUSER_USERNAME, DJANGO_SUPERUSER_EMAIL, and DJANGO_SUPERUSER_PASSWORD to create a superuser." >&2
        exit 1
    fi

    poetry run python manage.py shell -c '
import os

from django.contrib.auth import get_user_model
from django.core.management import call_command

user_model = get_user_model()
username = os.environ["DJANGO_SUPERUSER_USERNAME"]
user = user_model.objects.filter(**{user_model.USERNAME_FIELD: username}).first()

if user is None:
    call_command("createsuperuser", interactive=False)
elif not user.is_superuser:
    raise RuntimeError(f"User {username!r} exists but is not a superuser.")
'

    touch "$superuser_marker"
fi

if [ -n "$fixtures" ] && [ ! -f "$fixtures_marker" ]; then
    old_ifs=$IFS
    IFS=,
    set -f
    set -- $fixtures
    set +f
    IFS=$old_ifs
    poetry run python manage.py loaddata $@

    touch "$fixtures_marker"
fi

poetry run python manage.py collectstatic --noinput

set --
if [ -n "${DJANGO_SCRIPT_NAME:-}" ]; then
    set -- --root-path "$DJANGO_SCRIPT_NAME"
fi

exec poetry run daphne "$@" -b 0.0.0.0 -p 8000 wmlt.asgi:application
