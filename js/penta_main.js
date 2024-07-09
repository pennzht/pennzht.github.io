/*
Next steps:
1. Use better edge and face numbering. (letter + order)
2. Encode each point as (ABC:Face, pos:complex)
    pos is an Eisenstein integer, not divided by "scale" yet.
3. Extensible coordinates
    if out of bounds, map to neighboring face
*/

const $ = (x) => document.getElementById(x);

const c = $('canvas').getContext('2d');
const w = $('canvas').width, h = $('canvas').height;
const radius = Math.min (w/4, h/2) * 0.8;
const phi = (1 + 5 ** 0.5) / 2;

const rotation = [0, 0];

const gran = 8;

window.onload = (e) => {
    vertices = genVertices();
    triangles = genTriangles();
    meshpoints = genMeshpoints();
    console.log (
        vertices.length,
        triangles.length,
        meshpoints.length,
    );
}

$('canvas').onmousemove = (e) => {
    const x = e.offsetX, y = e.offsetY;

    // Calculate rotations
    const rotX = (x - w/2) / radius * Math.PI;
    const rotY = (y - h/2) / radius * Math.PI;

    rotation[0] = rotX;
    rotation[1] = rotY;

    c.clearRect (0, 0, w, h);
    c.fillStyle = '#00000011';
    c.fillRect (0, 0, w, h);

    c.fillStyle = 'black';

    // Draw hemispheres
    c.beginPath();
    c.ellipse (w/4, h/2, radius, radius, 0, 0, Math.PI*2);
    c.stroke();

    c.beginPath();
    c.ellipse (w*3/4, h/2, radius, radius, 0, 0, Math.PI*2);
    c.stroke();

    // Draw points
    for (const vert of vertices) {
        drawPoint (vert, 2, 'black');
    }

    // Draw lerpings
    for (const vert1 of vertices) {
        for (const vert2 of vertices) {
            if (distance (vert1, vert2) <= 3) {
                drawLine (vert1, vert2, 100, 'gray');
            }
        }
    }

    // Draw meshpoints
    for (const mp of meshpoints) {
        drawPoint(mp, 1, 'gray');
    }

    genVoronoi();
}

function getPointLocation (xyz) {
    const [x, y, z] = norm(xyz);
    if (z >= 0) {
        return [
            w/4 + x * radius,
            h/2 + y * radius,
        ];
    } else {
        return [
            w*3/4 + x * radius * (-1),  // revert
            h/2 + y * radius,
        ];
    }
}

function drawPoint (xyz, size = 2, color='black') {
    const [a, b] = getPointLocation (rotate (xyz, rotation));
    c.fillStyle = color;
    c.fillRect (a-size, b-size, size * 2, size * 2);
}

function drawLine (p1, p2, gran=100, color='black') {
    c.strokeStyle = color;

    const lerpings = [];
    for (let i = 0; i <= gran; i++) {
        lerpings.push (lerp (p1, p2, i/gran));
    }
    for (let i = 0; i < gran; i++) {
        const proj1 = getPointLocation (rotate (lerpings[i], rotation));
        const proj2 = getPointLocation (rotate (lerpings[i+1], rotation));

        if (proj1[0] < w/2 && proj2[0] < w/2 ||
            proj1[0] > w/2 && proj2[0] > w/2) {
            // Draw segment
            c.beginPath();
            c.moveTo(... proj1);
            c.lineTo(... proj2);
            c.stroke();
        }
    }
}

function norm (xyz) {
    const [x, y, z] = xyz;
    const r = (x**2 + y**2 + z**2) ** .5;
    return [x / r, y / r, z / r];
}

function rotate (xyz, ab) {
    let [x, y, z] = [...xyz], [a, b] = ab;
    [x, y] = rotby ([x, y], a);
    [y, z] = rotby ([y, z], b);
    return [x, y, z];
}

function rotby (xy, a) {
    const [x, y] = xy;
    return [x * Math.cos(a) + y * Math.sin(a),
            y * Math.cos(a) - x * Math.sin(a)];
}

function add (a, b) {
    const ans = [];
    for (let i = 0; i < a.length; i++) ans.push (a[i] + b[i]);
    return ans;
}

function scale (a, k) {
    const ans = [];
    for (let i = 0; i < a.length; i++) ans.push (a[i] * k);
    return ans;
}

function genVertices () {
    const ans = [];
    for (let i = 0; i < 12; i++) {
        const sign1 = [1, -1] [i & 1];
        const sign2 = [1, -1] [(i >> 1) & 1];
        const rotation = (i >> 2);
        const [x, y, z] = [0, 1 * sign1, phi * sign2];
        ans.push (
            [[x, y, z], [y, z, x], [z, x, y]] [rotation]
        );
    }
    return ans;
}

function genTriangles () {
    const verts = genVertices();
    
    const edges = [];
    const edgesSet = new Set();
    const tris = [];

    // First, range over edges.
    for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) {
        if (i !== j && distance (verts[i], verts[j]) <= 3) {
            edges.push ([i, j]);
            edgesSet.add (`${i},${j}`);
        }
    }

    // Then, range over triangles(!), in a given handedness.
    for (let [i, j] of edges) for (let k = 0; k < 12; k++) {
        // Only consider one order.
        if (! (i <= j && i <= k)) continue;

        if (edgesSet.has (`${i},${k}`) && edgesSet.has (`${j},${k}`) && righthanded (verts[i], verts[j], verts[k])) {
            tris.push ([i, j, k]);
        }
    }

    console.log ('edges', JSON.stringify (edges, null, 2));
    console.log ('tris', JSON.stringify (tris, null, 2));

    console.log (edges.length, 'edges', tris.length, 'tris');

    return tris;
}

function genMeshpoints () {
    // For each triangle, cut up into `gran` parts.
    const verts = vertices;

    const meshpoints = [];

    for (const [i, j, k] of triangles) {
        const vi = verts[i], vj = verts[j], vk = verts[k];

        // Draws an equilateral triangle on an Eisenstein (Eulerian) grid.

        const strideA = 4, strideB = 2;

        const side1 = new Eulerian (strideA, -strideB);
        const side2 = side1.mul (rotate60);
        // Find bounding box.
        const minA = Math.min (0, side1.a, side2.a), minB = Math.min (0, side1.b, side2.b);
        const maxA = Math.max (0, side1.a, side2.a), maxB = Math.max (0, side1.b, side2.b);

        console.log (side1, side2, minA, maxA, minB, maxB);

        const interiorPoints = [];
        for (let a = minA; a <= maxA; a++) for (let b = minB; b <= maxB; b++) {
            const pt = [a, b, 1];
            // Test if inside.
            const inner =
                  det ([0, 0, 1], side1.coordProj(), pt) >= 0 &&
                  det ([0, 0, 1], pt, side2.coordProj()) >= 0 &&
                  det (pt, side1.coordProj(), side2.coordProj()) >= 0;
            if (inner) interiorPoints.push (new Eulerian (a, b));
        }

        // Find relative position of point in equilateral triangle.
        let closeMatchCount = 0;
        for (const pt of interiorPoints) {
            const relPos = pt.div (side1);
            const a = relPos.a, b = relPos.b;
            const meshpoint = add (
                scale (vi, 1 - a),
                add (
                    scale (vj, a - b),
                    scale (vk, b),
                ),
            );

            // Seeks close point
            let found = false;
            const epsilon = 1e-8;
            for (const mp of vertices) {
                if (distance (mp, meshpoint) < epsilon) {
                    found = true; break;
                }
            }
            if (found) continue;

            for (const mp of meshpoints) {
                if (distance (mp, meshpoint) < epsilon) {
                    found = true; break;
                }
            }
            if (found) continue;

            meshpoints.push (meshpoint);
        }

        // Every meshpoint can be recorded as [faceId, u, v] where u, v are rationals,
        //     or as [faceId, a, b] where a, b are integers.
    }

    return meshpoints;
}

function genVoronoi () {
    const points = [...vertices, ...meshpoints];
    
    // For meshpoints, get 6 closest points.
    for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        const isVertex = i < vertices.length;
        const neighborCount = isVertex ? 5 : 6;

        const sortByDist = [...points];
        sortByDist.sort ((a, b) => distance (a, pt) - distance (b, pt));
        const nearest = sortByDist.slice(1, neighborCount+1);
        const sorted = sortNeighbors (pt, nearest);
        
        const midpoints = [];
        for (let i = 0; i < neighborCount; i++) {
            midpoints.push (
                scale (
                    add (
                        pt,
                        add (sorted[i], sorted[(i+1)%neighborCount]),
                    ),
                    1/3,
                ),
            );
        }

        for (let i = 0; i < sorted.length; i++) {
            // drawPoint (lerp (pt, n, 0.3), 1);
            drawLine (
                midpoints[i],
                midpoints[(i+1) % neighborCount],
            );
        }
    }
}

function lerp (v1, v2, t) {
    const ans = [];
    for (let i = 0; i < Math.min (v1.length, v2.length); i++) {
        ans.push (
            v1[i] * (1-t) + v2[i] * t
        );
    }
    return ans;
}

function distance (v1, v2) {
    let ans = 0;
    for (let i = 0; i < Math.min (v1.length, v2.length); i++) {
        ans += (v1[i] - v2[i]) ** 2;
    }
    return ans ** 0.5;
}

function dot (v1, v2) {
    let ans = 0;
    for (let i = 0; i < Math.min (v1.length, v2.length); i++) {
        ans += v1[i] * v2[i];
    }
    return ans;
}

function righthanded (v1, v2, v3) {
    return det (v1, v2, v3) > 0;
}

function det (v1, v2, v3) {
    const [[a, b, c],
           [d, e, f],
           [g, h, i]] = [v1, v2, v3];
    const det =
          a * (e * i - f * h) +
          b * (f * g - d * i) +
          c * (d * h - e * g);
    return det;
}

function sortNeighbors (axis, neighbors) {
    const [a, b, c] = axis;
    const w1 = [-b, a, 0];
    const w2 = [-a*c, -b*c, a*a+b*b];
    // Sort the remaining points by dot products;

    const withAngles = neighbors.map ((nb) => {
        const d1 = dot (w1, nb);
        const d2 = dot (w2, nb);
        const angle = Math.atan2 (d2, d1);
        return {nb, angle};
    });

    withAngles.sort ((a, b) => a.angle - b.angle);
    return withAngles.map ((a) => a.nb);
}

const a = new Eulerian (1, 2);
console.log (a.inv());
