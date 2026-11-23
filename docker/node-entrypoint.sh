#!/bin/sh
set -eu

cd /workspace/app

lock_hash="$(sha256sum package.json package-lock.json | sha256sum | cut -d ' ' -f 1)"
lock_marker=node_modules/.docker-dependencies.sha256

if [ ! -f "$lock_marker" ] || [ "$(cat "$lock_marker")" != "$lock_hash" ]; then
    echo "Node dependencies changed; installing from the lock file."
    npm ci
    printf '%s\n' "$lock_hash" > "$lock_marker"
else
    echo "Node dependencies are up to date. No reinstallation necessary."
fi

config_json="$(node bin/init/read-config.js static/config.json)"
config_hash="$(printf '%s\n' "$config_json" | sha256sum | cut -d ' ' -f 1)"
config_marker=static/_generated/.config.sha256

if [ ! -d static/_generated ] ||
   [ ! -f "$config_marker" ] ||
   [ "$(cat "$config_marker")" != "$config_hash" ]; then
    echo "Generated frontend assets are missing or the configuration changed; initializing them."
    npm run init
    mkdir -p static/_generated
    printf '%s\n' "$config_hash" > "$config_marker"
else
    echo "Generated frontend assets are up to date. No regeneration necessary."
fi

if [ -n "${API_PUBLIC_URL:-}" ]; then
    echo "$API_PUBLIC_URL" > static/api.url
fi

npm run build
