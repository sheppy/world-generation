import SimplexNoise from "simplex-noise";

function generateNoise(width, height, freq) {
    let noise = [];
    let simplex = new SimplexNoise(Math.random);

    for (let y = 0; y < height; y++) {
        noise[y] = [];
        for (let x = 0; x < width; x++) {
            noise[y][x] = simplex.noise2D(x / freq * 2, y / freq * 2) * 0.5 + 0.5; // 0.5 > convert to 0-1 range
        }
    }

    return noise;
}

function renderMapToCtx(width, height, noise, ctx) {
    let imgData = ctx.getImageData(0, 0, width, height);
    let data = imgData.data;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let i = (width * y + x) * 4;
            let c = noise[y][x] * 255;

            data[i] = c;
            data[i + 1] = c;
            data[i + 2] = c;
            data[i + 3] = 255;
        }
    }

    ctx.putImageData(imgData, 0, 0);
}

function combineMapsWeighted(width, height, maps) {
    let map = [];

    for (let y = 0; y < height; y++) {
        map[y] = [];
        for (let x = 0; x < width; x++) {
            map[y][x] = maps.reduce((val, map) => val + (map.map[y][x] * map.weight) , 0);
        }
    }

    var largestVal = maps.reduce((val, map) => val + map.weight, 0);

    // TODO: Normalise the values
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            map[y][x] = map[y][x] / largestVal;
        }
    }

    return map;
}
// array[width * row + col] = value;


const WIDTH = 320;
const HEIGHT = 240;


var canvas = document.createElement("canvas");
document.body.appendChild(canvas);
canvas.width = WIDTH;
canvas.height = HEIGHT;
var ctx = canvas.getContext("2d");

// console.profile("Processing noise maps");
var map1 = generateNoise(WIDTH, HEIGHT, 512);
var map2 = generateNoise(WIDTH, HEIGHT, 256);
var map3 = generateNoise(WIDTH, HEIGHT, 128);
var map4 = generateNoise(WIDTH, HEIGHT, 64);
var map5 = generateNoise(WIDTH, HEIGHT, 32);
var map6 = generateNoise(WIDTH, HEIGHT, 16);
var map7 = generateNoise(WIDTH, HEIGHT, 8);

var mapCombined = combineMapsWeighted(WIDTH, HEIGHT, [
    { map: map1, weight: 64 },
    { map: map2, weight: 32 },
    { map: map3, weight: 16 },
    { map: map4, weight: 8 },
    { map: map5, weight: 4 },
    { map: map6, weight: 2 },
    { map: map7, weight: 1 }
]);

renderMapToCtx(WIDTH, HEIGHT, mapCombined, ctx);
// console.profileEnd();
