FROM python:3.14-slim

ARG DATABASE_DRIVER=postgres

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_CREATE=true \
    POETRY_VIRTUALENVS_IN_PROJECT=true

RUN if [ "$DATABASE_DRIVER" = "mysql" ]; then \
        apt-get update \
        && apt-get install -y --no-install-recommends gcc pkg-config default-libmysqlclient-dev \
        && rm -rf /var/lib/apt/lists/*; \
    fi \
    && pip install --no-cache-dir "poetry==2.3.1" \
    && mkdir -p /opt/poetry

WORKDIR /workspace/server
COPY bin/docker/python-entrypoint.sh /usr/local/bin/docker-entrypoint
RUN chmod +x /usr/local/bin/docker-entrypoint

ENTRYPOINT ["/usr/local/bin/docker-entrypoint"]
