/*
    This will hold the vertices for the icosahedron geometry.
    It is populated immediately when the module is loaded.
*/
export const verts = [];

/*
    Here, we initialize the 3D geometry for the Icosahedron.
    This calculates the vertices for the top, upper ring, lower ring, and bottom.
*/
(function init3DGeometry() {
    const t = (1.0 + Math.sqrt(5.0)) / 2.0;
    const lat = Math.atan(0.5);
    const yRing = Math.sin(lat);
    const rRing = Math.cos(lat);
    
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
})();

/*
    So, this function calculates the barycentric coordinates for a point P inside a triangle (A, B, C).
    Used for mapping the 2D hex grid onto the 3D triangle faces.
*/
export function getBarycentric(px, py, x1, y1, x2, y2, x3, y3) {
    const detT = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
    const u = ((y2 - y3) * (px - x3) + (x3 - x2) * (py - y3)) / detT;
    const v = ((y3 - y1) * (px - x3) + (x1 - x3) * (py - y3)) / detT;
    const w = 1 - u - v;
    return { u, v, w };
}

/*
    Then, this function generates pseudo-random 3D noise for terrain generation.
    It takes an activePlanet object (which must be passed in or handled via state, 
    but for purity we will assume the caller handles the seed, or we default it here).
    
    Note: Refactored to accept seed as a parameter for better purity.
*/
export function get3DNoise(x, y, z, seed = 1234) {
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