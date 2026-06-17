# Deploy su server Unix con Docker, GitHub e DuckDNS

Questa guida assume un server Unix raggiungibile via SSH, con Docker e Docker Compose gia' installati.

## 1. Pubblica il repository su GitHub

Sul computer locale:

```bash
git init
git add .
git commit -m "Initial teaching lab"
./scripts/connect-github.sh git@github.com:TUO-UTENTE/game-design-summer-school-2026.git
git push -u origin main
```

## 2. Clona sul server

Sul server:

```bash
sudo mkdir -p /srv
sudo chown "$USER":"$USER" /srv
cd /srv
git clone git@github.com:TUO-UTENTE/game-design-summer-school-2026.git
cd game-design-summer-school-2026
cp .env.example .env
docker compose up -d
```

Se vuoi servire solo HTTP direttamente sulla porta 80, modifica `.env`:

```bash
WEB_PORT=80
```

Poi:

```bash
docker compose up -d
```

## 3. HTTPS con DuckDNS e Caddy

Se il server remoto puo' usare HTTPS, usa Caddy come reverse proxy davanti a nginx. Caddy ottiene e rinnova automaticamente i certificati Let's Encrypt.

Nel file `.env` imposta il dominio DuckDNS:

```bash
PUBLIC_DOMAIN=miocorso.duckdns.org
HTTP_PORT=80
HTTPS_PORT=443
```

Poi avvia con entrambi i file Compose:

```bash
docker compose -f docker-compose.yml -f docker-compose.https.yml up -d
```

Verifica:

```bash
docker compose -f docker-compose.yml -f docker-compose.https.yml ps
```

L'indirizzo pubblico sara':

```text
https://miocorso.duckdns.org
```

Nota: la porta 80 deve essere raggiungibile dall'esterno almeno durante il rilascio/rinnovo del certificato Let's Encrypt.

## 4. Aggiornare il server da GitHub

Ogni volta che modifichi il materiale e fai push:

```bash
cd /srv/game-design-summer-school-2026
git pull --ff-only
docker compose up -d
```

Se usi HTTPS:

```bash
docker compose -f docker-compose.yml -f docker-compose.https.yml up -d
```

Oppure usa lo script incluso:

```bash
./scripts/server-pull-and-restart.sh /srv/game-design-summer-school-2026
```

## 5. Modifiche live tramite volume

Il compose monta l'intero progetto in sola lettura:

```yaml
.:/srv/materiale:ro
```

nginx usa `site/` come root web e serve anche `docs/`. Quindi, se lavori direttamente nella cartella clonata sul server, ogni modifica dentro `site/` o `docs/` e' visibile al refresh del browser. Non serve ricostruire il container.

Per modifiche a `docker-compose.yml`, `.env` o `nginx/default.conf`, riavvia:

```bash
docker compose up -d --force-recreate
```

## 6. DuckDNS

Su DuckDNS crea un dominio, per esempio:

```text
miocorso.duckdns.org
```

Poi assicurati che punti all'IP pubblico del server. Puoi aggiornare manualmente:

```bash
./scripts/update-duckdns.sh miocorso TOKEN_DUCKDNS
```

Per aggiornamento automatico, sul server apri il crontab:

```bash
crontab -e
```

Aggiungi una riga come questa, sostituendo dominio e token:

```cron
*/5 * * * * /srv/game-design-summer-school-2026/scripts/update-duckdns.sh miocorso TOKEN_DUCKDNS >/tmp/duckdns.log 2>&1
```

## 7. Firewall

Se usi la porta 80:

```bash
sudo ufw allow 80/tcp
```

Se usi HTTPS:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

Se usi la porta 8080:

```bash
sudo ufw allow 8080/tcp
```

## 8. Accesso dal browser

Con HTTPS:

```text
https://miocorso.duckdns.org
```

Con porta 80 HTTP:

```text
http://miocorso.duckdns.org
```

Con porta 8080:

```text
http://miocorso.duckdns.org:8080
```

## 9. Log utili

```bash
docker compose logs -f web
docker compose -f docker-compose.yml -f docker-compose.https.yml logs -f caddy
```
