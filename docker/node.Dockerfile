FROM node:24-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends brotli gzip zstd \
    && rm -rf /var/lib/apt/lists/*

COPY docker/precompress-static.sh /usr/local/bin/precompress-static
RUN chmod +x /usr/local/bin/precompress-static
