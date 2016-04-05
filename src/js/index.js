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

function renderMapToCtx(map, ctx) {
    let imgData = ctx.getImageData(0, 0, map.width, map.height);
    let data = imgData.data;

    for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
            let i = map.width * y + x;
            setPixelColor(data, i * 4, map.combined[i], map.elevations);
        }
    }

    ctx.putImageData(imgData, 0, 0);
}

function setPixelColor(data, d, val, elevationData) {
    data[d + 3] = 255;

    if (!elevationData) {
        var grey = val * 255;
        data[d] = grey;
        data[d + 1] = grey;
        data[d + 2] = grey;
        return;
    }

    var color = elevationData.min.color;
    //
    // if (val < elevationData.sea.value) {
    //
    // }
    //
    if (val >= elevationData.sea.value) {
        color = elevationData.sea.color;
    }
    if (val >= elevationData.hill.value) {
        color = elevationData.hill.color;
    }
    if (val >= elevationData.mountain.value) {
        color = elevationData.mountain.color;
    }

    data[d] = color[0];
    data[d + 1] = color[1];
    data[d + 2] = color[2];
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

var map = {};
map.width = WIDTH;
map.height = HEIGHT;

// console.profile("Processing noise maps");
// var t0 = performance.now();
map.noise1 = generateNoise(WIDTH, HEIGHT, 512);
map.noise2 = generateNoise(WIDTH, HEIGHT, 256);
map.noise3 = generateNoise(WIDTH, HEIGHT, 128);
map.noise4 = generateNoise(WIDTH, HEIGHT, 64);
map.noise5 = generateNoise(WIDTH, HEIGHT, 32);
map.noise6 = generateNoise(WIDTH, HEIGHT, 16);
map.noise7 = generateNoise(WIDTH, HEIGHT, 8);

map.combined = combineMapsWeighted(WIDTH, HEIGHT, [
    { map: map.noise1, weight: 64 },
    { map: map.noise2, weight: 32 },
    { map: map.noise3, weight: 16 },
    { map: map.noise4, weight: 8 },
    { map: map.noise5, weight: 4 },
    { map: map.noise6, weight: 2 },
    { map: map.noise7, weight: 1 }
]);


map.elevations = {
    min: {
        value: 0,
        color: [2, 69, 92]
    },
    sea: {
        value: 0.25,
        color: [128, 237, 235]
    },
    hill : {
        value: 0.65,
        color: [65, 69, 28]
    },
    mountain: {
        value: 1,
        color: [226, 227, 218]
    }
};

map.clone = map.combined.slice(0).sort();
map.elevations.min.value = map.clone[0];
map.elevations.sea.value = map.clone[Math.ceil(map.elevations.sea.value * map.clone.length)];
map.elevations.hill.value = map.clone[Math.ceil(map.elevations.hill.value * map.clone.length)];
map.elevations.mountain.value = map.clone[map.clone.length - 1];


renderMapToCtx(map, ctx);
// console.profileEnd();
// var t1 = performance.now();
// console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.");
