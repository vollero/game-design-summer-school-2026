# Traccia docente

Durata consigliata: 90-120 minuti.

Pubblico: ragazzi delle scuole medie. La lezione funziona anche con studenti piu' grandi, ma il linguaggio e' volutamente concreto.

## Obiettivo

Portare gli studenti a capire che un videogioco nasce da poche idee ripetute:

- un ciclo che gira nel tempo;
- variabili che descrivono lo stato;
- regole che cambiano lo stato;
- input che modificano le regole;
- disegno dello stato sullo schermo.

## Sequenza suggerita

### 1. Ciclo e tempo

Apri lo step 01. Fai notare che il programma continua a scrivere senza essere rilanciato.

Domande utili:

- Che cosa succede se cambio 500 in 100?
- Che cosa succede se commento `volte = volte + 1`?

### 2. Disegno e coordinate

Apri gli step 02-04. Cambia coordinate e dimensioni in diretta.

Punto chiave: sullo schermo la coordinata `y` cresce verso il basso.

### 3. Movimento

Apri gli step 05-06. Fai cambiare `velocitaX`, poi introduci `if`.

Punto chiave: una regola di gioco e' spesso un controllo `if`.

### 4. Controllo

Apri gli step 07-11. Introduci il player come oggetto, poi tastiera e direzione.

Punto chiave: il personaggio non e' il cerchio disegnato, ma i dati che lo descrivono.

### 5. Liste di oggetti

Apri gli step 12-15. Mostra prima un solo proiettile, poi tanti proiettili e tanti nemici.

Punto chiave: un array permette di gestire un numero variabile di cose.

### 6. Collisioni e partita

Apri gli step 16-20. Mostra distanza tra cerchi, punteggio, vite, feedback e restart.

Punto chiave: il gameplay nasce quando gli oggetti iniziano a interagire.

## Esercizi rapidi

- Cambia il colore del player.
- Cambia la frequenza di sparo.
- Rendi i nemici piu' veloci.
- Aggiungi un secondo tipo di nemico.
- Aggiungi un power-up che restituisce una vita.

## Gestione aula

Per una classe molto giovane conviene lavorare cosi:

1. prima dimostrazione dal proiettore;
2. poi 3 minuti di esperimento individuale su un numero o colore;
3. condivisione di 1-2 modifiche riuscite;
4. passaggio allo step successivo.

Evita di spiegare tutta la sintassi JavaScript all'inizio. Introduci solo i simboli necessari quando appaiono: `let`, `if`, funzioni, oggetti, array.

