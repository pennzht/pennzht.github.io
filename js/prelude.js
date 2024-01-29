// Bach's Prelude in C Major

const score = {
    main:
    `c e g c+ e+ / c d a d+ f+ / b- d g d+ f+ / c e g c+ e+ /
     c e a e+ a+ / c d f♯ a d+ / b- d g d+ g+ / b- c e g c+ /
     a- c e g c+ / d- a- d f♯ c+ / g- b- d g b / g- b♭- e g c♯+ /
     f- a- d a d+ / f- a♭- d f b / e- g- c g c+ / e- f- a- c f /
     d- f- a- c f / g-- d- g- b- f / c- e- g- c e / c- g- b♭- c e /
     f-- f- a- c e / f♯-- c- a- c e♭ / a♭-- f- b- c d / g-- f- g- b- d /
     g-- e- g- c e / g-- d- g- c f / g-- d- g- b- f / g-- e♭- a- c f♯ /
     g-- e- g- c g / g-- d- g- c f / g-- d- g- b- f / c-- c- g- b♭- e`,

    outro: `c-- c- f- a- c f c a- c a- f- a- f- d- f- d- / c-- b- g b d+ f+ d+ b d+ b g b d f e d`,

    end: `c-- c- e g c+`,
};

function noteToFreq (note) {
    const height = note.split('')
          .map ((ch) => ({'c':-9,'d':-7,'e':-5,'f':-4,'g':-2,'a':0,'b':2,'♯':1,'♭':-1,'+':12,'-':-12,})[ch])
          .reduce ((a, b) => a + b);
    return 440 * 2 ** (height / 12);
}

var ac = null;
var intervalHandle = null;
var players = [];
var currentBeat = 0;
const beatLength = 0.25;  // seconds

function getCommands () {
    const bars = score.main.split ('/').map ((str) => str.trim ().split (' '));
    const notes = [];
    for (var i = 0; i < bars.length; i++) {
        const [v, w, x, y, z] = bars[i];
        notes.push (
            {note: v, start: i*16 + 0, duration: 8},
            {note: w, start: i*16 + 1, duration: 7},
            {note: x, start: i*16 + 2, duration: 1},
            {note: y, start: i*16 + 3, duration: 1},
            {note: z, start: i*16 + 4, duration: 1},
            {note: x, start: i*16 + 5, duration: 1},
            {note: y, start: i*16 + 6, duration: 1},
            {note: z, start: i*16 + 7, duration: 1},
            {note: v, start: i*16 + 8, duration: 8},
            {note: w, start: i*16 + 9, duration: 7},
            {note: x, start: i*16 + 10, duration: 1},
            {note: y, start: i*16 + 11, duration: 1},
            {note: z, start: i*16 + 12, duration: 1},
            {note: x, start: i*16 + 13, duration: 1},
            {note: y, start: i*16 + 14, duration: 1},
            {note: z, start: i*16 + 15, duration: 1},
        );
    }

    // Outro
    const outroBegins = bars.length * 16;
    const outroBars = score.outro.split ('/').map ((str) => str.trim ().split (' '));

    for (var i = 0; i < outroBars.length; i++) {
        const bar = outroBars[i];
        const start = outroBegins + bar.length * i;
        notes.push (
            {note: bar[0], start: start + 0, duration: bar.length},
            {note: bar[1], start: start + 1, duration: bar.length - 1},
        );
        for (var j = 2; j < bar.length; j++) {
            notes.push (
                {note: bar[j], start: start + j, duration: 1},
            );
        }
    }

    const last = outroBegins + 16 * 2;

    for (const note of score.end.split(' ')) {
        notes.push ({note, start: last, duration: 16});
    }

    // Compose
    const ans = {};
    for (const n of notes) {
        if (ans[n.start] == null) ans[n.start] = [];
        ans[n.start].push ({
            frequency: noteToFreq (n.note),
            duration: n.duration,
        });
    }
    return ans;
}

function preludePlay () {
    if (ac) return false;
    ac = new window.AudioContext ();
    const allCommands = getCommands ();
    currentBeat = 0;
    intervalHandle = setInterval (
        () => {
            const commands = allCommands[currentBeat] ?? [];
            for (const cmd of commands) {
                const player = new Player (ac, {frequency: cmd.frequency, duration: cmd.duration * beatLength});
            }
            currentBeat ++;
        },
        beatLength * 1000,
    );
    return true;
}

function preludeStop () {
    if (ac) {
        ac.close ();
        clearInterval (intervalHandle);
        ac = null;
    }
}

class Player {
    constructor (ac, params /* {frequency, duration} */) {
        const now = ac.currentTime;

        this.osc = ac.createOscillator ();
        this.osc.type = 'sine';
        this.osc.frequency.setValueAtTime (params.frequency, now);

        this.gain = ac.createGain ();
        this.gain.gain.setValueAtTime (0.0, now);
        this.gain.gain.linearRampToValueAtTime (0.3, now + 0.03);
        this.gain.gain.linearRampToValueAtTime (0.2, now + 0.05);
        this.gain.gain.linearRampToValueAtTime (0.2, now + params.duration - 0.05);
        this.gain.gain.linearRampToValueAtTime (0, now + params.duration);

        this.osc.connect (this.gain);
        this.gain.connect (ac.destination);
        this.osc.start ();
        this.osc.stop (now + params.duration);
    }
}
