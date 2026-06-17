# Arena cooperativa

La pagina `site/collab.html` permette a piu' persone di entrare nella stessa battaglia.

## Funzionamento

- Ogni partecipante sceglie un nome.
- Il browser apre una connessione WebSocket su `/ws`.
- Il client invia solo input: rotazione, avanti, indietro o direzione touch.
- Il server simula posizione, spari, nemici, collisioni, bonus e punteggio.
- I proiettili colpiscono solo i nemici, non gli altri giocatori.
- Il mondo condiviso e' grande `5760x3840`; ogni browser mostra una camera `2880x1920` centrata sul proprio giocatore, con minimappa.
- Su dispositivi touch basta toccare o trascinare sul canvas: il personaggio ruota subito nella direzione indicata e avanza a una velocita' pari al `105%` del nemico piu' veloce.

## Servizi Docker

Il compose avvia due servizi:

- `web`: nginx, serve il laboratorio e fa proxy WebSocket;
- `collab`: Node.js, mantiene lo stato condiviso dell'arena.

## URL

Locale:

```text
http://localhost:8080/collab.html
```

Server HTTPS:

```text
https://tuodominio.duckdns.org/collab.html
```

## Aggiornamento server

```bash
cd /srv/game-design-summer-school-2026
git pull --ff-only
docker compose -f docker-compose.yml -f docker-compose.https.yml up -d --force-recreate
```

Se modifichi solo file dentro `site/`, il refresh del browser basta. Se modifichi `server/collab-server.js`, ricrea il servizio `collab`.
