#!/usr/bin/env sh
set -eu

repo_dir="${1:-/srv/game-design-summer-school-2026}"

cd "$repo_dir"
git pull --ff-only
docker compose -f docker-compose.yml -f docker-compose.https.yml up -d --force-recreate
docker compose -f docker-compose.yml -f docker-compose.https.yml ps

echo
echo "Local health check:"
curl -fsS http://127.0.0.1/api/collab/health || true
echo

