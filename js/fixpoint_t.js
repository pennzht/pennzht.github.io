// for: /fixpoint-t

$ = (...x) => document.getElementById(...x);
Q = (...x) => document.querySelector(...x);
QQ = (...x) => document.querySelectorAll(...x);

divmod = (a, b) => {
  return [Math.floor(a / b), a % b];
};

Numerals = {
  cardinals: [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
  ],

  decades: [
    '', '',
    'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety',
    'hundred',
  ],

  powers: [
    '', 'thousand', 'million', 'billion', 'trillion', 'quadrillion',
    'quintillion', 'sextillion', 'septillion', 'octillion', 'nonillion',
    'decillion', 'undecillion', 'duodecillion', 'tredecillion', 'quattuordecillion',
    'quindecillion', 'sexdecillion', 'septendecillion', 'octodecillion', 'novemdecillion',
    'vigintillion',
  ],

  suffixes: [
    ['one', 'first'],
    ['two', 'second'],
    ['three', 'third'],
    ['five', 'fifth'],
    ['eight', 'eighth'],
    ['nine', 'ninth'],
    ['twelve', 'twelfth'],
    ['ty', 'tieth'],
  ],

  kiloBreakdown: function(n) {
    let ans = [], next = 0;

    while (n > 0) {
      const [tail, head] = divmod (n, 1000);
      ans.push ([next, head]);
      next++;
      n = tail;
    }

    ans.reverse();
    return ans;
  },

  toBasicName: function(n) {
    // Requires n to be between 0 and 999

    const [h, to] = divmod (n, 100);
    const [t, o] = divmod (to, 10);

    let ans = [];

    if (h > 0) ans.push (this.cardinals[h], 'hundred');
    if (to === 0) {
      ;
    } else if (to < 20) {
      ans.push (this.cardinals[to]);
    } else if (o === 0) {
      ans.push (this.decades[t]);
    } else {
      ans.push (this.decades[t] + '-' + this.cardinals[o]);
    }

    return ans.join(' ').trim();
  },

  toCardinal: function(n) {
    // Requires n to be a natural number (non-negative integer).

    if (n < 20) return this.cardinals[n];

    let parts = this.kiloBreakdown (n);  // list of decreasing [power of 1000, number]

    if (parts.length > this.powers.length) {return 'infinity';}

    parts = parts.filter ((ab) => ab[1] != 0);

    let ans = (parts
               .map ((ab) => this.toBasicName (ab[1]) + ' ' + this.powers[ab[0]])
               .join(' ')
               .trim());

    return ans;
  },

  toOrdinal: function(n) {
    const card = this.toCardinal(n);

    for (const lr of this.suffixes) {
      const l = lr[0], r = lr[1];
      if (card.endsWith(l)) {
        return card.slice(0, card.length - l.length) + r;
      }
    }

    return card + 'th';
  },
};

Div = $('fixpoint_main');

State = {
  index: 0,   // 1-indexed(!) into span
  spans: [],  // array of {symb: char example 'T', after: string example ' ', elem: HTMLElement}

  init: function() {
    this.index = 0;
    this.spans = [];

    Div = $('fixpoint_main');
    Div.innerHTML = '';
    $('predisplay').innerHTML = '';

    $('sequence').innerHTML = '';

    // Initialize spans
    const seed = ['T ', 'i', 's ', 't', 'h', 'e '];
    for (const s of seed) {
      const symb = s[0], after = s.slice(1);
      const elem = document.createElement('span');
      elem.innerText = symb;
      if (symb == 't' || symb == 'T') elem.classList.add('hl-t');
      Div.appendChild(elem);
      const afterElem = document.createElement('span');
      afterElem.innerText = after;
      Div.appendChild(afterElem);
      this.spans.push({symb, after, elem});
    }
  },

  step: function() {
    this.index ++;

    $('predisplay').innerText = `Index: ${this.index}`;

    const current = this.spans[this.index - 1];  // remember, 1-indexed

    const expanding = (current.symb == 't' || current.symb == 'T');

    if (expanding) {
      const ordinal = Numerals.toOrdinal (this.index) + ', ';

      const number = document.createElement('div');
      number.classList.add('hl-inline');
      number.innerText = `${this.index}, `;
      $('sequence').appendChild (number);

      // Separates by letters
      const parts = [];
      for (const ch of [...ordinal]) {
        if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) {
          parts.push(ch);
        } else {
          parts[parts.length - 1] = parts[parts.length - 1] + ch;
        }
      }

      for (const part of parts) {
        const symb = part[0], after = part.slice(1);
        const elem = document.createElement('span');
        elem.innerText = symb;
        Div.appendChild(elem);
        if (symb == 't' || symb == 'T') elem.classList.add('hl-t');
        const afterElem = document.createElement('span');
        afterElem.innerText = after;
        Div.appendChild(afterElem);
        this.spans.push({symb, after, elem});
      }
    }

    // Highlights current step
    current.elem.classList.add ('hl-curr');
    const previous = this.spans[this.index - 2];
    if (previous) {
      previous.elem.classList.remove ('hl-curr');
    }
  },
};

State.init();

$('step1').onclick = () => State.step();
$('step2').onclick = () => State.step();

$('reset1').onclick = () => State.init();
$('reset2').onclick = () => State.init();

document.body.onkeydown = (e) => {
  if (e.key.toLowerCase() == 's') {
    State.step();
  } else if (e.key.toLowerCase() == 'r') {
    State.init();
  }
};
