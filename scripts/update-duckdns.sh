#!/usr/bin/env sh
set -eu

if [ "$#" -ne 2 ]; then
  echo "Uso: $0 dominio token"
  echo "Esempio: $0 miocorso abcdef12-3456-7890"
  exit 1
fi

domain="$1"
token="$2"

curl -fsS "https://www.duckdns.org/update?domains=${domain}&token=${token}&ip="
echo

