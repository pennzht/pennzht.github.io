/* penta_main2.js: improved

Next steps:
1. Use better edge and face numbering. (letter + order)
2. Encode each point as (ABC:Face, pos:complex)
    pos is an Eisenstein integer, not divided by "scale" yet.
3. Extensible coordinates
    if out of bounds, map to neighboring face
4. Determine identity of points using coordinates (RATIONAL!), not epsilon.
*/

const $ = (x) => document.getElementById(x);

const c = $('canvas').getContext('2d');
const w = $('canvas').width, h = $('canvas').height;
const radius = Math.min (w/4, h/2) * 0.8;
const phi = (1 + Math.sqrt(5)) / 2;

const rotation = [0, 0];

const gran = 8;

//// Helper functions

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

//// Point-drawing functions

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

//// Icosahedron

function icosa () {
    const vertices = {
        A: [0, 1, phi],
        B: [0, -1, phi],
        C: [phi, 0, 1],
        D: [1, phi, 0],
        E: [-1, phi, 0],
        F: [-phi, 0, 1],
        G: [phi, 0, -1],
        H: [1, -phi, 0],
        I: [-1, -phi, 0],
        J: [-phi, 0, -1],
        K: [0, 1, -phi],
        L: [0, -1, -phi],
    };
    const verticesList = [...'ABCDEFGHIJKL'].map ((a) => vertices[a]);
    const faces = [
        'ABC', 'ACD', 'ADE', 'AEF', 'AFB',
        'CBH', 'DCG', 'EDK', 'FEJ', 'BFI',
        'BIH', 'CHG', 'DGK', 'EKJ', 'FJI',
        'GHL', 'HIL', 'IJL', 'JKL', 'KGL',
    ];

    const r = (face) => face[1] + face[2] + face[0];
    // Normal form of each face
    const normal = {};
    // Find neighboring faces
    const neighbor = {};

    for (const f of faces) for (const rf of [f, r(f), r(r(f))]) {
        normal[rf] = f;
        for (const f2 of faces) for (const rf2 of [f2, r(f2), r(r(f2))]) {
            if (rf2[0] === rf[1] && rf2[1] === rf[0]) {
                // Neighboring faces
                neighbor[rf] = rf2;
            }
        }
    }
    return {vertices, verticesList, faces, normal, neighbor};
}

console.log ('icosa', icosa ());

//// Main

window.onload = (e) => {
    icosahedron = icosa();
    vertices = icosahedron.vertices;
    verticesList = icosahedron.verticesList;
    faces = icosahedron.faces;
    normal = icosahedron.normal;
    neighbor = icosahedron.neighbor;
    meshpoints = genMeshpoints();
    console.log ('meshpoints:', meshpoints);
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
    const v2 = icosa().vertices;
    for (const label of 'ABCDEFGHIJKL') {
        drawPoint (v2[label], 2, 'red');
    }

    // Draw faces, in a certain way
    const faces = icosa().faces;
    for (const f of faces) {
        const a = v2[f[0]], b = v2[f[1]], c = v2[f[2]];
        drawLine (a, b, 100, 'gray');
        drawLine (b, c, 100, 'gray');
        drawLine (c, a, 100, 'gray');
    }

    // Draw meshpoints
    for (const mp of meshpoints) {
        drawPoint(mp.pt, 2, 'gray');

        // Draw neighbors
        console.log (mp);

        const hexagon = hexNeighbors (mp.def, new Eulerian (4, -2));
        const plotted = hexagon.map ((vertex) => defToPos (vertex, vertices));

        for (let i = 0; i < 6; i++) {
            drawLine (
                plotted[i],
                plotted[(i+1)%6],
                10, 'gray',
            );
        }
    }
}

// Draws an equilateral triangle on an Eisenstein (Eulerian) grid.
function genTriangleMesh (strideA, strideB) {
    const side1A = strideA, side1B = -strideB;
    // (a - bw) (1 + 1w) = a + (a-b)w - bw^2 = (a+b) + aw
    const side2A = strideA + strideB, side2B = strideA;
    const side1 = [side1A, side1B, 1];
    const side2 = [side2A, side2B, 1];

    const minA = Math.min (0, side1A, side2A);
    const maxA = Math.max (0, side1A, side2A);
    const minB = Math.min (0, side1B, side2B);
    const maxB = Math.max (0, side1B, side2B);

    console.log ('trianglemesh args', side1A, side1B, side2A, side2B, minA, maxA, minB, maxB);

    const interiorCoords = [];

    // Create interior points.
    for (let b = minB; b <= maxB; b++) for (let a = minA; a <= maxA; a++) {
        const pt = [a, b, 1];
        const inner =
              det ([0, 0, 1], side1, pt) >= 0 &&
              det ([0, 0, 1], pt, side2) >= 0 &&
              det (pt, side1, side2) >= 0;
        if (inner) {
            interiorCoords.push ({a, b});
            console.log ('interior', a, b);
        }
    }

    return interiorCoords;
}

function genMeshpoints () {
    // For each triangle, cut up into `gran` parts.
    const verts = vertices;

    const meshpoints = [];

    const strideA = 4, strideB = 2;

    const interiorPoints = genTriangleMesh(strideA, strideB);
    const side1 = new Eulerian (strideA, - strideB);

    for (const [i, j, k] of faces) {
        const vi = verts[i], vj = verts[j], vk = verts[k];

        // Find relative position of point in equilateral triangle.
        let closeMatchCount = 0;
        for (const ab of interiorPoints) {
            const pt = new Eulerian (ab.a, ab.b);
            const relPos = pt.div (side1);
            const a = Q.float(relPos.a), b = Q.float(relPos.b);
            const meshpoint = add (
                scale (vi, 1 - a),
                add (
                    scale (vj, a - b),
                    scale (vk, b),
                ),
            );

            const defString = `${i}${j}${k} ${ab.a},${ab.b} ${relPos.a},${relPos.b}`
            const def = [`${i}${j}${k}`, relPos];

            // Seeks close point
            // TODO - replace with EQUIVALENCE, exact distances
            let found = false;
            const epsilon = 1e-8;
            for (const mp of verticesList) {
                if (distance (mp, meshpoint) < epsilon) {
                    found = true; break;
                }
            }
            if (found) continue;

            for (const mp of meshpoints) {
                if (distance (mp.pt, meshpoint) < epsilon) {
                    found = true; break;
                }
            }
            if (found) continue;

            meshpoints.push ({
                pt: meshpoint,
                defString,
                def,
            });
        }

        // Every meshpoint can be recorded as [faceId, u, v] where u, v are rationals,
        //     or as [faceId, a, b] where a, b are integers.
    }

    return meshpoints;
}

/*
  An icosahedral coordinate:
  {face: 'EDK', weights: [1/7, 2/7, 4/7]}
  weights are in rationals.
  This represents the point (1/7) E + (2/7) D + (4/7) K on face EDK.
  By transposition (r), a coordinate has 2 other equivalents.
  By mirroring, a coordinate has 3 other equivalents (and in case of negative coefficients, 1).

  Example, since ABC's mirror face is BAF, the point aA + bB + cC (a + b + c = 1) will be mirrored as...
  F = A + B - C
  C = A + B - F
  aA + bB + cC = aA + bB + c(A+B-F) = (a+c)A + (b+c)B - cF.
  (a+c) + (b+c) + (-c) = a + b + c = 1. Verified.
 */

function coordinateXfer (coords) {
    // Transfers an icosahedral coordinate to a neighboring face; this makes it possible to draw hexagons "across borders".
}

function hexNeighbors (def, side1) {
    // `def` is in format [face, relPos: Eulerian]
    // side1 is Eulerian (strideA, -strideB)

    const [face, relPos] = def;
    const ans = [];

    for (const dir of [
        new Eulerian (1, 0),
        new Eulerian (1, 1),
        new Eulerian (0, 1),
        new Eulerian (-1, 0),
        new Eulerian (-1, -1),
        new Eulerian (0, -1),
    ]) {
        // Neighboring center.
        const neighbor = dir.div (side1);
        // Point on boundary.
        const boundary = neighbor.div (new Eulerian (2, 1));
        const newPos = relPos.add (boundary);
        ans.push ([face, newPos]);
    }
    return ans;
}

// Converts a definition ([face, coords]) to spatial coordinates.
function defToPos (def, vertices) {
    const [face, pos] = def;
    const [i, j, k] = face;

    const a = Q.float(pos.a), b = Q.float(pos.b);
    return add (
        scale (vertices[i], 1 - a),
        add (
            scale (vertices[j], a - b),
            scale (vertices[k], b),
        ),
    );
}