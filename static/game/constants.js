/*
    This will define the color palettes used for rendering planets.
    We export this object so it can be imported by the renderer module.
*/
export const palettes = {
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