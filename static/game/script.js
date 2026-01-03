/* Tailwind Configuration 
    Must be defined before the Tailwind CDN script runs.
*/
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                primary: "#3b82f6", // Blue-500
                "background-light": "#e5e7eb", // Gray-200
                "background-dark": "#18181b", // Zinc-900
                "panel-light": "#f3f4f6", // Gray-100
                "panel-dark": "#27272a", // Zinc-800
                "border-light": "#d1d5db", // Gray-300
                "border-dark": "#3f3f46", // Zinc-700
            },
            fontFamily: {
                display: ["'JetBrains Mono'", "monospace"],
                body: ["'Inter'", "sans-serif"],
            },
            borderRadius: {
                DEFAULT: "0.25rem",
            },
        },
    },
};

/* Theme Initialization Logic
    Checks LocalStorage or System Preference to apply dark mode immediately.
*/
if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark')
} else {
    document.documentElement.classList.remove('dark')
}

window.toggleTheme = function() {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
    } else {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
    }
}

/* Map & Navigation Logic 
*/
document.addEventListener('DOMContentLoaded', () => {
    // === Navigation Logic ===
    const navButtons = {
        map: document.getElementById('nav-map'),
        info: document.getElementById('nav-info'),
        economy: document.getElementById('nav-economy'),
        diplomacy: document.getElementById('nav-diplomacy')
    };

    const views = {
        map: document.getElementById('view-map'),
        info: document.getElementById('view-info'),
        economy: document.getElementById('view-economy'),
        diplomacy: document.getElementById('view-diplomacy')
    };

    const btnBack = document.getElementById('btn-back');

    function setActiveButton(activeId) {
        Object.keys(navButtons).forEach(key => {
            const btn = navButtons[key];
            if (navButtons[key]) {
                if (key === activeId) {
                    btn.className = "nav-btn bg-blue-50 dark:bg-zinc-800/80 hover:bg-gray-400 dark:hover:bg-zinc-700 px-6 py-2 text-sm font-bold uppercase tracking-wider border-b-4 border-primary dark:border-primary rounded-t-sm transition-colors flex items-center gap-2 whitespace-nowrap text-primary dark:text-blue-400";
                } else {
                    btn.className = "nav-btn bg-gray-300 hover:bg-gray-400 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-6 py-2 text-sm font-bold uppercase tracking-wider border-b-4 border-gray-400 dark:border-zinc-600 rounded-t-sm transition-colors flex items-center gap-2 whitespace-nowrap";
                }
            }
        });

        Object.keys(views).forEach(key => {
            if (views[key]) {
                if (key === activeId) {
                    views[key].classList.remove('hidden');
                    if (key === 'map') {
                        requestAnimationFrame(render);
                    }
                } else {
                    views[key].classList.add('hidden');
                }
            }
        });
    }

    if (navButtons.map) navButtons.map.addEventListener('click', () => setActiveButton('map'));
    if (navButtons.info) navButtons.info.addEventListener('click', () => setActiveButton('info'));
    if (navButtons.economy) navButtons.economy.addEventListener('click', () => setActiveButton('economy'));
    if (navButtons.diplomacy) navButtons.diplomacy.addEventListener('click', () => setActiveButton('diplomacy'));

    // === Back Button Logic ===
    if (btnBack) {
        btnBack.addEventListener('click', () => {
            handleBack();
        });
    }

    function handleBack() {
        if (currentView === 'planet') {
            exitPlanet();
        } else if (currentView === 'system') {
            exitSystem();
        }
    }

    // === View State Management ===
    // 'sector' (Grid Map) | 'system' (Star View) | 'planet' (Planet View)
    let currentView = 'sector'; 
    
    // Camera States
    let savedSectorCamera = { x: 0, y: 0, zoom: 1 };
    let savedSystemCamera = { x: 0, y: 0, zoom: 1 };
    
    // Active Data
    let activeSystem = null; 
    let activePlanet = null;
    
    // Selections
    let selectedCell = null;   // Sector View
    let selectedPlanet = null; // System View

    // --- System Navigation ---
    function enterSystem(systemData) {
        savedSectorCamera = { ...camera };
        currentView = 'system';
        activeSystem = systemData;
        selectedPlanet = null; // Reset selection

        // Generate System Details if missing
        if (!activeSystem.details) {
            activeSystem.details = {
                planets: []
            };
            const planetCount = Math.floor(Math.random() * 4) + 3;
            let currentRadius = 150; 
            for (let i = 0; i < planetCount; i++) {
                currentRadius += Math.floor(Math.random() * 150) + 100;
                activeSystem.details.planets.push({
                    id: i, // ID for easier lookup
                    orbitRadius: currentRadius,
                    angle: Math.random() * Math.PI * 2,
                    size: Math.floor(Math.random() * 4) + 6
                });
            }
            activeSystem.details.systemRadius = currentRadius + 300;
        }

        // Center camera for system view
        const canvas = document.getElementById('map-canvas');
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            camera.x = rect.width / 2;
            camera.y = rect.height / 2;
            camera.zoom = 0.5;
        }

        updateBackButtonState();
        updatePanel1();
        requestAnimationFrame(render);
    }

    function exitSystem() {
        camera = { ...savedSectorCamera };
        currentView = 'sector';
        activeSystem = null;
        selectedPlanet = null;
        updateBackButtonState();
        updatePanel1();
        requestAnimationFrame(render);
    }

    // --- Planet Navigation ---
    function enterPlanet(planetData) {
        savedSystemCamera = { ...camera };
        currentView = 'planet';
        activePlanet = planetData;

        // Reset camera for planet view (center it)
        const canvas = document.getElementById('map-canvas');
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            camera.x = rect.width / 2;
            camera.y = rect.height / 2;
            camera.zoom = 1;
        }

        updateBackButtonState();
        updatePanel1();
        requestAnimationFrame(render);
    }

    function exitPlanet() {
        camera = { ...savedSystemCamera };
        currentView = 'system';
        activePlanet = null;
        // Keep selectedPlanet active so context is maintained
        updateBackButtonState();
        updatePanel1();
        requestAnimationFrame(render);
    }

    function updateBackButtonState() {
        if (!btnBack) return;
        if (currentView === 'sector') {
            btnBack.disabled = true;
            btnBack.classList.add('opacity-50', 'cursor-not-allowed');
            btnBack.classList.remove('hover:bg-gray-400', 'dark:hover:bg-zinc-700', 'active:border-b-0', 'active:translate-y-1');
        } else {
            btnBack.disabled = false;
            btnBack.classList.remove('opacity-50', 'cursor-not-allowed');
            btnBack.classList.add('hover:bg-gray-400', 'dark:hover:bg-zinc-700', 'active:border-b-0', 'active:translate-y-1');
        }
    }

    // === Grid Logic with Pan & Zoom ===
    const canvas = document.getElementById('map-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;

    const mapData = {
        systems: [],
        nebulae: [],
        pirates: []
    };

    let hoveredCell = null; 

    function initMapData() {
        const GRID_SIZE = 100;
        const SYSTEM_COUNT = 150;
        const NEBULA_COUNT = 300;

        mapData.systems = [];
        mapData.nebulae = [];
        mapData.pirates = [];

        for (let i = 0; i < SYSTEM_COUNT; i++) {
            mapData.systems.push({
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE)
            });
        }
        
        for (let i = 0; i < NEBULA_COUNT; i++) {
            mapData.nebulae.push({
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE)
            });
        }

        const PIRATE_COUNT = Math.floor(Math.random() * 2) + 3; 
        for (let i = 0; i < PIRATE_COUNT; i++) {
             mapData.pirates.push({
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE)
            });
        }
    }
    
    initMapData();

    // Nebula Pattern
    let nebulaPattern = null;
    function createNebulaPattern() {
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

    if (ctx) {
        nebulaPattern = createNebulaPattern();
    }

    let camera = { x: 0, y: 0, zoom: 1 };
    let isMouseDown = false;
    let isPanning = false; 
    let lastMouse = { x: 0, y: 0 };

    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 10;
    const GRID_SIZE = 100;

    // Helper to calculate cell coordinates from screen pixels
    function getGridCoordinates(clientX, clientY) {
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;

        const worldX = (mouseX - camera.x) / camera.zoom;
        const worldY = (mouseY - camera.y) / camera.zoom;

        const width = rect.width; 
        const height = rect.height;
        const size = Math.min(width, height);
        const cellSize = size / GRID_SIZE;

        const cellX = Math.floor(worldX / cellSize);
        const cellY = Math.floor(worldY / cellSize);

        if (cellX >= 0 && cellX < GRID_SIZE && cellY >= 0 && cellY < GRID_SIZE) {
            return { x: cellX, y: cellY };
        }
        return null;
    }

    // Helper to get World Coordinates from Screen Coordinates
    function getWorldCoordinates(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;
        return {
            x: (mouseX - camera.x) / camera.zoom,
            y: (mouseY - camera.y) / camera.zoom
        };
    }

    // Function to populate Panel 1
    function updatePanel1() {
        const panel = document.getElementById('panel-1-content');
        if (!panel) return;

        // === PLANET VIEW ===
        if (currentView === 'planet') {
            panel.innerHTML = `
                <div class="mb-4">
                    <div class="text-xs font-bold text-gray-500 uppercase">Current Location</div>
                    <div class="text-lg font-mono text-primary font-bold">PLANET SURFACE</div>
                </div>
                <div class="p-3 bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-800 rounded mb-2">
                    <div class="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-2">
                        <span class="material-icons text-sm">public</span> PLANET P-${activePlanet.id}
                    </div>
                    <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Orbit Radius: ${activePlanet.orbitRadius}<br>
                        Size Class: ${activePlanet.size}
                    </div>
                </div>
            `;
            return;
        }

        // === SYSTEM VIEW ===
        if (currentView === 'system') {
            // Header showing system info
            let html = `
                <div class="mb-4">
                    <div class="text-xs font-bold text-gray-500 uppercase">Current Location</div>
                    <div class="text-lg font-mono text-primary font-bold">SYSTEM VIEW</div>
                    <div class="text-xs text-gray-400 mt-1">Coordinates: [ ${activeSystem.x}, ${activeSystem.y} ]</div>
                </div>
            `;

            // If a planet is selected, show its specific details
            if (selectedPlanet) {
                 html += `
                    <div class="p-3 bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-800 rounded mb-2">
                        <div class="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-2">
                            <span class="material-icons text-sm">public</span> SELECTED PLANET
                        </div>
                        <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            A terrestrial world in orbit.<br>
                            Click enter to initiate landing sequence.
                        </div>
                    </div>
                    <button id="btn-enter-planet" class="w-full mt-2 bg-primary hover:bg-blue-600 text-white font-bold py-2 px-4 rounded shadow transition-colors flex items-center justify-center gap-2">
                        <span class="material-icons text-sm">login</span> Enter Planet
                    </button>
                    <div class="mt-4 border-t border-gray-200 dark:border-zinc-700 pt-2">
                         <div class="text-xs text-gray-500 italic">Select the Star or empty space to clear selection.</div>
                    </div>
                `;
            } else {
                // Default System Info
                const pCount = activeSystem.details ? activeSystem.details.planets.length : 0;
                html += `
                    <div class="p-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800 rounded mb-2">
                        <div class="text-yellow-600 dark:text-yellow-400 font-bold flex items-center gap-2">
                            <span class="material-icons text-sm">wb_sunny</span> LOCAL STAR
                        </div>
                        <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">Class G Yellow Dwarf.</div>
                    </div>
                    <div class="mt-4">
                        <div class="text-xs font-bold text-gray-500 uppercase mb-2">System Data</div>
                        <div class="flex items-center justify-between text-sm border-b border-gray-200 dark:border-zinc-700 py-1">
                            <span>Planets Detected:</span>
                            <span class="font-mono font-bold">${pCount}</span>
                        </div>
                    </div>
                `;
            }
            
            panel.innerHTML = html;

            // Attach listener for Enter Planet
            const enterPBtn = document.getElementById('btn-enter-planet');
            if (enterPBtn && selectedPlanet) {
                enterPBtn.addEventListener('click', () => {
                    enterPlanet(selectedPlanet);
                });
            }
            return;
        }

        // === SECTOR VIEW ===
        if (!selectedCell) {
            panel.innerHTML = `<p class="opacity-50 italic">Select a grid cell to view details.</p>`;
            return;
        }

        const system = mapData.systems.find(p => p.x === selectedCell.x && p.y === selectedCell.y);
        const nebula = mapData.nebulae.find(p => p.x === selectedCell.x && p.y === selectedCell.y);
        const pirate = mapData.pirates.find(p => p.x === selectedCell.x && p.y === selectedCell.y);

        let contentHtml = `
            <div class="mb-4">
                <div class="text-xs font-bold text-gray-500 uppercase">Coordinates</div>
                <div class="text-lg font-mono text-primary">[ ${selectedCell.x}, ${selectedCell.y} ]</div>
            </div>
        `;

        let statusFound = false;

        if (pirate) {
            contentHtml += `
                <div class="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded mb-2">
                    <div class="text-red-600 dark:text-red-400 font-bold flex items-center gap-2">
                        <span class="material-icons text-sm">warning</span> PIRATE FLEET
                    </div>
                    <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">Hostile entities detected. High threat level.</div>
                </div>
            `;
            statusFound = true;
        }

        if (system) {
            contentHtml += `
                <div class="p-3 bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-800 rounded mb-2">
                    <div class="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-2">
                        <span class="material-icons text-sm">wb_sunny</span> STAR SYSTEM
                    </div>
                    <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">G-type main sequence star. Local planets detected.</div>
                </div>
                <button id="btn-enter-system" class="w-full mt-2 bg-primary hover:bg-blue-600 text-white font-bold py-2 px-4 rounded shadow transition-colors flex items-center justify-center gap-2">
                    <span class="material-icons text-sm">login</span> Enter System
                </button>
            `;
            statusFound = true;
        }

        if (nebula) {
            contentHtml += `
                <div class="p-3 bg-purple-100 dark:bg-purple-900/20 border border-purple-300 dark:border-purple-800 rounded mb-2">
                    <div class="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-2">
                        <span class="material-icons text-sm">blur_on</span> NEBULA
                    </div>
                    <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">Ionized gas cloud. Sensor interference high.</div>
                </div>
            `;
            statusFound = true;
        }

        if (!statusFound) {
            contentHtml += `
                <div class="text-sm text-gray-500 dark:text-gray-400 italic">
                    Empty Space.
                </div>
            `;
        }

        panel.innerHTML = contentHtml;

        const enterBtn = document.getElementById('btn-enter-system');
        if (enterBtn && system) {
            enterBtn.addEventListener('click', () => {
                enterSystem(system);
            });
        }
    }


    // === Render Loop ===
    function render() {
        if (!canvas || !ctx || !canvas.parentElement) return;

        const rect = canvas.parentElement.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        ctx.scale(dpr, dpr);

        ctx.fillStyle = '#FFFFFF'; 
        ctx.fillRect(0, 0, rect.width, rect.height);

        ctx.save();
        
        ctx.translate(camera.x, camera.y);
        ctx.scale(camera.zoom, camera.zoom);

        if (currentView === 'system') {
            drawSystem();
        } else if (currentView === 'planet') {
            drawPlanet();
        } else {
            drawSector(rect.width, rect.height);
        }

        ctx.restore();
    }

    function drawPlanet() {
        // Placeholder for planet view
        // Just empty space for now as requested
        // We could add some grid lines or something later
    }

    function drawSystem() {
        if (!activeSystem || !activeSystem.details) return;

        // 1. System Boundary
        ctx.beginPath();
        ctx.setLineDash([20, 20]);
        ctx.lineWidth = 1 / camera.zoom;
        ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
        ctx.arc(0, 0, activeSystem.details.systemRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // 2. Planets
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1 / camera.zoom;

        activeSystem.details.planets.forEach(planet => {
            // Orbit
            ctx.beginPath();
            ctx.arc(0, 0, planet.orbitRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Planet Position
            const px = Math.cos(planet.angle) * planet.orbitRadius;
            const py = Math.sin(planet.angle) * planet.orbitRadius;

            // Highlight if selected
            if (selectedPlanet && selectedPlanet.id === planet.id) {
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
            ctx.stroke(); 
        });

        // 3. Central Star
        ctx.fillStyle = "#000000";
        const starRadius = 50; 
        ctx.beginPath();
        ctx.arc(0, 0, starRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawSector(width, height) {
        const size = Math.min(width, height);
        const cellSize = size / GRID_SIZE;

        const mapWidth = cellSize * GRID_SIZE;
        const mapHeight = cellSize * GRID_SIZE;

        if (mapData.nebulae.length > 0) {
            ctx.save();
            mapData.nebulae.forEach(neb => {
                const nx = neb.x * cellSize;
                const ny = neb.y * cellSize;

                ctx.shadowBlur = 15;
                ctx.shadowColor = "rgba(180, 0, 200, 0.8)"; 
                ctx.fillStyle = "rgba(200, 100, 255, 0.2)"; 
                ctx.fillRect(nx, ny, cellSize, cellSize);
                ctx.shadowBlur = 0;

                if (nebulaPattern) {
                    ctx.fillStyle = nebulaPattern;
                    ctx.save();
                    ctx.translate(nx, ny);
                    ctx.fillRect(0, 0, cellSize, cellSize);
                    ctx.restore();
                }
            });
            ctx.restore();
        }

        if (hoveredCell) {
             ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
             ctx.fillRect(hoveredCell.x * cellSize, hoveredCell.y * cellSize, cellSize, cellSize);
        }
        if (selectedCell) {
             ctx.strokeStyle = "#00FFFF"; 
             ctx.lineWidth = 2 / camera.zoom;
             ctx.strokeRect(selectedCell.x * cellSize, selectedCell.y * cellSize, cellSize, cellSize);
             ctx.fillStyle = "rgba(0, 255, 255, 0.1)";
             ctx.fillRect(selectedCell.x * cellSize, selectedCell.y * cellSize, cellSize, cellSize);
        }

        ctx.beginPath();
        ctx.lineWidth = 1 / camera.zoom; 
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';

        for (let i = 0; i <= GRID_SIZE; i++) {
            const x = i * cellSize;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, mapHeight);
        }

        for (let i = 0; i <= GRID_SIZE; i++) {
            const y = i * cellSize;
            ctx.moveTo(0, y);
            ctx.lineTo(mapWidth, y);
        }
        ctx.stroke();

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2 / camera.zoom;
        ctx.strokeRect(0, 0, mapWidth, mapHeight);

        if (mapData.systems.length > 0) {
            ctx.fillStyle = "#000000"; 
            const systemRadius = cellSize * 0.25;

            mapData.systems.forEach(system => {
                const px = (system.x * cellSize) + (cellSize / 2);
                const py = (system.y * cellSize) + (cellSize / 2);

                ctx.beginPath();
                ctx.arc(px, py, systemRadius, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        if (mapData.pirates && mapData.pirates.length > 0) {
            ctx.fillStyle = "#EF4444"; 
            const pirateSize = cellSize * 0.5; 
            const offset = (cellSize - pirateSize) / 2;

            mapData.pirates.forEach(pirate => {
                const px = (pirate.x * cellSize) + offset;
                const py = (pirate.y * cellSize) + offset;
                ctx.fillRect(px, py, pirateSize, pirateSize);
                
                ctx.strokeStyle = "#7F1D1D"; 
                ctx.lineWidth = 1 / camera.zoom;
                ctx.strokeRect(px, py, pirateSize, pirateSize);
            });
        }
    }

    // === Event Listeners for Interaction ===

    if (canvas) {
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSensitivity = 0.001;
            const delta = -e.deltaY * zoomSensitivity;
            
            let minZoomLimit = MIN_ZOOM;
            if (currentView === 'system') {
                minZoomLimit = 0.05; 
            } else if (currentView === 'planet') {
                minZoomLimit = 0.1;
            }

            const newZoom = Math.min(Math.max(camera.zoom * (1 + delta), minZoomLimit), MAX_ZOOM);

            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const worldX = (mouseX - camera.x) / camera.zoom;
            const worldY = (mouseY - camera.y) / camera.zoom;

            camera.zoom = newZoom;
            camera.x = mouseX - worldX * camera.zoom;
            camera.y = mouseY - worldY * camera.zoom;

            requestAnimationFrame(render);
        });

        canvas.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            isPanning = false; 
            lastMouse = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('mousemove', (e) => {
            // Sector View Hover
            if (currentView === 'sector') {
                const gridCoords = getGridCoordinates(e.clientX, e.clientY);
                if (!hoveredCell || !gridCoords || hoveredCell.x !== gridCoords.x || hoveredCell.y !== gridCoords.y) {
                    hoveredCell = gridCoords;
                    requestAnimationFrame(render);
                }
            } else {
                if (hoveredCell) {
                    hoveredCell = null;
                    requestAnimationFrame(render);
                }
            }

            if (!isMouseDown) return;

            const dx = e.clientX - lastMouse.x;
            const dy = e.clientY - lastMouse.y;
            
            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                isPanning = true;
                canvas.classList.add('grabbing');
            }

            if (isPanning) {
                camera.x += dx;
                camera.y += dy;
                lastMouse = { x: e.clientX, y: e.clientY };
                requestAnimationFrame(render);
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (isMouseDown && !isPanning) {
                // === CLICK HANDLING ===
                
                if (currentView === 'sector') {
                    const coords = getGridCoordinates(e.clientX, e.clientY);
                    if (coords) {
                        selectedCell = coords;
                        updatePanel1();
                        requestAnimationFrame(render);
                    }
                } else if (currentView === 'system') {
                    // Check if clicked on a planet
                    const worldCoords = getWorldCoordinates(e.clientX, e.clientY);
                    const wx = worldCoords.x;
                    const wy = worldCoords.y;

                    let clickedPlanet = null;
                    if (activeSystem && activeSystem.details) {
                        // Iterate through planets
                        activeSystem.details.planets.forEach(planet => {
                            const px = Math.cos(planet.angle) * planet.orbitRadius;
                            const py = Math.sin(planet.angle) * planet.orbitRadius;
                            
                            // Check distance (hitbox slightly larger than visual size)
                            const dist = Math.sqrt((wx - px) ** 2 + (wy - py) ** 2);
                            if (dist <= planet.size + 10) { // +10 padding
                                clickedPlanet = planet;
                            }
                        });
                    }

                    selectedPlanet = clickedPlanet;
                    updatePanel1();
                    requestAnimationFrame(render);
                }
            }
            
            isMouseDown = false;
            isPanning = false;
            canvas.classList.remove('grabbing');
        });
    }

    const resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(render);
    });
    
    if (views.map) {
        resizeObserver.observe(views.map);
    }
});