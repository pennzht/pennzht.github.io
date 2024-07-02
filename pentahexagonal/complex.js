class Complex {
    constructor (a, b) { this.a = a, this.b = b; }
    add (other) {
        return new Complex (this.a + other.a, this.b + other.b);
    }
    sub (other) {
        return new Complex (this.a - other.a, this.b - other.b);
    }
    mul (other) {
        return new Complex (
            this.a * other.a - this.b * other.b,
            this.a * other.b + this.b * other.a,
        );
    }
    inv () {
        // TODO compute inverse
    }
    toString () {
        return `C (${this.a}, ${this.b})`
    }
}

// Numbers of the form a + b omega, where omega^3 = 1.
class Eulerian {
    constructor (a, b) { this.a = a, this.b = b; }
    add (other) {
        return new Eulerian (this.a + other.a, this.b + other.b);
    }
    sub (other) {
        return new Eulerian (this.a - other.a, this.b - other.b);
    }
    mul (other) {
        const ones = this.a * other.a;
        const omegas = this.a * other.b + this.b * other.a;
        const omegaSquares = this.b * other.b;
        return new Eulerian (
            ones - omegaSquares,
            omegas - omegaSquares,
        );
    }
    inv () {
        /*
            (a + bw) (a^2 - abw + b^2w^2) = a^3 + b^3w^3 = a^3 + b^3.
        */
        const a = this.a, b = this.b;
        const denom = a**3 + b**3;
        return new Eulerian (
            (a * a - b * b) / denom,
            (- a * b - b * b) / denom,
        );
    }
    div (other) {
        return other.inv().mul(this);
    }
    coord () {
        return [this.a, this.b];
    }
    coordProj () {
        return [this.a, this.b, 1];
    }
    toString () {
        return `E (${this.a}, ${this.b})`
    }
}

const rotate60 = new Eulerian (1, 1);
