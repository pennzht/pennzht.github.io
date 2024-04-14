/*
Colors
    # = foreground
    _ = background
    ^ = gray
    ROYLGCBP = red orange yellow lime green cyan blue purple
*/

class Colormap {
    constructor (height, width, fn) {
        this.height = height; this.width = width;
        this.fn = (i, j) => {
            if (i >= 0 && i < height && j >= 0 && j < width) return fn(i, j);
            return '_';
        };
    }

    static blank (height, width) {
        return new Colormap (height, width, (i, j) => '_');
    }

    static fromGrid (grid) {
        return new Colormap (grid.length, grid[0].length, (i, j) => grid[i][j]);
    }

    color (newColor) {
        return new Colormap (
            this.height,
            this.width,
            (i, j) => {
                const original = this.fn (i, j);
                return original === '_' ? original : newColor;
            },
        );
    }

    flip () {
        return new Colormap (this.height, this.width, (i, j) => this.fn (this.height - 1 - i, this.width - 1 - j));
    }

    toString () {
        return range (0, this.height).map (
            (i) => range (0, this.width).map ((j) => this.fn (i, j)).join ('')
        ).join ('\n');
    }

    toImageData (isDark, scale = 5) {
        const colorTable = {
            '_': [0, 0, 0, 0],  /* transparent */
            '#': isDark ? [255, 255, 255, 255] : [0, 0, 0, 255],
            '^': [127, 127, 127, 255],
            'O': [0xe6, 0x5c, 0x00, 255],
            'B': [0x00, 0x8f, 0xd5, 255],
        };
        const array = new Uint8ClampedArray (
            4 * this.width * this.height * (scale ** 2)
        );
        for (const i of range (0, this.height)) {
            for (const j of range (0, this.width)) {
                const color = colorTable [this.fn (i, j)];
                for (const iSpread of range (0, scale)) {
                    for (const jSpread of range (0, scale)) {
                        const iTrue = i * scale + iSpread;
                        const jTrue = j * scale + jSpread;
                        for (const k of [0, 1, 2, 3]) {
                            array[(iTrue*this.width*scale + jTrue) * 4 + k] = color[k];
                        }
                    }
                }
            }
        }
        return new ImageData (array, this.width * scale, this.height * scale);
    }

    print () { console.log (this.toString()); }

    right (other, gap=null) {
        gap = gap ?? (this.width === 0 || other.width === 0 ? 0 : 1);
        return new Colormap (
            Math.max (this.height, other.height),
            this.width + gap + other.width,
            (i, j) => {
                if (j < this.width) return this.fn (i, j);
                if (j >= this.width + gap) return other.fn (i, j - (this.width + gap));
                return '_';
            },
        );
    }

    down (other, gap=null) {
        gap = gap ?? (this.height === 0 || other.height === 0 ? 0 : 1);
        return new Colormap (
            this.height + gap + other.height,
            Math.max (this.width, other.width),
            (i, j) => {
                if (i < this.height) return this.fn (i, j);
                if (i >= this.height + gap) return other.fn (i - (this.height + gap), j);
                return '_';
            },
        );
    }

    padAllSides (padding=2) {
        return new Colormap (
            this.height + padding * 2, this.width + padding * 2,
            (i, j) => this.fn (i-padding, j-padding),
        );
    }
};

const fontMap = `
____________________________________________________#_#_______________________#_
_##___###__###_#__#_###__###__####_####_####_####__#___#______________________#_
__#_____#____#_#__#_#____#____#__#_#__#_#__#_#__#_#_____#___#_________#___#___#_
__#_____#____#_#__#_#____#_______#_#__#_#__#_#__#_#_____#___#__________#_#___#__
__#__####_####_####_####_####____#_####_####_#__#_#_____#_#####_#####___#____#__
__#__#_______#____#____#_#__#____#_#__#____#_#__#_#_____#___#__________#_#___#__
__#__#_______#____#____#_#__#____#_#__#____#_#__#_#_____#___#_________#___#_#___
__##_###__####____#__###_####____#_####__###_####__#___#____________________#___
____________________________________________________#_#_____________________#___
________________________________________________________________________________
_##__###_###_#_#_###_###_###_###_###_###_##_##_______________#__________________
__#__#_#_#_#_#_#_#_#_#_#_#_#_#_#_#_#_#_#_#___#_______________#__________________
__#____#___#_#_#_#___#_____#_#_#_#_#_#_#_#___#_______________#____#_____________
__#____#___#_#_#_#___#_____#_#_#_#_#_#_#_#___#__#______#_#__#______#____________
__#__###__##_###_###_###___#_###_###_#_#_#___#_###_###__#___#__######___________
__#__#_____#___#___#_#_#___#_#_#___#_#_#_#___#__#______#_#__#______#____________
__#__#_____#___#___#_#_#___#_#_#___#_#_#_#___#_____________#______#_____________
__#__#_#_#_#___#_#_#_#_#___#_#_#_#_#_#_#_#___#_____________#____________________
__##_###_###___#_###_###___#_###_###_###_##_##_____________#____________________
`

function range (a, b) {
    const ans = [];
    for (var i = a; i < b; i++) ans.push (i);
    return ans;
}

function extractSymbols (grid) {
    const height = grid.length, width = grid[0].length;
    const gist = range (0, width).map ((j) => grid.some ((row) => row[j] === '#'));
    const starts = [], stops = [];
    for (const i of range (1, width)) {
        if (!gist[i-1] && gist[i]) starts.push (i);
        else if (gist[i-1] && !gist[i]) stops.push (i);
    }
    return range (0, starts.length)
        .map ((n) => {
            const start = starts[n], stop = stops[n];
            return grid.map ((row) => row.slice (start, stop));
        });
}

function genFont () {
    const lines = fontMap.trim().split('\n');
    const [a1, a2, a3, a4, a5, a6, a7, a8, a9, a0, aO, aC, aA, aS, aM, aD] = extractSymbols (lines.slice (0, 9));
    const [b1, b2, b3, b4, b5, b6, b7, b8, b9, b0, bO, bC, bB, bS, bM, bD, arrow] = extractSymbols (lines.slice (10, 19));
    return {
        a: {1: a1, 2: a2, 3: a3, 4: a4, 5: a5, 6: a6, 7: a7, 8: a8, 9: a9, 0: a0, '(': aO, ')': aC, '+': aA, '-': aS, '*': aM, '/': aD, '>': arrow},
        b: {1: b1, 2: b2, 3: b3, 4: b4, 5: b5, 6: b6, 7: b7, 8: b8, 9: b9, 0: b0, '(': bO, ')': bC, '+': bB, '-': bS, '*': bM, '/': bD, '>': arrow},
    };
}

function flip (character) {
    const reverse = (arr) => {
        return range (0, arr.length).map ((n) => arr[arr.length - 1 - n]).join ('');
    };
    return reverse(character.join('\n')).split('\n');
}

const allFonts = genFont();

const canvas = document.getElementById('ambicanvas');
const c = canvas.getContext('2d');

function typesetExpr (expr, widthLimit, font) {
    var map = Colormap.blank (0, 0);
    var row = Colormap.blank (0, 0);
    for (const _i of range (0, expr.length)) {
        const i = expr.length-1 - _i;
        const ch = expr[i];
        const chmap = Colormap.fromGrid (font[ch]);
        // Attempts to add to row
        if (chmap.right (row).width <= widthLimit) {
            row = chmap.right (row);
        } else {
            const padding = Colormap.blank (1, widthLimit - row.width);
            map = padding.right(row, 0).down (map);
            row = Colormap.blank (0, 0);
        }
    }
    // Finally, add row if there is any
    if (row.width > 0 || row.height > 0) {
        const padding = Colormap.blank (1, widthLimit - row.width);
        map = padding.right(row, 0).down (map);
    }
    return map;
}

function typesetExprOneLine (expr, font) {
    var row = Colormap.blank (0, 0);
    for (const ch of expr) {
        const chmap = Colormap.fromGrid (font[ch]);
        row = row.right(chmap);
    }
    return row;
}

// Paints a bitmap
function typesetBitmapMultiLine (expr, evaL, evaR, font, widthLimit) {
    const arrow = Colormap.fromGrid(font['>']).color('^');
    const bitmapR = arrow.right (typesetExpr (evaR, widthLimit - arrow.width - 1 /*gap*/, font).color('O'));
    const bitmapL = arrow.right (typesetExpr (evaL, widthLimit - arrow.width - 1 /*gap*/, font).color('B'));
    const bitmapExpr = typesetExpr (expr, widthLimit, font);
    return bitmapR.flip().down(bitmapExpr).down(bitmapL);
}

// Paints a bitmap on one line
function typesetBitmapOneLine (expr, evaL, evaR, font, _unused = null) {
    const arrow = Colormap.fromGrid(font['>']).color('^');
    const bitmapR = arrow.right (typesetExprOneLine (evaR, font).color('O'));
    const bitmapL = arrow.right (typesetExprOneLine (evaL, font).color('B'));
    const bitmapExpr = typesetExprOneLine (expr, font);
    return bitmapR.flip().right(bitmapExpr).right(bitmapL);
}

function paint2 (expr, evaL, evaR, fontName, upsideDown, isDark) {
    const widthLimit = 120;
    const oneline = typesetBitmapOneLine (expr, evaL, evaR, allFonts[fontName]);
    const bitmap = oneline.width <= widthLimit ? oneline : typesetBitmapMultiLine (expr, evaL, evaR, allFonts[fontName], widthLimit);
    const finalBitmap = upsideDown ? bitmap.flip () : bitmap;
    const data = finalBitmap.padAllSides ().toImageData (isDark, 1);
    canvas.width = data.width;
    canvas.height = data.height;
    canvas.style.width = '100%';
    canvas.style['max-width'] = data.width * 5 + 'px';
    canvas.style['aspect-ratio'] = `${data.width} / ${data.height}`;
    // canvas.style.height = data.height * 5 + 'px';
    c.clearRect (0, 0, canvas.width, canvas.height);
    c.putImageData (data, 0, 0);
}

