"use strict";

var Alea = require("alea");
var Noise = require("./Noise");


class Map {
    generate(options = {}) {
        this.seed = options.seed || Date.now();
        this.random = new Alea(this.seed);
        this.width = options.width || 320;
        this.height = options.height || 240;
        this.elevations = JSON.parse(JSON.stringify(options.elevations));
        this.gradientRender = options.gradientRender;

        let noiseMaps = Noise.generateNoiseMaps(this.random, this.width, this.height, options.noiseMapCount || 7);

        this.noiseMap = Noise.combineNoiseMapsWeighted(this.width, this.height, noiseMaps);
        this.sortedNoiseMap = this.noiseMap.slice(0).sort();

        this.generateElevations();
    }

    generateElevations() {
        if (!this.elevations) {
            return;
        }

        for (let elevation of this.elevations) {
            elevation.index = Math.ceil(elevation.value * this.sortedNoiseMap.length);

            if (elevation.index >= this.sortedNoiseMap.length) {
                elevation.index = this.sortedNoiseMap.length - 1;
            }

            elevation.value = this.sortedNoiseMap[elevation.index];
        }
    }

    render(ctx) {
        ctx.clearRect(0, 0, this.width, this.height);
        let imgData = ctx.getImageData(0, 0, this.width, this.height);
        let data = imgData.data;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let i = this.width * y + x;
                this.setPixelColor(data, i * 4, this.noiseMap[i]);
            }
        }

        ctx.putImageData(imgData, 0, 0);
    }

    setPixelColor(data, d, val) {
        data[d + 3] = 255;

        if (!this.elevations) {
            let grey = val * 255;
            data[d] = grey;
            data[d + 1] = grey;
            data[d + 2] = grey;
            return;
        }

        let color = this.elevations[0].color;

        for (let i = this.elevations.length - 1; i >= 0; --i) {
            let elevation = this.elevations[i];

            if (val >= elevation.value) {

                if (!this.gradientRender) {
                    color = elevation.color;
                    break;
                }

                let next = this.elevations[i + 1] || elevation;
                color = this.gradient(val, elevation.value, next.value, elevation.color, next.color);
                break;
            }
        }

        data[d] = color[0];
        data[d + 1] = color[1];
        data[d + 2] = color[2];
    }

    // Mix two colors according to the given proportion
    gradient(value, low, high, low_color, high_color) {
        let [lr, lg, lb] = low_color;
        let [hr, hg, hb] = high_color;
        let _range = high - low;
        let _x = (value - low) / _range;

        let r = parseInt(lr + hr * _x, 10);
        let g = parseInt(lg + hg * _x, 10);
        let b = parseInt(lb + hb * _x, 10);

        return [r, g, b];
    }
}


module.exports = Map;
