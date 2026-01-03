import { gameState, mapData, initMapData } from './state.js';
import { render } from './renderers.js';
import { initUI, updatePanel1, updateBackButtonState, updateNavigation } from './ui.js';

/*
    Main Controller Module
    ----------------------
    This module initializes the game, handles user input (mouse/keyboard),
    manages the game loop, and connects the UI actions to the game state.
*/

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 10;
// We fixed the map size in renderers.js to 2000 (20px per cell)
const CELL_SIZE = 20; 

// Input State
let isMouseDown = false;
let isPanning = false;
let lastMouse = { x: 0, y: 0 };

// Canvas References
let canvas = null;
let ctx = null;

/*
    Initialization
*/
document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('map-canvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
    }

    // Initialize Data
    initMapData();

    // Initialize UI with Callbacks
    initUI({
        onNavChange: handleNavChange,
        onBack: handleBack,
        onEnterSystem: handleEnterSystem,
        onEnterPlanet: handleEnterPlanet
    });

    // Bind Input Events
    if (canvas) {
        canvas.addEventListener('wheel', handleWheel);
        canvas.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }

    // Start Loop
    requestAnimationFrame(gameLoop);
});

/*
    Game Loop
*/
function gameLoop() {
    if (canvas && ctx) {
        render(canvas, ctx, gameState, mapData);
    }
    requestAnimationFrame(gameLoop);
}

/*
    Input Handlers
*/
function handleWheel(e) {
    e.preventDefault();
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    
    let minZoomLimit = MIN_ZOOM;
    if (gameState.currentView === 'system') minZoomLimit = 0.05;
    else if (gameState.currentView === 'planet') minZoomLimit = 0.1;

    const newZoom = Math.min(Math.max(gameState.camera.zoom * (1 + delta), minZoomLimit), MAX_ZOOM);

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - gameState.camera.x) / gameState.camera.zoom;
    const worldY = (mouseY - gameState.camera.y) / gameState.camera.zoom;

    gameState.camera.zoom = newZoom;
    gameState.camera.x = mouseX - worldX * gameState.camera.zoom;
    gameState.camera.y = mouseY - worldY * gameState.camera.zoom;
}

function handleMouseDown(e) {
    isMouseDown = true;
    isPanning = false;
    lastMouse = { x: e.clientX, y: e.clientY };
    if (canvas) canvas.classList.add('active:cursor-grabbing');
}

function handleMouseMove(e) {
    // 1. Handle Panning
    if (isMouseDown) {
        const dx = e.clientX - lastMouse.x;
        const dy = e.clientY - lastMouse.y;
        
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
            isPanning = true;
            if (canvas) canvas.classList.add('grabbing');
        }

        if (isPanning) {
            gameState.camera.x += dx;
            gameState.camera.y += dy;
            lastMouse = { x: e.clientX, y: e.clientY };
        }
    }

    // 2. Handle Hover (only relevant for Sector View)
    if (gameState.currentView === 'sector') {
        const gridCoords = getGridCoordinates(e.clientX, e.clientY);
        if (!gameState.hoveredCell || !gridCoords || gameState.hoveredCell.x !== gridCoords.x || gameState.hoveredCell.y !== gridCoords.y) {
            gameState.hoveredCell = gridCoords;
        }
    } else {
        gameState.hoveredCell = null;
    }
}

function handleMouseUp(e) {
    if (isMouseDown && !isPanning) {
        // Handle Clicks
        if (gameState.currentView === 'sector') {
            const coords = getGridCoordinates(e.clientX, e.clientY);
            if (coords) {
                gameState.selectedCell = coords;
                // Re-bind callbacks to the new panel content
                updatePanel1({
                    onEnterSystem: handleEnterSystem,
                    onEnterPlanet: handleEnterPlanet
                });
            }
        } else if (gameState.currentView === 'system') {
            handleSystemClick(e.clientX, e.clientY);
        }
    }
    
    isMouseDown = false;
    isPanning = false;
    if (canvas) canvas.classList.remove('grabbing');
}

/*
    Coordinate Helpers
*/
function getGridCoordinates(clientX, clientY) {
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const worldX = (mouseX - gameState.camera.x) / gameState.camera.zoom;
    const worldY = (mouseY - gameState.camera.y) / gameState.camera.zoom;

    const cellX = Math.floor(worldX / CELL_SIZE);
    const cellY = Math.floor(worldY / CELL_SIZE);

    if (cellX >= 0 && cellX < 100 && cellY >= 0 && cellY < 100) {
        return { x: cellX, y: cellY };
    }
    return null;
}

function getWorldCoordinates(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    return {
        x: (mouseX - gameState.camera.x) / gameState.camera.zoom,
        y: (mouseY - gameState.camera.y) / gameState.camera.zoom
    };
}

function handleSystemClick(clientX, clientY) {
    const worldCoords = getWorldCoordinates(clientX, clientY);
    const wx = worldCoords.x;
    const wy = worldCoords.y;

    let clickedPlanet = null;
    if (gameState.activeSystem && gameState.activeSystem.details) {
        gameState.activeSystem.details.planets.forEach(planet => {
            const px = Math.cos(planet.angle) * planet.orbitRadius;
            const py = Math.sin(planet.angle) * planet.orbitRadius;
            
            const dist = Math.sqrt((wx - px) ** 2 + (wy - py) ** 2);
            if (dist <= planet.size + 10) {
                clickedPlanet = planet;
            }
        });
    }

    gameState.selectedPlanet = clickedPlanet;
    updatePanel1({
        onEnterSystem: handleEnterSystem,
        onEnterPlanet: handleEnterPlanet
    });
}

/*
    Action Callbacks
*/
function handleNavChange(viewId) {
    updateNavigation(viewId);
    // Note: Render loop keeps running, but canvas might be hidden.
}

function handleBack() {
    if (gameState.currentView === 'planet') {
        // Exit Planet -> System
        gameState.camera = { ...gameState.savedSystemCamera };
        gameState.currentView = 'system';
        gameState.activePlanet = null;
    } else if (gameState.currentView === 'system') {
        // Exit System -> Sector
        gameState.camera = { ...gameState.savedSectorCamera };
        gameState.currentView = 'sector';
        gameState.activeSystem = null;
        gameState.selectedPlanet = null;
    }
    
    updateBackButtonState();
    updatePanel1({
        onEnterSystem: handleEnterSystem,
        onEnterPlanet: handleEnterPlanet
    });
}

function handleEnterSystem(system) {
    gameState.savedSectorCamera = { ...gameState.camera };
    gameState.currentView = 'system';
    gameState.activeSystem = system;
    gameState.selectedPlanet = null;

    // Generate Details if missing
    if (!system.details) {
        system.details = { planets: [] };
        const planetCount = Math.floor(Math.random() * 4) + 3;
        let currentRadius = 150; 
        for (let i = 0; i < planetCount; i++) {
            currentRadius += Math.floor(Math.random() * 150) + 100;
            
            const types = ['Terran', 'Arid', 'Frozen', 'Volcanic', 'Toxic'];
            const type = types[Math.floor(Math.random() * types.length)];
            
            let atmosphere = 'Nitrogen-Oxygen';
            if(type === 'Volcanic') atmosphere = 'Volcanic';
            else if(type === 'Toxic') atmosphere = 'Toxic';
            else if(type === 'Arid') atmosphere = 'Thin';
            else if(type === 'Frozen') atmosphere = 'Thin';

            system.details.planets.push({
                id: i,
                orbitRadius: currentRadius,
                angle: Math.random() * Math.PI * 2,
                size: Math.floor(Math.random() * 4) + 6,
                seed: Math.floor(Math.random() * 10000),
                hydro: Math.floor(Math.random() * 100),
                atmosphere: atmosphere,
                type: type
            });
        }
        system.details.systemRadius = currentRadius + 300;
    }

    // Center Camera
    if (canvas) {
        const rect = canvas.getBoundingClientRect();
        gameState.camera.x = rect.width / 2;
        gameState.camera.y = rect.height / 2;
        gameState.camera.zoom = 0.5;
    }

    updateBackButtonState();
    updatePanel1({
        onEnterSystem: handleEnterSystem,
        onEnterPlanet: handleEnterPlanet
    });
}

function handleEnterPlanet(planet) {
    gameState.savedSystemCamera = { ...gameState.camera };
    gameState.currentView = 'planet';
    gameState.activePlanet = planet;

    if (canvas) {
        const rect = canvas.getBoundingClientRect();
        gameState.camera.x = rect.width / 2;
        gameState.camera.y = rect.height / 2;
        gameState.camera.zoom = 1;
    }

    updateBackButtonState();
    updatePanel1({
        onEnterSystem: handleEnterSystem,
        onEnterPlanet: handleEnterPlanet
    });
}