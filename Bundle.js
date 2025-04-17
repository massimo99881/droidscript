// Variabili globali
var gameOver = false;
var background, ship;
var asteroids = [];
var missiles = [];
var missileImg, asteroidImg;
var gameOverImg;
var leftStick, rightStick, fwdStick, revStick, fireBtn;
var hVel = 0; // Velocità orizzontale
var vVel = 0; // Velocità verticale
var lastShipY = 0;  // verrà inizializzata in OnReady
var nextAsteroidId = 0;  // contatore per gli id degli asteroidi


//---------------------------------------------------------------------
// OnLoad: inizializza fisica, limiti e pre-carica gli asset
//---------------------------------------------------------------------
function OnLoad() {
    // Abilita la fisica e imposta i limiti su tutti i lati dello schermo
    gfx.AddPhysics();
    // Nota: gfx.SetGravity(0,0) non è disponibile
    gfx.Enclose(-1, "top,bottom,left,right");
    
    // Crea lo sfondo (scalato per coprire l'intera area)
    background = gfx.CreateBackground("Img/GalaxyUno.jpg", "stretch");
    
    // Crea la navicella
    ship = gfx.CreateSprite("Img/SpaceShooter.png", "ship");
    
    // Percorsi per le immagini del missile e dell'asteroide
    missileImg = "Img/bullet.png";
    asteroidImg = "Img/enemy2.png";
    
    // Crea l'asset per la schermata di game over (usa un'immagine appropriata)
    gameOverImg = gfx.CreateSprite("Img/enemy2.png", "gameover");
    
    // Crea i bottoni virtuali per il controllo
    AddButtons();
}

//---------------------------------------------------------------------
// AddButtons: crea i bottoni virtuali per il controllo del movimento
//---------------------------------------------------------------------
function AddButtons() {
    var stickSize = 0.08, stickLeft = 0.02;
    
    // Bottone sinistro
    leftStick = gfx.CreateCircle(stickSize, 0xeeeeee);
    gfx.AddGraphic(leftStick, stickLeft, 1 - leftStick.height * 2);
    leftStick.alpha = 0.1;
    
    // Bottone destro
    rightStick = gfx.CreateCircle(stickSize, 0xeeeeee);
    gfx.AddGraphic(rightStick, stickLeft + leftStick.width * 1.5, 1 - rightStick.height * 2);
    rightStick.alpha = 0.1;
    
    // Bottone per muovere in avanti (su)
    fwdStick = gfx.CreateCircle(stickSize, 0xeeeeee);
    gfx.AddGraphic(fwdStick, stickLeft + leftStick.width * 0.75, 1 - fwdStick.height * 3 + 0.02);
    fwdStick.alpha = 0.1;
    
    // Bottone per muovere indietro (giù)
    revStick = gfx.CreateCircle(stickSize, 0xeeeeee);
    gfx.AddGraphic(revStick, stickLeft + leftStick.width * 0.75, 1 - revStick.height - 0.02);
    revStick.alpha = 0.1;
    
    // Bottone per sparare
    fireBtn = gfx.CreateCircle(stickSize * 1.25, 0xeeeeee);
    gfx.AddGraphic(fireBtn, 1 - fireBtn.width - 0.02, 1 - fireBtn.height * 1.5);
    fireBtn.alpha = 0.1;
}

//---------------------------------------------------------------------
// SpawnWave: genera una “ondata” di 10 asteroidi
//---------------------------------------------------------------------
function SpawnWave(){
    if (gameOver) return;
    for(var i=0;i<10;i++){
        CreateAsteroid(i);
    }
}

//---------------------------------------------------------------------
// OnReady: aggiunge gli oggetti alla scena, crea gli asteroidi e avvia il gioco
//---------------------------------------------------------------------
function OnReady() {
    gfx.AddBackground(background);
    // Aggiungi la navicella alla scena: le coordinate sono normalizzate (0-1)
    gfx.AddSprite(ship, 0.1, 0.5, 0.1, 0.1);
    
    // Imposta la fisica della navicella con densità 0, in modo che non sia influenzata dalla gravità
    ship.SetPhysics(0, "dynamic");
    // Imposta una forma rettangolare per collisioni più precise
    ship.SetShape("rect", 0.8, 0.8);
    
    // Inizializza lastShipY con la posizione verticale iniziale della navicella
    lastShipY = 0.5;
    
    // prima ondata
    SpawnWave();
    // ripeti ogni 5 secondi (5000 ms)
    setInterval(SpawnWave,5000);
    
    gfx.Play();
}

//---------------------------------------------------------------------
// OnAnimate: aggiornamento continuo, chiamato circa 60 volte al secondo
//---------------------------------------------------------------------
function OnAnimate(time, timeDiff) {
    if (gameOver) return;
    
    // Scorri lo sfondo verso sinistra
    background.Scroll(-0.002, 0);
    
    ship.UpdatePhysics();
    
    // Applica la velocità impostata tramite i controlli
    ship.SetVelocity(hVel, vVel, 0);
    
    // Gestione della posizione verticale: se non c'è input verticale, mantieni lastShipY
    if (vVel === 0) {
        ship.y = lastShipY;
    } else {
        lastShipY = ship.y;
    }
     
    
    // Aggiornamento dei missili
    for (var j = missiles.length - 1; j >= 0; j--) {
        var ms = missiles[j];
        ms.SetVelocity(0.5, 0, 0);
        ms.UpdatePhysics();
        // Se il bordo destro del missile (ms.x + ms.width) ha raggiunto o superato il bordo destro dello schermo, rimuovilo.
        if (ms.x + ms.width >= 0.9992) {
            gfx.RemoveSprite(ms);
            missiles.splice(j, 1);
        }
    }
    
    // Aggiornamento degli asteroidi
    
    for (var i = 0; i < asteroids.length; i++) {
        var ast = asteroids[i];
                 
        ast.UpdatePhysics();
        
        // Ripristina la y iniziale per evitare cadute per effetto della gravità
        ast.y = ast.myY; 
        // console.log("x=",ast.x," - 0.01");
        if (ast.x <= 0.01) {
            gfx.RemoveSprite(ast);
            asteroids.splice(i, 1);
        }
        
    }
    
    //---------------------------------------------------------------------
    // Collisione manuale: missile vs asteroide
    //---------------------------------------------------------------------
    for (let i = asteroids.length - 1; i >= 0; i--) {
      for (let j = missiles.length - 1; j >= 0; j--) {
        // soglia 0 considera sovrapposizione perfetta
        if (gfx.IsOverlap(missiles[j], asteroids[i], 0)) {
          // rimuovi fisicamente entrambi
          gfx.RemoveSprite(missiles[j]);
          gfx.RemoveSprite(asteroids[i]);
          // togli da array
          missiles.splice(j, 1);
          asteroids.splice(i, 1);
          // appena uno è colpito, esci dal doppio ciclo per evitare errori di indice
          j = -1;
        }
      }
    }
    
    //-----------------------------------------------------------------
    // Collisione: asteroide vs navicella → GAME OVER
    //-----------------------------------------------------------------
    for (let i = 0; i < asteroids.length; i++) {
      if (gfx.IsOverlap(ship, asteroids[i], 0)) {
        gameOver = true;
        // Blocco OnAnimate d’ora in poi:
        alert("GAME OVER");
        break;
      }
    }

}

//---------------------------------------------------------------------
// OnControl: gestisce i tasti fisici e i tocchi, con movimento continuo finché il pulsante è premuto
//---------------------------------------------------------------------
function OnControl(touchState, touchX, touchY, keyState, key) {
    if (gameOver) return;
    
    // Controllo tramite tasti fisici: aggiorna hVel e vVel in base al keyState
    if (key == "ArrowLeft") {
        if (keyState == "Down") { hVel = -0.3; }
        else if (keyState == "Up") { hVel = 0; }
    }
    else if (key == "ArrowRight") {
        if (keyState == "Down") { hVel = 0.3; }
        else if (keyState == "Up") { hVel = 0; }
    }
    else if (key == "ArrowUp") {
        if (keyState == "Down") { vVel = -0.3; }
        else if (keyState == "Up") { vVel = 0; }
    }
    else if (key == "ArrowDown") {
        if (keyState == "Down") { vVel = 0.3; }
        else if (keyState == "Up") { vVel = 0; }
    }
    else if (key == " ") {
        if (keyState == "Down") { FireMissile(); }
    }
    
    // Controllo tramite touch sui bottoni virtuali
    if (touchState == "Down") {
        if (leftStick.Contains(touchX, touchY)) {
            hVel = -0.3;
        }
        else if (rightStick.Contains(touchX, touchY)) {
            hVel = 0.3;
        }
        else if (fwdStick.Contains(touchX, touchY)) {
            vVel = -0.3;
        }
        else if (revStick.Contains(touchX, touchY)) {
            vVel = 0.3;
        }
        else if (fireBtn.Contains(touchX, touchY)) {
            FireMissile();
        }
    }
    else if (touchState == "Up") {
        hVel = 0;
        vVel = 0;
    }
}

//---------------------------------------------------------------------
// FireMissile: crea e lancia un missile verso destra; il missile parte dalla navicella
//---------------------------------------------------------------------
function FireMissile() {
    var missile = gfx.CreateSprite(missileImg, "missile");
    
    // Se il missile non viene creato, logga l'errore
    if (!missile) {
        console.log("ERRORE: impossibile creare lo sprite per il missile. Controlla il path:", missileImg);
        return;
    }
    
    // Prova a ottenere le dimensioni intrinseche dello sprite
    var missileW = missile.width;
    var missileH = missile.height;
    if (!missileW || !missileH) {
        console.log("ERRORE: dimensioni intrinseche non disponibili per il missile:", missileImg);
        return;
    }
    
    // Calcola il punto di partenza basato sulla navicella:
    // il missile parte dal bordo destro della navicella, centrato verticalmente.
    var sx = ship.x;
    var sy = ship.y;
    var sw = ship.width;
    var startX = sx + sw;
    var startY = sy + ship.height / 2 - missileH / 2;
    
    // Aggiunge lo sprite alla scena usando le sue dimensioni intrinseche.
    gfx.AddSprite(missile, startX, startY, missileW, missileH);
    missile.group = "missile";
    
    // Imposta la fisica con densità 0 per evitare effetti di gravità.
    missile.SetPhysics(0, "dynamic");
    missile.SetShape("rect", 1, 1);
    // Imposta una velocità orizzontale fissa per il missile, senza componente verticale.
    missile.SetVelocity(0.5, 0, 0);
    
    // Aggiunge il missile all'array dei missili.
    missiles.push(missile);
}

//---------------------------------------------------------------------
// CreateAsteroid: genera un nuovo asteroide in una posizione casuale a destra dello schermo
//---------------------------------------------------------------------
function CreateAsteroid(i) {
    var asteroid = gfx.CreateSprite(asteroidImg, "asteroid");
    if (!asteroid) {
        console.log("ERRORE: impossibile creare lo sprite per l'asteroide. Controlla il path:", asteroidImg);
        return;
    }
    var asteroid_DIM =  0.045; 
    
    // Posiziona l'asteroide in modo che la sua coordinata x sia quasi 0.999 e la coordinata y sia casuale.
    var posX = 0.95; // leggero offset se desiderato
    
    var spacing = (1 - asteroid_DIM) / (10 - 1);
    var posY    = i * spacing;
    //console.log("posY: ",posY);s
    
    // Salva il valore y iniziale per uso futuro (per evitare effetti della gravità)
    asteroid.myY = posY; 
    
    //console.log("a:",posX," ",posY);
    gfx.AddSprite(asteroid, posX, posY, asteroid_DIM, asteroid_DIM);
    asteroid.group = "asteroid";
    asteroid.SetPhysics(0, "dynamic");
    asteroid.SetShape("rect", 1, 1);
    asteroid.SetVelocity(-0.2, 0, 0);
    asteroid.id = nextAsteroidId++;

    // Aggiungi l'asteroide all'array degli asteroidi.
    asteroids.push(asteroid);
   /* console.log("ELENCO ASTEROIDI");
    for (var i = 0; i < asteroids.length; i++) {
        console.log( asteroids[i].id, ",");
    }*/
}

//---------------------------------------------------------------------
// Crash: gestisce la collisione tra la navicella e un asteroide e mostra "hai perso"
//---------------------------------------------------------------------
function Crash() {
    // Implementazione futura…
}

//---------------------------------------------------------------------
// OnCollide: gestisce le collisioni fisiche automatiche (opzionale)
//---------------------------------------------------------------------
//---------------------------------------------------------------------
// OnCollide: rimuove missile e asteroide in caso di collisione
//---------------------------------------------------------------------
 function OnCollide(a, b) {
     
 }
