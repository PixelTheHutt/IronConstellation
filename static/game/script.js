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

    // === Icosahedron Geometry Init ===
    let verts = [];
    function init3DGeometry() {
        const t = (1.0 + Math.sqrt(5.0)) / 2.0;
        const lat = Math.atan(0.5);
        const yRing = Math.sin(lat);
        const rRing = Math.cos(lat);
        
        verts = [];
        verts.push({x:0, y:1, z:0}); // 0: Top
        for(let i=0; i<5; i++){ 
            const theta = (i * 2 * Math.PI / 5);
            verts.push({x: rRing*Math.cos(theta), y: yRing, z: rRing*Math.sin(theta)}); // 1-5: Upper Ring
        }
        for(let i=0; i<5; i++){ 
            const theta = (i * 2 * Math.PI / 5) + (Math.PI/5);
            verts.push({x: rRing*Math.cos(theta), y: -yRing, z: rRing*Math.sin(theta)}); // 6-10: Lower Ring
        }
        verts.push({x:0, y:-1, z:0}); // 11: Bottom
    }
    init3DGeometry();

    // === Palettes ===
    const palettes = {
        terran: {
            oceanDeep: '#aed9e0', oceanShallow: '#caf0f8',
            land: '#b7e4c7', forest: '#74c69d', mountain: '#adb5bd', peak: '#ffffff',
            ice: '#f8f9fa', grid: 'rgba(0,0,0,0.15)', border: '#000000'
        },
        arid: {
            oceanDeep: '#e6ccb2', oceanShallow: '#ede0d4',
            land: '#fff6b6', forest: '#cab172', mountain: '#d4a373', peak: '#faedcd',
            ice: '#ffffff', grid: 'rgba(0,0,0,0.15)', border: '#000000'
        },
        frozen: {
            oceanDeep: '#90e0ef', oceanShallow: '#caf0f8',
            land: '#e0fbfc', forest: '#ffffff', mountain: '#ced4da', peak: '#ffffff',
            ice: '#ffffff', grid: 'rgba(0,0,0,0.15)', border: '#000000'
        },
        toxic: {
            oceanDeep: '#7d93ff', oceanShallow: '#40a8fd',
            land: '#adfded', forest: '#2ec4b6', mountain: '#726a7b', peak: '#535353',
            ice: '#ffffff', grid: 'rgba(0,0,0,0.15)', border: '#000000'
        },
        volcanic: {
            oceanDeep: '#6c757d', oceanShallow: '#adb5bd',
            land: '#dee2e6', forest: '#ced4da', mountain: '#495057', peak: '#ffadad',
            ice: '#e9ecef', grid: 'rgba(0,0,0,0.15)', border: '#000000'
        }
    };

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
                
                // Generate Atmosphere & Biome Data
                const types = ['Terran', 'Arid', 'Frozen', 'Volcanic', 'Toxic'];
                const type = types[Math.floor(Math.random() * types.length)];
                
                let atmosphere = 'Nitrogen-Oxygen';
                if(type === 'Volcanic') atmosphere = 'Volcanic';
                else if(type === 'Toxic') atmosphere = 'Toxic';
                else if(type === 'Arid') atmosphere = 'Thin';
                else if(type === 'Frozen') atmosphere = 'Thin';

                activeSystem.details.planets.push({
                    id: i, // ID for easier lookup
                    orbitRadius: currentRadius,
                    angle: Math.random() * Math.PI * 2,
                    size: Math.floor(Math.random() * 4) + 6,
                    seed: Math.floor(Math.random() * 10000),
                    hydro: Math.floor(Math.random() * 100),
                    atmosphere: atmosphere,
                    type: type
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
                        Type: ${activePlanet.type}<br>
                        Orbit Radius: ${activePlanet.orbitRadius}<br>
                        Atmosphere: ${activePlanet.atmosphere}
                    </div>
                </div>
                <div class="mt-4 border-t border-gray-200 dark:border-zinc-700 pt-2">
                     <div class="text-xs text-gray-500 italic">Planetary Grid: Icosahedral Projection</div>
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
                            Type: ${selectedPlanet.type}<br>
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

    /*
     * drawPlanet: Renders an Icosahedral Map using Barycentric Projection.
     */
    function drawPlanet() {
        // --- 1. Map Layout Calculations ---
        // We define the layout based on the "baseHexCount" to determine grid density
        const baseHexCount = 50; 
        
        // Define map dimensions to fit comfortably at default zoom
        // Total map width is 5.5 * Side Length.
        // We approximate Side Length (S) to be reasonable.
        const S = 300; 
        const H = S * (Math.sqrt(3) / 2);
        
        const mapW = 5.5 * S;
        const mapH = 3 * H;
        
        // Center the map at (0,0) in our camera world space
        const startX = -mapW / 2;
        const startY = -mapH / 2;
        
        // Determine hex geometry based on S and desired count
        const targetHexW = S / 10; // Approx 10 hexes per side
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
            
            // Indices for the vertices
            const upCurrent = i + 1; 
            const upNext = nextI + 1;
            const lowCurrent = i + 6; 
            const lowNext = nextI + 6;
            const lowNextPlus = ((i + 2) % 5) + 6; 

            // Triangle 1: North Polar (Up)
            // Verts: Top (0), UpCurrent, UpNext
            // Wait, standard winding order?
            // V[0] is top.
            drawLocalTriangle(xBase, startY + H, S, H, 'up', V[upCurrent], V[upNext], V[0], colors, hexRadius);
            
            // Triangle 2: North Temperate (Down)
            // Verts: UpCurrent, UpNext, LowNext
            // Connects two upper ring to one lower ring?
            // Actually, in standard numbering:
            // 0 is top. 1-5 upper ring. 6-10 lower ring. 11 bottom.
            // A 'Down' triangle here shares the top edge with T1's base? No.
            // It sits between the upper ring points.
            drawLocalTriangle(xBase, startY + H, S, H, 'down', V[upCurrent], V[upNext], V[lowNext], colors, hexRadius);
            
            // Triangle 3: South Temperate (Up)
            // Verts: LowNext, LowNextPlus, UpNext
            drawLocalTriangle(xBase + S/2, startY + 2*H, S, H, 'up', V[lowNext], V[lowNextPlus], V[upNext], colors, hexRadius);
            
            // Triangle 4: South Polar (Down)
            // Verts: LowNext, LowNextPlus, Bottom (11)
            drawLocalTriangle(xBase + S/2, startY + 2*H, S, H, 'down', V[lowNext], V[lowNextPlus], V[11], colors, hexRadius);
        }
    }

    function drawLocalTriangle(offsetX, offsetY, S, H, orientation, v1, v2, v3, colors, hexRadius) {
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
        
        // Clip to triangle
        ctx.clip();

        // Fill background
        ctx.fillStyle = colors.oceanDeep;
        ctx.fillRect(0, -H, S, 2*H); // generous fill

        const hexW = Math.sqrt(3) * hexRadius;
        const vertDist = 1.5 * hexRadius;
        
        // Calculate Grid Bounds (relative to local triangle origin)
        const rows = Math.ceil(H / vertDist) + 2;
        const cols = Math.ceil(S / hexW) + 2;

        for (let row = -rows; row < rows; row++) {
            const xOffset = (row % 2) * (hexW / 2);
            for (let col = -2; col < cols; col++) {
                const cx = col * hexW + xOffset;
                const cy = row * vertDist;

                // Barycentric Mapping
                const {u, v, w} = getBarycentric(cx, cy, tX1, tY1, tX2, tY2, tX3, tY3);
                
                // Culling: If significantly outside triangle, skip
                if (u < -0.1 || v < -0.1 || w < -0.1) continue;

                // Interpolate 3D position
                const p3 = {
                    x: u*v1.x + v*v2.x + w*v3.x,
                    y: u*v1.y + v*v2.y + w*v3.y,
                    z: u*v1.z + v*v2.z + w*v3.z
                };

                // Sample Noise
                const noiseVal = get3DNoise(p3.x, p3.y, p3.z);
                
                // Determine Color
                let color = null;
                const seed = activePlanet ? activePlanet.seed : 0;
                const hydro = activePlanet ? activePlanet.hydro : 50;
                const waterLevel = hydro / 100.0;
                
                // Color Logic
                if (Math.abs(p3.y) > 0.90) { color = colors.ice; } 
                else if (noiseVal > (waterLevel + 0.4)) { color = colors.peak; }
                else if (noiseVal > (waterLevel + 0.2)) { color = colors.mountain; }
                else if (noiseVal > (waterLevel + 0.1)) { color = colors.forest; }
                else if (noiseVal > waterLevel) { color = colors.land; }
                else if (noiseVal > (waterLevel - 0.1)) { color = colors.oceanShallow; } 
                // else deep ocean (null/background)

                if (color) {
                    drawHex(cx, cy, hexRadius, color, colors.grid);
                } else {
                    drawHex(cx, cy, hexRadius, null, colors.grid);
                }
            }
        }
        
        // Draw Border
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

    function drawHex(cx, cy, r, fillColor, strokeColor) {
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

    function getBarycentric(px, py, x1, y1, x2, y2, x3, y3) {
        const detT = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
        const u = ((y2 - y3) * (px - x3) + (x3 - x2) * (py - y3)) / detT;
        const v = ((y3 - y1) * (px - x3) + (x1 - x3) * (py - y3)) / detT;
        const w = 1 - u - v;
        return { u, v, w };
    }

    function get3DNoise(x, y, z) {
        const seed = activePlanet ? activePlanet.seed : 1234;
        const len = Math.sqrt(x*x + y*y + z*z);
        // Normalize
        const nx = x/len; const ny = y/len; const nz = z/len;
        
        let val = 0;
        val += Math.sin(nx*3 + seed) * Math.cos(ny*3 - seed) * Math.sin(nz*3 + seed);
        val += 0.5 * (Math.sin(nx*8 + seed*2) + Math.cos(ny*8 + seed));
        val += 0.2 * Math.sin((nx+ny+nz)*15 + seed);
        
        // Normalize roughly to 0..1
        return (val + 1.5) / 3.0;
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