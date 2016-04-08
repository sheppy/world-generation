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
        this.colorRender = options.colorRender;
        this.gradientRender = options.gradientRender;

        let heightMap = this.generateHeightMap(options.noiseMapCount);
        this.elevations = this.parseElevations(options.elevations, heightMap);
        this.data = this.generateMapData(heightMap);
    }

    generateMapData(heightMap) {
        let data = [];

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let i = this.width * y + x;
                data[i] = {};
                data[i].height = heightMap[i];
                data[i].elevation = this.getElevationFromHeight(data[i].height);
                data[i].color = this.getColorFromElevation(data[i].height, data[i].elevation);
            }
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
        let heightRollingMask = this.generateRollingMask();
        let heightNoiseMaps = Noise.generateNoiseMaps(this.random, this.width, this.height, noiseMapCount);
        let heightNoiseMap = Noise.combineNoiseMapsWeighted(this.width, this.height, heightNoiseMaps);

        // Multiple rolling mask against heightNOiseMap
        let heightMap = heightNoiseMap.map((val, n) => val * heightRollingMask[n]);

        return heightMap;
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

    getColorFromElevation(height, i) {
        let elevation = this.elevations[i];
        let color = elevation.color;

        if (height >= elevation.value) {
            if (!this.colorRender) {
                let grey = height * 255;
                color = [grey, grey, grey];
            } else if (this.gradientRender) {
                let next = this.elevations[i + 1] || elevation;
                color = Colour.colorGradient(height, elevation, next);
            } else {
                color = elevation.color;
            }
        }

        return color;
    }
}


module.exports = Map;
