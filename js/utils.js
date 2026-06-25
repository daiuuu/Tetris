// ============================================================
//  utils.js — Helpers: colisiones, bag system, misc
// ============================================================

// ── Colisiones ────────────────────────────────────────────

function checkCollision(piece, board, px, py) {
  const shape = getCurrentShape(piece);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const bx = px + c;
      const by = py + r;
      if (bx < 0 || bx >= COLS) return true;
      if (by >= ROWS) return true;
      if (by >= 0 && board[by][bx]) return true;
    }
  }
  return false;
}

// ── Sistema 7-bag ─────────────────────────────────────────
// Garantiza que las 7 piezas aparezcan antes de repetirse.
// Esto elimina las rachas largas sin cierta pieza.

let _bag = [];

function _refillBag() {
  _bag = [...PIECE_KEYS];
  // Fisher-Yates shuffle
  for (let i = _bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [_bag[i], _bag[j]] = [_bag[j], _bag[i]];
  }
}

// Extrae la siguiente pieza del bag; rellena si está vacío
function drawFromBag() {
  if (_bag.length === 0) _refillBag();
  return _bag.pop();
}

// Reinicia el bag al comenzar una partida nueva
function resetBag() {
  _bag = [];
}

// ── Speed curve ───────────────────────────────────────────
// Fórmula suave inspirada en el estándar Tetris Guideline.
// Nivel 1 ≈ 800ms, nivel 10 ≈ 200ms, nivel 20 ≈ 50ms.
function getDropInterval(level) {
  return Math.max(50, Math.round(800 * Math.pow(0.85, level - 1)));
}

// ── Misc ──────────────────────────────────────────────────

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
