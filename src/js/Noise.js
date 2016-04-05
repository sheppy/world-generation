var SimplexNoise = require("simplex-noise");


class Noise {
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

        // Create weights
        let weights = [];
        for (let n = noiseMaps.length - 1; n >= 0; --n) {
            weights.push(Math.pow(2, n));
        }

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let i = width * y + x;
                combinedMap[i] = noiseMaps.reduce((val, map, n) => val + (map[i] * weights[n]), 0);
            }
        }

        let largestVal = weights.reduce((val, weight) => val + weight, 0);

        // Normalise the values
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let i = width * y + x;
                combinedMap[i] = combinedMap[i] / largestVal;
            }
        }

        return combinedMap;
    }
}


module.exports = Noise;
