/* An experiment to begin with. */

function $(...x) {return document.getElementById(...x);}
function Type(x) {return document.getElementsByName (x);}
function P(...x) {return console.log(...x);}

const flipPairs = ['()', '[]', '{}', '<>', '00', '11', '22', '55', '88', '69', '++', '--', '**', '//', '  '];
const twin = new Map();
for (const a of flipPairs) {
    twin.set (a[0], a[1]);
    twin.set (a[1], a[0]);
}

function centerdivmod (num, mod) {
    const offset = mod >> 1n;
    const b = (num + offset) % mod - offset;
    const a = (num - b) / mod;
    return [a, b];
}

function twinOf (a) {
    return twin.get(a) ?? a;
}

function strictFlip (s) {
    if (s == null) return s;
    const ans = [];
    for (const ch of s) {
        if (! twin.has (ch)) return null;
        ans.push (twinOf(ch));
    }
    ans.reverse();
    return ans.join ('');
}

function eva (expr, useBigint=true) {
    if (expr === null) return null;

    // Replace if using bigint
    if (useBigint) {
        expr = expr.replaceAll (/[0-9]+/g, (integer) => integer + 'n');
    }

    try {
        const fn = Function ('return ' + expr);
        const ans = fn() ?? null;
        return ans;
    } catch (e) {
        if (e instanceof SyntaxError) {
            return null;
        } else if (e instanceof TypeError) {
            // 0()
            return null;
        } else {
            throw new Error (`Unrecognized error ${e}`);
        }
    }
}

// Handling data
const settings = {
    charset: '06891',
    font: 'a',
};

function getNextTry (currentTry) {
    const charSequence = {
        '0689':     {'0': '6', '1': '6', '2': '6', '3': '6', '4': '6', '5': '6', '6': '8', '7': '8', '8': '9', '9': 'X'},
        '06891':    {'0': '1', '1': '6', '2': '6', '3': '6', '4': '6', '5': '6', '6': '8', '7': '8', '8': '9', '9': 'X'},
        '0689125':  {'0': '1', '1': '2', '2': '5', '3': '5', '4': '5', '5': '6', '6': '8', '7': '8', '8': '9', '9': 'X'},
    } [settings.charset];
    var seq = ['0', ...currentTry];
    for (var i = seq.length - 1; i >= 0; i--) {
        seq[i] = charSequence[seq[i]];
        if (seq[i] != 'X') {
            // Good!
            break;
        } else {
            seq[i] = '0';
            // Continue upping
        }
    }
    // Remove first zero
    if (seq[0] == '0') {
        seq[0] = '';
    }
    // Handle last zero
    if (seq[seq.length - 1] == '0') {
        seq[seq.length - 1] = charSequence ['0'];
    }
    return seq.join ('');
}

function isCurrentCharSet (string) {
    return [...string].every ((e) => settings.charset.includes (e));
}

function getExprImmediate (l, r) {
    // Check for exact reverses
    if (strictFlip(l.toString()) == r.toString() && isCurrentCharSet(l.toString())) return l.toString();

    if (l <= r) {
        return fullmap[settings.charset][`${l},${r}`] ?? null;
    } else {
        return strictFlip (fullmap[settings.charset][`${r},${l}`] ?? null);
    }
}

function shrinkZeros (string) {
    return string == '0' ? '' : string;
}

/// Returns an expression with values l, r
function getExpr (l, r, parity /* +-1 */) {
    var expr = getExprImmediate (l, r);
    if (expr == null) {
        var triesLeft = 500;
        var currentTry = '1';
        var bestTry = null;
        var outer = '8888888888888888';
        while (triesLeft > 0) {
            triesLeft --;
            currentTry = getNextTry (currentTry);
            // divmod and so on
            // See if this is good enough
            const [lq, lr] = centerdivmod (l, BigInt(currentTry));
            const [rq, rr] = centerdivmod (r, BigInt(strictFlip(currentTry)));
            const myouter = shrinkZeros (getExprImmediate (lr, rr));
            // P (currentTry, lq, lr, rq, rr, myouter);
            if (myouter != null && myouter.length <= outer.length) {
                bestTry = currentTry;
                outer = myouter;
            }
        }
        const [lq, lr] = centerdivmod (l, BigInt(bestTry));
        const [rq, rr] = centerdivmod (r, BigInt(strictFlip(bestTry)));
        const tail = getExpr (lq, rq, -parity);
        if (outer == '') {
            if (parity > 0) {
                return `${bestTry}*(${tail})`;
            } else {
                return `(${tail})*${bestTry}`;
            }
        } else {
            if (parity > 0) {
                return `${bestTry}*(${tail})+${outer}`;
            } else {
                return `${outer}+(${tail})*${bestTry}`;
            }
        }
    }
    return expr;
}

function getBigInt (n) {
    const inString = n.trim();
    if (n.match (/^[+-]?[0-9]+$/)) {
        return BigInt (n);
    }
    return -1n;
}

// Watches for dark mode

const mediaQueryList = window.matchMedia ('(prefers-color-scheme: dark)');

document.body.onload = $('l').oninput = $('r').oninput = $('cs1').oninput = $('cs2').oninput = $('cs3').oninput = $('cf1').oninput = $('cf2').oninput = $('cflip').oninput = $('lup').onclick = $('ldown').onclick = $('rup').onclick = $('rdown').onclick = $('random').onclick = mediaQueryList.onchange = (e) => {
    const currentMode = mediaQueryList.matches;

    // Update text
    switch (e.target.id) {
    case 'lup':  $('l').value = (BigInt ($('l').value) + 1n).toString(); break;
    case 'ldown':  $('l').value = (BigInt ($('l').value) - 1n).toString(); break;
    case 'rup':  $('r').value = (BigInt ($('r').value) + 1n).toString(); break;
    case 'rdown':  $('r').value = (BigInt ($('r').value) - 1n).toString(); break;
    case 'random':
        const size = 10000;
        $('l').value = BigInt(Math.round((Math.random () * 2 - 1) * size)).toString();
        $('r').value = BigInt(Math.round((Math.random () * 2 - 1) * size)).toString();
        break;
    default: ;
    }

    for (const cs of Type ('charset')) {
        if (cs.checked) {
            settings.charset = cs.getAttribute ('data-charset');
        }
    }

    for (const cs of Type ('font')) {
        if (cs.checked) {
            settings.font = cs.getAttribute ('data-font');
        }
    }

    const l = getBigInt($('l').value);
    const r = getBigInt($('r').value);
    const expr = getExpr (l, r, +1);
    if (expr) {
        $('a1').innerText = expr;
        $('b1').innerText = strictFlip (expr);
        const evaL = eva (expr);
        const evaR = eva (strictFlip (expr));
        $('a2').innerText = evaL;
        $('b2').innerText = evaR;
        paint2 (expr, evaL.toString(), evaR.toString(), settings.font, $('cflip').checked, currentMode);
    }
}

