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

        this.generateHeightMap(options.noiseMapCount);
        this.elevations = this.parseElevations(options.elevations, this.heightMap);
        this.data = this.generateMapData(this.heightMap);
    }

    generateMapData(heightMap) {
        let data = [];

        for (let i = 0, j = this.width * this.height; i < j; i++) {
            data[i] = {};
            data[i].height = heightMap[i];
            data[i].elevation = this.getElevationFromHeight(data[i].height);
        }

        return data;
    }

    generateRollingMask() {
        let iterations = (Math.ceil(this.width * this.height) / 1000) * 1000;
        let life = (Math.floor(this.width * this.height) / 500) * 10;
        return Noise.generateRollingMap(this.random, this.width, this.height, iterations, life);
    }

    generateHeightMap(noiseMapCount) {
        // Generate rolling particle mask
        this.heightRollingMask = this.generateRollingMask();
        this.heightNoiseMaps = Noise.generateNoiseMaps(this.random, this.width, this.height, noiseMapCount);
        this.heightNoiseMap = Noise.combineNoiseMapsWeighted(this.width, this.height, this.heightNoiseMaps);

        // Multiple rolling mask against heightNoiseMap
        this.heightMap = this.heightNoiseMap.map((val, n) => val * this.heightRollingMask[n]);
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
}


module.exports = Map;
