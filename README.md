# Snake Game 🐍

A browser-based Snake Game built with vanilla JavaScript and HTML5 Canvas.

## Features

- **Smooth 60fps gameplay** using `requestAnimationFrame`
- **4 game states**: Start screen, Playing, Paused, Game Over
- **Collision detection**: Walls and self-collision
- **Score system**: Current score and persistent high score (localStorage)
- **Keyboard controls**: Arrow keys + WASD for movement, Space/P to pause
- **Responsive design**: Works on desktop and mobile devices
- **Visual polish**: Smooth animations, glow effects, gradient snake body

## How to Play

### Desktop Controls
- **Move**: Arrow keys (↑ ↓ ← →) or WASD
- **Pause**: Space or P
- **Start/Restart**: Enter or Space (from menus)
- **Main Menu**: Escape

### Mobile
- The game board scales to fit your screen
- Touch controls not implemented (desktop-focused)

## Setup Instructions

1. **Clone or download** the game files to your local machine

2. **Open the game**:
   - Simply open `index.html` in any modern web browser
   - No server required - works with `file://` protocol
   - Or use a local server: `python -m http.server 8000` then visit `http://localhost:8000`

3. **Play!**

## File Structure

```
snake-game/
├── index.html      # Main HTML structure
├── style.css       # Styling and animations
├── game.js         # Game logic and rendering
└── README.md       # This file
```

## Game Mechanics

- **Grid**: 20x20 cells (400x400px canvas)
- **Snake**: Starts with 3 segments, grows when eating food
- **Food**: Spawns randomly, worth 10 points
- **Speed**: 10 moves per second (100ms interval)
- **High Score**: Automatically saved to browser's localStorage

## Technical Details

### Tech Stack
- **HTML5 Canvas** for rendering
- **Vanilla JavaScript** (ES6+)
- **CSS3** with CSS Variables for theming
- No external dependencies

### Key Implementation Details
- Game loop using `requestAnimationFrame` for smooth 60fps rendering
- Movement updates every 100ms (10 FPS for game logic)
- Collision detection checks walls and self-intersection
- High score persistence via `localStorage`
- Responsive design with media queries

## Browser Compatibility

Works in all modern browsers:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Design Specifications

### Color Palette
- Background: `#1a1a2e` (Dark blue-black)
- Board: `#16213e` (Deep navy)
- Snake Head: `#00ff88` (Bright green)
- Snake Body: Gradient `#00cc6a` to darker
- Food: `#ff6b6b` (Coral red)

### Visual Effects
- Snake head glow effect
- Food pulsing animation
- Score change animation
- Smooth transitions between states

## Future Enhancements

Potential improvements (not currently implemented):
- Multiple difficulty levels (speed adjustment)
- Sound effects
- Mobile touch controls (swipe gestures)
- Different food types with varying points
- Obstacles/walls mode
- Theme customization

## License

MIT - Feel free to use and modify!

---

Built with ❤️ by the Engineer Agent
