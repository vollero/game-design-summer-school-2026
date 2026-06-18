# arenaPVP

La pagina `site/arenaPVP.html` aggiunge una seconda arena multiplayer separata dalla modalita' cooperativa.

## Regole

- Massimo `5` giocatori attivi.
- Chi entra quando i posti sono pieni, o mentre una partita e' in corso, diventa visitatore.
- La partita parte dalla lobby quando ci sono almeno `2` giocatori e tutti i giocatori presenti hanno premuto `Pronto`.
- Ogni giocatore ha `5` vite.
- I proiettili colpiscono solo gli altri giocatori.
- Barriere e muri bloccano movimento e proiettili, quindi possono essere usati come copertura.
- Vince l'ultimo giocatore rimasto vivo.

## Controlli

- Tastiera: frecce o `WASD`.
- Touch: tocca o trascina sul canvas per puntare la direzione di movimento.
- Il fuoco e' automatico nella direzione del personaggio.

## Servizi Docker

Il compose avvia un servizio dedicato:

- `pvp`: Node.js, mantiene stato, vite, muri, proiettili e lobby dell'arena PVP.

nginx espone:

- pagina: `/arenaPVP.html`
- WebSocket: `/arenaPVP-ws`
- health check: `/api/arenaPVP/health`

## Aggiornamento server

Quando aggiorni questa modalita', ricrea i container:

```bash
cd /srv/game-design-summer-school-2026
git pull --ff-only
docker compose -f docker-compose.yml -f docker-compose.https.yml up -d --force-recreate
curl -fsS https://tuodominio.duckdns.org/api/arenaPVP/health
```
