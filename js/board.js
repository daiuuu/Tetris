// ============================================================
//  board.js — Lógica del tablero de juego
// ============================================================

const COLS = 10;
const ROWS = 20;

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

// Fija la pieza en el tablero, guardando el color en cada celda
function lockPiece(board, piece, px, py) {
  const shape = getCurrentShape(piece);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const bx = px + c;
      const by = py + r;
      if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
        board[by][bx] = piece.color;
      }
    }
  }
}

// Elimina líneas completas. Devuelve { count, rows } donde rows son
// los índices originales de las filas eliminadas (para el flash visual).
function clearLines(board) {
  const fullRows = [];
  for (let r = 0; r < ROWS; r++) {
    if (board[r].every(cell => cell !== null)) fullRows.push(r);
  }
  if (fullRows.length === 0) return { count: 0, rows: [] };

  // Filtrar filas llenas y agregar vacías arriba (muta el array original)
  const kept = board.filter((_, idx) => !fullRows.includes(idx));
  while (kept.length < ROWS) kept.unshift(Array(COLS).fill(null));
  board.splice(0, ROWS, ...kept);

  return { count: fullRows.length, rows: fullRows };
}

// Puntuación base clásica: 1=100, 2=300, 3=500, 4=800 × nivel
function calcScore(lineCount, level) {
  const base = [0, 100, 300, 500, 800];
  return (base[lineCount] ?? 0) * level;
}

// Bonus por combo (puntaje adicional por racha de limpiezas consecutivas)
// El bonus escala con el combo y el nivel actual
function calcComboBonus(combo, level) {
  if (combo < 2) return 0;
  const bonus = Math.min((combo - 1) * 50, 300); // hasta +300 por combo
  return bonus * level;
}

// El juego termina si hay piezas en la fila visible más alta
function isGameOver(board) {
  return board[0].some(cell => cell !== null);
}
