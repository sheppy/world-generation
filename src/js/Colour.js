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

        let [lr, lg, lb] = from.color;
        let [hr, hg, hb] = to.color;
        let ratio = (value - from.value) / (to.value - from.value);

        let _ix = 1.0 - ratio;

        let r = parseInt(lr * _ix + hr * ratio, 10);
        let g = parseInt(lg * _ix + hg * ratio, 10);
        let b = parseInt(lb * _ix + hb * ratio, 10);

        return [r, g, b];
    }
}

module.exports = Colour;
