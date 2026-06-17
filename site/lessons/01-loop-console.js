// STEP 01
// Un ciclo puo' ripetere la stessa azione molte volte.
// Qui usiamo setInterval: ogni 500 millisecondi scrive una riga.

function setup() {
  let volte = 0;

  setInterval(() => {
    volte = volte + 1;
    log("Il gioco gira... tick " + volte);
  }, 500);
}

