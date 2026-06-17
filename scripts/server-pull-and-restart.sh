#!/usr/bin/env sh
set -eu

repo_dir="${1:-/srv/game-design-summer-school-2026}"

cd "$repo_dir"
git pull --ff-only
docker compose up -d
docker compose ps

