"use strict";

var Colour = require("./Colour");
var Util = require("./Util");


class Graphics {
    static createCanvas(width, height) {
        let canvas = document.createElement("canvas");
        document.body.appendChild(canvas);
        canvas.width = width;
        canvas.height = height;
        return canvas.getContext("2d");
    }

    static renderAlphaMap(ctx, alphaMap, width, height) {
        let mapLength = width * height;
        let imgData = ctx.createImageData(width, height);
        let data = imgData.data;

        for (let i = 0; i < mapLength; i++) {
            let grey = alphaMap[i] * 255;
            Graphics.renderPixel(data, i * 4, [grey, grey, grey]);
        }

        ctx.putImageData(imgData, 0, 0);
    }

    static renderColourMap(ctx, colourMap, width, height) {
        let mapLength = width * height;
        let imgData = ctx.createImageData(width, height);
        let data = imgData.data;

        for (let i = 0; i < mapLength; i++) {
            Graphics.renderPixel(data, i * 4, colourMap[i].color);
        }

        ctx.putImageData(imgData, 0, 0);
    }

    static renderHeightMapData(ctx, map, isFlat) {
        let imgData = ctx.createImageData(map.width, map.height);
        let data = imgData.data;

        for (let i = 0; i < map.data.length; i++) {
            let color;
            if (isFlat) {
                color = map.elevations[map.data[i].elevation].color;
            } else {
                let elevation = map.elevations[map.data[i].elevation];
                let next = map.elevations[map.data[i].elevation + 1] || elevation;
                color = Colour.colorGradient(map.data[i].height, elevation, next);
            }

            Graphics.renderPixel(data, i * 4, color);
        }

        ctx.putImageData(imgData, 0, 0);
    }

    static renderPixel(data, d, color, alpha) {
        alpha = alpha || 255;
        data[d] = color[0];
        data[d + 1] = color[1];
        data[d + 2] = color[2];
        data[d + 3] = alpha;
    }

    static renderWaterLevel(ctx, map, width, height) {
        let heightMap = map.heightMap;
        let mapLength = width * height;
        let imgData = ctx.createImageData(width, height);
        let data = imgData.data;

        // Clear it to black
        for (let i = 0; i < mapLength; i++) {
            Graphics.renderPixel(data, i * 4, [0, 0, 0]);
        }

        let depth = height;

        for (let x = 0; x < width; x++) {
            for (let z = 0; z < depth; z++) {
                let h = z  / depth;
                let g = 0;
                for (let y = 0; y < height; y++) {
                    let i = Util.xYToIndex(x, y, width);
                    if (heightMap[i] >= h) {
                        g++;
                    }
                }

                let grey = (g / height) * 255;
                let j = Util.xYToIndex(x, height-z, width);
                Graphics.renderPixel(data, j * 4, [grey, grey, grey]);
            }
        }

        // Draw sea level!
        for (let x = 0; x < width; x++) {
            let y = height - Math.floor(map.seaLevel * height);
            let i = Util.xYToIndex(x, y, width);
            Graphics.renderPixel(data, i * 4, [255, 0, 255]);
        }

        // Draw elevations
        for (let elevation of map.elevations) {
            for (let x = 0; x < width; x++) {
                let y = height - Math.floor(elevation.value * height);
                let i = Util.xYToIndex(x, y, width);
                Graphics.renderPixel(data, i * 4, elevation.color);
            }
        }

        ctx.putImageData(imgData, 0, 0);
    }
}

module.exports = Graphics;
