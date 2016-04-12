"use strict";

var Alea = require("alea");
var Noise = require("./Noise");
var Colour = require("./Colour");


class Map {
    generate(options = {}) {
        this.seed = options.seed || Date.now();
        this.random = new Alea(this.seed);
        this.width = options.width;
        this.height = options.height;

        this.windNoiseSize = options.windNoiseSize || 3;
        this.windContinentNoiseSize = options.windContinentNoiseSize || 8;
        this.windBandWeight = options.windBandWeight || 0.8;
        this.windContinentWeight = options.windContinentWeight || 0.3;

        this.initMapData();

        this.generateHeightMap(options.noiseMapCount, options.elevations);
        this.generateWindMap();
        this.generateContinentMap();
    }

    initMapData() {
        this.data = [];

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let i = this.width * y + x;
                this.data[i] = {};
                this.data[i].x = x;
                this.data[i].y = y;
            }
        }
    }

    generateRollingMask() {
        let iterations = (Math.ceil(this.width * this.height) / 1000) * 1000;
        let life = (Math.floor(this.width * this.height) / 500) * 10;
        return Noise.generateRollingMap(this.random, this.width, this.height, iterations, life);
    }

    generateHeightMap(noiseMapCount, elevations) {
        // Generate rolling particle mask
        this.heightRollingMask = this.generateRollingMask();
        this.heightNoiseMaps = Noise.generateNoiseMaps(this.random, this.width, this.height, noiseMapCount);
        this.heightNoiseMap = Noise.combineNoiseMapsWeighted(this.width, this.height, this.heightNoiseMaps, 2);

        this.heightMap = this.heightNoiseMap.map((val, n) => val * this.heightRollingMask[n]);

        this.elevations = this.parseElevations(elevations, this.heightMap);

        // Update the main map data
        for (let i = 0, j = this.width * this.height; i < j; i++) {
            this.data[i].height = this.heightMap[i];
            this.data[i].elevation = this.getElevationFromHeight(this.data[i].height);
        }
    }

    generateContinentMap() {
        // TODO: Generate continents with flood fill
        this.continents = [];

        // TODO: Update the main map data
    }

    generateWindMap() {
        // 1. Start with a base noise map. (FBM octaves = 5.0 and size = 4.0)
        this.windNoiseMaps = Noise.generateNoiseMaps(this.random, this.width, this.height, this.windNoiseSize);
        this.windNoiseMap = Noise.combineNoiseMapsWeighted(this.width, this.height, this.windNoiseMaps);

        // 2. Define bands where with varying wind values. (Strong-Weak-Strong for this example)
        let bands = this.createBandMap(2);

        // 3. For each cell the value from the band is added to the noise map multiplied by the base noise weight
        let mapLength = this.width * this.height;

        for (let i = 0; i < mapLength; i++) {
            this.windNoiseMap[i] += bands[i] * this.windBandWeight;
        }

        // 4. To complete the base map the whole map is normalized between 0.0 and a base weight.
        this.normalize(this.windNoiseMap);

        // 5. A second noise map is created called the continent noise map. (FBM octaves = 5.0 and size = 8.0)
        this.continentNoiseMaps = Noise.generateNoiseMaps(this.random, this.width, this.height, this.windContinentNoiseSize);
        this.continentNoiseMap = Noise.combineNoiseMapsWeighted(this.width, this.height, this.continentNoiseMaps);

        // 6. Using the Voronoi operation create a map where every cell has a value equal to its distance to the nearest coast.
        // 7. For each cell I create a weight based on the distance to the coast. If the point is further than the distance threshold the weight is 1.0 if over ocean and 0.0 if over land.


        // 8. This weight is combined with the continent weight and then multiplied by the continent noise and added to the base map.
        this.windMap = [];
        for (let i = 0; i < mapLength; i++) {
            this.windMap[i] = this.windNoiseMap[i] + (this.continentNoiseMap[i] * this.windContinentWeight);
        }

        // 9. The final map is then normalized.
        this.normalize(this.windMap);

        // TODO: Update the main map data
    }

    parseElevations(elevations, heightMap) {
        if (!elevations) {
            return null;
        }

        elevations = JSON.parse(JSON.stringify(elevations));
        heightMap = heightMap.slice(0).sort();

        let seaLevel = heightMap[Math.floor(0.6 * heightMap.length)];
        let skyLevel = heightMap[heightMap.length - 1];


        for (let elevation of elevations) {
            let value;

            if (elevation.hasOwnProperty("seaLevel")) {
                value = seaLevel + (seaLevel * (elevation.seaLevel / 255));
            } else if (elevation.hasOwnProperty("skyLevel")) {
                value = skyLevel + (skyLevel + (elevation.skyLevel / 255));
            } else {
                value = elevation.level / 255;
            }

            elevation.index = Math.max(0, Math.ceil(value * heightMap.length));

            if (elevation.index >= heightMap.length) {
                elevation.index = heightMap.length - 1;
            }

            if (elevation.hasOwnProperty("seaLevel") || elevation.hasOwnProperty("skyLevel")) {
                elevation.value = heightMap[elevation.index];
            } else {
                elevation.value = value;
            }
        }

        return elevations;
    }

    getElevationFromHeight(height) {

        for (let i = 0, j = this.elevations.length - 1; i < j; i++) {
            let nextElevation = this.elevations[i + 1];
            if (height < nextElevation.value) {
                return i;
            }
        }

        return this.elevations.length - 2;


        // for (let i = this.elevations.length - 1; i >= 0; --i) {
        //     let elevation = this.elevations[i];
        //
        //     if (height >= elevation.value) {
        //         return i;
        //     }
        // }
    }

    createBandMap(numBands) {
        let bandHeight = this.height / numBands * 0.5;
        let bands = [];

        for (let y = 0; y < this.height; y++) {
            let bandNo = Math.floor(y / bandHeight);
            let bY = bandNo * bandHeight;
            let val = (y - bY) / bandHeight;
            if (bandNo % 2) {
                val = 1 - val;
            }

            for (let x = 0; x < this.width; x++) {
                let i = this.width * y + x;
                bands[i] = val;
            }
        }

        return bands;
    }

    normalize(arr) {
        let largestVal = arr.reduce((largest, val) => val > largest ? val : largest, 0);
        for (let i = 0; i < arr.length; i++) {
            arr[i] = arr[i] / largestVal;
        }
    }
}



module.exports = Map;
