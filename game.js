// Snake Game - Main Game Logic

// ==========================================
// GAME SETTINGS
// ==========================================

// Default Settings
const DEFAULT_SETTINGS = {
    speed: 'normal',      // slow, normal, fast, insane
    walls: true,          // true = walls kill, false = wrap around
    gridSize: 'medium',   // small, medium, large
    snakeColor: 'green',  // green, blue, purple, orange
    sound: false          // placeholder for sound
};

// Speed configurations (milliseconds between moves)
const SPEED_CONFIG = {
    slow: 200,     // 5 moves/sec
    normal: 150,   // 6.6 moves/sec
    fast: 100,     // 10 moves/sec
    insane: 70     // 14 moves/sec
};

// Grid size configurations
const GRID_CONFIG = {
    small: 15,
    medium: 20,
    large: 25
};

// Snake color configurations
const SNAKE_COLORS = {
    green: {
        head: '#00ff88',
        body: '#00cc6a',
        glow: 'rgba(0, 255, 136, 0.3)'
    },
    blue: {
        head: '#00d4ff',
        body: '#0099cc',
        glow: 'rgba(0, 212, 255, 0.3)'
    },
    purple: {
        head: '#b366ff',
        body: '#8833ff',
        glow: 'rgba(179, 102, 255, 0.3)'
    },
    orange: {
        head: '#ffaa00',
        body: '#ff7700',
        glow: 'rgba(255, 170, 0, 0.3)'
    }
};

// Current Settings (loaded from localStorage or defaults)
let gameSettings = { ...DEFAULT_SETTINGS };

// ==========================================
// GAME CONSTANTS (now dynamic based on settings)
// ==========================================

const CELL_SIZE = 20;

// Colors
const COLORS = {
    board: '#16213e',
    gridLine: '#0f3460',
    food: '#ff6b6b',
    foodGlow: 'rgba(255, 107, 107, 0.3)'
};

// Game State
const GameState = {
    IDLE: 'idle',
    SETTINGS: 'settings',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
};

// Direction Vectors
const Direction = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

// Game Variables
let canvas, ctx;
let gameState = GameState.IDLE;
let snake = [];
let food = { x: 0, y: 0 };
let direction = Direction.RIGHT;
let nextDirection = Direction.RIGHT;
let score = 0;
let highScore = 0;
let gameLoop = null;
let lastRenderTime = 0;
let controlsHintTimeout = null;

// Computed values based on settings
let GRID_SIZE = GRID_CONFIG[gameSettings.gridSize];
let CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
let GAME_SPEED = SPEED_CONFIG[gameSettings.speed];

// DOM Elements
let startScreen, gameScreen, pauseOverlay, gameoverOverlay, settingsScreen;
let currentScoreEl, highScoreEl, startHighScoreEl;
let finalScoreEl, bestScoreEl, newRecordEl;
let playingControlsHint;

// ==========================================
// SETTINGS FUNCTIONS
// ==========================================

// Load settings from localStorage
function loadSettings() {
    const saved = localStorage.getItem('snakeGameSettings');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            gameSettings = { ...DEFAULT_SETTINGS, ...parsed };
        } catch (e) {
            console.warn('Failed to load settings, using defaults');
            gameSettings = { ...DEFAULT_SETTINGS };
        }
    }
    
    // Apply settings to game variables
    applySettings();
}

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('snakeGameSettings', JSON.stringify(gameSettings));
}

// Apply settings to game variables
function applySettings() {
    GRID_SIZE = GRID_CONFIG[gameSettings.gridSize];
    CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
    GAME_SPEED = SPEED_CONFIG[gameSettings.speed];
    
    // Update canvas size if canvas exists
    if (canvas) {
        canvas.width = CANVAS_SIZE;
        canvas.height = CANVAS_SIZE;
    }
}

// Update settings UI to reflect current settings
function updateSettingsUI() {
    // Speed
    const speedRadio = document.querySelector(`input[name="speed"][value="${gameSettings.speed}"]`);
    if (speedRadio) speedRadio.checked = true;
    
    // Walls
    const wallsToggle = document.getElementById('walls-toggle');
    const wallsLabel = document.getElementById('walls-label');
    if (wallsToggle) {
        wallsToggle.checked = gameSettings.walls;
        if (wallsLabel) wallsLabel.textContent = gameSettings.walls ? 'ON' : 'OFF';
    }
    
    // Grid Size
    const gridRadio = document.querySelector(`input[name="grid-size"][value="${gameSettings.gridSize}"]`);
    if (gridRadio) gridRadio.checked = true;
    
    // Snake Color
    const colorRadio = document.querySelector(`input[name="snake-color"][value="${gameSettings.snakeColor}"]`);
    if (colorRadio) colorRadio.checked = true;
    
    // Sound
    const soundToggle = document.getElementById('sound-toggle');
    const soundLabel = document.getElementById('sound-label');
    if (soundToggle) {
        soundToggle.checked = gameSettings.sound;
        if (soundLabel) soundLabel.textContent = gameSettings.sound ? 'ON' : 'OFF';
    }
}

// Setup settings event listeners
function setupSettingsListeners() {
    // Settings button
    document.getElementById('settings-btn').addEventListener('click', showSettings);
    
    // Back button
    document.getElementById('settings-back-btn').addEventListener('click', hideSettings);
    
    // Speed options
    document.querySelectorAll('input[name="speed"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            gameSettings.speed = e.target.value;
            GAME_SPEED = SPEED_CONFIG[gameSettings.speed];
            saveSettings();
        });
    });
    
    // Walls toggle
    const wallsToggle = document.getElementById('walls-toggle');
    const wallsLabel = document.getElementById('walls-label');
    if (wallsToggle) {
        wallsToggle.addEventListener('change', (e) => {
            gameSettings.walls = e.target.checked;
            if (wallsLabel) wallsLabel.textContent = gameSettings.walls ? 'ON' : 'OFF';
            saveSettings();
        });
    }
    
    // Grid size options
    document.querySelectorAll('input[name="grid-size"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            gameSettings.gridSize = e.target.value;
            applySettings();
            saveSettings();
        });
    });
    
    // Snake color options
    document.querySelectorAll('input[name="snake-color"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            gameSettings.snakeColor = e.target.value;
            saveSettings();
        });
    });
    
    // Sound toggle
    const soundToggle = document.getElementById('sound-toggle');
    const soundLabel = document.getElementById('sound-label');
    if (soundToggle) {
        soundToggle.addEventListener('change', (e) => {
            gameSettings.sound = e.target.checked;
            if (soundLabel) soundLabel.textContent = gameSettings.sound ? 'ON' : 'OFF';
            saveSettings();
        });
    }
}

// Show settings screen
function showSettings() {
    updateSettingsUI();
    showScreen(GameState.SETTINGS);
}

// Hide settings screen
function hideSettings() {
    showScreen(GameState.IDLE);
}

// ==========================================
// INITIALIZATION
// ==========================================

// Initialize Game
function init() {
    // Load settings first
    loadSettings();
    
    // Get DOM elements
    canvas = document.getElementById('game-board');
    ctx = canvas.getContext('2d');
    
    startScreen = document.getElementById('start-screen');
    gameScreen = document.getElementById('game-screen');
    pauseOverlay = document.getElementById('pause-overlay');
    gameoverOverlay = document.getElementById('gameover-overlay');
    settingsScreen = document.getElementById('settings-screen');
    
    currentScoreEl = document.getElementById('current-score');
    highScoreEl = document.getElementById('high-score');
    startHighScoreEl = document.getElementById('start-high-score');
    finalScoreEl = document.getElementById('final-score');
    bestScoreEl = document.getElementById('best-score');
    newRecordEl = document.getElementById('new-record');
    playingControlsHint = document.getElementById('playing-controls-hint');
    
    // Load high score from localStorage
    loadHighScore();
    
    // Setup event listeners
    setupEventListeners();
    setupSettingsListeners();
    
    // Set canvas size
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    
    // Show start screen
    showScreen(GameState.IDLE);
}

// Load high score from localStorage
function loadHighScore() {
    const saved = localStorage.getItem('snakeHighScore');
    highScore = saved ? parseInt(saved, 10) : 0;
    updateHighScoreDisplay();
}

// Save high score to localStorage
function saveHighScore() {
    localStorage.setItem('snakeHighScore', highScore.toString());
}

// Setup Event Listeners
function setupEventListeners() {
    // Start button
    document.getElementById('start-btn').addEventListener('click', startGame);
    
    // Pause button
    document.getElementById('pause-btn').addEventListener('click', togglePause);
    
    // Pause overlay buttons
    document.getElementById('resume-btn').addEventListener('click', resumeGame);
    document.getElementById('restart-btn-pause').addEventListener('click', restartGame);
    document.getElementById('main-menu-btn-pause').addEventListener('click', goToMainMenu);
    
    // Game over overlay buttons
    document.getElementById('play-again-btn').addEventListener('click', restartGame);
    document.getElementById('main-menu-btn-gameover').addEventListener('click', goToMainMenu);
    
    // Keyboard controls
    document.addEventListener('keydown', handleKeyDown);
}

// Handle Keyboard Input
function handleKeyDown(e) {
    // Prevent default for game keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyP', 'Escape'].includes(e.code)) {
        e.preventDefault();
    }
    
    // Start game on Enter or Space from idle state
    if (gameState === GameState.IDLE && (e.code === 'Enter' || e.code === 'Space')) {
        startGame();
        return;
    }
    
    // Go back from settings
    if (gameState === GameState.SETTINGS && (e.code === 'Escape' || e.code === 'Backspace')) {
        hideSettings();
        return;
    }
    
    // Handle pause toggle
    if ((e.code === 'Space' || e.code === 'KeyP') && gameState === GameState.PLAYING) {
        togglePause();
        return;
    }
    
    // Resume from pause
    if ((e.code === 'Space' || e.code === 'KeyP' || e.code === 'Enter') && gameState === GameState.PAUSED) {
        resumeGame();
        return;
    }
    
    // Direction controls (only when playing)
    if (gameState === GameState.PLAYING) {
        switch (e.code) {
            case 'ArrowUp':
            case 'KeyW':
                if (direction !== Direction.DOWN) {
                    nextDirection = Direction.UP;
                }
                break;
            case 'ArrowDown':
            case 'KeyS':
                if (direction !== Direction.UP) {
                    nextDirection = Direction.DOWN;
                }
                break;
            case 'ArrowLeft':
            case 'KeyA':
                if (direction !== Direction.RIGHT) {
                    nextDirection = Direction.LEFT;
                }
                break;
            case 'ArrowRight':
            case 'KeyD':
                if (direction !== Direction.LEFT) {
                    nextDirection = Direction.RIGHT;
                }
                break;
        }
    }
    
    // Restart on Enter from game over
    if (gameState === GameState.GAME_OVER && e.code === 'Enter') {
        restartGame();
    }
    
    // Escape to main menu
    if (e.code === 'Escape') {
        if (gameState === GameState.PLAYING || gameState === GameState.PAUSED) {
            goToMainMenu();
        }
    }
}

// ==========================================
// GAME LOOP
// ==========================================

// Start Game
function startGame() {
    // Apply current settings (in case grid size changed)
    applySettings();
    
    // Calculate starting position based on grid size
    const startX = Math.floor(GRID_SIZE / 2);
    const startY = Math.floor(GRID_SIZE / 2);
    
    // Reset game state
    snake = [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY }
    ];
    direction = Direction.RIGHT;
    nextDirection = Direction.RIGHT;
    score = 0;
    
    // Spawn initial food
    spawnFood();
    
    // Update display
    updateScoreDisplay();
    
    // Show game screen
    showScreen(GameState.PLAYING);
    
    // Start game loop
    gameState = GameState.PLAYING;
    lastRenderTime = 0;
    gameLoop = requestAnimationFrame(gameLoopHandler);
    
    // Show controls hint temporarily
    showControlsHint();
}

// Game Loop Handler
function gameLoopHandler(currentTime) {
    if (gameState !== GameState.PLAYING) {
        return;
    }
    
    gameLoop = requestAnimationFrame(gameLoopHandler);
    
    const timeSinceLastRender = currentTime - lastRenderTime;
    
    if (timeSinceLastRender < GAME_SPEED) {
        // Render at 60fps even if not moving
        render();
        return;
    }
    
    lastRenderTime = currentTime;
    
    // Update game state
    update();
    
    // Render
    render();
}

// Update Game State
function update() {
    // Update direction
    direction = nextDirection;
    
    // Calculate new head position
    const head = { ...snake[0] };
    head.x += direction.x;
    head.y += direction.y;
    
    // Handle wall collision based on settings
    if (gameSettings.walls) {
        // Walls kill mode
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
            gameOver();
            return;
        }
    } else {
        // Wrap around mode
        if (head.x < 0) head.x = GRID_SIZE - 1;
        if (head.x >= GRID_SIZE) head.x = 0;
        if (head.y < 0) head.y = GRID_SIZE - 1;
        if (head.y >= GRID_SIZE) head.y = 0;
    }
    
    // Check for self collision
    if (checkSelfCollision(head)) {
        gameOver();
        return;
    }
    
    // Add new head
    snake.unshift(head);
    
    // Check if food eaten
    if (head.x === food.x && head.y === food.y) {
        // Increase score
        score += 10;
        updateScoreDisplay();
        
        // Spawn new food
        spawnFood();
    } else {
        // Remove tail if no food eaten
        snake.pop();
    }
}

// Check Self Collision (separate from wall collision)
function checkSelfCollision(head) {
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            return true;
        }
    }
    return false;
}

// Legacy check collision (kept for reference)
function checkCollision(head) {
    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        return true;
    }
    
    // Self collision (skip head)
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            return true;
        }
    }
    
    return false;
}

// Spawn Food
function spawnFood() {
    let newFood;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
        newFood = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
        attempts++;
    } while (isOnSnake(newFood) && attempts < maxAttempts);
    
    food = newFood;
}

// Check if position is on snake
function isOnSnake(pos) {
    return snake.some(segment => segment.x === pos.x && segment.y === pos.y);
}

// ==========================================
// RENDERING
// ==========================================

// Render Game
function render() {
    // Clear canvas
    ctx.fillStyle = COLORS.board;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Draw grid
    drawGrid();
    
    // Draw food with glow effect
    drawFood();
    
    // Draw snake
    drawSnake();
}

// Draw Grid
function drawGrid() {
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i <= GRID_SIZE; i++) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
        ctx.stroke();
        
        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
        ctx.stroke();
    }
}

// Draw Food
function drawFood() {
    const x = food.x * CELL_SIZE;
    const y = food.y * CELL_SIZE;
    const padding = 2;
    
    // Glow effect
    const pulseScale = 1 + Math.sin(Date.now() / 200) * 0.1;
    const centerX = x + CELL_SIZE / 2;
    const centerY = y + CELL_SIZE / 2;
    const glowRadius = (CELL_SIZE / 2) * pulseScale * 1.5;
    
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
    gradient.addColorStop(0, COLORS.foodGlow);
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x - CELL_SIZE / 2, y - CELL_SIZE / 2, CELL_SIZE * 2, CELL_SIZE * 2);
    
    // Food body
    ctx.fillStyle = COLORS.food;
    ctx.beginPath();
    ctx.roundRect(x + padding, y + padding, CELL_SIZE - padding * 2, CELL_SIZE - padding * 2, 4);
    ctx.fill();
}

// Draw Snake
function drawSnake() {
    // Get current snake colors based on settings
    const snakeColors = SNAKE_COLORS[gameSettings.snakeColor] || SNAKE_COLORS.green;
    
    snake.forEach((segment, index) => {
        const x = segment.x * CELL_SIZE;
        const y = segment.y * CELL_SIZE;
        const padding = 2;
        
        // Head has different color and glow
        if (index === 0) {
            // Glow effect for head
            const centerX = x + CELL_SIZE / 2;
            const centerY = y + CELL_SIZE / 2;
            const glowRadius = CELL_SIZE * 0.8;
            
            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
            gradient.addColorStop(0, snakeColors.glow);
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x - CELL_SIZE / 2, y - CELL_SIZE / 2, CELL_SIZE * 2, CELL_SIZE * 2);
            
            ctx.fillStyle = snakeColors.head;
        } else {
            // Gradient color for body (darker towards tail)
            const colorIntensity = 1 - (index / snake.length) * 0.3;
            const baseColor = snakeColors.body;
            
            // Parse the hex color
            const r = parseInt(baseColor.slice(1, 3), 16);
            const g = parseInt(baseColor.slice(3, 5), 16);
            const b = parseInt(baseColor.slice(5, 7), 16);
            
            ctx.fillStyle = `rgb(${Math.floor(r * colorIntensity)}, ${Math.floor(g * colorIntensity)}, ${Math.floor(b * colorIntensity)})`;
        }
        
        ctx.beginPath();
        ctx.roundRect(x + padding, y + padding, CELL_SIZE - padding * 2, CELL_SIZE - padding * 2, 4);
        ctx.fill();
    });
}

// ==========================================
// GAME STATE MANAGEMENT
// ==========================================

// Toggle Pause
function togglePause() {
    if (gameState === GameState.PLAYING) {
        pauseGame();
    } else if (gameState === GameState.PAUSED) {
        resumeGame();
    }
}

// Pause Game
function pauseGame() {
    gameState = GameState.PAUSED;
    cancelAnimationFrame(gameLoop);
    pauseOverlay.classList.remove('hidden');
}

// Resume Game
function resumeGame() {
    pauseOverlay.classList.add('hidden');
    gameState = GameState.PLAYING;
    lastRenderTime = 0;
    gameLoop = requestAnimationFrame(gameLoopHandler);
}

// Game Over
function gameOver() {
    gameState = GameState.GAME_OVER;
    cancelAnimationFrame(gameLoop);
    
    // Check for new high score
    const isNewRecord = score > highScore;
    if (isNewRecord) {
        highScore = score;
        saveHighScore();
        updateHighScoreDisplay();
    }
    
    // Update game over screen
    finalScoreEl.textContent = score;
    bestScoreEl.textContent = highScore;
    
    if (isNewRecord && score > 0) {
        newRecordEl.classList.remove('hidden');
    } else {
        newRecordEl.classList.add('hidden');
    }
    
    // Show game over overlay
    gameoverOverlay.classList.remove('hidden');
}

// Restart Game
function restartGame() {
    // Hide overlays
    pauseOverlay.classList.add('hidden');
    gameoverOverlay.classList.add('hidden');
    
    // Start new game
    startGame();
}

// Go to Main Menu
function goToMainMenu() {
    // Cancel game loop
    if (gameLoop) {
        cancelAnimationFrame(gameLoop);
    }
    
    // Hide overlays
    pauseOverlay.classList.add('hidden');
    gameoverOverlay.classList.add('hidden');
    
    // Update high score display
    updateHighScoreDisplay();
    
    // Show start screen
    showScreen(GameState.IDLE);
}

// Show Screen
function showScreen(state) {
    gameState = state;
    
    // Hide all screens
    startScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
    settingsScreen.classList.add('hidden');
    
    // Show appropriate screen
    switch (state) {
        case GameState.IDLE:
            startScreen.classList.remove('hidden');
            break;
        case GameState.SETTINGS:
            settingsScreen.classList.remove('hidden');
            break;
        case GameState.PLAYING:
        case GameState.PAUSED:
        case GameState.GAME_OVER:
            gameScreen.classList.remove('hidden');
            break;
    }
}

// ==========================================
// UI UPDATES
// ==========================================

// Update Score Display
function updateScoreDisplay() {
    currentScoreEl.textContent = score;
    
    // Animate score change
    currentScoreEl.classList.remove('animate');
    void currentScoreEl.offsetWidth; // Trigger reflow
    currentScoreEl.classList.add('animate');
}

// Update High Score Display
function updateHighScoreDisplay() {
    highScoreEl.textContent = highScore;
    startHighScoreEl.textContent = highScore;
    bestScoreEl.textContent = highScore;
}

// Show Controls Hint (temporary)
function showControlsHint() {
    playingControlsHint.classList.remove('fade-out');
    
    // Clear existing timeout
    if (controlsHintTimeout) {
        clearTimeout(controlsHintTimeout);
    }
    
    // Fade out after 5 seconds
    controlsHintTimeout = setTimeout(() => {
        playingControlsHint.classList.add('fade-out');
    }, 5000);
}

// ==========================================
// TOUCH CONTROLS
// ==========================================

let touchStartX = 0;
let touchStartY = 0;
const SWIPE_THRESHOLD = 30;

// Handle Touch Start
function handleTouchStart(e) {
    // Ignore if touch is on joystick
    if (e.target.closest('.joystick-container')) return;
    
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}

// Handle Touch End (Swipe)
function handleTouchEnd(e) {
    // Ignore if touch is on joystick
    if (e.target.closest('.joystick-container')) return;
    
    if (gameState !== GameState.PLAYING) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // Check if it's a swipe (not a tap)
    if (Math.abs(deltaX) < SWIPE_THRESHOLD && Math.abs(deltaY) < SWIPE_THRESHOLD) {
        return;
    }
    
    // Determine swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0 && direction !== Direction.LEFT) {
            nextDirection = Direction.RIGHT;
        } else if (deltaX < 0 && direction !== Direction.RIGHT) {
            nextDirection = Direction.LEFT;
        }
    } else {
        // Vertical swipe
        if (deltaY > 0 && direction !== Direction.UP) {
            nextDirection = Direction.DOWN;
        } else if (deltaY < 0 && direction !== Direction.DOWN) {
            nextDirection = Direction.UP;
        }
    }
}

// Virtual Joystick Variables
let joystickBase = null;
let joystickThumb = null;
let joystickActive = false;
let joystickTouchId = null;
const JOYSTICK_DEAD_ZONE = 0.2; // 20% dead zone in center
const JOYSTICK_MAX_DISTANCE = 42; // Max distance thumb can move from center

// Setup Virtual Joystick
function setupVirtualJoystick() {
    joystickBase = document.getElementById('joystick-base');
    joystickThumb = document.getElementById('joystick-thumb');
    
    if (!joystickBase || !joystickThumb) return;
    
    // Touch start on joystick
    joystickBase.addEventListener('touchstart', handleJoystickTouchStart, { passive: false });
    
    // Touch move anywhere on screen (joystick might move outside base)
    document.addEventListener('touchmove', handleJoystickTouchMove, { passive: false });
    
    // Touch end
    document.addEventListener('touchend', handleJoystickTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleJoystickTouchEnd, { passive: true });
}

// Handle Joystick Touch Start
function handleJoystickTouchStart(e) {
    if (gameState !== GameState.PLAYING) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    joystickTouchId = touch.identifier;
    joystickActive = true;
    
    joystickBase.classList.add('active');
    joystickThumb.classList.add('active');
    
    updateJoystickPosition(touch);
}

// Handle Joystick Touch Move
function handleJoystickTouchMove(e) {
    if (!joystickActive || gameState !== GameState.PLAYING) return;
    
    // Find our joystick touch
    let touch = null;
    for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === joystickTouchId) {
            touch = e.touches[i];
            break;
        }
    }
    
    if (!touch) return;
    
    e.preventDefault();
    updateJoystickPosition(touch);
}

// Handle Joystick Touch End
function handleJoystickTouchEnd(e) {
    // Check if our joystick touch ended
    let found = false;
    for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === joystickTouchId) {
            found = true;
            break;
        }
    }
    
    if (!found && joystickActive) {
        resetJoystick();
    }
}

// Update Joystick Position
function updateJoystickPosition(touch) {
    const baseRect = joystickBase.getBoundingClientRect();
    const centerX = baseRect.left + baseRect.width / 2;
    const centerY = baseRect.top + baseRect.height / 2;
    
    let deltaX = touch.clientX - centerX;
    let deltaY = touch.clientY - centerY;
    
    // Calculate distance from center
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Clamp to max distance
    if (distance > JOYSTICK_MAX_DISTANCE) {
        const angle = Math.atan2(deltaY, deltaX);
        deltaX = Math.cos(angle) * JOYSTICK_MAX_DISTANCE;
        deltaY = Math.sin(angle) * JOYSTICK_MAX_DISTANCE;
    }
    
    // Update thumb position
    joystickThumb.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
    
    // Calculate normalized values (-1 to 1)
    const normalizedX = deltaX / JOYSTICK_MAX_DISTANCE;
    const normalizedY = deltaY / JOYSTICK_MAX_DISTANCE;
    
    // Determine direction based on joystick position
    updateDirectionFromJoystick(normalizedX, normalizedY);
}

// Update Direction from Joystick
function updateDirectionFromJoystick(x, y) {
    // Calculate distance from center
    const distance = Math.sqrt(x * x + y * y);
    
    // Apply dead zone
    if (distance < JOYSTICK_DEAD_ZONE) {
        return; // Ignore input in dead zone
    }
    
    // Determine primary direction (whichever axis is stronger)
    if (Math.abs(x) > Math.abs(y)) {
        // Horizontal movement dominates
        if (x > 0 && direction !== Direction.LEFT) {
            nextDirection = Direction.RIGHT;
        } else if (x < 0 && direction !== Direction.RIGHT) {
            nextDirection = Direction.LEFT;
        }
    } else {
        // Vertical movement dominates
        if (y > 0 && direction !== Direction.UP) {
            nextDirection = Direction.DOWN;
        } else if (y < 0 && direction !== Direction.DOWN) {
            nextDirection = Direction.UP;
        }
    }
}

// Reset Joystick to Center
function resetJoystick() {
    joystickActive = false;
    joystickTouchId = null;
    
    joystickBase.classList.remove('active');
    joystickThumb.classList.remove('active');
    joystickThumb.style.transform = 'translate(-50%, -50%)';
}

// D-Pad Button Handlers (legacy - replaced by virtual joystick)
function setupTouchButtons() {
    const touchPause = document.getElementById('touch-pause');
    
    if (touchPause) {
        touchPause.addEventListener('touchstart', (e) => {
            e.preventDefault();
            togglePause();
        });
    }
}

// ==========================================
// INITIALIZATION
// ==========================================

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    init();
    
    // Setup touch controls
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
        gameContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
        gameContainer.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
    
    // Setup virtual joystick
    setupVirtualJoystick();
    
    // Setup touch buttons
    setupTouchButtons();
});
