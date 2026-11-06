#!/bin/sh
set -eu

cd /workspace

lock_hash="$(sha256sum package.json package-lock.json | sha256sum | cut -d ' ' -f 1)"
lock_marker=node_modules/.docker-dependencies.sha256

if [ ! -f "$lock_marker" ] || [ "$(cat "$lock_marker")" != "$lock_hash" ]; then
    echo "Node dependencies changed; installing from the lock file."
    npm ci
    printf '%s\n' "$lock_hash" > "$lock_marker"
fi

if [ ! -d static/_generated ]; then
    echo "Generated frontend assets are missing; initializing them."
    npm run init
fi

npm run build
