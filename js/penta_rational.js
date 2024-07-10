// Rational numbers and their computation

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

const unpack = (q) => {
    const [a, b] = q.split('/');
    return [parseInt(a), parseInt(b)];
};
const pack = (ab) => {
    const [a, b] = ab;
    return a.toString() + '/' + b.toString();
};

function fraction (a, b) {
    if (b === 0) return NaN;

    if (b < 0) {a *= -1; b *= -1;}
    const g = gcd (a, b);
    const [ad, bd] = [a/g, b/g];
    return pack ([ad, bd]);
};

const numer = (q) => unpack(q)[0];
const denom = (q) => unpack(q)[1];

const rationalAdd = (a, b) => {
    const [an, ad] = unpack (a);
    const [bn, bd] = unpack (b);
    return fraction (an*bd+bn*ad, ad*bd);
};

const rationalSub = (a, b) => {
    const [an, ad] = unpack (a);
    const [bn, bd] = unpack (b);
    return fraction (an*bd-bn*ad, ad*bd);
};

const rationalMul = (a, b) => {
    const [an, ad] = unpack (a);
    const [bn, bd] = unpack (b);
    return fraction (an*bn, ad*bd);
};

const rationalDiv = (a, b) => {
    const [an, ad] = unpack (a);
    const [bn, bd] = unpack (b);
    return fraction (an*bd, ad*bn);
};

const rationalSign = (a) => {
    const [an, ad] = unpack (a);
    return an * ad > 0 ? +1 : an * ad < 0 ? -1 : 0;
};

const rationalCompare = (a, b) => rationalSign (rationalSub (a, b));

const rationalFrom = (a) => {
    if ((typeof a) === 'string') return a;
    if ((typeof a) === 'number') return fraction (a, 1);
};

const rationalFloat = (a) => {
    const [an, ad] = unpack (a);
    return an/ad;
}

const rationalMin = (...args) => {
    let ans = args[0];
    for (let obj of args) {
        const cmp = rationalCompare (obj, ans);
        if (cmp < 0) ans = obj;
    }
    return ans;
}

const rationalMax = (...args) => {
    let ans = args[0];
    for (let obj of args) {
        const cmp = rationalCompare (obj, ans);
        if (cmp > 0) ans = obj;
    }
    return ans;
}

// Q for rational numbers.
Q = {
    unpack,
    pack,
    numer,
    denom,
    from: rationalFrom,
    add: rationalAdd,
    sub: rationalSub,
    mul: rationalMul,
    div: rationalDiv,
    sign: rationalSign,
    compare: rationalCompare,
    float: rationalFloat,
    min: rationalMin,
    max: rationalMax,
};
