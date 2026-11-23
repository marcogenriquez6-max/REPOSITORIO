#!/bin/sh
set -e

STORAGE_ROOT="${STORAGE_ROOT:-/app/storage}"

if [ "$1" = "node" ]; then
  mkdir -p "$STORAGE_ROOT/originals" "$STORAGE_ROOT/thumbnails"
  chown -R node:node "$STORAGE_ROOT"
  exec su-exec node "$@"
fi

exec "$@"
