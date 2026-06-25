// ============================================================
//  render.js — Todo el dibujo en Canvas
//  El canvas principal solo dibuja el tablero (10×20).
//  Las vistas de hold/next se dibujan en sus propios canvas.
// ============================================================

const CELL          = 32;     // px por celda del tablero
const BORDER_RADIUS = 5;      // redondeo de celdas
const PREVIEW_CELL  = 22;     // px por celda en paneles hold/next
const PREVIEW_SLOT  = 90;     // alto en px de cada slot de pieza next
const FLASH_MS      = 380;    // duración del flash (debe coincidir con game.js)

const COLOR_BG    = '#1A1A2E';
const COLOR_GRID  = 'rgba(255,255,255,0.05)';
const COLOR_GHOST = 'rgba(255,255,255,0.10)';

// ── Helper: rectángulo con esquinas redondeadas ────────────

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Dibuja una celda de color (con glow y brillo interior) ─

function drawCell(ctx, x, y, color, cellSize = CELL, alpha = 1) {
  const px  = x * cellSize;
  const py  = y * cellSize;
  const pad = 1;
  const r   = cellSize === CELL ? BORDER_RADIUS : 4;

  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.shadowColor = color;
  ctx.shadowBlur  = 8;
  ctx.fillStyle   = color;
  roundRect(ctx, px + pad, py + pad, cellSize - pad * 2, cellSize - pad * 2, r);
  ctx.fill();

  // Brillo superior para efecto 3D
  ctx.shadowBlur = 0;
  const g = ctx.createLinearGradient(px, py, px, py + cellSize);
  g.addColorStop(0, 'rgba(255,255,255,0.38)');
  g.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = g;
  roundRect(ctx, px + pad, py + pad, cellSize - pad * 2, cellSize - pad * 2, r);
  ctx.fill();

  ctx.restore();
}

// ── Canvas principal ───────────────────────────────────────

function renderBackground(ctx, canvas) {
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function renderGrid(ctx) {
  ctx.strokeStyle = COLOR_GRID;
  ctx.lineWidth   = 1;
  for (let col = 0; col <= COLS; col++) {
    ctx.beginPath();
    ctx.moveTo(col * CELL, 0);
    ctx.lineTo(col * CELL, ROWS * CELL);
    ctx.stroke();
  }
  for (let row = 0; row <= ROWS; row++) {
    ctx.beginPath();
    ctx.moveTo(0, row * CELL);
    ctx.lineTo(COLS * CELL, row * CELL);
    ctx.stroke();
  }
}

function renderBoard(ctx, board) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c]) drawCell(ctx, c, r, board[r][c]);
    }
  }
}

function renderGhost(ctx, piece, px, ghostY) {
  if (ghostY === null) return;
  const shape = getCurrentShape(piece);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const x = px + c, y = ghostY + r;
      if (y >= 0) {
        // Ghost: borde punteado del color de la pieza
        const px2  = x * CELL + 1;
        const py2  = y * CELL + 1;
        const size = CELL - 2;
        ctx.save();
        ctx.strokeStyle = piece.color;
        ctx.globalAlpha = 0.25;
        ctx.lineWidth   = 1.5;
        roundRect(ctx, px2, py2, size, size, BORDER_RADIUS);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}

function renderPiece(ctx, piece, px, py) {
  const shape = getCurrentShape(piece);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const x = px + c, y = py + r;
      if (y >= 0) drawCell(ctx, x, y, piece.color);
    }
  }
}

// Flash al limpiar líneas; alpha se desvanece con el tiempo restante
function renderLineClear(ctx, rows, isTetris, flashMsLeft) {
  if (!rows.length || flashMsLeft <= 0) return;
  const alpha = (flashMsLeft / FLASH_MS) * 0.65;

  ctx.save();
  // Tetris (4 líneas): flash dorado; el resto: flash blanco
  ctx.fillStyle = isTetris
    ? `rgba(255, 230, 80, ${alpha})`
    : `rgba(255, 255, 255, ${alpha})`;

  for (const row of rows) {
    ctx.fillRect(0, row * CELL, COLS * CELL, CELL);
  }

  // Para Tetris, además un glow sobre todo el tablero
  if (isTetris) {
    ctx.fillStyle = `rgba(255, 220, 80, ${alpha * 0.18})`;
    ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);
  }

  ctx.restore();
}

// Overlay de pausa
function renderPauseOverlay(ctx) {
  const cx = (COLS * CELL) / 2;
  const cy = (ROWS * CELL) / 2;

  ctx.fillStyle = 'rgba(26, 26, 46, 0.82)';
  ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#CDB4FF';
  ctx.font = 'bold 34px "Segoe UI", sans-serif';
  ctx.shadowColor = '#CDB4FF';
  ctx.shadowBlur  = 16;
  ctx.fillText('PAUSADO', cx, cy - 16);

  ctx.shadowBlur = 0;
  ctx.fillStyle  = 'rgba(255,255,255,0.38)';
  ctx.font       = '13px "Segoe UI", sans-serif';
  ctx.fillText('Presioná P para continuar', cx, cy + 18);
  ctx.restore();
}

// Overlay de game over
function renderGameOver(ctx, score, highScore) {
  const cx = (COLS * CELL) / 2;
  const cy = (ROWS * CELL) / 2;

  ctx.fillStyle = 'rgba(26, 26, 46, 0.88)';
  ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);

  ctx.save();
  ctx.textAlign   = 'center';
  ctx.textBaseline = 'middle';

  // Título
  ctx.fillStyle  = '#F7A8B8';
  ctx.font       = 'bold 32px "Segoe UI", sans-serif';
  ctx.shadowColor = '#F7A8B8';
  ctx.shadowBlur  = 18;
  ctx.fillText('GAME OVER', cx, cy - 44);

  // Score final
  ctx.shadowBlur  = 0;
  ctx.fillStyle   = 'rgba(255,255,255,0.6)';
  ctx.font        = '13px "Segoe UI", sans-serif';
  ctx.fillText('PUNTUACIÓN', cx, cy - 12);

  ctx.fillStyle  = '#FFF3A6';
  ctx.font       = 'bold 26px "Segoe UI", sans-serif';
  ctx.fillText(score.toLocaleString(), cx, cy + 14);

  // High score
  if (score >= highScore && score > 0) {
    ctx.fillStyle = '#B8F2C2';
    ctx.font      = '12px "Segoe UI", sans-serif';
    ctx.fillText('¡Nuevo récord!', cx, cy + 40);
  }

  // Instrucción
  ctx.fillStyle = 'rgba(205,180,255,0.7)';
  ctx.font      = '13px "Segoe UI", sans-serif';
  ctx.fillText('Presioná R para reiniciar', cx, cy + 66);

  ctx.restore();
}

// ── Paneles laterales (hold-canvas / next-canvas) ──────────

// Dibuja una pieza centrada en un canvas pequeño.
// Se usa para hold y para cada slot de la cola.
function _drawPreviewPiece(ctx, piece, offsetX, offsetY, dimmed) {
  const shape = getCurrentShape(piece);
  const cols  = shape[0].length;
  const rows  = shape.length;
  const w     = cols * PREVIEW_CELL;
  const h     = rows * PREVIEW_CELL;
  const sx    = offsetX + Math.floor((100 - w) / 2);
  const sy    = offsetY + Math.floor((PREVIEW_SLOT - h) / 2);

  ctx.save();
  if (dimmed) ctx.globalAlpha = 0.35;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!shape[r][c]) continue;
      const px  = sx + c * PREVIEW_CELL;
      const py  = sy + r * PREVIEW_CELL;
      const pad = 1;

      ctx.shadowColor = piece.color;
      ctx.shadowBlur  = 6;
      ctx.fillStyle   = piece.color;
      roundRect(ctx, px + pad, py + pad, PREVIEW_CELL - pad * 2, PREVIEW_CELL - pad * 2, 4);
      ctx.fill();

      ctx.shadowBlur = 0;
      const g = ctx.createLinearGradient(px, py, px, py + PREVIEW_CELL);
      g.addColorStop(0, 'rgba(255,255,255,0.35)');
      g.addColorStop(1, 'rgba(0,0,0,0.10)');
      ctx.fillStyle = g;
      roundRect(ctx, px + pad, py + pad, PREVIEW_CELL - pad * 2, PREVIEW_CELL - pad * 2, 4);
      ctx.fill();
    }
  }

  ctx.restore();
}

// Renderiza el canvas de hold piece
function renderHoldCanvas(ctx, piece, canHold, w, h) {
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  roundRect(ctx, 3, 3, w - 6, h - 6, 8);
  ctx.fill();

  if (!piece) {
    ctx.fillStyle  = 'rgba(255,255,255,0.18)';
    ctx.font       = '11px "Segoe UI", sans-serif';
    ctx.textAlign  = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('vacío', w / 2, h / 2);
    return;
  }

  // Centrar la pieza dentro del canvas usando _drawPreviewPiece con offsets ajustados
  const shape  = getCurrentShape(piece);
  const cols   = shape[0].length;
  const rows   = shape.length;
  const pw     = cols * PREVIEW_CELL;
  const ph     = rows * PREVIEW_CELL;
  const sx     = Math.floor((w - pw) / 2);
  const sy     = Math.floor((h - ph) / 2);
  const pad    = 1;

  ctx.save();
  if (!canHold) ctx.globalAlpha = 0.35;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!shape[r][c]) continue;
      const px = sx + c * PREVIEW_CELL;
      const py = sy + r * PREVIEW_CELL;

      ctx.shadowColor = piece.color;
      ctx.shadowBlur  = 6;
      ctx.fillStyle   = piece.color;
      roundRect(ctx, px + pad, py + pad, PREVIEW_CELL - pad * 2, PREVIEW_CELL - pad * 2, 4);
      ctx.fill();

      ctx.shadowBlur = 0;
      const g = ctx.createLinearGradient(px, py, px, py + PREVIEW_CELL);
      g.addColorStop(0, 'rgba(255,255,255,0.35)');
      g.addColorStop(1, 'rgba(0,0,0,0.10)');
      ctx.fillStyle = g;
      roundRect(ctx, px + pad, py + pad, PREVIEW_CELL - pad * 2, PREVIEW_CELL - pad * 2, 4);
      ctx.fill();
    }
  }

  ctx.restore();
}

// Renderiza el canvas de la cola de próximas piezas (5 slots)
function renderNextCanvas(ctx, queue, w) {
  const totalH = queue.length * PREVIEW_SLOT;
  ctx.clearRect(0, 0, w, totalH);

  queue.forEach((piece, i) => {
    const slotY = i * PREVIEW_SLOT;

    // Fondo del slot
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    roundRect(ctx, 3, slotY + 3, w - 6, PREVIEW_SLOT - 6, 8);
    ctx.fill();

    _drawPreviewPiece(ctx, piece, 0, slotY, false);
  });
}
