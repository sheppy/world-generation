var SimplexNoise = require("simplex-noise");

function generateNoise(width, height, freq) {
  var noise = [];
  var simplex = new SimplexNoise(Math.random);

  for (var y = 0; y < height; y++) {
    noise[y] = [];
    for (var x = 0; x < width; x++) {
      noise[y][x] = simplex.noise2D(x / freq * 2, y / freq * 2) * 0.5 + 0.5; // 0.5 > convert to 0-1 range
    }
  }

  return noise;
}

function renderMapToCtx(width, height, noise, ctx) {
  var imgData = ctx.getImageData(0, 0, width, height);
  var data = imgData.data;

  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      var i = (width * y + x) * 4;
      var c = noise[y][x] * 255;

      data[i] = c;
      data[i + 1] = c;
      data[i + 2] = c;
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

function combineMapsWeighted(width, height, maps) {
  var map = [];

  for (var y = 0; y < height; y++) {
    map[y] = [];
    for (var x = 0; x < width; x++) {
      map[y][x] = maps.reduce(function(val, map) {
        return val + (map.map[y][x] * map.weight);
      }, 0);
    }
  }

  var largestVal = maps.reduce(function(val, map) {
    return val + map.weight;
  }, 0);

  // TODO: Normalise the values
  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      map[y][x] = map[y][x] / largestVal;
    }
  }

  // for (var i = 0; i < maps.length; i++) {
  //   largestWeight = Math.max(weight, maps[i].weight);
  // }

  return map;
}
// array[width * row + col] = value;


var WIDTH = 320;
var HEIGHT = 240;


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
