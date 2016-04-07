import dat from "exdat";
import Map from "./Map"


const WIDTH = 145;
const HEIGHT = 79;

var canvas = document.createElement("canvas");
document.body.appendChild(canvas);
canvas.width = WIDTH;
canvas.height = HEIGHT;
var ctx = canvas.getContext("2d");

let settings = {
    seed: 123546,
    noiseMapCount: 7,       // Zoom?
    width: WIDTH,
    height: HEIGHT,
    colorRender: false,
    gradientRender: true,
    elevations: [
        {
            name: "min",
            value: 0,
            color: [2, 69, 92]
        },
        {
            name: "sea",
            value: 0.25,
            color: [128, 237, 235]
        },
        {
            name: "land",
            value: 0.45,
            color: [112, 158, 76]
        },
        {
            name: "hill",
            value: 0.8,
            color: [65, 69, 28]
        },
        {
            name: "mountain",
            value: 1,
            color: [226, 227, 218]
        }
    ]
};

let m = new Map();
m.generate(settings);
m.render(ctx);

function update() {
    m.generate(settings);
    m.render(ctx);
}

window.map = m;




// var obj = { x: 5 };
var gui = new dat.GUI();

gui.add(settings, "seed").onFinishChange(update);
gui.add(settings, "colorRender").onFinishChange(update);
gui.add(settings, "gradientRender").onFinishChange(update);
gui.add(settings, "noiseMapCount").onFinishChange(update);


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
