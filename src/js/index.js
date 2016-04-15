import dat from "exdat";
import Map from "./Map"
import Graphics from "./Graphics"


const WIDTH = 145;
const HEIGHT = 79;
// const WIDTH = 640;
// const HEIGHT = 480;

var ctx = Graphics.createCanvas(WIDTH, HEIGHT);


let settings = {
    seed: 123546,
    noiseMapCount: 7,       // Zoom?
    width: WIDTH,
    height: HEIGHT,
    elevations: [
        {
            name: "deepSea",
            seaLevel: -255,
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

    // Wind
    windNoiseSize: 3,
    windContinentNoiseSize: 8,
    windBandWeight: 0.8,
    windContinentWeight: 0.3,

    // Rendering debugging
    renderMode: "continentMap"
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
    "continentMap"
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

        case "dataFlat":                Graphics.renderHeightMapData(ctx, m, true); break;

        case "data":
        default:
            Graphics.renderHeightMapData(ctx, m);
    }
}

window.map = m;




// var obj = { x: 5 };
var gui = new dat.GUI();

gui.add(settings, "seed").onFinishChange(update);
gui.add(settings, "noiseMapCount").onFinishChange(update);
gui.add(settings, "renderMode", renderModes).onFinishChange(render);
gui.add(settings, "percentLand").onFinishChange(update);
gui.add(settings, "windNoiseSize").onFinishChange(update);
gui.add(settings, "windContinentNoiseSize").onFinishChange(update);
gui.add(settings, "windBandWeight").onFinishChange(update);
gui.add(settings, "windContinentWeight").onFinishChange(update);


// var seaFolder = gui.addFolder("Sea");
// seaFolder.add(settings.elevations.find(ele => ele.name === "sea"), "seaLevel", -255, 255).onFinishChange(update);
// seaFolder.open();
//
// var landFolder = gui.addFolder("Land");
// landFolder.add(settings.elevations.find(ele => ele.name === "plain"), "seaLevel", -255, 255).onFinishChange(update);
// landFolder.open();
//
// var hillsFolder = gui.addFolder("Hills");
// hillsFolder.add(settings.elevations.find(ele => ele.name === "hill"), "level", -255, 255).onFinishChange(update);
// hillsFolder.open();
//
// var mountainsFolder = gui.addFolder("Mountains");
// mountainsFolder.add(settings.elevations.find(ele => ele.name === "mountain"), "level", -255, 255).onFinishChange(update);
// mountainsFolder.open();
