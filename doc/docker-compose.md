# Docker Compose Deployment

The repository's [`compose.yaml`](../compose.yaml) supports running the Django backend,
an optional PostgreSQL database, an optional frontend build, and Caddy. Containers use
the checked-out source tree through a volume rather than copying the application source
into an image.

* [Configure the environment](#configure-the-environment)
* [Start a profile](#start-a-profile)
* [Profiles and services](#profiles-and-services)
* [Optimize server throughput](#optimize-server-throughput)
* [Use Apache on the host instead of Caddy](#use-apache-on-the-host-instead-of-caddy)

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

When using MariaDB on a Debian host, load MariaDB's time-zone tables. Django uses
`USE_TZ = True` and the deployment settings default to `TIME_ZONE = "Europe/Berlin"`;
without those tables, time-zone conversions can fail in the admin. On the database
host, run:

```sh
sudo mariadb-tzinfo-to-sql /usr/share/zoneinfo | sudo mariadb mysql
sudo systemctl restart mariadb
```

To check that the tables are available, this query should return
`2026-01-01 13:00:00`, not `NULL`:

```sh
sudo mariadb -Nse "SELECT CONVERT_TZ('2026-01-01 12:00:00', 'UTC', 'Europe/Berlin');"
```

On the first startup, the backend imports the fixtures listed in `DJANGO_FIXTURES`
(comma-separated; defaults to the bundled prompt templates). To create an admin
account, set `DJANGO_CREATE_SUPERUSER=true` and provide
`DJANGO_SUPERUSER_USERNAME`, `DJANGO_SUPERUSER_EMAIL`, and
`DJANGO_SUPERUSER_PASSWORD` in `.env`. Keep the password secret.

Each step runs once per `python-dependencies` volume, which stores its completion
marker. To rerun a step, remove its marker (`/opt/poetry/superuser-created` or
`/opt/poetry/fixtures-imported`) from the backend container before restarting it.

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
* `caddy`: frontend web server.
* `full`: PostgreSQL, backend, frontend initialization/build, and Caddy.

The frontend's generated files and Python/Node dependencies are stored in mounted
workspace paths or named volumes. For local, non-containerized development, see
[Building and Running the Web App](web-app.md) and
[Building and Running the Django Backend](django-backend.md).

## Optimize server throughput

The Node and Django startup scripts pre-compress static files as Brotli, Zstandard,
and gzip sidecars (skipping existing `.br`, `.zst`, and `.gz` sidecars). Pre-compression
takes time on first startup and uses additional disk space; Thus, files are only
recompressed when their source is newer than the sidecar. The overall benefit
is, that the web server doesn't need to apply compression on-the-fly, saving
CPU cycles at runtime.

ONNX model files (`.onnx`, `.onnx_data`, and split `.onnx_data_<number>` files) are
excluded, since compression doesn't save much bandwidth (if at all), but consumes
considerable CPU cycles on both server and client. Left-over sidecars for them are
thus removed and Caddy does not apply on-the-fly HTTP compression to them, either.
The Apache example below skips their sidecars and excludes them from Apache's `mod_deflate`
and `mod_brotli` output filters if those are enabled elsewhere in the site configuration.

Note, that upstream proxy servers might still compress the HTTP traffic. For this
optimization to work best, disable HTTP compression for ONXX files there, too.

Set `STATIC_PRECOMPRESS=false` in `.env` to disable pre-compression entirely.

## Use Apache on the host instead of Caddy

If Apache is already serving the host, start the Compose services without the `full`
or `caddy` profile. For example, with PostgreSQL:

```sh
docker compose --profile postgres --profile node up --build
```

Or, with a database outside Compose:

```sh
docker compose --profile external --profile node up --build
```

The `node` profile builds the frontend; neither command starts Caddy. In `.env`, bind
the backend port to loopback so it is only reachable by host services:

```dotenv
DJANGO_PORT=127.0.0.1:8000
DJANGO_SCRIPT_NAME=/srv
```

Enable the Apache modules used by the example (`alias`, `dir`, `headers`, `mime`,
`proxy`, `proxy_http`, `rewrite`, and `setenvif`; on Debian, for example, run
`sudo a2enmod alias dir headers mime proxy proxy_http rewrite setenvif`). Add the
following inside the site's existing `<VirtualHost>` and replace the frontend and
static-files paths with the absolute paths to this checkout:

```apache
RedirectMatch 302 ^/$ /app/
RedirectMatch 308 ^/app$ /app/
RedirectMatch 308 ^/srv$ /srv/
RedirectMatch 308 ^/admin$ /admin/

Alias /app/ /path/to/web-mobile-localai-test/app/static/
<Directory /path/to/web-mobile-localai-test/app/static/>
    Require all granted
    FallbackResource /app/index.html

    # Use UNIX sendfile to optmize throughput
    EnableSendfile On

    # Serve pre-compressed files to optimize throughput
    AddEncoding br .br
    AddEncoding zstd .zst
    AddEncoding gzip .gz
    Header merge Vary Accept-Encoding

    RewriteEngine On
    RewriteBase /app/

    RewriteCond %{REQUEST_FILENAME} !\.(onnx|onnx_data(?:_[0-9]+)?)$ [NC]
    RewriteCond %{HTTP:Accept-Encoding} \bbr\b [NC]
    RewriteCond %{HTTP:Accept-Encoding} !\bbr\s*;\s*q=0(?:\.0*)?(?:\s*,|$) [NC]
    RewriteCond %{REQUEST_FILENAME} -f
    RewriteCond %{REQUEST_FILENAME}.br -f
    RewriteRule ^(.+)$ $1.br [END]

    RewriteCond %{REQUEST_FILENAME} !\.(onnx|onnx_data(?:_[0-9]+)?)$ [NC]
    RewriteCond %{HTTP:Accept-Encoding} \bzstd\b [NC]
    RewriteCond %{HTTP:Accept-Encoding} !\bzstd\s*;\s*q=0(?:\.0*)?(?:\s*,|$) [NC]
    RewriteCond %{REQUEST_FILENAME} -f
    RewriteCond %{REQUEST_FILENAME}.zst -f
    RewriteRule ^(.+)$ $1.zst [END]

    RewriteCond %{REQUEST_FILENAME} !\.(onnx|onnx_data(?:_[0-9]+)?)$ [NC]
    RewriteCond %{HTTP:Accept-Encoding} \bgzip\b [NC]
    RewriteCond %{HTTP:Accept-Encoding} !\bgzip\s*;\s*q=0(?:\.0*)?(?:\s*,|$) [NC]
    RewriteCond %{REQUEST_FILENAME} -f
    RewriteCond %{REQUEST_FILENAME}.gz -f
    RewriteRule ^(.+)$ $1.gz [END]
</Directory>

Alias /srv/static/ /path/to/web-mobile-localai-test/server/static/
<Directory /path/to/web-mobile-localai-test/server/static/>
    Require all granted

    # Use UNIX sendfile to optmize throughput
    EnableSendfile On

    # Serve pre-compressed files to optimize throughput
    AddEncoding br .br
    AddEncoding zstd .zst
    AddEncoding gzip .gz
    Header merge Vary Accept-Encoding

    RewriteEngine On
    RewriteBase /srv/static/

    RewriteCond %{REQUEST_FILENAME} !\.(onnx|onnx_data(?:_[0-9]+)?)$ [NC]
    RewriteCond %{HTTP:Accept-Encoding} \bbr\b [NC]
    RewriteCond %{HTTP:Accept-Encoding} !\bbr\s*;\s*q=0(?:\.0*)?(?:\s*,|$) [NC]
    RewriteCond %{REQUEST_FILENAME} -f
    RewriteCond %{REQUEST_FILENAME}.br -f
    RewriteRule ^(.+)$ $1.br [END]

    RewriteCond %{REQUEST_FILENAME} !\.(onnx|onnx_data(?:_[0-9]+)?)$ [NC]
    RewriteCond %{HTTP:Accept-Encoding} \bzstd\b [NC]
    RewriteCond %{HTTP:Accept-Encoding} !\bzstd\s*;\s*q=0(?:\.0*)?(?:\s*,|$) [NC]
    RewriteCond %{REQUEST_FILENAME} -f
    RewriteCond %{REQUEST_FILENAME}.zst -f
    RewriteRule ^(.+)$ $1.zst [END]
    
    RewriteCond %{REQUEST_FILENAME} !\.(onnx|onnx_data(?:_[0-9]+)?)$ [NC]
    RewriteCond %{HTTP:Accept-Encoding} \bgzip\b [NC]
    RewriteCond %{HTTP:Accept-Encoding} !\bgzip\s*;\s*q=0(?:\.0*)?(?:\s*,|$) [NC]
    RewriteCond %{REQUEST_FILENAME} -f
    RewriteCond %{REQUEST_FILENAME}.gz -f
    RewriteRule ^(.+)$ $1.gz [END]
</Directory>

SetEnvIfNoCase Request_URI \.(?:onnx|onnx_data(?:_[0-9]+)?)$ no-gzip no-brotli

<FilesMatch "\.(onnx|onnx_data(?:_[0-9]+)?)$">
    Header set Cache-Control "public, max-age=604800"
</FilesMatch>

ProxyPreserveHost On
ProxyPass /srv/static/ !
ProxyPass /srv/ http://127.0.0.1:8000/srv/
ProxyPassReverse /srv/ http://127.0.0.1:8000/srv/
ProxyPass /admin/ http://127.0.0.1:8000/admin/
ProxyPassReverse /admin/ http://127.0.0.1:8000/admin/
```

Keep any existing HTTPS configuration and place these directives in the virtual host
that serves the application. If the backend port or paths differ, update the proxy
target and aliases accordingly. The rewrite rules serve the best available
`.br`, `.zst`, or `.gz` sidecar when the client advertises that encoding; Apache's
`AddEncoding` directives set the corresponding `Content-Encoding`.
