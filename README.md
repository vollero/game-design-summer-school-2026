# Game Design Summer School 2026

Materiale per una lezione/laboratorio di programmazione di videogiochi per ragazzi delle scuole medie.

Il progetto contiene:

- un laboratorio web interattivo con esempi JavaScript granulari;
- una mini libreria didattica canvas, ispirata a p5.js ma inclusa nel progetto;
- una progressione di script dal ciclo infinito al mini shooter;
- un finale con canvas 1440x960, controllo a rotazione, bonus arma tripla e bonus riparazione;
- una arena cooperativa online 5760x3840 con camera 2880x1920 sul giocatore, nomi, WebSocket, controllo touch e fuoco amico disabilitato;
- una arenaPVP tutti contro tutti con massimo 5 giocatori, visitatori, muri, 5 vite e ultimo sopravvissuto;
- slide Beamer in LaTeX;
- PDF delle slide servito dal laboratorio web;
- container Docker con nginx per servire tutto come sito statico;
- script e documentazione per sincronizzare il materiale su un server remoto.

## Avvio locale

```bash
docker compose up -d
```

Poi apri:

```text
http://localhost:8080
```

Arena cooperativa:

```text
http://localhost:8080/collab.html
```

arenaPVP:

```text
http://localhost:8080/arenaPVP.html
```

La directory del progetto e' montata come volume dentro nginx. Se modifichi HTML, CSS, JS, lezioni o documenti, il cambiamento e' visibile al refresh del browser senza ricostruire l'immagine. I servizi `collab` e `pvp` gestiscono le partite condivise via WebSocket: se modifichi `server/collab-server.js` o `server/pvp-server.js`, ricrea i container.

## Struttura

```text
site/
  index.html              laboratorio web
  collab.html             arena cooperativa multiplayer
  arenaPVP.html           arena multiplayer tutti contro tutti
  css/styles.css          stile dell'interfaccia
  css/arena-pvp.css       stile arenaPVP
  js/app.js               shell del laboratorio
  js/arena-pvp.js         client arenaPVP
  js/collab.js            client arena cooperativa
  js/edu-game.js          mini engine canvas didattico
  lessons/*.js            progressione degli esempi
server/
  collab-server.js        server WebSocket co-op senza dipendenze npm
  pvp-server.js           server WebSocket arenaPVP senza dipendenze npm
slides/
  lezione-game-loop.tex   presentazione Beamer
nginx/
  default.conf            configurazione nginx
docs/
  remote-server.md        deploy su server Unix e DuckDNS
scripts/
  sync-remote.sh          sincronizzazione via rsync
  restart-remote.sh       riavvio compose sul server
  server-pull-and-restart-https.sh
```

## Collegamento a GitHub

Crea un repository vuoto su GitHub, poi collega questa cartella:

```bash
git remote add origin git@github.com:TUO-UTENTE/game-design-summer-school-2026.git
git branch -M main
git push -u origin main
```

Sul server remoto puoi clonare lo stesso repository e avviare `docker compose up -d`.

Per HTTPS con DuckDNS usa l'override Caddy:

```bash
cp .env.example .env
# modifica PUBLIC_DOMAIN dentro .env
docker compose -f docker-compose.yml -f docker-compose.https.yml up -d
```

## Slide

Per compilare le slide:

```bash
cd slides
latexmk -pdf lezione-game-loop.tex
```

In alternativa:

```bash
pdflatex lezione-game-loop.tex
pdflatex lezione-game-loop.tex
```

## Uso in aula

Il percorso consigliato e':

1. partire dal ciclo che stampa messaggi;
2. passare al canvas e al game loop;
3. introdurre variabili, posizione, velocita';
4. collegare la tastiera allo stato del gioco;
5. introdurre liste di oggetti con proiettili e nemici;
6. chiudere con collisioni, punteggio e game over.
7. aprire l'arena cooperativa per far entrare piu' studenti nella stessa battaglia.

Ogni step nel laboratorio e' modificabile. Gli studenti possono cambiare numeri, colori e regole e premere `Esegui`.
