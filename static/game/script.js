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
                        requestAnimationFrame(drawGrid);
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

    // === Grid Logic with Pan & Zoom ===
    const canvas = document.getElementById('map-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;

    let camera = { x: 0, y: 0, zoom: 1 };
    let isDragging = false;
    let lastMouse = { x: 0, y: 0 };

    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 10;

    function drawGrid() {
        if (!canvas || !ctx || !canvas.parentElement) return;

        const rect = canvas.parentElement.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        // Sync canvas resolution
        canvas.width = rect.width;
        canvas.height = rect.height;

        const width = canvas.width;
        const height = canvas.height;
        const gridSize = 100;

        // --- NEW LOGIC: Square Cells ---
        // Determine cell size based on the smaller dimension to fit the grid initially
        // This ensures stepX and stepY are identical (Square cells)
        const size = Math.min(width, height);
        const cellSize = size / gridSize;

        // Calculate total map dimensions
        const mapWidth = cellSize * gridSize;
        const mapHeight = cellSize * gridSize;

        // Clear Screen
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        
        // Apply Camera transforms
        ctx.translate(camera.x, camera.y);
        ctx.scale(camera.zoom, camera.zoom);

        ctx.beginPath();
        // Keep lines consistent thickness
        ctx.lineWidth = 1 / camera.zoom; 
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';

        // Draw Vertical Lines
        // Note: We loop up to 'mapWidth', not 'width'
        for (let i = 0; i <= gridSize; i++) {
            const x = i * cellSize;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, mapHeight);
        }

        // Draw Horizontal Lines
        // Note: We loop up to 'mapHeight', not 'height'
        for (let i = 0; i <= gridSize; i++) {
            const y = i * cellSize;
            ctx.moveTo(0, y);
            ctx.lineTo(mapWidth, y);
        }

        ctx.stroke();

        // Draw Map Border (Thicker line to define the edge of the 100x100 sector)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2 / camera.zoom;
        ctx.strokeRect(0, 0, mapWidth, mapHeight);

        ctx.restore();
    }

    // === Event Listeners for Interaction ===

    if (canvas) {
        // 1. Zoom
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSensitivity = 0.001;
            const delta = -e.deltaY * zoomSensitivity;
            const newZoom = Math.min(Math.max(camera.zoom * (1 + delta), MIN_ZOOM), MAX_ZOOM);

            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const worldX = (mouseX - camera.x) / camera.zoom;
            const worldY = (mouseY - camera.y) / camera.zoom;

            camera.zoom = newZoom;
            camera.x = mouseX - worldX * camera.zoom;
            camera.y = mouseY - worldY * camera.zoom;

            requestAnimationFrame(drawGrid);
        });

        // 2. Start Pan
        canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastMouse = { x: e.clientX, y: e.clientY };
            canvas.classList.add('grabbing');
        });

        // 3. Pan
        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - lastMouse.x;
            const dy = e.clientY - lastMouse.y;
            camera.x += dx;
            camera.y += dy;
            lastMouse = { x: e.clientX, y: e.clientY };
            requestAnimationFrame(drawGrid);
        });

        // 4. End Pan
        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                canvas.classList.remove('grabbing');
            }
        });
    }

    // === Resize Observer ===
    const resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(drawGrid);
    });
    
    if (views.map) {
        resizeObserver.observe(views.map);
    }
});