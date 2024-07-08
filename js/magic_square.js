$ = (x) => document.getElementById(x);
C = (x) => document.getElementsByClassName(x);
Q = (x) => document.querySelector(x);
elem = (x) => document.createElement(x);

State = {n: 7, a: 1, b: 1, c: 1, d: 2};

orange = [0xfe, 0x89, 0x00, 0xff];
blue   = [0x00, 0xb3, 0xfb, 0xff];
pink   = [0xff, 0x80, 0x9d, 0xff];
green  = [0x00, 0xc0, 0x6f, 0xff];
white  = [0xff, 0xff, 0xff, 0xff];

function gcd (a, b) {
    if (a < 0) a *= -1;
    if (b < 0) b *= -1;
    if (a < b) {
        const c = a; a = b; b = c;
    }
    let modlimit = a + b + 1;
    while (b > 0 && modlimit >= 0) {
        const rem = a % b;
        a = b; b = rem;
        modlimit --;
    }
    return a;
}

function coprime (a, b) {
    return gcd (a, b) === 1;
}

function lerpColor (from, to, t) {
    const lin = (arr) => arr.map ((a) => (a/255)*(a/255));
    const delin = (arr) => arr.map ((a) => Math.round(Math.sqrt(a)*255));

    const FROM = lin(from);
    const TO = lin(to);
    const OUT = [0,1,2,3].map ((i) => FROM[i] * (1-t) + TO[i]);
    return delin (OUT);
}

function printColor (color) {
    const [r, g, b, a] = color;
    return `rgb(${r} ${g} ${b} / ${a/255*100}%)`;
}

function colorCellWith (cell, number /* -1 to +1 */, colors /* 3 colors */) {
    const [min, med, max] = colors;
    let color = white;
    if (number >= 0) color = lerpColor (med, max, number);
    else color = lerpColor (med, min, -number);
    cell.style.backgroundColor = printColor (color);
    cell.style.color = 'black';  // to ensure the number is visible.
}

function formatLinFn (a, b) {
    // Compute form.
    const ans = [];
    for (const [coeff, varia] of [[a, 'i'], [b, 'j']]) {
        if (coeff === 0) continue;
        if (coeff < 0) {
            if (ans.length === 0) ans.push (coeff, varia);
            else ans.push ('-', -coeff, varia);
        } else {
            if (ans.length === 0) ans.push (coeff, varia);
            else ans.push ('+', coeff, varia);
        }
    }
    if (ans.length === 0) ans.push ('0');
    return ans.join (' ');
}

function main () {
    $('ms-order-down').onclick = () => {
        State.n -= 2;
        if (State.n < 3) State.n = 3;
        render();
    }
    $('ms-order-up').onclick = () => {
        State.n += 2;
        if (State.n > 13) State.n = 13;
        render();
    }
    $('ms-a-down').onclick = () => { State.a = mod (State.a - 1); render(); }
    $('ms-a-up').onclick = () => { State.a = mod (State.a + 1); render(); }
    $('ms-b-down').onclick = () => { State.b = mod (State.b - 1); render(); }
    $('ms-b-up').onclick = () => { State.b = mod (State.b + 1); render(); }
    $('ms-c-down').onclick = () => { State.c = mod (State.c - 1); render(); }
    $('ms-c-up').onclick = () => { State.c = mod (State.c + 1); render(); }
    $('ms-d-down').onclick = () => { State.d = mod (State.d - 1); render(); }
    $('ms-d-up').onclick = () => { State.d = mod (State.d + 1); render(); }

    render();
}

function remainders () {
    const ans = [];
    const n = State.n;
    for (let i = -(n-1)/2; i <= (n-1)/2; i++) ans.push(i);
    return ans;
}

// Finds the number congruent to `val` mod `n`, with the least absolute value.
function mod (val) {
    const bottom = -(State.n-1)/2;
    return ((val - bottom) % State.n + 2 * State.n) % State.n + bottom;
}

function render () {
    const n = State.n, a = State.a, b = State.b, c = State.c, d = State.d;
    for (const elem of C('ms-order')) {
        elem.innerText = n;
    }
    for (const elem of C('ms-order-range')) {
        elem.innerText = '{' + remainders().map((a) => a.toString()).join(', ') + '}';
    }
    for (const elem of C('ms-median')) {
        elem.innerText = (n*n + 1)/2;
    }
    for (const elem of C('ms-max')) {
        elem.innerText = n*n;
    }
    for (const elem of C('ms-a')) {
        elem.innerText = a;
    }
    for (const elem of C('ms-b')) {
        elem.innerText = b;
    }
    for (const elem of C('ms-c')) {
        elem.innerText = c;
    }
    for (const elem of C('ms-d')) {
        elem.innerText = d;
    }
    for (const elem of C('ms-abij')) {
        elem.innerText = formatLinFn (a, b);
    }
    for (const elem of C('ms-cdij')) {
        elem.innerText = formatLinFn (c, d);
    }

    // Tables.
    $('ms-diags-1').innerHTML = '';
    $('ms-diags-1').appendChild (makeGrid (
        (i, j) => mod(i+j),
        (i, j, cell) => {
            colorCellWith (cell, mod (i+j) / ((n-1)/2),
                           [orange, white, blue]);
        },
    ));

    $('ms-diags-2').innerHTML = '';
    $('ms-diags-2').appendChild (makeGrid (
        (i, j) => mod(i-j) * n,
        (i, j, cell) => {
            colorCellWith (cell, mod (i-j) / ((n-1)/2),
                           [pink, white, green]);
        },
    ));

    $('ms-diags-3').innerHTML = '';
    $('ms-diags-3').appendChild (makeGrid (
        (i, j) => mod(i+j) + mod(i-j) * n + (n*n + 1)/2,
    ));

    $('ms-diags-4').innerHTML = '';
    $('ms-diags-4').appendChild (makeGrid (
        (i, j) => mod(i+j) + mod(i-j) * n + (n*n + 1)/2,
        (i, j, cell) => {
            // Determine which cell to start coloring.
            const startI = -(n-1)/2;
            const startJ = startI + 2;
            const useDiag1 = mod((i + j) - (startI + startJ)) === 0;
            const useDiag2 = mod((i - j) - (startI - startJ)) === 0;
            let color = [0, 0, 0, 0];
            if (useDiag1) {
                if (useDiag2) {
                    color = [0xff, 0, 0, 0xff];
                } else {
                    color = orange;
                }
            } else if (useDiag2) {
                color = blue;
            }
            cell.style.backgroundColor = printColor (color);
        }
    ));

    $('ms-diags-5').innerHTML = '';
    const coordMatrix = makeGrid (
        (i, j) => `(${i}, ${j})`,
    );
    coordMatrix.classList.add ('widegrid');
    $('ms-diags-5').appendChild (coordMatrix);

    $('ms-diags-6').innerHTML = '';
    $('ms-diags-6').appendChild (makeGrid (
        (i, j) => mod(a * i + b * j),
        (i, j, cell) => {
            colorCellWith (cell, mod (a*i+b*j) / ((n-1)/2),
                           [orange, white, blue]);
        },
    ));

    // Warn if not coprime
    $('no-good-magic-square').innerHTML = '';

    const goodConstituent1 = coprime (a, n) && coprime (b, n);
    const goodConstituent2 = coprime (c, n) && coprime (d, n);

    if (! goodConstituent1) {
        $('no-coprime-ab').innerText = `In this case, at least one of the two coefficients is not coprime with ${n}; try adjusting the coefficients.`;
        $('no-good-magic-square').innerText = ''
    } else $('no-coprime-ab').innerHTML = '';

    if (! goodConstituent2) {
        $('no-coprime-cd').innerText = `In this case, at least one of the two coefficients is not coprime with ${n}; try adjusting the coefficients.`;
    } else $('no-coprime-cd').innerHTML = '';

    $('ms-diags-7').innerHTML = '';
    $('ms-diags-7').appendChild (makeGrid (
        (i, j) => mod(c * i + d * j) * n,
        (i, j, cell) => {
            colorCellWith (cell, mod (c*i+d*j) / ((n-1)/2),
                           [pink, white, green]);
        },
    ));

    $('ms-diags-8').innerHTML = '';
    $('ms-diags-8').appendChild (makeGrid (
        (i, j) => (
            mod(a * i + b * j) +
            mod(c * i + d * j) * n +
            (n * n + 1) / 2
        ),
    ));

    const linearIndependence = coprime (a * d - b * c, n);
    if (! linearIndependence) {
        $('no-good-magic-square').innerText = `(ad - bc) = ${a*d - b*c} is not coprime with ${n}; adjust one of the matrices above and try again.`;
    } else if (! goodConstituent1 || ! goodConstituent2) {
        $('no-good-magic-square').innerText = `At least one of the two constituent matrices do not satisfy the row/column/diagonal sum conditions; adjust one or both and try again.`;
    } else {
        // Pass!
    }
}

window.onload = main;

function makeGrid (fn, coloring) {
    const table = elem('table');
    for (let i of remainders ()) {
        const row = elem('tr');
        table.appendChild (row);
        for (let j of remainders ()) {
            const cell = elem('td');
            row.appendChild (cell);
            const val = fn(i, j);
            cell.innerText = val;

            if (coloring) { coloring (i, j, cell); }
        }
    }
    return table;
}
