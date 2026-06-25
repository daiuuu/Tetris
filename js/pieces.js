// ============================================================
//  pieces.js — Definición de todas las piezas tetrominó
//  Cada pieza tiene: forma (matriz), color pastel y nombre.
// ============================================================

const PIECES = {
  I: {
    name: 'I',
    color: '#A7D8FF',       // celeste pastel
    shadowColor: '#7EC8F5',
    shapes: [
      [[0,0,0,0],
       [1,1,1,1],
       [0,0,0,0],
       [0,0,0,0]],
      [[0,0,1,0],
       [0,0,1,0],
       [0,0,1,0],
       [0,0,1,0]],
      [[0,0,0,0],
       [0,0,0,0],
       [1,1,1,1],
       [0,0,0,0]],
      [[0,1,0,0],
       [0,1,0,0],
       [0,1,0,0],
       [0,1,0,0]],
    ],
  },

  O: {
    name: 'O',
    color: '#FFF3A6',       // amarillo pastel
    shadowColor: '#FFE97A',
    shapes: [
      [[1,1],
       [1,1]],
    ],
  },

  T: {
    name: 'T',
    color: '#CDB4FF',       // lila pastel
    shadowColor: '#B89EF5',
    shapes: [
      [[0,1,0],
       [1,1,1],
       [0,0,0]],
      [[0,1,0],
       [0,1,1],
       [0,1,0]],
      [[0,0,0],
       [1,1,1],
       [0,1,0]],
      [[0,1,0],
       [1,1,0],
       [0,1,0]],
    ],
  },

  L: {
    name: 'L',
    color: '#FFD4A8',       // naranja pastel
    shadowColor: '#FFBF80',
    shapes: [
      [[0,1,0],
       [0,1,0],
       [0,1,1]],
      [[0,0,0],
       [1,1,1],
       [1,0,0]],
      [[1,1,0],
       [0,1,0],
       [0,1,0]],
      [[0,0,1],
       [1,1,1],
       [0,0,0]],
    ],
  },

  J: {
    name: 'J',
    color: '#F7A8B8',       // rosa pastel
    shadowColor: '#F086A0',
    shapes: [
      [[0,1,0],
       [0,1,0],
       [1,1,0]],
      [[1,0,0],
       [1,1,1],
       [0,0,0]],
      [[0,1,1],
       [0,1,0],
       [0,1,0]],
      [[0,0,0],
       [1,1,1],
       [0,0,1]],
    ],
  },

  S: {
    name: 'S',
    color: '#B8F2C2',       // verde pastel
    shadowColor: '#8EE8A0',
    shapes: [
      [[0,1,1],
       [1,1,0],
       [0,0,0]],
      [[0,1,0],
       [0,1,1],
       [0,0,1]],
      [[0,0,0],
       [0,1,1],
       [1,1,0]],
      [[1,0,0],
       [1,1,0],
       [0,1,0]],
    ],
  },

  Z: {
    name: 'Z',
    color: '#FFB3B3',       // coral pastel
    shadowColor: '#FF9090',
    shapes: [
      [[1,1,0],
       [0,1,1],
       [0,0,0]],
      [[0,0,1],
       [0,1,1],
       [0,1,0]],
      [[0,0,0],
       [1,1,0],
       [0,1,1]],
      [[0,1,0],
       [1,1,0],
       [1,0,0]],
    ],
  },
};

// Lista de claves para seleccionar pieza aleatoria
const PIECE_KEYS = Object.keys(PIECES);

// Retorna una copia profunda de la pieza pedida
function getPiece(name) {
  const def = PIECES[name];
  return {
    name: def.name,
    color: def.color,
    shadowColor: def.shadowColor,
    shapes: def.shapes,
    rotation: 0,            // índice de rotación actual
  };
}

// Retorna la forma actual según la rotación
function getCurrentShape(piece) {
  return piece.shapes[piece.rotation];
}

// Avanza la rotación de la pieza (con wrapping)
function rotatePiece(piece) {
  const next = (piece.rotation + 1) % piece.shapes.length;
  return { ...piece, rotation: next };
}
