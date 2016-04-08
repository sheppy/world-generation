var SimplexNoise = require("simplex-noise");


class Noise {

    static getRandomInt(random, min, max) {
        return Math.floor(random() * (max - min + 1)) + min;
    }

    static rollParticle(random, width, height, map, x, y) {
        let iCurrent = width * y + x;
        let iUp = width * (y - 1) + x;
        let iDown = width * (y + 1) + x;
        let iLeft = width * y + (x - 1);
        let iRight = width * y + (x + 1);

        map[iCurrent] += 1;

        let adjacents = [];
        if (typeof map[iUp] !== "undefined" && map[iUp] <= map[iCurrent]) {
            adjacents.push({ x: x, y: y - 1 });
        }
        if (typeof map[iDown] !== "undefined" && map[iDown] <= map[iCurrent]) {
            adjacents.push({ x: x, y: y + 1 });
        }
        if (typeof map[iLeft] !== "undefined" && map[iLeft] <= map[iCurrent]) {
            adjacents.push({ x: x - 1, y: y });
        }
        if (typeof map[iRight] !== "undefined" && map[iRight] <= map[iCurrent]) {
            adjacents.push({ x: x + 1, y: y });
        }

        // No where to roll
        if (!adjacents.length) {
            return false;
        }

        let direction = Math.floor(random() * adjacents.length);
        return adjacents[direction];
    }

    static generateRollingMap(random, width, height, iterations, startLife) {
        let map = new Array(width * height).fill(0);

        let widthBias = Math.floor(width * 0.1);
        let heightBias = Math.floor(height * 0.1);

        let left = widthBias;
        let right = width - widthBias;
        let top = heightBias;
        let bottom = height - heightBias;

        for (let n = 0; n < iterations; n++) {
            // Pick a random starting point
            let pos = { x: Noise.getRandomInt(random, left, right), y: Noise.getRandomInt(random, top, bottom) };

            for (let life = startLife; life > 0; --life) {
                pos = Noise.rollParticle(random, width, height, map, pos.x, pos.y);
                if (!pos) {
                    break;
                }
            }
        }

        // To absolutely ensure that the islands will not reach the edges, I’ve also multiplied the outermost tiles by 0.75, and the second outermost tiles by 0.88

        // Normalize the map
        let largestVal = map.reduce((largest, val) => (val > largest)  ? val : largest, 0);
        return map.map(val => val / largestVal);
    }

    static generateNoiseMaps(random, width, height, noiseMapCount, minPow = 2) {
        let noiseMaps = [];

        for (let n = noiseMapCount; n > 0; --n) {
            let frequency = Math.pow(2, n + minPow);
            let noise = Noise.generateNoiseMap(random, width, height, frequency);
            noiseMaps.push(noise);
        }

        return noiseMaps;
    }

    static generateNoiseMap(random, width, height, frequency) {
        let noise = [];
        let simplex = new SimplexNoise(random);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let i = width * y + x;
                let n = simplex.noise2D(x / frequency * 2, y / frequency * 2);
                noise[i] = (n * 0.5 + 0.5); // 0.5 > convert to 0-1 range
            }
        }

        return noise;
    }

    static combineNoiseMapsWeighted(width, height, noiseMaps) {
        let combinedMap = [];
        let mapLength = width * height;

        // Create weights
        let weights = [];
        for (let n = noiseMaps.length - 1; n >= 0; --n) {
            weights.push(Math.pow(2, n));
        }

        for (let i = 0; i < mapLength; i++) {
            combinedMap[i] = noiseMaps.reduce((val, map, n) => val + (map[i] * weights[n]), 0);
        }

        let largestVal = weights.reduce((val, weight) => val + weight, 0);

        // Normalise the values
        for (let i = 0; i < mapLength; i++) {
            combinedMap[i] = combinedMap[i] / largestVal;
        }

        return combinedMap;
    }
}


module.exports = Noise;
