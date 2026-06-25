// ============================================================
//  game.js — Motor principal, estado y game loop
//  Orquesta: board.js, pieces.js, render.js, utils.js
// ============================================================

// ── Estados del juego ────────────────────────────────────

const STATE = Object.freeze({
  PLAYING:   'PLAYING',
  PAUSED:    'PAUSED',
  GAME_OVER: 'GAME_OVER',
});

// ── Configuración ─────────────────────────────────────────

const NEXT_QUEUE_SIZE  = 5;      // piezas visibles en la cola
const LOCK_DELAY_MS    = 500;    // ms de gracia antes de fijar pieza
const LOCK_MAX_RESETS  = 15;     // límite de resets del lock delay
const SOFT_DROP_MS     = 50;     // intervalo de caída con ↓ presionado
const DAS_DELAY_MS     = 170;    // ms antes de empezar auto-repetición
const DAS_INTERVAL_MS  = 50;     // ms entre repeticiones del DAS

// FLASH_MS está definido en render.js (380) y se usa aquí también
const FLASH_MS_GAME    = 380;

// ── Variables de estado ───────────────────────────────────

let canvas, ctx;
let holdCanvas, holdCtx;
let nextCanvas, nextCtx;

let gameState;
let board;

// Pieza activa
let currentPiece, pieceX, pieceY;

// Hold
let holdPiece;
let canHold;

// Cola de próximas piezas
let nextQueue;

// Puntuación
let score, level, lines, combo;
let highScore;

// Tiempo
let lastTimestamp = 0;
let dropAccumulator = 0;

// Input
let softDrop;
let dasLeft, dasRight, dasTimer, dasRepeating;

// Lock delay
let lockTimer;       // ms desde que la pieza tocó el suelo
let lockResets;      // cuántos resets del lock delay se usaron

// Efectos visuales
let flashRows;       // filas que se acaban de limpiar
let flashMsLeft;     // ms restantes del flash
let isTetris;        // fue una limpieza de 4 líneas

// ── Inicialización ────────────────────────────────────────

function init() {
  canvas     = document.getElementById('tetris-canvas');
  holdCanvas = document.getElementById('hold-canvas');
  nextCanvas = document.getElementById('next-canvas');

  canvas.width     = COLS * CELL;
  canvas.height    = ROWS * CELL;
  holdCanvas.width  = 120;
  holdCanvas.height = 90;
  nextCanvas.width  = 120;
  nextCanvas.height = NEXT_QUEUE_SIZE * PREVIEW_SLOT;

  ctx      = canvas.getContext('2d');
  holdCtx  = holdCanvas.getContext('2d');
  nextCtx  = nextCanvas.getContext('2d');

  highScore = parseInt(localStorage.getItem('tetris-hs') || '0', 10);

  bindKeys();
  document.getElementById('restart-btn').addEventListener('click', resetGame);
  document.getElementById('pause-btn').addEventListener('click', togglePause);

  resetGame();
  requestAnimationFrame(gameLoop);
}

// ── Reset completo ────────────────────────────────────────

function resetGame() {
  board           = createBoard();
  score           = 0;
  level           = 1;
  lines           = 0;
  combo           = 0;
  holdPiece       = null;
  canHold         = true;
  nextQueue       = [];
  dropAccumulator = 0;
  lastTimestamp   = 0;
  softDrop        = false;
  dasLeft         = false;
  dasRight        = false;
  dasTimer        = 0;
  dasRepeating    = false;
  lockTimer       = 0;
  lockResets      = 0;
  flashRows       = [];
  flashMsLeft     = 0;
  isTetris        = false;
  gameState       = STATE.PLAYING;

  resetBag();

  // Llenar la cola inicial
  for (let i = 0; i < NEXT_QUEUE_SIZE; i++) {
    nextQueue.push(getPiece(drawFromBag()));
  }

  spawnPiece();
  updateHUD();
  document.getElementById('pause-btn').textContent = 'Pausar';
}

// ── Spawn de pieza ────────────────────────────────────────

function spawnPiece() {
  currentPiece = nextQueue.shift();
  nextQueue.push(getPiece(drawFromBag()));

  const shape = getCurrentShape(currentPiece);
  pieceX = Math.floor((COLS - shape[0].length) / 2);
  pieceY = -1;

  lockTimer  = 0;
  lockResets = 0;
  canHold    = true;

  // Si al aparecer ya colisiona → game over
  if (checkCollision(currentPiece, board, pieceX, pieceY + 1)) {
    gameState = STATE.GAME_OVER;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('tetris-hs', highScore);
    }
    updateHUD();
  }
}

// ── Ghost piece ───────────────────────────────────────────

function getGhostY() {
  let gy = pieceY;
  while (!checkCollision(currentPiece, board, pieceX, gy + 1)) gy++;
  return gy;
}

// ── Movimiento ────────────────────────────────────────────

function moveLeft() {
  if (gameState !== STATE.PLAYING) return;
  if (!checkCollision(currentPiece, board, pieceX - 1, pieceY)) {
    pieceX--;
    _onPieceMoved();
  }
}

function moveRight() {
  if (gameState !== STATE.PLAYING) return;
  if (!checkCollision(currentPiece, board, pieceX + 1, pieceY)) {
    pieceX++;
    _onPieceMoved();
  }
}

function rotate() {
  if (gameState !== STATE.PLAYING) return;
  const rotated = rotatePiece(currentPiece);

  // Wall kick: intentar hasta 4 offsets
  const kicks = [0, 1, -1, 2, -2];
  for (const dx of kicks) {
    if (!checkCollision(rotated, board, pieceX + dx, pieceY)) {
      currentPiece = rotated;
      pieceX += dx;
      _onPieceMoved();
      return;
    }
  }
}

function hardDrop() {
  if (gameState !== STATE.PLAYING) return;
  while (!checkCollision(currentPiece, board, pieceX, pieceY + 1)) pieceY++;
  lockCurrentPiece();
}

// Después de un movimiento exitoso, si la pieza está en el suelo,
// reseteamos el lock delay (hasta el límite de resets permitidos)
function _onPieceMoved() {
  const onGround = checkCollision(currentPiece, board, pieceX, pieceY + 1);
  if (onGround && lockTimer > 0 && lockResets < LOCK_MAX_RESETS) {
    lockTimer = 0;
    lockResets++;
  }
}

// ── Hold ──────────────────────────────────────────────────

function doHold() {
  if (gameState !== STATE.PLAYING || !canHold) return;
  canHold = false;

  const saved = holdPiece ? holdPiece.name : null;
  holdPiece = getPiece(currentPiece.name); // guarda sin rotación

  if (saved) {
    currentPiece = getPiece(saved);
  } else {
    currentPiece = nextQueue.shift();
    nextQueue.push(getPiece(drawFromBag()));
  }

  const shape = getCurrentShape(currentPiece);
  pieceX = Math.floor((COLS - shape[0].length) / 2);
  pieceY = -1;
  lockTimer  = 0;
  lockResets = 0;
}

// ── Fijar pieza ───────────────────────────────────────────

function lockCurrentPiece() {
  lockPiece(board, currentPiece, pieceX, pieceY);

  const { count, rows } = clearLines(board);

  if (count > 0) {
    combo++;

    const base       = calcScore(count, level);
    const bonusCombo = calcComboBonus(combo, level);
    score           += base + bonusCombo;

    lines += count;
    level  = Math.floor(lines / 10) + 1;

    // Efecto visual
    flashRows   = rows;
    flashMsLeft = FLASH_MS_GAME;
    isTetris    = count === 4;
  } else {
    combo = 0;
  }

  updateHUD();
  spawnPiece();
}

// ── Pausa ─────────────────────────────────────────────────

function togglePause() {
  if (gameState === STATE.GAME_OVER) return;

  if (gameState === STATE.PLAYING) {
    gameState = STATE.PAUSED;
    document.getElementById('pause-btn').textContent = 'Continuar';
  } else {
    gameState = STATE.PLAYING;
    document.getElementById('pause-btn').textContent = 'Pausar';
    lastTimestamp = 0; // evitar delta enorme al retomar
  }
}

// ── Game Loop ─────────────────────────────────────────────

function gameLoop(timestamp) {
  const delta = lastTimestamp ? Math.min(timestamp - lastTimestamp, 100) : 0;
  lastTimestamp = timestamp;

  if (gameState === STATE.PLAYING) {
    _updatePhysics(delta);
    _updateEffects(delta);
  }

  _render();
  requestAnimationFrame(gameLoop);
}

function _updatePhysics(delta) {
  // DAS (auto-shift horizontal)
  if (dasLeft || dasRight) {
    dasTimer += delta;
    if (!dasRepeating && dasTimer >= DAS_DELAY_MS) {
      dasRepeating = true;
      dasTimer = 0;
      if (dasLeft) moveLeft(); else moveRight();
    } else if (dasRepeating) {
      while (dasTimer >= DAS_INTERVAL_MS) {
        dasTimer -= DAS_INTERVAL_MS;
        if (dasLeft) moveLeft(); else moveRight();
      }
    }
  }

  // Gravedad
  const interval = softDrop ? SOFT_DROP_MS : getDropInterval(level);
  dropAccumulator += delta;

  const onGround = checkCollision(currentPiece, board, pieceX, pieceY + 1);

  if (onGround) {
    // Lock delay: acumular tiempo; fijar al expirar
    lockTimer += delta;
    if (lockTimer >= LOCK_DELAY_MS) {
      lockCurrentPiece();
    }
    dropAccumulator = 0;
  } else {
    lockTimer = 0;
    while (dropAccumulator >= interval) {
      dropAccumulator -= interval;
      if (!checkCollision(currentPiece, board, pieceX, pieceY + 1)) {
        pieceY++;
      }
    }
  }
}

function _updateEffects(delta) {
  if (flashMsLeft > 0) flashMsLeft -= delta;
}

// ── Render del frame ──────────────────────────────────────

function _render() {
  // Canvas principal
  renderBackground(ctx, canvas);
  renderGrid(ctx);

  const ghostY = gameState !== STATE.GAME_OVER ? getGhostY() : null;
  if (ghostY !== null) renderGhost(ctx, currentPiece, pieceX, ghostY);

  renderBoard(ctx, board);
  renderPiece(ctx, currentPiece, pieceX, pieceY);
  renderLineClear(ctx, flashRows, isTetris, flashMsLeft);

  if (gameState === STATE.PAUSED)   renderPauseOverlay(ctx);
  if (gameState === STATE.GAME_OVER) renderGameOver(ctx, score, highScore);

  // Paneles laterales
  renderHoldCanvas(holdCtx, holdPiece, canHold, holdCanvas.width, holdCanvas.height);
  renderNextCanvas(nextCtx, nextQueue, nextCanvas.width);
}

// ── HUD HTML ──────────────────────────────────────────────

function updateHUD() {
  document.getElementById('score-value').textContent      = score.toLocaleString();
  document.getElementById('high-score-value').textContent = highScore.toLocaleString();
  document.getElementById('level-value').textContent      = level;
  document.getElementById('lines-value').textContent      = lines;

  const comboEl = document.getElementById('combo-display');
  if (combo > 1) {
    comboEl.classList.add('active');
    document.getElementById('combo-value').textContent = combo;
  } else {
    comboEl.classList.remove('active');
  }
}

// ── Teclado ───────────────────────────────────────────────

function bindKeys() {
  document.addEventListener('keydown', e => {
    // Prevenir scroll del navegador con las flechas
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)) {
      e.preventDefault();
    }

    switch (e.key) {
      case 'ArrowLeft':
        moveLeft();
        if (!dasLeft) { dasLeft = true; dasRight = false; dasTimer = 0; dasRepeating = false; }
        break;
      case 'ArrowRight':
        moveRight();
        if (!dasRight) { dasRight = true; dasLeft = false; dasTimer = 0; dasRepeating = false; }
        break;
      case 'ArrowUp':
        rotate();
        break;
      case 'ArrowDown':
        softDrop = true;
        break;
      case ' ':
        hardDrop();
        break;
      case 'c':
      case 'C':
      case 'Shift':
        doHold();
        break;
      case 'p':
      case 'P':
        togglePause();
        break;
      case 'r':
      case 'R':
        resetGame();
        break;
    }
  });

  document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft')  { dasLeft    = false; if (!dasRight) { dasTimer = 0; dasRepeating = false; } }
    if (e.key === 'ArrowRight') { dasRight   = false; if (!dasLeft)  { dasTimer = 0; dasRepeating = false; } }
    if (e.key === 'ArrowDown')  { softDrop   = false; }
  });
}

// ── Arranque ──────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);
