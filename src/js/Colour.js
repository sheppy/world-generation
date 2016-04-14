"use strict";

class Colour {
    /**
     * Mix two colors according to the given proportion
     *
     * @param {number} value
     * @param {Object} from
     * @param {number} from.value
     * @param {Array} from.color
     * @param {Object} to
     * @param {number} to.value
     * @param {Array} to.color
     * @returns {Array}
     */
    static colorGradient(value, from, to) {
        if (from.value === to.value) {
            return from.color;
        }

        if (value < from.value) {
            value = from.value;
        }

        if (value > to.value) {
            value = to.value;
        }

        let [lr, lg, lb] = from.color;
        let [hr, hg, hb] = to.color;
        let ratio = (value - from.value) / (to.value - from.value);

        let _ix = 1.0 - ratio;

        let r = parseInt(lr * _ix + hr * ratio, 10);
        let g = parseInt(lg * _ix + hg * ratio, 10);
        let b = parseInt(lb * _ix + hb * ratio, 10);

        return [r, g, b];
    }

    static getNColours(n) {
        let colours = [];

        for (let i = 0; i < 360; i += 360 / n) {
            let c = {
                hue: i / 360,
                saturation: (90 + Math.random() * 10) / 100,
                lightness: (50 + Math.random() * 10) / 100
            };

            colours.push(Colour.hslToRgb(c.hue, c.saturation, c.lightness));
        }

        return colours;
    }

    static hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    }

    static hslToRgb(h, s, l) {
        var r, g, b;

        if (s == 0) {
            r = g = b = l; // achromatic
        } else {
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = Colour.hue2rgb(p, q, h + 1 / 3);
            g = Colour.hue2rgb(p, q, h);
            b = Colour.hue2rgb(p, q, h - 1 / 3);
        }

        return [Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255)];
    }
}

module.exports = Colour;
