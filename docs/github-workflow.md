# Workflow GitHub consigliato

## Primo setup

```bash
git init
git add .
git commit -m "Initial teaching lab"
./scripts/connect-github.sh git@github.com:TUO-UTENTE/game-design-summer-school-2026.git
git push -u origin main
```

## Lavoro quotidiano

```bash
git status
git add site/lessons/ slides/ docs/
git commit -m "Update classroom material"
git push
```

Sul server:

```bash
cd /srv/game-design-summer-school-2026
git pull --ff-only
docker compose up -d
```

## Allineamento senza Git

Se durante la lezione vuoi copiare tutto al volo via SSH:

```bash
./scripts/sync-remote.sh deploy@miocorso.duckdns.org /srv/game-design-summer-school-2026
```

Questo usa `rsync`, aggiorna i file e rilancia `docker compose up -d`.

