# 🎮 Tetris Pastel Edition

Un juego de Tetris moderno desarrollado con **HTML, CSS y JavaScript**, utilizando la **Canvas API** para el renderizado.

Este proyecto transforma el Tetris clásico en una experiencia más completa, con sistema de niveles, puntuación avanzada, combos, y mejoras visuales con estética pastel.

---

## 🌸 Demo

> https://daiuuu.github.io/Tetris/

---

## ✨ Características

### 🧩 Mecánicas del juego

* Tablero clásico 10x20
* Piezas Tetrominó (I, O, T, L, J, S, Z)
* Movimiento: izquierda, derecha, rotación y caída
* Detección de colisiones
* Eliminación de líneas completas

---

### 📈 Sistema de niveles

* El nivel aumenta cada **10 líneas eliminadas**
* La velocidad de caída incrementa progresivamente
* Dificultad dinámica según progreso del jugador

---

### 💯 Sistema de puntuación

Sistema clásico de Tetris:

* 1 línea → 100 puntos
* 2 líneas → 300 puntos
* 3 líneas → 500 puntos
* 4 líneas (Tetris) → 800 puntos

Incluye bonus por nivel para aumentar progresión.

---

### 🔥 Combo system

* Multiplicador de puntos por líneas consecutivas
* Aumenta la puntuación si el jugador limpia líneas seguidas sin pausas

---

### ⚙️ Gravity system

* Sistema de caída basado en tiempo (deltaTime)
* Ajuste dinámico según nivel
* Movimiento suave y consistente

---

### 🧠 Estados del juego

* PLAYING
* PAUSED
* GAME OVER

Control completo del flujo del juego.

---

### 🧩 Hold piece system

* Permite guardar una pieza activa
* Intercambio estratégico durante el juego
* Uso limitado por pieza activa

---

### 🔮 Next pieces preview

* Visualización de próximas piezas
* Mejora la planificación del jugador

---

### ⏱️ Lock delay

* Retraso antes de fijar una pieza al suelo
* Permite ajustes finales de posición


---

## 🖥️ UI

* Header con título del juego
* Score en tiempo real
* Nivel actual
* Combo activo
* Preview de próxima pieza
* Hold piece display
* Footer personalizado

---

## 📦 Tecnologías utilizadas

* HTML5
* CSS3
* JavaScript (ES6+)
* Canvas API

---

## 📁 Estructura del proyecto

```text
/index.html
/css/styles.css
/js/game.js
/js/board.js
/js/pieces.js
/js/render.js
/js/input.js
```

---

## 🚀 Cómo ejecutar el proyecto

1. Clonar el repositorio
2. Abrir `index.html` en el navegador
3. Jugar 🎮

---

## 👩‍💻 Autor

Hecho por **Daiana Soria 💖**
