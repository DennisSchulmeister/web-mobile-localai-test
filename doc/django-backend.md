# Building and Running the Django Backend

The Django project is in `server/`. It provides backend functionality for recording test
cases through a REST API.

* [Prerequisites](#prerequisites)
* [Install dependencies](#install-dependencies)
* [Initialize and run](#initialize-and-run)
* [Deployment-specific settings](#deployment-specific-settings)

## Prerequisites

The project requires Python 3.14 or newer and Poetry. See
[`server/pyproject.toml`](../server/pyproject.toml) for the runtime and dependency
requirements.

## Install dependencies

From the repository root:

```sh
cd server
poetry install
```

The default Django settings use the SQLite database at `server/db.sqlite3`, so no
additional database driver is required for local development.

## Initialize and run

Run database migrations and start Django's development server:

```sh
poetry run python manage.py migrate
poetry run python manage.py runserver
```

By default, the server listens at <http://127.0.0.1:8000/>. Create an administrator
account to access to admin interface at <http://127.0.0.1:8000/admin>:

```sh
poetry run python manage.py createsuperuser
```

## Deployment-specific settings

For Docker-based setup, environment variables, and Compose profiles, see
[Docker Compose deployment](docker-compose.md).
