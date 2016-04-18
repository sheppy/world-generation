"use strict";

var Alea = require("alea");
var Util = require("./Util");
var Noise = require("./Noise");
var Colour = require("./Colour");
var FloodFill = require("./FloodFill");


class Map {
    generate(options = {}) {
        this.seed = options.seed || Date.now();
        this.random = new Alea(this.seed);
        this.width = options.width;
        this.height = options.height;
        this.size = this.width * this.height;

        this.percentLand = options.percentLand || 0.6;
        this.windNoiseSize = options.windNoiseSize || 3;
        this.windContinentNoiseSize = options.windContinentNoiseSize || 8;
        this.windBandWeight = options.windBandWeight || 0.8;
        this.windContinentWeight = options.windContinentWeight || 0.3;
        this.minContinentSize = Math.round(Math.sqrt(this.size) * 0.25);

        console.time("Map.generate()");
        this.initMapData();

        this.generateHeightMap(options.noiseMapCount, options.elevations);
        this.generateWindMap();
        this.generateContinentMap();
        console.timeEnd("Map.generate()");
        // 810-840
        // 596-630
    }

    initMapData() {
        this.data = [];

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let i = Util.xYToIndex(x, y, this.width);
                this.data[i] = {};
                this.data[i].x = x;
                this.data[i].y = y;
            }
        }
    }

    generateRollingMask() {
        let iterations = Math.ceil(this.size / 1000) * 2000;
        let life = Math.floor(this.size / 500) * 2;
        console.info(`Generating rolling mask with ${iterations} iterations and ${life} life`);
        return Noise.generateRollingMap(this.random, this.width, this.height, iterations, life);
    }

    generateHeightMap(noiseMapCount, elevations) {
        this.heightNoiseMaps = Noise.generateNoiseMaps(this.random, this.width, this.height, noiseMapCount);
        this.heightNoiseMap = Noise.combineNoiseMapsWeighted(this.width, this.height, this.heightNoiseMaps, 2);

        // Re-normalize so that 0 and 1 are lowest and highest
        let smallestVal = Math.min.apply(Math, this.heightNoiseMap);
        let largestVal = Math.max.apply(Math, this.heightNoiseMap);

        // TODO: Idea: Apply sea level to the noise map! And re-normalize?
        // let sortedHeightNoiseMap = this.heightNoiseMap.slice(0).sort();
        // let seaLevel = sortedHeightNoiseMap[sortedHeightNoiseMap.length - Math.floor(this.percentLand * sortedHeightNoiseMap.length)];
        // smallestVal = seaLevel// + 0.1;

        console.info(`Normalising heightNoiseMap between ${smallestVal} and ${largestVal}`);
        for (let i = 0; i < this.size; i++) {
            this.heightNoiseMap[i] = (this.heightNoiseMap[i] - smallestVal) / (largestVal - smallestVal);
        }

        // Depends if you need a centered map island
        this.heightRollingMask = this.generateRollingMask();
        this.heightMap = this.heightNoiseMap.map((val, n) => val * this.heightRollingMask[n]);

        // Re-normalize so that 0 and 1 are lowest and highest
        smallestVal = Math.min.apply(Math, this.heightMap);
        largestVal = Math.max.apply(Math, this.heightMap);

        console.info(`Normalising heightMap between ${smallestVal} and ${largestVal}`);
        for (let i = 0; i < this.size; i++) {
            this.heightMap[i] = (this.heightMap[i] - smallestVal) / (largestVal - smallestVal);
        }


        this.elevations = this.parseElevations(elevations, this.heightMap);

        // Update the main map data
        for (let i = 0; i < this.size; i++) {
            this.data[i].height = this.heightMap[i];
            this.data[i].elevation = this.getElevationFromHeight(this.data[i].height);
        }
    }

    generateContinentMap() {
        this.continentLandMassMap = [];

        // TODO: Get sea elevation value
        let seaIndex = this.elevations.findIndex((ele) => ele.value > this.seaLevel);
        console.log("seaIndex", seaIndex);
        seaIndex = 1;
        let landElevation = this.elevations[seaIndex + 1];

        for (let i = 0; i < this.size; i++) {
            this.continentLandMassMap[i] = this.heightMap[i] >= landElevation.value ? 1 : 0;
        }

        // Edge detection
        this.continentLandEdgeMap = this.getEdges(this.continentLandMassMap, this.width, this.height);

        // Generate continents with flood fill
        this.continentMap = this.continentLandMassMap.slice(0);

        this.continents = [];

        let initialContinentIndex = 2;  // Start at 2, 0 is taken for sea, 1 is taken for generic land
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let i = Util.xYToIndex(x, y, this.width);

                let oldColor = this.continentMap[i];

                if (oldColor === 1) {
                    let filledPoints = FloodFill.fill(this.continentMap, this.width, this.height, x, y, initialContinentIndex, oldColor);
                    if (filledPoints.length) {
                        let continent = {
                            index: initialContinentIndex,
                            points: filledPoints,
                            size: filledPoints.length
                        };

                        // Find the box edges of the continent
                        continent.rect = Util.pointsToRect(continent.points, this.width, this.height);

                        // Find the center of the continent
                        continent.center = Util.getCenterOfRect(continent.rect);

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
                }, { dist: this.size, index: -1 });

                // Combine with closest continent
                if (closest.index !== -1) {
                    let newContinent = this.continents[closest.index];
                    newContinent.points = newContinent.points.concat(continent.points);
                    newContinent.size += continent.points.length;

                    // TODO: Re-calculate dimensions & center?
                    // newContinent.rect = Util.pointsToRect(newContinent.points, this.width, this.height);
                    //
                    // // Find the center of the continent
                    // newContinent.center = Util.getCenterOfRect(newContinent.rect);
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
            let color = colours[n];
            let continent = this.continents[n];
            continent.index = n;

            FloodFill.fillRegion(this.continentMap, this.width, this.height, continent.points, { color });
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
        for (let i = 0; i < this.size; i++) {
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
        for (let i = 0; i < this.size; i++) {
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

        this.floorLevel = heightMap[0];
        this.skyLevel = heightMap[heightMap.length - 1];
        this.seaLevel = heightMap[heightMap.length - Math.floor(this.percentLand * heightMap.length)];

        console.info(`Setting sky level to ${this.skyLevel}`);
        console.info(`Setting sea level to ${this.seaLevel} for ${this.percentLand * 100}% landmass`);
        console.info(`Setting floor level to ${this.floorLevel}`);


        for (let elevation of elevations) {
            let value;

            if (elevation.hasOwnProperty("seaLevel")) {
                value = this.seaLevel + (this.seaLevel * (elevation.seaLevel / 255));
            } else if (elevation.hasOwnProperty("skyLevel")) {
                value = this.skyLevel + (this.skyLevel * (elevation.skyLevel / 255));
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

            console.info(`Setting elevation ${elevation.name} level to ${elevation.value}`);
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
                let i = Util.xYToIndex(x, y, this.width);
                bands[i] = val;
            }
        }

        return bands;
    }

    normalize(arr) {
        let largestVal = Math.max.apply(Math, arr);
        for (let i = 0, j = arr.length; i < j; i++) {
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
                let i = Util.xYToIndex(x, y, width);
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
