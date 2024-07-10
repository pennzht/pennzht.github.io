// Numbers of the form a + b omega, where omega^3 = 1.
class Eulerian {
    constructor (a, b) { this.a = Q.from(a), this.b = Q.from(b); }
    add (o) {
        return new Eulerian (
            Q.add (this.a, o.a),
            Q.add (this.b, o.b),
        );
    }
    sub (o) {
        return new Eulerian (
            Q.sub (this.a, o.a),
            Q.sub (this.b, o.b),
        )
    }
    mul (o) {
        const ones = Q.mul (this.a, o.a);
        const omegas = Q.add (Q.mul (this.a, o.b), Q.mul (this.b, o.a));
        const omegaSquares = Q.mul (this.b, o.b);
        return new Eulerian (
            Q.sub (ones, omegaSquares),
            Q.sub (omegas, omegaSquares),
        );
    }
    inv () {
        /*
            (a + bw) (a^2 - abw + b^2w^2) = a^3 + b^3w^3 = a^3 + b^3.
        */
        const a = this.a, b = this.b;
        const denom = Q.add(
            Q.mul (a, Q.mul (a, a)),
            Q.mul (b, Q.mul (b, b)),
        );
        return new Eulerian ( // Continue translating this...
            Q.div (Q.sub (Q.mul (a, a), Q.mul (b, b)), denom),
            Q.div (Q.sub (Q.mul (a, Q.mul (Q.from(-1), b)), Q.mul(b, b)), denom),
            // (a * a - b * b) / denom,
            // (- a * b - b * b) / denom,
        );
    }
    div (other) {
        return other.inv().mul(this);
    }
    coord () {
        return [Q.float(this.a), Q.float(this.b)];
    }
    coordProj () {
        return [Q.float(this.a), Q.float(this.b), 1];
    }
    toString () {
        return `E (${this.a}, ${this.b})`
    }
}

const rotate60 = new Eulerian (1, 1);

// class Complex: unused.

