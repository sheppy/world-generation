import dat from "exdat";
import Map from "./Map"
import Graphics from "./Graphics"


const WIDTH = 145;
const HEIGHT = 79;

var ctx = Graphics.createCanvas(WIDTH, HEIGHT);


let settings = {
    seed: 123546,
    noiseMapCount: 7,       // Zoom?
    width: WIDTH,
    height: HEIGHT,
    elevations: [
        {
            name: "min",
            value: 0,
            color: [48, 96, 130]
        },
        {
            name: "sea",
            value: 0.25,
            color: [99, 155, 255]
        },
        {
            name: "land",
            value: 0.45,
            color: [106, 190, 48]
        },
        {
            name: "hill",
            value: 0.8,
            color: [75, 105, 47]
        },
        {
            name: "mountain",
            value: 1,
            color: [255, 255, 255]
        }
    ],

    renderMode: "windNoiseMap"
    // renderMode: "data"
};

let renderModes = [
    "data",
    "dataFlat",
    "heightMap",
    "heightRollingMask",
    "heightNoiseMap",
    "windNoiseMap",
    "continentNoiseMap"
];

let m = new Map();
update();

function update() {
    m.generate(settings);
    render();
}

function render() {
    switch (settings.renderMode) {
        case "heightNoiseMap":      Graphics.renderAlphaMap(ctx, m.heightNoiseMap, WIDTH, HEIGHT); break;
        case "heightRollingMask":   Graphics.renderAlphaMap(ctx, m.heightRollingMask, WIDTH, HEIGHT); break;
        case "heightMap":           Graphics.renderAlphaMap(ctx, m.heightMap, WIDTH, HEIGHT); break;
        case "windNoiseMap":        Graphics.renderAlphaMap(ctx, m.windNoiseMap, WIDTH, HEIGHT); break;
        case "continentNoiseMap":        Graphics.renderAlphaMap(ctx, m.continentNoiseMap, WIDTH, HEIGHT); break;

        case "dataFlat":            Graphics.renderHeightMapData(ctx, m, true); break;

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


var seaFolder = gui.addFolder("Sea");
seaFolder.add(settings.elevations.find(ele => ele.name === "sea"), "value", 0, 1).onFinishChange(update);
seaFolder.open();

var landFolder = gui.addFolder("Land");
landFolder.add(settings.elevations.find(ele => ele.name === "land"), "value", 0, 1).onFinishChange(update);
landFolder.open();

var hillsFolder = gui.addFolder("Hills");
hillsFolder.add(settings.elevations.find(ele => ele.name === "hill"), "value", 0, 1).onFinishChange(update);
hillsFolder.open();

var mountainsFolder = gui.addFolder("Mountains");
mountainsFolder.add(settings.elevations.find(ele => ele.name === "mountain"), "value", 0, 1).onFinishChange(update);
mountainsFolder.open();
