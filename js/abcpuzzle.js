lights = ['🌟️', '🌨️', '❄️', '🟢️', '🔴️'];

isSuccess = false;

/* The answer key is right here, not encrypted. Please go ahead and enjoy the puzzle instead. :-D */

source = {"codes":[[0,"o","+"],[1,"g","√"],[2,"t","!"],[3,"c","÷"],[4,"a","*"],[5,"e","§"],[6,"m","^"],[7,"s","%"],[8,"l","±"],[9,"d","~"],[10,"b","?"],[11,"f","¶"],[12,"p","»"],[13,"u","&"],[14,"y","="],[15,"n","µ"],[16,"h","∞"],[17,"v",":"],[18,"j","/"],[19,"i","⋄"],[20,"r","#"],[21,"w","°"]],"cipher":[2,16,5," ",10,20,19,1,16,2," ",7,15,0,21," ",19,7," ",11,4,8,8,19,15,1,"\n",4,15,9," ",15,5,21," ",9,20,5,4,6,7," ",4,20,5," ",3,4,8,8,19,15,1,"\n",4,15,9," ",2,16,5," ",4,19,20," ",21,19,2,16," ",7,0,15,1,7," ",19,7," ",4,8,19,17,5,"\n",2,16,0,13,1,16," ",9,19,7,2,4,15,3,5," ",9,19,17,19,9,5,7," ",13,7,"\n",19," ",21,19,7,16," ",14,0,13," ",4," ",18,0,14,0,13,7,"\n",4,15,9," ",16,4,12,12,14," ",102,121,105,115,102,114," ",102,121,105,115,102,114,"-",111,119,117,105,"\n"]};

// initialize source
source.toChar = new Map();
source.toSymbol = new Map();
source.cipherLength = (() => {
    let total = 0;
    for (const x of source.cipher) {
        total += (typeof(x) === typeof(3)) ? 1 : 0;
    }
    return total;
})();
for (const [i, ch, symb] of source.codes) {
    source.toChar.set(i, ch);
    source.toSymbol.set(i, symb);
}

$ = (x) => document.getElementById(x);
q = (x) => document.querySelectorAll(x);
e = (x) => document.createElement(x);

d = $('d');

function forceInt (a) {
    if (typeof(a) === typeof(3)) return a;
    return parseInt(a);
}

function lower (ch) {
    if (ch.charCodeAt(0) >= 'A'.charCodeAt(0) && ch.charCodeAt(0) <= 'Z'.charCodeAt(0)) {
        return [String.fromCharCode(ch.charCodeAt(0) + 32), 2];
    }
    if (ch.charCodeAt(0) >= 'a'.charCodeAt(0) && ch.charCodeAt(0) <= 'z'.charCodeAt(0)) {
        return [ch, 1];
    }
    return [ch, 0];
}

const state = new Map();

const inputs = [];

let row = e('div');
row.setAttribute('class', 'row');

for (const chRaw of source.cipher) {
    if (chRaw === '\n') {
        d.appendChild(row);
        row = e('div');
        row.setAttribute('class', 'row');
        continue;
    }

    let ch = chRaw, type = 'symbol';
    if (typeof (chRaw) === typeof ('a')) {
        ch = chRaw;
    } else if (chRaw >= 100) {
        ch = chRaw - 100;
        type = 'upper';
    } else {
        ch = chRaw;
        type = 'lower';
    }

    const text = e('input');
    const classes = ['letter'];
    text.setAttribute ('type', 'text');
    text.setAttribute ('maxlength', '1');
    const placeholder = type === 'symbol' ? ch : source.toSymbol.get(ch);
    text.setAttribute ('placeholder', placeholder);
    text.dataset.number = ch;
    let index = inputs.length + 0;

    if (type === 'symbol') {
        text.setAttribute ('disabled', '');
        classes.push('hidden');
    } else {
        inputs.push(text);
    }

    if (type === 'upper') {
        classes.push('highlight');
    }

    text.setAttribute('class', classes.join(' '));

    row.appendChild(text);

    text.onfocus = (event) => {
        updateFocus(event.target.dataset.number);
        text.select();
    };

    text.onblur = (event) => {
        updateFocus();
    };

    text.oninput = text.onchange = (event) => {
        const value = event.target.value.toLowerCase();
        const ch = forceInt(event.target.dataset.number);
        for (const [a, b] of [...state.entries()]) {
            if (b === value) {
                state.delete(a);
                break;
            }
        }
        state.set(ch, value);
        updateState();
        inputs[(index + 1 + source.cipherLength * 2) % source.cipherLength].focus();
        inputs[(index + 1 + source.cipherLength * 2) % source.cipherLength].select();
    };
}

row = e('div');
row.setAttribute ('class', 'row');
row.setAttribute ('id', 'remaining');
d.appendChild (row);

function updateState () {
    for (const text of q('input.letter')) {
        const ch = forceInt(text.dataset.number);
        text.value = state.has(ch) ? state.get(ch) : '';
    }

    const left = new Set();
    for (ch of 'abcdefghijklmnopqrstuvwxyz') {
        left.add(ch);
    }
    for (ch of 'kqxz') {
        left.delete(ch);
    }
    for (const [ch, letter] of state.entries()) {
        left.delete(letter);
    }
    $('remaining').innerText = [...left].join(' ');

    // check correctness
    let isSucceeded = source.codes.every ((item) => {
        const [ch, plaintext, _] = item;
        return state.get(ch) === plaintext;
    });
    if (isSucceeded) runSuccess();
}

function updateFocus(focusNumber) {
    for (const t of q('input.letter')) {
        if (t.dataset.number === focusNumber) {
            t.classList.add('same-letter');
        } else {
            t.classList.remove('same-letter');
        }
    }
}

updateState();

function successTick() {
    for (const l of q('div.lights')) {
        const text = [];
        for (let i = 0; i < 30; i++) {
            text.push(lights[Math.floor(Math.random() * 5)]);
        }
        l.innerText = text.join(' ');
    }
}

function runSuccess() {
    if (!isSuccess) {
        isSuccess = true;
        setInterval (successTick, 1000);
        $('remaining').style = 'display:none;';
    }
}

