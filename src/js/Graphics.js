"use strict";

class Graphics {
    static createCanvas(width, height) {
        let canvas = document.createElement("canvas");
        document.body.appendChild(canvas);
        canvas.width = width;
        canvas.height = height;
        return canvas.getContext("2d");
    }

    static renderMapData(ctx, map) {
        let imgData = ctx.createImageData(map.width, map.height);
        let data = imgData.data;

        for (let i = 0; i < map.data.length; i++) {
            let d = i * 4;

            data[d] = map.data[i].color[0];
            data[d + 1] = map.data[i].color[1];
            data[d + 2] = map.data[i].color[2];
            data[d + 3] = 255;
        }

        ctx.putImageData(imgData, 0, 0);
    }

    static setPixelColor(data, d, color) {
        data[d] = color[0];
        data[d + 1] = color[1];
        data[d + 2] = color[2];
        data[d + 3] = 255;
    }
}

module.exports = Graphics;
