import { palettes } from './constants.js';
import { verts, getBarycentric, get3DNoise } from './utils.js';

/*
    This module handles all Canvas 2D rendering.
    It is stateless regarding the game data; it simply renders whatever state is passed to it.
*/

const GRID_SIZE = 100;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 10;

let nebulaPattern = null;

/*
    Here, we define a helper to create the nebula pattern pattern if it doesn't exist.
*/
function createNebulaPattern(ctx) {
    if (nebulaPattern) return nebulaPattern;
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 8;
    pCanvas.height = 8;
    const pCtx = pCanvas.getContext('2d');
    pCtx.fillStyle = "rgba(75, 0, 130, 0.4)"; 
    for(let i=0; i<6; i++) {
        const x = Math.random() * 8;
        const y = Math.random() * 8;
        const size = Math.random() * 1.2;
        pCtx.beginPath();
        pCtx.arc(x, y, size, 0, Math.PI * 2);
        pCtx.fill();
    }
    return ctx.createPattern(pCanvas, 'repeat');
}

/*
    So, this is the main render function.
    It sets up the canvas, handles high-DPI scaling, applies the camera transform,
    and dispatches to the specific view drawer.
*/
export function render(canvas, ctx, state, mapData) {
    if (!canvas || !ctx || !canvas.parentElement) return;

    const rect = canvas.parentElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Handle High DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear Screen
    ctx.fillStyle = '#FFFFFF'; 
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    
    // Apply Camera
    ctx.translate(state.camera.x, state.camera.y);
    ctx.scale(state.camera.zoom, state.camera.zoom);

    // Dispatch
    if (state.currentView === 'system') {
        drawSystem(ctx, state);
    } else if (state.currentView === 'planet') {
        drawPlanet(ctx, state);
    } else {
        drawSector(ctx, state, mapData, rect.width, rect.height);
    }

    ctx.restore();
}

/*
    Then, we implement the Sector Map renderer (The Grid).
*/
function drawSector(ctx, state, mapData, width, height) {
    const size = Math.min(width, height);
    // Use the camera zoom inverse to keep lines consistent if desired, or fixed.
    // Logic adapted from original script.
    
    // Note: The original logic calculated cellSize based on screen size, 
    // effectively making the map fit the screen at zoom 1.
    const cellSize = 10; // Base unit size, scaled by camera effectively.
    // Wait, original logic: const cellSize = size / GRID_SIZE; 
    // This depends on the passed width/height which are screen dimensions.
    // We should recalculate it here to match the original behavior.
    
    // We need to know the 'base' size for the grid.
    // If we want it to look the same, we need the rect passed in.
    // However, we are inside a transformed context.
    // The original logic was: const cellSize = size / GRID_SIZE;
    // And drawing happened at x * cellSize.
    
    // Let's use a fixed large size for the map world space to make zooming logical.
    const WORLD_SIZE = 10000; 
    const effectiveCellSize = WORLD_SIZE / GRID_SIZE;
    
    // Original Logic Re-evaluation:
    // const size = Math.min(width, height);
    // const cellSize = size / GRID_SIZE;
    // It calculated cell size based on the *current* canvas size.
    // But since we are zoomed/panned, the 'width' and 'height' passed to this function
    // are the *screen* dimensions.
    
    // To maintain the exact behavior where "zoom 1 fits the screen", 
    // we should use the screen dimensions to determine the base scale.
    // But wait, if we resize the window, the map stretches?
    // Yes, the original code did: const size = Math.min(rect.width, rect.height).
    
    // To preserve this exactly:
    const baseSize = Math.min(width, height) / state.camera.zoom; 
    // We divide by zoom because we are already scaled by zoom in the context?
    // No. The original code calculated cellSize from raw rect, THEN applied translate/scale.
    // But the coordinates (x*cellSize) were constant relative to the grid.
    // We need a stable world definition.
    // For this refactor, let's fix the world size to a stable value so resizing doesn't warp the map coordinates.
    // This is an improvement. Let's fix the map to 2000x2000 units.
    
    const FIXED_MAP_SIZE = 2000;
    const finalCellSize = FIXED_MAP_SIZE / GRID_SIZE;

    // Nebulae
    if (mapData.nebulae.length > 0) {
        ctx.save();
        if (!nebulaPattern) nebulaPattern = createNebulaPattern(ctx);
        
        mapData.nebulae.forEach(neb => {
            const nx = neb.x * finalCellSize;
            const ny = neb.y * finalCellSize;

            ctx.shadowBlur = 15;
            ctx.shadowColor = "rgba(180, 0, 200, 0.8)"; 
            ctx.fillStyle = "rgba(200, 100, 255, 0.2)"; 
            ctx.fillRect(nx, ny, finalCellSize, finalCellSize);
            ctx.shadowBlur = 0;

            if (nebulaPattern) {
                ctx.fillStyle = nebulaPattern;
                ctx.save();
                ctx.translate(nx, ny);
                ctx.fillRect(0, 0, finalCellSize, finalCellSize);
                ctx.restore();
            }
        });
        ctx.restore();
    }

    // Hover Selection
    if (state.hoveredCell) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
            ctx.fillRect(state.hoveredCell.x * finalCellSize, state.hoveredCell.y * finalCellSize, finalCellSize, finalCellSize);
    }
    // Click Selection
    if (state.selectedCell) {
            ctx.strokeStyle = "#00FFFF"; 
            ctx.lineWidth = 2 / state.camera.zoom;
            ctx.strokeRect(state.selectedCell.x * finalCellSize, state.selectedCell.y * finalCellSize, finalCellSize, finalCellSize);
            ctx.fillStyle = "rgba(0, 255, 255, 0.1)";
            ctx.fillRect(state.selectedCell.x * finalCellSize, state.selectedCell.y * finalCellSize, finalCellSize, finalCellSize);
    }

    // Grid Lines
    ctx.beginPath();
    ctx.lineWidth = 1 / state.camera.zoom; 
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';

    for (let i = 0; i <= GRID_SIZE; i++) {
        const p = i * finalCellSize;
        ctx.moveTo(p, 0);
        ctx.lineTo(p, FIXED_MAP_SIZE);
        ctx.moveTo(0, p);
        ctx.lineTo(FIXED_MAP_SIZE, p);
    }
    ctx.stroke();

    // Map Border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2 / state.camera.zoom;
    ctx.strokeRect(0, 0, FIXED_MAP_SIZE, FIXED_MAP_SIZE);

    // Systems
    if (mapData.systems.length > 0) {
        ctx.fillStyle = "#000000"; 
        const systemRadius = finalCellSize * 0.25;

        mapData.systems.forEach(system => {
            const px = (system.x * finalCellSize) + (finalCellSize / 2);
            const py = (system.y * finalCellSize) + (finalCellSize / 2);

            ctx.beginPath();
            ctx.arc(px, py, systemRadius, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // Pirates
    if (mapData.pirates && mapData.pirates.length > 0) {
        ctx.fillStyle = "#EF4444"; 
        const pirateSize = finalCellSize * 0.5; 
        const offset = (finalCellSize - pirateSize) / 2;

        mapData.pirates.forEach(pirate => {
            const px = (pirate.x * finalCellSize) + offset;
            const py = (pirate.y * finalCellSize) + offset;
            ctx.fillRect(px, py, pirateSize, pirateSize);
            
            ctx.strokeStyle = "#7F1D1D"; 
            ctx.lineWidth = 1 / state.camera.zoom;
            ctx.strokeRect(px, py, pirateSize, pirateSize);
        });
    }
}

/*
    Draw System View (Star + Planets)
*/
function drawSystem(ctx, state) {
    if (!state.activeSystem || !state.activeSystem.details) return;

    // 1. System Boundary
    ctx.beginPath();
    ctx.setLineDash([20, 20]);
    ctx.lineWidth = 1 / state.camera.zoom;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
    ctx.arc(0, 0, state.activeSystem.details.systemRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Planets
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1 / state.camera.zoom;

    state.activeSystem.details.planets.forEach(planet => {
        // Orbit
        ctx.beginPath();
        ctx.arc(0, 0, planet.orbitRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Planet Position
        const px = Math.cos(planet.angle) * planet.orbitRadius;
        const py = Math.sin(planet.angle) * planet.orbitRadius;

        // Highlight if selected
        if (state.selectedPlanet && state.selectedPlanet.id === planet.id) {
            ctx.save();
            ctx.fillStyle = "rgba(0, 255, 255, 0.2)";
            ctx.beginPath();
            ctx.arc(px, py, planet.size * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#00FFFF";
            ctx.stroke();
            ctx.restore();
        }

        // Planet Body
        ctx.beginPath();
        ctx.arc(px, py, planet.size, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.stroke(); 
    });

    // 3. Central Star
    ctx.fillStyle = "#000000";
    const starRadius = 50; 
    ctx.beginPath();
    ctx.arc(0, 0, starRadius, 0, Math.PI * 2);
    ctx.fill();
}

/*
    Draw Planet View (Icosahedral Projection)
*/
function drawPlanet(ctx, state) {
    const activePlanet = state.activePlanet;
    // --- 1. Map Layout Calculations ---
    const S = 300; 
    const H = S * (Math.sqrt(3) / 2);
    
    const mapW = 5.5 * S;
    const mapH = 3 * H;
    
    // Center the map at (0,0)
    const startX = -mapW / 2;
    const startY = -mapH / 2;
    
    const targetHexW = S / 10;
    const hexWidth = targetHexW;
    const hexRadius = hexWidth / Math.sqrt(3);

    const V = verts;

    // --- 2. Select Palette ---
    let colors = palettes.terran;
    if (activePlanet) {
        const atm = activePlanet.atmosphere.toLowerCase();
        const type = activePlanet.type ? activePlanet.type.toLowerCase() : 'terran';

        if (atm.includes('volcanic') || type.includes('volcanic')) colors = palettes.volcanic;
        else if (atm.includes('toxic') || type.includes('toxic')) colors = palettes.toxic;
        else if (type.includes('arid')) colors = palettes.arid;
        else if (type.includes('frozen')) colors = palettes.frozen;
    }

    // --- 3. Draw 5 Gores ---
    for(let i = 0; i < 5; i++) {
        const xBase = startX + i * S;
        const nextI = (i + 1) % 5;
        
        const upCurrent = i + 1; 
        const upNext = nextI + 1;
        const lowCurrent = i + 6; 
        const lowNext = nextI + 6;
        const lowNextPlus = ((i + 2) % 5) + 6; 

        // Triangle 1: North Polar (Up)
        drawLocalTriangle(ctx, xBase, startY + H, S, H, 'up', V[upCurrent], V[upNext], V[0], colors, hexRadius, activePlanet);
        
        // Triangle 2: North Temperate (Down)
        drawLocalTriangle(ctx, xBase, startY + H, S, H, 'down', V[upCurrent], V[upNext], V[lowNext], colors, hexRadius, activePlanet);
        
        // Triangle 3: South Temperate (Up)
        drawLocalTriangle(ctx, xBase + S/2, startY + 2*H, S, H, 'up', V[lowNext], V[lowNextPlus], V[upNext], colors, hexRadius, activePlanet);
        
        // Triangle 4: South Polar (Down)
        drawLocalTriangle(ctx, xBase + S/2, startY + 2*H, S, H, 'down', V[lowNext], V[lowNextPlus], V[11], colors, hexRadius, activePlanet);
    }
}

function drawLocalTriangle(ctx, offsetX, offsetY, S, H, orientation, v1, v2, v3, colors, hexRadius, activePlanet) {
    ctx.save();
    ctx.translate(offsetX, offsetY);
    
    // Define Triangle Shape (Clipping Mask)
    let tX1, tY1, tX2, tY2, tX3, tY3;
    if (orientation === 'up') {
        tX1 = 0; tY1 = 0; 
        tX2 = S; tY2 = 0; 
        tX3 = S/2; tY3 = -H;  
    } else {
        tX1 = 0; tY1 = 0; 
        tX2 = S; tY2 = 0; 
        tX3 = S/2; tY3 = H;   
    }

    ctx.beginPath();
    ctx.moveTo(tX1, tY1);
    ctx.lineTo(tX2, tY2);
    ctx.lineTo(tX3, tY3);
    ctx.closePath();
    
    ctx.clip();

    ctx.fillStyle = colors.oceanDeep;
    ctx.fillRect(0, -H, S, 2*H);

    const hexW = Math.sqrt(3) * hexRadius;
    const vertDist = 1.5 * hexRadius;
    
    const rows = Math.ceil(H / vertDist) + 2;
    const cols = Math.ceil(S / hexW) + 2;

    for (let row = -rows; row < rows; row++) {
        const xOffset = (row % 2) * (hexW / 2);
        for (let col = -2; col < cols; col++) {
            const cx = col * hexW + xOffset;
            const cy = row * vertDist;

            const {u, v, w} = getBarycentric(cx, cy, tX1, tY1, tX2, tY2, tX3, tY3);
            
            if (u < -0.1 || v < -0.1 || w < -0.1) continue;

            const p3 = {
                x: u*v1.x + v*v2.x + w*v3.x,
                y: u*v1.y + v*v2.y + w*v3.y,
                z: u*v1.z + v*v2.z + w*v3.z
            };

            const seed = activePlanet ? activePlanet.seed : 0;
            const hydro = activePlanet ? activePlanet.hydro : 50;
            const noiseVal = get3DNoise(p3.x, p3.y, p3.z, seed);
            
            let color = null;
            const waterLevel = hydro / 100.0;
            
            if (Math.abs(p3.y) > 0.90) { color = colors.ice; } 
            else if (noiseVal > (waterLevel + 0.4)) { color = colors.peak; }
            else if (noiseVal > (waterLevel + 0.2)) { color = colors.mountain; }
            else if (noiseVal > (waterLevel + 0.1)) { color = colors.forest; }
            else if (noiseVal > waterLevel) { color = colors.land; }
            else if (noiseVal > (waterLevel - 0.1)) { color = colors.oceanShallow; } 

            if (color) {
                drawHex(ctx, cx, cy, hexRadius, color, colors.grid);
            } else {
                drawHex(ctx, cx, cy, hexRadius, null, colors.grid);
            }
        }
    }
    
    ctx.beginPath();
    ctx.moveTo(tX1, tY1);
    ctx.lineTo(tX2, tY2);
    ctx.lineTo(tX3, tY3);
    ctx.closePath();
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 2; 
    ctx.stroke();

    ctx.restore();
}

function drawHex(ctx, cx, cy, r, fillColor, strokeColor) {
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
        const ang = Math.PI/3 * k + Math.PI/6;
        ctx.lineTo(cx + r*Math.cos(ang), cy + r*Math.sin(ang));
    }
    ctx.closePath();
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 0.5;
    ctx.stroke();
}