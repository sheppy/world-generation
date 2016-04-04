import dat from "exdat";
import Alea from "alea";
import SimplexNoise from "simplex-noise";


var obj = { x: 5 };
var gui = new dat.GUI();

gui.add(obj, 'x').onChange(function() {
    // obj.x will now have updated value
});

var seed = 123456;

var random = new Alea(seed);

function generateNoise(width, height, freq) {
    let noise = [];
    let simplex = new SimplexNoise(random);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let i = width * y + x;
            let n = simplex.noise2D(x / freq * 2, y / freq * 2);
            noise[i] = (n * 0.5 + 0.5); // 0.5 > convert to 0-1 range
        }
    }

    return noise;
}

function renderMapToCtx(width, height, noise, ctx) {
    let imgData = ctx.getImageData(0, 0, width, height);
    let data = imgData.data;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let i = width * y + x;
            let d = i * 4;
            let a = noise[i] * 255;

            data[d] = a;
            data[d + 1] = a;
            data[d + 2] = a;
            data[d + 3] = 255;
        }
    }

    ctx.putImageData(imgData, 0, 0);
}

function combineMapsWeighted(width, height, maps) {
    let map = [];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let i = width * y + x;
            map[i] = maps.reduce((val, map) => val + (map.map[i] * map.weight) , 0);
        }
    }

    var largestVal = maps.reduce((val, map) => val + map.weight, 0);

    // Normalise the values
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let i = width * y + x;
            map[i] = map[i] / largestVal;
        }
    }

    return map;
}


const WIDTH = 320;
const HEIGHT = 240;


var canvas = document.createElement("canvas");
document.body.appendChild(canvas);
canvas.width = WIDTH;
canvas.height = HEIGHT;
var ctx = canvas.getContext("2d");

// console.profile("Processing noise maps");
// var t0 = performance.now();
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


var elevations = {
    min: 0,
    sea: 0.25,
    hill : 0.65,
    mountain: 1
};









renderMapToCtx(WIDTH, HEIGHT, mapCombined, ctx);
// console.profileEnd();
// var t1 = performance.now();
// console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.");
