var SimplexNoise = require("simplex-noise");
var Util = require("./Util");


class Noise {

    static getRandomInt(random, min, max) {
        return Math.floor(random() * (max - min + 1)) + min;
    }

    static rollParticle(random, width, height, map, x, y) {
        let iCurrent = Util.xYToIndex(x, y, width);
        let iUp = width * (y - 1) + x;
        let iDown = width * (y + 1) + x;
        let iLeft = width * y + (x - 1);
        let iRight = width * y + (x + 1);

        map[iCurrent] += 1;

        let namAdjacent = 0, adjacents = [];
        if (typeof map[iUp] !== "undefined" && map[iUp] <= map[iCurrent]) {
            adjacents[namAdjacent] = { x: x, y: y - 1 };
            namAdjacent++;
        }
        if (typeof map[iDown] !== "undefined" && map[iDown] <= map[iCurrent]) {
            adjacents[namAdjacent] = { x: x, y: y + 1 };
            namAdjacent++;
        }
        if (typeof map[iLeft] !== "undefined" && map[iLeft] <= map[iCurrent]) {
            adjacents[namAdjacent] = { x: x - 1, y: y };
            namAdjacent++;
        }
        if (typeof map[iRight] !== "undefined" && map[iRight] <= map[iCurrent]) {
            adjacents[namAdjacent] = { x: x + 1, y: y };
            namAdjacent++;
        }

        // No where to roll
        if (!namAdjacent) {
            return false;
        }

        let direction = Math.floor(random() * namAdjacent);
        return adjacents[direction];
    }

    // TODO: Performance, slowest thing
    static generateRollingMap(random, width, height, iterations, startLife) {
        let map = new Array(width * height).fill(0);

        // TODO: Depends on aspect ratio?
        let widthBias = Math.floor(width * 0.1);
        let heightBias = Math.floor(height * 0.2);

        let left = widthBias;
        let right = width - widthBias;
        let top = heightBias;
        let bottom = height - heightBias;

        for (let n = 0; n < iterations; n++) {
            // Pick a random starting point
            let pos = { x: Noise.getRandomInt(random, left, right), y: Noise.getRandomInt(random, top, bottom) };

            for (let i = 0; i < startLife; i++) {
                pos = Noise.rollParticle(random, width, height, map, pos.x, pos.y);
                if (!pos) {
                    break;
                }
            }
        }

        // TODO: Possibly: To absolutely ensure that the islands will not reach the edges,
        //       multiply the outermost tiles by 0.75, and the second outermost tiles by 0.88

        // Normalize the map
        let largestVal = Math.max.apply(Math, map);
        return map.map(val => val / largestVal);
    }

    static generateEdgeGradientMap(width, height) {
        let map = [];

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let x1 = x / width;
                let y1 = y / height;
                let i = Util.xYToIndex(x, y, width);
                map[i] = x1 * (1 - x1) * y1 * (1 - y1);
            }
        }

        return map;
    }

    static generateNoiseMaps(random, width, height, noiseMapCount, minPow = 2) {
        let numNoiseMaps = 0, noiseMaps = [];

        for (let n = noiseMapCount; n > 0; --n) {
            let frequency = Math.pow(2, n + minPow);
            noiseMaps[numNoiseMaps] = Noise.generateNoiseMap(random, width, height, frequency);
            numNoiseMaps++;
        }

        return noiseMaps;
    }

    /*

     lower frequencies make wider hills and higher frequencies make narrower hills.
     Frequency describes the horizontal size of the features;
     amplitude describes the vertical size.
      the valley/hill/mountain maps looked “too random” and I wanted larger areas of valleys or mountains? I was essentially asking for a lower frequency of variation.


     Increasing the frequency means multiplying the input by some factor
     Increasing the amplitude means multiplying the output by some factor
    */
    static generateNoiseMap(random, width, height, frequency) {
        // frequency = 1/64;
        // amplitude = 1;

        let noise = [];
        // let largest = -10000;
        // let smallest = 10000;
        let simplex = new SimplexNoise(random);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let i = Util.xYToIndex(x, y, width);
                let n = simplex.noise2D(x / frequency * 2, y / frequency * 2);
                // let n = simplex.noise2D(x * frequency, y * frequency) * amplitude;


                // if (n > largest) { largest = n; }
                // if (n < smallest) { smallest = n; }

                noise[i] = (n * 0.5 + 0.5); // 0.5 > convert to 0-1 range
                // noise[i] = n;
            }
        }

        // Normalize to 0-1 range
        // for (let i = 0; i < noise.length; i++) {
        //     noise[i] = (noise[i] - smallest) / (largest - smallest);
        // }

        return noise;
    }

    static combineNoiseMapsWeighted(width, height, noiseMaps, roughness) {
        roughness = roughness || 1;
        let combinedMap = [];
        let mapLength = width * height;

        // Create weights
        let weights = [];
        for (let n = noiseMaps.length - 1; n >= 0; --n) {
            weights.push(Math.pow(2, n / roughness));
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

    static filterNoiseSmooth(noise, width, height) {
        let filteredNoise = [];

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let i = Util.xYToIndex(x, y, width);
                let i1 = (width * y) + x + 1;
                let i2 = (width * (y + 1)) + x;
                let i3 = (width * y) + x - 1;
                let i4 = (width * (y - 1)) + x;
                let count = 1;
                let noiseVal = noise[i];

                if (noise[i1] !== undefined) { count++; noiseVal += noise[i1]; }
                if (noise[i2] !== undefined) { count++; noiseVal += noise[i2]; }
                if (noise[i3] !== undefined) { count++; noiseVal += noise[i3]; }
                if (noise[i4] !== undefined) { count++; noiseVal += noise[i4]; }

                filteredNoise[i] = noiseVal / count;
            }
        }

        return filteredNoise;
    }
}


module.exports = Noise;
