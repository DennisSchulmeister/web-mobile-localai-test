# Docker Compose Deployment

The repository's [`compose.yaml`](../compose.yaml) supports running the Django backend,
an optional PostgreSQL database, an optional frontend build, and Caddy. Containers use
the checked-out source tree through a volume rather than copying the application source
into an image.

* [Configure the environment](#configure-the-environment)
* [Start a profile](#start-a-profile)
* [Profiles and services](#profiles-and-services)

## Configure the environment

Before the first start, create the environment and local Django settings files:

```sh
cp .env.template .env
cp server/wmlt/local_settings.py.template server/wmlt/local_settings.py
```

In `.env`, choose the database driver and set database credentials and connection
details as needed. The available variables are documented in `.env.template`. Replace
the `SECRET_KEY` in `server/wmlt/local_settings.py`; adjust its other deployment settings
if needed. Do not use the template's example secret key for a deployed instance.

## Start a profile

Run these commands from the repository root:

```sh
# Django backend with an external database
docker compose --profile external up --build

# Django backend and PostgreSQL in the Compose network
docker compose --profile postgres up --build

# External database and frontend initialization/build
docker compose --profile external --profile node up --build

# PostgreSQL and frontend initialization/build
docker compose --profile postgres --profile node up --build

# Full stack: PostgreSQL, Django, frontend, and Caddy
docker compose --profile full up --build
```

The backend is exposed on `${DJANGO_PORT:-8000}`. In the full profile, Caddy is exposed
on `${HTTP_PORT:-8080}`. The first startup can take several minutes while dependencies
are installed and language models are downloaded.

## Profiles and services

* `external`: backend configured for a database outside the Compose network.
* `postgres`: backend and PostgreSQL database.
* `node`: frontend initialization/build service.
* `full`: PostgreSQL, backend, frontend initialization/build, and Caddy.

The frontend's generated files and Python/Node dependencies are stored in mounted
workspace paths or named volumes. For local, non-containerized development, see
[Building and Running the Web App](web-app.md) and
[Building and Running the Django Backend](django-backend.md).
