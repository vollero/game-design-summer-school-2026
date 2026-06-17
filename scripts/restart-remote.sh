#!/usr/bin/env sh
set -eu

if [ "$#" -lt 2 ]; then
  echo "Uso: $0 utente@server /percorso/remoto [porta]"
  echo "Esempio: $0 deploy@mioserver.duckdns.org /srv/game-design 22"
  exit 1
fi

target="$1"
remote_dir="$2"
ssh_port="${3:-22}"

ssh -p "${ssh_port}" "${target}" "cd '${remote_dir}' && docker compose up -d --force-recreate"

