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
        this.heightNoiseMap = Noise.combineNoiseMapsWeighted(this.width, this.height, this.heightNoiseMaps);

        // Multiple rolling mask against heightNoiseMap
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
        this.windNoiseMaps = Noise.generateNoiseMaps(this.random, this.width, this.height, 4);
        this.windNoiseMap = Noise.combineNoiseMapsWeighted(this.width, this.height, this.windNoiseMaps);

        // 2. Define bands where with varying wind values. (Strong-Weak-Strong for this example)
        let bands = this.createBandMap(2);

        // 3. For each cell the value from the band is added to the noise map multiplied by the base noise weight
        let mapLength = this.width * this.height;

        for (let i = 0; i < mapLength; i++) {
            this.windNoiseMap[i] += bands[i] * 0.5;
        }

        // 4. To complete the base map the whole map is normalized between 0.0 and a base weight.
        let largestVal = this.windNoiseMap.reduce((largest, val) => val > largest ? val : largest, 0);
        for (let i = 0; i < mapLength; i++) {
            this.windNoiseMap[i] = this.windNoiseMap[i] / largestVal;
        }

        // 5. A second noise map is created called the continent noise map. (FBM octaves = 5.0 and size = 8.0)
        this.continentNoiseMaps = Noise.generateNoiseMaps(this.random, this.width, this.height, 8);
        this.continentNoiseMap = Noise.combineNoiseMapsWeighted(this.width, this.height, this.continentNoiseMaps);

        // 6. Using the Voronoi operation create a map where every cell has a value equal to its distance to the nearest coast.
        // 7. For each cell I create a weight based on the distance to the coast. If the point is further than the distance threshold the weight is 1.0 if over ocean and 0.0 if over land.
        // 8. This weight is combines the the continent weight and then multiplied by the continent noise and added to the base map.
        // 9. The final map is then normalized.


        // TODO: Update the main map data
    }

    parseElevations(elevations, heightMap) {
        if (!elevations) {
            return null;
        }

        elevations = JSON.parse(JSON.stringify(elevations));
        heightMap = heightMap.slice(0).sort();

        for (let elevation of elevations) {
            elevation.index = Math.ceil(elevation.value * heightMap.length);

            if (elevation.index >= heightMap.length) {
                elevation.index = heightMap.length - 1;
            }

            elevation.value = heightMap[elevation.index];
        }

        return elevations;
    }

    getElevationFromHeight(height) {
        for (let i = this.elevations.length - 1; i >= 0; --i) {
            let elevation = this.elevations[i];

            if (height >= elevation.value) {
                return i;
            }
        }
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
}



module.exports = Map;
