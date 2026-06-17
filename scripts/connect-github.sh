#!/usr/bin/env sh
set -eu

if [ "$#" -ne 1 ]; then
  echo "Uso: $0 git@github.com:utente/repo.git"
  exit 1
fi

repo_url="$1"

git remote remove origin 2>/dev/null || true
git remote add origin "$repo_url"
git branch -M main

echo "Remote configurato:"
git remote -v
echo
echo "Per pubblicare:"
echo "  git push -u origin main"

