/*
    This will define the central state of the game.
    It holds the camera configurations, current view mode, active selections, and map data.
    By centralizing this, we avoid passing too many individual variables between modules.
*/

export const gameState = {
    // 'sector' (Grid Map) | 'system' (Star View) | 'planet' (Planet View)
    currentView: 'sector',

    // Camera State
    camera: { x: 0, y: 0, zoom: 1 },
    
    // Saved Camera States to restore positions when switching views
    savedSectorCamera: { x: 0, y: 0, zoom: 1 },
    savedSystemCamera: { x: 0, y: 0, zoom: 1 },

    // Active Data Context
    activeSystem: null,
    activePlanet: null,

    // User Selections
    selectedCell: null,   // Sector View
    selectedPlanet: null, // System View
    hoveredCell: null     // Sector View
};

/*
    Here, we define the map data structure.
    It will be populated by initMapData.
*/
export const mapData = {
    systems: [],
    nebulae: [],
    pirates: []
};

/*
    So, this function initializes the random map generation.
    It populates the mapData object with systems, nebulae, and pirate fleets.
*/
export function initMapData() {
    const GRID_SIZE = 100;
    const SYSTEM_COUNT = 150;
    const NEBULA_COUNT = 300;

    mapData.systems = [];
    mapData.nebulae = [];
    mapData.pirates = [];

    // Generate Systems
    for (let i = 0; i < SYSTEM_COUNT; i++) {
        mapData.systems.push({
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        });
    }
    
    // Generate Nebulae
    for (let i = 0; i < NEBULA_COUNT; i++) {
        mapData.nebulae.push({
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        });
    }

    // Generate Pirates
    const PIRATE_COUNT = Math.floor(Math.random() * 2) + 3; 
    for (let i = 0; i < PIRATE_COUNT; i++) {
            mapData.pirates.push({
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        });
    }
}