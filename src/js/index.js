import dat from "exdat";
import Map from "./Map"
import Graphics from "./Graphics"


const WIDTH = 145;
const HEIGHT = 79;
// const WIDTH = 290;
// const HEIGHT = 158;
// const WIDTH = 640;
// const HEIGHT = 480;

var ctx = Graphics.createCanvas(WIDTH, HEIGHT);


let settings = {
    seed: 123546,
    smoothness: 7,
    width: WIDTH,
    height: HEIGHT,
    elevations: [
        {
            name: "deepSea",
            level: -41,
            color: [48, 96, 130]
        },
        {
            name: "sea",
            seaLevel: -40,
            color: [99, 155, 255]
        },
        {
            name: "beach",
            seaLevel: 15,
            color: [251, 242, 54]
        },
        {
            name: "plain",
            seaLevel: 35,
            color: [106, 190, 48]
        },
        {
            name: "forest",
            seaLevel: 205,
            color: [75, 105, 47]
        },
        {
            name: "hill",
            // value: 0.8,
            // level: 205,
            skyLevel: -10,
            color: [138, 111, 48]
            // color: [0, 255, 255]
        },
        {
            name: "mountain",
            // value: 1,
            // level: 230,
            skyLevel: -1,
            color: [255, 255, 255]
        }
    ],

    percentLand: 0.6,
    seaLevel: 0.35,
    terrainType: 1,

    // Rendering debugging
    // renderMode: "continentMap"
    renderMode: "heightRollingMask"
    // renderMode: "data"
};

let renderModes = [
    "data",
    "dataFlat",
    "heightMap",
    "heightRollingMask",
    "heightNoiseMap",
    "windNoiseMap",
    "windMap",
    "continentNoiseMap",
    "continentLandMassMap",
    "continentLandEdgeMap",
    "continentMap",
    "waterLevel"
];

let m = new Map();
update();

function update() {
    m.generate(settings);
    render();
}

function render() {
    switch (settings.renderMode) {
        case "heightNoiseMap":          Graphics.renderAlphaMap(ctx, m.heightNoiseMap, WIDTH, HEIGHT); break;
        case "heightRollingMask":       Graphics.renderAlphaMap(ctx, m.heightRollingMask, WIDTH, HEIGHT); break;
        case "heightMap":               Graphics.renderAlphaMap(ctx, m.heightMap, WIDTH, HEIGHT); break;
        case "windNoiseMap":            Graphics.renderAlphaMap(ctx, m.windNoiseMap, WIDTH, HEIGHT); break;
        case "continentNoiseMap":       Graphics.renderAlphaMap(ctx, m.continentNoiseMap, WIDTH, HEIGHT); break;
        case "windMap":                 Graphics.renderAlphaMap(ctx, m.windMap, WIDTH, HEIGHT); break;
        case "continentLandMassMap":    Graphics.renderAlphaMap(ctx, m.continentLandMassMap, WIDTH, HEIGHT); break;
        case "continentLandEdgeMap":    Graphics.renderAlphaMap(ctx, m.continentLandEdgeMap, WIDTH, HEIGHT); break;
        case "continentMap":            Graphics.renderColourMap(ctx, m.continentMap, WIDTH, HEIGHT); break;
        // case "continentMap":            Graphics.renderAlphaMap(ctx, m.continentMap, WIDTH, HEIGHT); break;

        case "waterLevel":                Graphics.renderWaterLevel(ctx, m, WIDTH, HEIGHT); break;
        case "dataFlat":                Graphics.renderHeightMapData(ctx, m, true); break;

        case "data":
        default:
            Graphics.renderHeightMapData(ctx, m);
    }
}


let smoothness = {"Very Smooth": 9, "Smooth": 8, "Medium": 7, "Rough": 5, "Very Rough": 3};
let seaLevel = {"Very Low": 0.1, "Low": 0.2, "Medium": 0.35, "High": 0.55, "Very High": 0.8};
let terrainType = {"Flat": 0, "Hilly": 1, "Mountainous": 2};
/*

Map Size:
    WxH
Climate: ???
Terrain Type:
    Flat
    Hilly
    Mountainous
Map Edges: Manual / Random ?
    North
    South
    East
    West
*/


// var obj = { x: 5 };
var gui = new dat.GUI();

gui.add(settings, "seed").onFinishChange(update);
gui.add(settings, "smoothness", smoothness).onFinishChange(update);
gui.add(settings, "seaLevel", seaLevel).onFinishChange(update);
gui.add(settings, "terrainType", terrainType).onFinishChange(update);
gui.add(settings, "renderMode", renderModes).onFinishChange(render);

// gui.add(settings, "percentLand").onFinishChange(update);
