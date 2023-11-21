// Canvas
const c = document.getElementById ('strife-canvas').getContext ('2d');

// Options
const Opts = {
    houses: 4,
    w: 64,
    h: 64,
    colors: [
        [0, 0, 0, 0],              // transparent: lifeless
        [0xCB, 0x00, 0x35, 0xFF],  // house 1: red
        [0xCD, 0xA6, 0x00, 0xFF],  // house 2: yellow
        [0x00, 0xA8, 0x00, 0xFF],  // house 3: green
        [0x00, 0x57, 0xF6, 0xFF],  // houes 4: blue
        [0x4E, 0x4E, 0x4E, 0x4E],  // gray: neutral
    ],
};
Opts.size = Opts.w * Opts.h;
Opts.gray = Opts.houses + 1;

// Helpers
function randomInt (n) {
    return Math.min(n - 1, Math.floor(Math.random () * n));
}

function random (choices) {
    return choices[randomInt (choices.length)];
}

// Random map
function randomMap () {
    return Uint8Array.from ({length: Opts.size}, (value, index) => {
        const live = randomInt(2);
        if (live) {
            return randomInt (Opts.houses) + 1;
        } else { return 0; }
    });
}

// Random split map
function randomSplitMap () {
    return Uint8Array.from ({length: Opts.size}, (value, index) => {
        const live = randomInt(2);
        if (live) {
            const color = Math.floor(index / Opts.size * Opts.houses) + 1;
            return color;
        } else { return 0; }
    });
}

// Turns a map into an ImageData
function imageData (map) {
    const array = Uint8ClampedArray.from (
        {length: map.length * 4},
        (value, index) => Opts.colors[map[Math.floor (index / 4)]] [index % 4],
    );
    return new ImageData (array, Opts.w, Opts.h);
}

// Overlays an image data on top of another one
function overlayImages (topImage, bottomImage, alpha = 0.5) {
    const top = topImage.data, bottom = bottomImage.data;
    const ans = Uint8ClampedArray.from (bottom, (bottomValue, index) => {
        const topValue = top[index];
        const alphaIndex = Math.floor(index / 4) * 4 + 3;
        if (top[alphaIndex] === 0xFF) {
            return topValue;
        } else {
            // Return bottom, but alpha-scaled
            if (index % 4 === 3) {
                return bottomValue * alpha;
            } else {
                return bottomValue;
            }
        }
    });

    return new ImageData (
        ans,
        bottomImage.width, bottomImage.height,
    );
}

// Steps the map for one generation.
function step (map) {
    const neighborShifts = [+1, -1, +Opts.w, -Opts.w, +1+Opts.w, -1-Opts.w, +1-Opts.w, -1+Opts.w];
    return Uint8Array.from (
        map,  // source
        (value, index) => {
            // i = Math.floor (i / Opts.w);
            // j = index % Opts.w;
            const ind = parseInt(index);
            const neighbors = (neighborShifts.map ((shift) => (shift + ind + Opts.size)%Opts.size)
                               .map ((newIndex) => map[newIndex]));
            const tally = Uint8Array.from ({length: Opts.houses + 2}, (v, k) => 0);
            for (const nb of neighbors) { tally[nb] ++; }

            // Number of live neighbors.
            const liveNbs = 8 - tally[0];

            // Decide next move
            if (value > 0 && (liveNbs === 2 || liveNbs === 3)) {
                // Switch if all neighbor have switched
                for (var h = 1; h <= Opts.houses; h++) {
                    if (tally[h] >= liveNbs) { return h; }
                }
                // Otherwise, stay.
                return value;
            }
            if (value === 0 && liveNbs === 3) {
                // Switch if clear majority
                for (var h = 1; h <= Opts.houses; h++) {
                    if (tally[h] >= 2) { return h; }
                }
                // Switch if only one house
                const houseCount = liveNbs - tally[Opts.gray];
                if (houseCount === 1) {
                    for (var h = 1; h <= Opts.houses; h++) {
                        if (tally[h] >= 1) { return h; }
                    }
                }

                // Otherwise, gray.
                return Opts.gray;
            }
            return 0;
        },
    );
}

var map = randomMap ();
var image = imageData (map);

setInterval (
    () => {
        c.putImageData (image, 0, 0);
        map = step (map);
        image = overlayImages (imageData (map), image, 0.5);
    },
    60,  // interval/ms
);

document.getElementById ('strife-restart').onclick = () => {
    map = randomMap();
};
