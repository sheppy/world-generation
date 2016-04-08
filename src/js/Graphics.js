"use strict";

var Colour = require("./Colour");

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

    static renderPixel(data, d, color) {
        data[d] = color[0];
        data[d + 1] = color[1];
        data[d + 2] = color[2];
        data[d + 3] = 255;
    }
}

module.exports = Graphics;
