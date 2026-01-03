import { gameState, mapData } from './state.js';

/*
    This module handles the UI interaction:
    1. Navigation tabs (Map, Economy, etc.)
    2. Side Panel updates (showing details for selected objects).
    3. Action buttons (Enter System, Enter Planet).
*/

export function initUI(callbacks) {
    const navButtons = {
        map: document.getElementById('nav-map'),
        info: document.getElementById('nav-info'),
        economy: document.getElementById('nav-economy'),
        diplomacy: document.getElementById('nav-diplomacy')
    };
    
    // Bind Nav Buttons
    if (navButtons.map) navButtons.map.addEventListener('click', () => callbacks.onNavChange('map'));
    if (navButtons.info) navButtons.info.addEventListener('click', () => callbacks.onNavChange('info'));
    if (navButtons.economy) navButtons.economy.addEventListener('click', () => callbacks.onNavChange('economy'));
    if (navButtons.diplomacy) navButtons.diplomacy.addEventListener('click', () => callbacks.onNavChange('diplomacy'));

    // Bind Back Button
    const btnBack = document.getElementById('btn-back');
    if (btnBack) {
        btnBack.addEventListener('click', () => callbacks.onBack());
    }
}

/*
    Updates the visuals of the navigation tabs and toggles the view containers.
*/
export function updateNavigation(activeId) {
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

    Object.keys(navButtons).forEach(key => {
        const btn = navButtons[key];
        if (btn) {
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
            } else {
                views[key].classList.add('hidden');
            }
        }
    });
}

export function updateBackButtonState() {
    const btnBack = document.getElementById('btn-back');
    if (!btnBack) return;
    
    // Back is only enabled if we are NOT in the root sector view
    if (gameState.currentView === 'sector') {
        btnBack.disabled = true;
        btnBack.classList.add('opacity-50', 'cursor-not-allowed');
        btnBack.classList.remove('hover:bg-gray-400', 'dark:hover:bg-zinc-700', 'active:border-b-0', 'active:translate-y-1');
    } else {
        btnBack.disabled = false;
        btnBack.classList.remove('opacity-50', 'cursor-not-allowed');
        btnBack.classList.add('hover:bg-gray-400', 'dark:hover:bg-zinc-700', 'active:border-b-0', 'active:translate-y-1');
    }
}

/*
    Populates Panel 1 with context-sensitive information.
    Accepts callbacks to bind the action buttons generated in the HTML.
*/
export function updatePanel1(callbacks) {
    const panel = document.getElementById('panel-1-content');
    if (!panel) return;

    // === PLANET VIEW ===
    if (gameState.currentView === 'planet') {
        if (gameState.selectedPlanetHex) {
            // -- SELECTED HEX DETAILS --
            const hex = gameState.selectedPlanetHex;
            panel.innerHTML = `
                <div class="mb-4">
                    <div class="text-xs font-bold text-black dark:text-gray-400 uppercase">Terrain Analysis</div>
                    <div class="text-lg font-mono text-primary dark:text-blue-400 font-bold">${hex.terrain.toUpperCase()}</div>
                </div>
                <div class="p-3 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded mb-2">
                    <div class="text-green-800 dark:text-green-400 font-bold flex items-center gap-2">
                        <span class="material-icons text-sm">landscape</span> SECTOR DATA
                    </div>
                    <div class="text-xs text-black dark:text-gray-300 mt-1">
                        Grid ID: ${hex.coordinate}<br>
                        Elevation Noise: ${hex.noise}<br>
                        Status: Unoccupied
                    </div>
                </div>
                <div class="mt-4 border-t border-gray-200 dark:border-zinc-700 pt-2">
                    <div class="text-xs text-black dark:text-gray-400 italic">
                        Click empty space to return to planet overview.
                    </div>
                </div>
            `;
        } else {
            // -- GENERAL PLANET OVERVIEW --
            panel.innerHTML = `
                <div class="mb-4">
                    <div class="text-xs font-bold text-black dark:text-gray-400 uppercase">Current Location</div>
                    <div class="text-lg font-mono text-primary dark:text-blue-400 font-bold">PLANET SURFACE</div>
                </div>
                <div class="p-3 bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-800 rounded mb-2">
                    <div class="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-2">
                        <span class="material-icons text-sm">public</span> PLANET P-${gameState.activePlanet.id}
                    </div>
                    <div class="text-xs text-black dark:text-gray-300 mt-1">
                        Type: ${gameState.activePlanet.type}<br>
                        Orbit Radius: ${gameState.activePlanet.orbitRadius}<br>
                        Atmosphere: ${gameState.activePlanet.atmosphere}
                    </div>
                </div>
                <div class="mt-4 border-t border-gray-200 dark:border-zinc-700 pt-2">
                        <div class="text-xs text-black dark:text-gray-400 italic">Select a grid cell to inspect terrain.</div>
                </div>
            `;
        }
        return;
    }

    // === SYSTEM VIEW ===
    if (gameState.currentView === 'system') {
        let html = `
            <div class="mb-4">
                <div class="text-xs font-bold text-black dark:text-gray-400 uppercase">Current Location</div>
                <div class="text-lg font-mono text-primary dark:text-blue-400 font-bold">SYSTEM VIEW</div>
                <div class="text-xs text-black dark:text-gray-400 mt-1">Coordinates: [ ${gameState.activeSystem.x}, ${gameState.activeSystem.y} ]</div>
            </div>
        `;

        if (gameState.selectedPlanet) {
                html += `
                <div class="p-3 bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-800 rounded mb-2">
                    <div class="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-2">
                        <span class="material-icons text-sm">public</span> SELECTED PLANET
                    </div>
                    <div class="text-xs text-black dark:text-gray-300 mt-1">
                        Type: ${gameState.selectedPlanet.type}<br>
                        Click enter to initiate landing sequence.
                    </div>
                </div>
                <button id="btn-enter-planet" class="w-full mt-2 bg-primary hover:bg-blue-600 text-white font-bold py-2 px-4 rounded shadow transition-colors flex items-center justify-center gap-2">
                    <span class="material-icons text-sm">login</span> Enter Planet
                </button>
                <div class="mt-4 border-t border-gray-200 dark:border-zinc-700 pt-2">
                        <div class="text-xs text-black dark:text-gray-400 italic">Select the Star or empty space to clear selection.</div>
                </div>
            `;
        } else {
            const pCount = gameState.activeSystem.details ? gameState.activeSystem.details.planets.length : 0;
            html += `
                <div class="p-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800 rounded mb-2">
                    <div class="text-yellow-600 dark:text-yellow-400 font-bold flex items-center gap-2">
                        <span class="material-icons text-sm">wb_sunny</span> LOCAL STAR
                    </div>
                    <div class="text-xs text-black dark:text-gray-300 mt-1">Class G Yellow Dwarf.</div>
                </div>
                <div class="mt-4">
                    <div class="text-xs font-bold text-black dark:text-gray-400 uppercase mb-2">System Data</div>
                    <div class="flex items-center justify-between text-sm border-b border-gray-200 dark:border-zinc-700 py-1">
                        <span class="text-black dark:text-gray-300">Planets Detected:</span>
                        <span class="font-mono font-bold text-black dark:text-gray-200">${pCount}</span>
                    </div>
                </div>
            `;
        }
        
        panel.innerHTML = html;

        const enterPBtn = document.getElementById('btn-enter-planet');
        if (enterPBtn && gameState.selectedPlanet) {
            enterPBtn.addEventListener('click', () => {
                callbacks.onEnterPlanet(gameState.selectedPlanet);
            });
        }
        return;
    }

    // === SECTOR VIEW ===
    if (!gameState.selectedCell) {
        panel.innerHTML = `<p class="opacity-50 italic text-black dark:text-gray-400">Select a grid cell to view details.</p>`;
        return;
    }

    const cell = gameState.selectedCell;
    const system = mapData.systems.find(p => p.x === cell.x && p.y === cell.y);
    const nebula = mapData.nebulae.find(p => p.x === cell.x && p.y === cell.y);
    const pirate = mapData.pirates.find(p => p.x === cell.x && p.y === cell.y);

    let contentHtml = `
        <div class="mb-4">
            <div class="text-xs font-bold text-black dark:text-gray-400 uppercase">Coordinates</div>
            <div class="text-lg font-mono text-primary dark:text-blue-400">[ ${cell.x}, ${cell.y} ]</div>
        </div>
    `;

    let statusFound = false;

    if (pirate) {
        contentHtml += `
            <div class="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded mb-2">
                <div class="text-red-600 dark:text-red-400 font-bold flex items-center gap-2">
                    <span class="material-icons text-sm">warning</span> PIRATE FLEET
                </div>
                <div class="text-xs text-black dark:text-gray-300 mt-1">Hostile entities detected. High threat level.</div>
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
                <div class="text-xs text-black dark:text-gray-300 mt-1">G-type main sequence star. Local planets detected.</div>
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
                <div class="text-xs text-black dark:text-gray-300 mt-1">Ionized gas cloud. Sensor interference high.</div>
            </div>
        `;
        statusFound = true;
    }

    if (!statusFound) {
        contentHtml += `
            <div class="text-sm text-black dark:text-gray-400 italic">
                Empty Space.
            </div>
        `;
    }

    panel.innerHTML = contentHtml;

    const enterBtn = document.getElementById('btn-enter-system');
    if (enterBtn && system) {
        enterBtn.addEventListener('click', () => {
            callbacks.onEnterSystem(system);
        });
    }
}