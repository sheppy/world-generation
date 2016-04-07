"use strict";

var Alea = require("alea");
var Noise = require("./Noise");


class Map {
    generate(options = {}) {
        this.seed = options.seed || Date.now();
        this.random = new Alea(this.seed);
        this.width = options.width || 320;
        this.height = options.height || 240;
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

    generateHeightMap(noiseMapCount) {
        noiseMapCount = noiseMapCount || 7;

        // Generate rolling particle mask
        let iterations = (Math.ceil(this.width * this.height) / 1000) * 1000;
        let life = (Math.floor(this.width * this.height) / 500) * 10;
        let baseMap = Noise.generateRollingMap(this.random, this.width, this.height, iterations, life);
        // return baseMap;

        let noiseMaps = Noise.generateNoiseMaps(this.random, this.width, this.height, noiseMapCount);
        let heightMap = Noise.combineNoiseMapsWeighted(this.width, this.height, noiseMaps);

        // TODO: Multiple base map against heightMap
        return heightMap.map((val, n) => val * baseMap[n]);
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
                color = this.elevationGradient(height, elevation, next);
            } else {
                color = elevation.color;
            }
        }

        return color;
    }

    render(ctx) {
        // TODO: Remove clear and use createImageData?
        ctx.clearRect(0, 0, this.width, this.height);
        let imgData = ctx.getImageData(0, 0, this.width, this.height);
        let data = imgData.data;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let i = this.width * y + x;
                this.setPixelColor(data, i * 4, this.data[i].color);
            }
        }

        ctx.putImageData(imgData, 0, 0);
    }

    setPixelColor(data, d, color) {
        data[d + 3] = 255;
        data[d] = color[0];
        data[d + 1] = color[1];
        data[d + 2] = color[2];
    }

    // Mix two colors according to the given proportion
    elevationGradient(value, from, to) {
        if (from === to) {
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


module.exports = Map;
