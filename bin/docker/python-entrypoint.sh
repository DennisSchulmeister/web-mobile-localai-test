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
poetry run python manage.py collectstatic --noinput
exec poetry run daphne -b 0.0.0.0 -p 8000 wmlt.asgi:application
