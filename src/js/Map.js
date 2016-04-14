"use strict";

var Alea = require("alea");
var Noise = require("./Noise");
var Colour = require("./Colour");
var FloodFill = require("./FloodFill");


class Map {
    generate(options = {}) {
        this.seed = options.seed || Date.now();
        this.random = new Alea(this.seed);
        this.width = options.width;
        this.height = options.height;

        this.percentLand = options.percentLand || 0.6;
        this.windNoiseSize = options.windNoiseSize || 3;
        this.windContinentNoiseSize = options.windContinentNoiseSize || 8;
        this.windBandWeight = options.windBandWeight || 0.8;
        this.windContinentWeight = options.windContinentWeight || 0.3;
        this.minContinentSize = 6;

        this.initMapData();

        this.generateHeightMap(options.noiseMapCount, options.elevations);
        this.generateWindMap();
        this.generateContinentMap();
    }

    initMapData() {
        this.data = [];

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let i = this.width * y + x;
                this.data[i] = {};
                this.data[i].x = x;
                this.data[i].y = y;
            }
        }
    }

    generateRollingMask() {
        let iterations = (Math.ceil(this.width * this.height) / 1000) * 2000;
        let life = (Math.floor(this.width * this.height) / 500) * 2;
        return Noise.generateRollingMap(this.random, this.width, this.height, iterations, life);
    }

    generateHeightMap(noiseMapCount, elevations) {
        // Generate rolling particle mask
        this.heightRollingMask = this.generateRollingMask();
        this.heightNoiseMaps = Noise.generateNoiseMaps(this.random, this.width, this.height, noiseMapCount);
        this.heightNoiseMap = Noise.combineNoiseMapsWeighted(this.width, this.height, this.heightNoiseMaps, 2);

        // Depends if you need a centered map island
        this.heightMap = this.heightNoiseMap.map((val, n) => val * this.heightRollingMask[n]);
        // this.heightMap = this.heightNoiseMap;

        this.elevations = this.parseElevations(elevations, this.heightNoiseMap);

        // Update the main map data
        for (let i = 0, j = this.width * this.height; i < j; i++) {
            this.data[i].height = this.heightMap[i];
            this.data[i].elevation = this.getElevationFromHeight(this.data[i].height);
        }
    }

    generateContinentMap() {
        let mapLength = this.width * this.height;

        this.continentLandMassMap = [];

        // Get sea elevation value
        let seaIndex = this.elevations.findIndex((ele) => ele.value > this.seaLevel);
        let landElevation = this.elevations[seaIndex + 1];

        for (let i = 0; i < mapLength; i++) {
            this.continentLandMassMap[i] = this.heightMap[i] >= landElevation.value ? 1 : 0;
        }

        // Edge detection
        this.continentLandEdgeMap = this.getEdges(this.continentLandMassMap, this.width, this.height);

        // Generate continents with flood fill
        this.continentMap = this.continentLandMassMap.slice(0);

        this.continents = [];

        let initialContinentIndex = 2;  // Start at 2, 0 is taken for sea - 1 is taken for generic land
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let i = this.width * y + x;

                let oldColor = this.continentMap[i];

                if (oldColor === 1) {
                    let filledPixels = FloodFill.fill(this.continentMap, this.width, this.height, x, y, initialContinentIndex, oldColor);
                    if (filledPixels.length) {
                        let continent = {
                            index: initialContinentIndex,
                            pixels: filledPixels,
                            size: filledPixels.length,
                            top: this.height,
                            bottom: 0,
                            left: this.width,
                            right: 0
                        };

                        // Find the box edges of the continent
                        for (let j = 0; j < continent.pixels.length; j++) {
                            if (continent.pixels[j][0] > continent.right) { continent.right = continent.pixels[j][0]; }
                            if (continent.pixels[j][0] < continent.left) { continent.left = continent.pixels[j][0]; }
                            if (continent.pixels[j][1] > continent.bottom) { continent.bottom = continent.pixels[j][1]; }
                            if (continent.pixels[j][1] < continent.top) { continent.top = continent.pixels[j][1]; }
                        }

                        // Find the center of the continent
                        continent.center = [
                            Math.floor((continent.right - continent.left) / 2) + continent.left,
                            Math.floor((continent.bottom - continent.top) / 2) + continent.top
                        ];

                        this.continents.push(continent);
                        initialContinentIndex += 1;
                    }
                }
            }
        }


        // Limit the size of a continent? If too small find closest continent and make part of that
        for (let i = 0, a = 0, m = this.continents.length; i < m; i++) {
            let continent = this.continents[a];

            if (continent.size < this.minContinentSize) {
                // Find closest continent
                let closest = this.continents.reduce((obj, checkContinent, index) => {
                    if (checkContinent.size < this.minContinentSize) { return obj; }

                    // TODO: Use edges also!?
                    // Get distance to this one
                    let dist = Math.abs(continent.center[0] - checkContinent.center[0]) * Math.abs(continent.center[1] - checkContinent.center[1]);
                    if (dist < obj.dist) {
                        obj.dist = dist;
                        obj.index = index;
                    }

                    return obj;
                }, { dist: mapLength, index: -1 });

                // Combine with closest continent
                if (closest.index !== -1) {
                    let newContinent = this.continents[closest.index];
                    newContinent.pixels = newContinent.pixels.concat(continent.pixels);
                    newContinent.size += continent.pixels.length;

                    // TODO: Re-calculate dimensions & center?
                    // for (let j = 0; j < newContinent.pixels.length; j++) {
                    //     if (newContinent.pixels[j][0] > newContinent.right) { newContinent.right = newContinent.pixels[j][0]; }
                    //     if (newContinent.pixels[j][0] < newContinent.left) { newContinent.left = newContinent.pixels[j][0]; }
                    //     if (newContinent.pixels[j][1] > newContinent.bottom) { newContinent.bottom = newContinent.pixels[j][1]; }
                    //     if (newContinent.pixels[j][1] < newContinent.top) { newContinent.top = newContinent.pixels[j][1]; }
                    // }
                    //
                    // // Find the center of the continent
                    // newContinent.center = [
                    //     Math.floor((newContinent.right - newContinent.left) / 2) + newContinent.left,
                    //     Math.floor((newContinent.bottom - newContinent.top) / 2) + newContinent.top
                    // ];
                }

                // Remove the old continent
                this.continents.splice(a, 1);
            } else {
                a++;
            }
        }

        this.continentMap.fill({ color: [0, 0, 0] });
        let colours = Colour.getNColours(this.continents.length);

        for (let n = 0, m = this.continents.length; n < m; n++) {
            let continent = this.continents[n];
            continent.index = n;
            let color = colours[n];

            FloodFill.fillRegion(this.continentMap, this.width, this.height, continent.pixels, { color });
        }

        // TODO: Update the main map data
    }

    generateWindMap() {
        // 1. Start with a base noise map. (FBM octaves = 5.0 and size = 4.0)
        this.windNoiseMaps = Noise.generateNoiseMaps(this.random, this.width, this.height, this.windNoiseSize);
        this.windNoiseMap = Noise.combineNoiseMapsWeighted(this.width, this.height, this.windNoiseMaps);

        // 2. Define bands where with varying wind values. (Strong-Weak-Strong for this example)
        let bands = this.createBandMap(2);

        // 3. For each cell the value from the band is added to the noise map multiplied by the base noise weight
        let mapLength = this.width * this.height;

        for (let i = 0; i < mapLength; i++) {
            this.windNoiseMap[i] += bands[i] * this.windBandWeight;
        }

        // 4. To complete the base map the whole map is normalized between 0.0 and a base weight.
        this.normalize(this.windNoiseMap);

        // 5. A second noise map is created called the continent noise map. (FBM octaves = 5.0 and size = 8.0)
        this.continentNoiseMaps = Noise.generateNoiseMaps(this.random, this.width, this.height, this.windContinentNoiseSize);
        this.continentNoiseMap = Noise.combineNoiseMapsWeighted(this.width, this.height, this.continentNoiseMaps);

        // 6. Using the Voronoi operation create a map where every cell has a value equal to its distance to the nearest coast.
        // 7. For each cell I create a weight based on the distance to the coast. If the point is further than the distance threshold the weight is 1.0 if over ocean and 0.0 if over land.


        // 8. This weight is combined with the continent weight and then multiplied by the continent noise and added to the base map.
        this.windMap = [];
        for (let i = 0; i < mapLength; i++) {
            this.windMap[i] = this.windNoiseMap[i] + (this.continentNoiseMap[i] * this.windContinentWeight);
        }

        // 9. The final map is then normalized.
        this.normalize(this.windMap);

        // TODO: Update the main map data
    }

    parseElevations(elevations, heightMap) {
        if (!elevations) {
            return null;
        }

        elevations = JSON.parse(JSON.stringify(elevations));
        heightMap = heightMap.slice(0).sort();

        this.percentLand = 0.2;

        this.seaLevel = heightMap[Math.floor(this.percentLand * heightMap.length)];
        this.skyLevel = heightMap[heightMap.length - 1];

        for (let elevation of elevations) {
            let value;

            if (elevation.hasOwnProperty("seaLevel")) {
                value = this.seaLevel + (this.seaLevel * (elevation.seaLevel / 255));
            } else if (elevation.hasOwnProperty("skyLevel")) {
                value = this.skyLevel + (this.skyLevel + (elevation.skyLevel / 255));
            } else {
                value = elevation.level / 255;
            }

            elevation.index = Math.max(0, Math.ceil(value * heightMap.length));

            if (elevation.index >= heightMap.length) {
                elevation.index = heightMap.length - 1;
            }

            if (elevation.hasOwnProperty("seaLevel") || elevation.hasOwnProperty("skyLevel")) {
                elevation.value = heightMap[elevation.index];
            } else {
                elevation.value = value;
            }
        }

        return elevations;
    }

    getElevationFromHeight(height) {
        // for (let i = 0, j = this.elevations.length - 1; i < j; i++) {
        //     let nextElevation = this.elevations[i + 1];
        //     if (height < nextElevation.value) {
        //         return i;
        //     }
        // }
        //
        // return this.elevations.length - 2;

        for (let i = this.elevations.length - 1; i >= 0; --i) {
            if (height >= this.elevations[i].value) {
                return i;
            }
        }

        return 0;
    }

    createBandMap(numBands) {
        let bandHeight = this.height / numBands * 0.5;
        let bands = [];

        for (let y = 0; y < this.height; y++) {
            let bandNo = Math.floor(y / bandHeight);
            let bY = bandNo * bandHeight;
            let val = (y - bY) / bandHeight;
            if (bandNo % 2) {
                val = 1 - val;
            }

            for (let x = 0; x < this.width; x++) {
                let i = this.width * y + x;
                bands[i] = val;
            }
        }

        return bands;
    }

    normalize(arr) {
        let largestVal = arr.reduce((largest, val) => val > largest ? val : largest, 0);
        for (let i = 0; i < arr.length; i++) {
            arr[i] = arr[i] / largestVal;
        }
    }

    getEdges(map, width, height) {
        let edgeMap = [];
        let mapLength = width * height;
        let eh = new Array(mapLength).fill(0);
        let ev = new Array(mapLength).fill(0);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let i = width * y + x;
                let ix = (width * y) + x + 1;
                let iy = (width * (y + 1)) + x;

                let e1 = map[i] ^ map[ix];
                let e2 = map[i] ^ map[iy];

                if (e1) {
                    eh[(map[i] ? i : ix)] = 1;
                }
                if (e2) {
                    ev[(map[i] ? i : iy)] = 1;
                }

                edgeMap[i] = eh[i] | ev[i];
            }
        }

        return edgeMap;
    }
}



module.exports = Map;
