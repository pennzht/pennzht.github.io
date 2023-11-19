function P (...x) {return console.log (...x);}
function $ (x) {return document.getElementById (x);}

class Queue {
    constructor (arr) {
        this.arr = arr;
        this.head = 0;
    }

    add (elem) {
        this.arr.push (elem);
    }

    get () {
        if (this.head >= this.arr.length) return null;
        const ans = this.arr[this.head];
        this.head ++;
        return ans;
    }

    hasElement () {
        return this.head < this.arr.length;
    }
}

function clamp (min, max, n) { return Math.min (max, Math.max (min, n)); }

function add (a, b) {
    const aa = parseCoord(a), bb = parseCoord(b);
    return fmtCoord([aa[0]+bb[0], aa[1]+bb[1]]);
}

function fmtCoord (a) {
    if (a === null) return null;
    return `${a[0]},${a[1]}`;
}

function parseCoord (n) {
    if (n === null) return null;
    return n.split (',').map ((a) => parseInt(a));
}

function randomNumber (n) {
    return Math.min(n-1, Math.max(0, Math.floor(Math.random () * n)));
}

function randomChoice (arr) {
    return arr[randomNumber (arr.length)];
}

class Snake {
    constructor (params) {
        /* params: width, height, body */
        this.species = 'snake';
        this.height = params.height;
        this.width = params.width;
        this.body = params.body ?? ['0,0', '1,0', '2,0'];  // [coords from tail to head]
        this.svgParent = params.svgParent;
        this.delay = params.delay ?? 20;
        this.showsVisions = params.showsVisions;
        this.showsArrows = params.showsArrows;
        this.speed = params.speed;
        this.ctrls = params.ctrls;  // controls panel
        this.food = new Set();  // set of food locations
        this.visions = [];
    }

    size () {
        return this.body.length;
    }

    head () {
        return this.body[this.body.length - 1];
    }

    map () {
        const ans = {};
        for (var i = -1; i <= this.height; i++) {
            for (var j = -1; j <= this.width; j++) {
                const value = (i == -1 || i == this.height || j == -1 || j == this.width) ? '#' : ' ';
                ans[fmtCoord([i,j])] = value;
            }
        }
        for (var index = 0; index < this.body.length; index ++) ans[this.body[index]] = '@'+index;
        return ans;
    }

    /// Solver begins here.
    possibleMoves (ab) {
        const [a, b] = parseCoord(ab);
        return [['0,-1', '1,0'], ['-1,0', '0,-1'], ['1,0', '0,1'], ['0,1', '-1,0']] [(a % 2) * 2 + b % 2];
    }

    chooseDestination (dests) {
        if (dests.length === 1) return dests[0];

        this.visions = [];

        if (this.food.size === 0) {
            const validDests = dests.filter ((dest) => this.map()[dest] === ' ' || this.map()[dest] === '@0');
            return randomChoice (validDests);
        }

        const map = this.map ();
        const prevMap = new Map(); prevMap.set (this.head(), 'Start');
        const queue = new Queue([this.head()]);
        const timeToReach = new Map(); timeToReach.set(this.head(), 0);

        while (queue.hasElement()) {
            const head = queue.get();
            const moves = this.possibleMoves (head);
            const visions = moves.map ((dir) => add (dir, head));
            const newTime = timeToReach.get(head) + 1;
            for (const v of visions) {
                if (! prevMap.has (v)
                    && (map[v] === ' ' || (map[v] && map[v][0] === '@' && parseInt(map[v].substring(1)) < newTime))) {
                    // a possible next move
                    queue.add (v);
                    prevMap.set (v, head);
                    if (this.showsVisions === 'all') this.visions.push ([head, v]);
                    timeToReach.set (v, newTime);
                    if (this.food.has(v)) {
                        // Found; construct path back
                        var backtracker = v;
                        while (prevMap.has(backtracker) && prevMap.get(backtracker) !== this.head()) {
                            this.visions.push ([backtracker, prevMap.get(backtracker)]);
                            backtracker = prevMap.get(backtracker);
                        }
                        return backtracker;
                    }
                }
            }
        }
    }

    makeMove () {
        const dests = this.possibleMoves (this.head ()).map (
            (dir) => add (dir, this.head ())
        );
        const newHead = this.chooseDestination (dests);

        if (this.food.has (newHead)) {
            this.body.push (newHead);
            this.food.delete (newHead);
        } else {
            this.body = this.body.slice (1).concat ([newHead]);
        }
    }
    /// Solver ends here.

    placeFood () {
        if (this.size () >= this.width * this.length) {/* do not place food */ return;}

        const blankSpaces = this.width * this.height - this.size ();
        const index = randomNumber (blankSpaces);
        const map = this.map ();
        var count = -1;
        for (var i = 0; i < this.height; i++) for (var j = 0; j < this.width; j++) {
            if (map[fmtCoord ([i, j])] == ' ') {
                count ++;
                if (count === index) this.food.add(fmtCoord([i, j]));
            }
        }
    }

    toSvg () {
        const elems = [];
        const hgap = 1/8;  // half-gap

        const background = this.showsArrows ? 'transparent' : '#a5e798';
        elems.push (`<rect id="${this.svgParent}-field" x="${-hgap}" y="${-hgap}" height="${this.height+2*hgap}" width="${this.width+2*hgap}" fill="${background}" />`);

        if (this.showsArrows) {
            const arrowR = ['0,0.05', '0.8,0', '-0.1,0.15', '0.3,-0.2', '-0.3,-0.2', '0.1,0.15', '-0.8,0', '0,0.05'];
            function rotateVector (vector) {
                const [x, y] = vector.split(',').map((c)=>parseFloat(c));
                return `${-y},${x}`;
            }
            const arrowD = arrowR.map (rotateVector);
            const arrowL = arrowD.map (rotateVector);
            const arrowU = arrowL.map (rotateVector);
            function toPath (arrow) {
                return arrow.map ((coord) => 'l ' + coord).join (' ');
            }

            for (var row = 0; row < this.height; row++) {
                for (var col = 0; col < this.width - 1; col++) {
                    var trueCol = (row % 2 === 0) ? col+1 : col;
                    elems.push (`<path d="M ${trueCol+0.5},${row+0.5} ${toPath(row % 2 === 0 ? arrowL : arrowR)}" fill="${row % 2 === 0 ? '#ff3b7a' : '#43b300'}" />`);
                }
            }

            for (var row = 0; row < this.height - 1; row++) {
                for (var col = 0; col < this.width; col++) {
                    var trueRow = (col % 2 === 0) ? row : row+1;
                    elems.push (`<path d="M ${col+0.5},${trueRow+0.5} ${toPath(col % 2 === 0 ? arrowD : arrowU)}" fill="${col % 2 === 0 ? '#d8cc00' : '#0093d8'}" />`);
                }
            }
        }

        for (var i = 0; i < this.size (); i++) {
            // paint pair
            const [a, b] = parseCoord(this.body[i]);
            const [c, d] = parseCoord(i < this.size() - 1 ? this.body[i+1] : this.body[i]);
            const top = Math.min (a, c);
            const bottom = Math.max (a, c);
            const left = Math.min (b, d);
            const right = Math.max (b, d);
            const color = i < this.size() - 1 ? '#007290' : '#00aad5';
            elems.push (`<rect x="${left+hgap}" y="${top+hgap}" height="${bottom-top+1-2*hgap}" width="${right-left+1-2*hgap}" fill="${color}" />`);
        }

        // Food
        if (this.food.size > 0) {
            for (const food of this.food) {
                const [f0, f1] = parseCoord (food);
                // elems.push (`<rect x="${f1+hgap}" y="${f0+hgap}" height="${1-2*hgap}" width="${1-2*hgap}" fill="red" />`);
                elems.push (`<circle cx="${f1+0.5}" cy="${f0+0.5}" r="0.4" fill="red" />`);
            }
        }

        // Visions
        if (this.showsVisions) {
            const visionColor = this.showsArrows ? '#de00f8' : 'white';

            for (const [aa, bb] of this.visions) {
                const a = parseCoord(aa);
                const b = parseCoord(bb);
                elems.push (`<path d="M ${a[1]+0.5} ${a[0]+0.5} L ${b[1]+0.5} ${b[0]+0.5}" fill="transparent" stroke="${visionColor}" stroke-width="0.25" stroke-linecap="round" />`)
            }
        }

        return elems.join ('');  // svg core
    }

    tick (move = true) {
        const svgElement = $(this.svgParent);
        if (move) this.makeMove ();
        svgElement.innerHTML = this.toSvg ();
        svgElement.setAttribute ('viewBox', `-0.5 -0.5 ${this.width+1} ${this.height+1}`);
        svgElement.onmousedown = (event) => this.manualPlaceFood (event, this);
    }

    /// Management functions
    manifest () {
        this.tick ();

        this.bar = 0;
        setInterval (() => {
            this.bar += {0: 0, 1: 6, 2: 30, 3: 120} [this.speed];
            if (this.bar >= 120) {
                this.bar -= 120;
                this.tick ();
            }
        }, this.delay);

        // Add controls
        if (this.ctrls) {
            const ctrlsElement = $(this.ctrls);
            const cls = `class = "${this.ctrls}-cls"`;
            ctrlsElement.innerHTML = `Speed: <input ${cls} type="range" id="${this.ctrls}-speed" min="0" max="3" value="${this.speed}" />` +
                ` Paths:` +
                `<input ${cls} type="radio" id="${this.ctrls}-shownone" name="${this.ctrls}-show" ${this.showsVisions ? "" : "checked"} />` +
                `<label for="${this.ctrls}-shownone">None</label>` +
                `<input ${cls} type="radio" id="${this.ctrls}-showshortest" name="${this.ctrls}-show" ${this.showsVisions === "shortest" ? "checked" : ""} />` +
                `<label for="${this.ctrls}-showshortest">Shortest</label>` +
                `<input ${cls} type="radio" id="${this.ctrls}-showall" name="${this.ctrls}-show" ${this.showsVisions === "all" ? "checked" : ""} />` +
                `<label for="${this.ctrls}-showall">All</label>` +
                `<input ${cls} type="checkbox" id="${this.ctrls}-arrows" ${this.showsArrows ? "checked" : ""} />` +
                `<label for="${this.ctrls}-arrows">Arrows</label> ` +
                `<input type="button" id="${this.ctrls}-reset" value="Reset" />` +
                '';

            for (const element of document.getElementsByClassName (`${this.ctrls}-cls`)) {
                element.oninput = element.onchange = (event) => {
                    // Updates state.
                    this.speed = parseInt ($(this.ctrls+'-speed').value);
                    this.showsVisions = $(this.ctrls+'-showall').checked ? 'all' : $(this.ctrls+'-showshortest').checked ? 'shortest' : null;
                    this.showsArrows = $(this.ctrls+'-arrows').checked;
                    this.tick (/*move=*/ false);
                };
            }

            $(`${this.ctrls}-reset`).onclick = (event) => {
                this.body = ['0,0', '1,0', '2,0'];
                this.visions = [];
                this.food = new Set();
            };
        }
    }

    manualPlaceFood (event, snake) {
        const bounds = $(this.svgParent + '-field').getBoundingClientRect ();
        const x = (event.clientX - bounds.x) / (bounds.right - bounds.x) * snake.width;
        const y = (event.clientY - bounds.y) / (bounds.bottom - bounds.y) * snake.height;
        const nomlocation = clamp (0, snake.height - 1, Math.floor(y)) + ',' + clamp (0, snake.width - 1, Math.floor(x));
        if (snake.map()[nomlocation] === ' ') snake.food.add (nomlocation);
        this.tick (/*move=*/ false);
    }
}

new Snake ({
    width: 12,
    height: 6,
    svgParent: 'svg1',
    ctrls: 'ctrls1',
    speed: 1,
}).manifest ();

new Snake ({
    width: 12,
    height: 6,
    body: ['0,0', '1,0', '2,0', '3,0', '4,0', '5,0'],
    svgParent: 'svg2',
    showsArrows: true,
    ctrls: 'ctrls2',
    speed: 1,
}).manifest ();

new Snake ({
    width: 12,
    height: 6,
    svgParent: 'svg3',
    showsVisions: 'shortest',
    ctrls: 'ctrls3',
    speed: 1,
}).manifest ();

