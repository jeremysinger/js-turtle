// get a handle for the canvases in the document
var imageCanvas = $('#imagecanvas')[0];
var imageContext = imageCanvas.getContext('2d');

imageContext.textAlign = "center";
imageContext.textBaseline = "middle";

var turtleCanvas = $('#turtlecanvas')[0];
var turtleContext = turtleCanvas.getContext('2d');

// the turtle takes precedence when compositing
turtleContext.globalCompositeOperation = 'destination-over';

// specification of relative coordinates for drawing turtle shapes,
// as lists of [x,y] pairs
// (The shapes are borrowed from cpython turtle.py)
var shapes = {
    "triangle" : [[-5, 0], [5, 0], [0, 15]],
    "turtle": [[0, 16], [-2, 14], [-1, 10], [-4, 7], [-7, 9],
               [-9, 8], [-6, 5], [-7, 1], [-5, -3], [-8, -6],
               [-6, -8], [-4, -5], [0, -7], [4, -5], [6, -8],
               [8, -6], [5, -3], [7, 1], [6, 5], [9, 8],
               [7, 9], [4, 7], [1, 10], [2, 14]],
    "square": [[10, -10], [10, 10], [-10, 10], [-10, -10]],
    "circle": [[10, 0], [9.51, 3.09], [8.09, 5.88],
               [5.88, 8.09], [3.09, 9.51], [0, 10],
               [-3.09, 9.51], [-5.88, 8.09], [-8.09, 5.88],
               [-9.51, 3.09], [-10, 0], [-9.51, -3.09],
               [-8.09, -5.88], [-5.88, -8.09], [-3.09, -9.51],
               [-0.00, -10.00], [3.09, -9.51], [5.88, -8.09],
               [8.09, -5.88], [9.51, -3.09]]
};

// initialise the state of the turtle
var turtle = undefined;

function initialise() {
    turtle = {
        pos: {
            x: 0,
            y: 0
        },
        angle: 0,
        penDown: true,
        width: 1,
        visible: true,
        redraw: true, // does this belong here?
        wrap: true,
        shape: "triangle",
        colour: {
            r: 0,
            g: 0,
            b: 0,
            a: 1
        },
    };
    imageContext.lineWidth = turtle.width;
    imageContext.strokeStyle = "black";
    imageContext.globalAlpha = 1;
}

// draw the turtle and the current image if redraw is true
// for complicated drawings it is much faster to turn redraw off
function drawIf() {
    if (turtle.redraw) draw();
}

// use canvas centered coordinates facing upwards
function centerCoords(context) {
    var width = context.canvas.width;
    var height = context.canvas.height;
    context.translate(width / 2, height / 2);
    context.transform(1, 0, 0, -1, 0, 0);
}

// draw the turtle and the current image
function draw() {
    clearContext(turtleContext);
    if (turtle.visible) {
        var x = turtle.pos.x;
        var y = turtle.pos.y;
        var w = 10;
        var h = 15;
        turtleContext.save();
        // use canvas centered coordinates facing upwards
        centerCoords(turtleContext);
        // move the origin to the turtle center
        turtleContext.translate(x, y);
        // rotate about the center of the turtle
        turtleContext.rotate(-turtle.angle);
        // move the turtle back to its position
        turtleContext.translate(-x, -y);
        // draw the turtle icon
        let icon = shapes.hasOwnProperty(turtle.shape) ?
            turtle.shape : "triangle";
        turtleContext.beginPath();
        for (let i=0; i<shapes[icon].length; i++) {
            let coord = shapes[icon][i];
            if (i==0) {
                turtleContext.moveTo(x+coord[0], y+coord[1]);
            }
            else {
                turtleContext.lineTo(x+coord[0], y+coord[1]);
            }
        }
        turtleContext.closePath();
        turtleContext.fillStyle = "green";
        turtleContext.fill();
        turtleContext.restore();
    }
    turtleContext.drawImage(imageCanvas, 0, 0, 300, 300, 0, 0, 300, 300);
}

// clear the display, don't move the turtle
function clear() {
    clearContext(imageContext);
    drawIf();
}

function clearContext(context) {
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context.restore();
}

// reset the whole system, clear the display and move turtle back to
// origin, facing the Y axis.
function reset() {
    initialise();
    clear();
    draw();
}

// Trace the forward motion of the turtle, allowing for possible
// wrap-around at the boundaries of the canvas.
function forward(distance) {
    imageContext.save();
    centerCoords(imageContext);
    imageContext.beginPath();
    // get the boundaries of the canvas
    var maxX = imageContext.canvas.width / 2;
    var minX = -imageContext.canvas.width / 2;
    var maxY = imageContext.canvas.height / 2;
    var minY = -imageContext.canvas.height / 2;
    var x = turtle.pos.x;
    var y = turtle.pos.y;
    // trace out the forward steps
    while (distance > 0) {
        // move the to current location of the turtle
        imageContext.moveTo(x, y);
        // calculate the new location of the turtle after doing the forward movement
        var cosAngle = Math.cos(turtle.angle);
        var sinAngle = Math.sin(turtle.angle)
        var newX = x + sinAngle * distance;
        var newY = y + cosAngle * distance;
        // wrap on the X boundary
        function xWrap(cutBound, otherBound) {
            var distanceToEdge = Math.abs((cutBound - x) / sinAngle);
            var edgeY = cosAngle * distanceToEdge + y;
            imageContext.lineTo(cutBound, edgeY);
            distance -= distanceToEdge;
            x = otherBound;
            y = edgeY;
        }
        // wrap on the Y boundary
        function yWrap(cutBound, otherBound) {
            var distanceToEdge = Math.abs((cutBound - y) / cosAngle);
            var edgeX = sinAngle * distanceToEdge + x;
            imageContext.lineTo(edgeX, cutBound);
            distance -= distanceToEdge;
            x = edgeX;
            y = otherBound;
        }
        // don't wrap the turtle on any boundary
        function noWrap() {
            imageContext.lineTo(newX, newY);
            turtle.pos.x = newX;
            turtle.pos.y = newY;
            distance = 0;
        }
        // if wrap is on, trace a part segment of the path and wrap on boundary if necessary
        if (turtle.wrap) {
            if (newX > maxX)
                xWrap(maxX, minX);
            else if (newX < minX)
                xWrap(minX, maxX);
            else if (newY > maxY)
                yWrap(maxY, minY);
            else if (newY < minY)
                yWrap(minY, maxY);
            else
                noWrap();
        }
        // wrap is not on.
        else {
            noWrap();
        }
    }
    // only draw if the pen is currently down.
    if (turtle.penDown)
        imageContext.stroke();
    imageContext.restore();
    drawIf();
}

// turn edge wrapping on/off
function wrap(bool) {
    turtle.wrap = bool;
}

// show/hide the turtle
function hideTurtle() {
    turtle.visible = false;
    drawIf();
}

// show/hide the turtle
function showTurtle() {
    turtle.visible = true;
    drawIf();
}

// turn on/off redrawing
function redrawOnMove(bool) {
    turtle.redraw = bool;
}

// lift up the pen (don't draw)
function penup() {
    turtle.penDown = false;
}
// put the pen down (do draw)
function pendown() {
    turtle.penDown = true;
}

// turn right by an angle in degrees
function right(angle) {
    turtle.angle += degToRad(angle);
    drawIf();
}

// turn left by an angle in degrees
function left(angle) {
    turtle.angle -= degToRad(angle);
    drawIf();
}

// move the turtle to a particular coordinate (don't draw on the way there)
function goto(x, y) {
    turtle.pos.x = x;
    turtle.pos.y = y;
    drawIf();
}

// set the angle of the turtle in degrees
function angle(angle) {
    turtle.angle = degToRad(angle);
}

// convert degrees to radians
function degToRad(deg) {
    return deg / 180 * Math.PI;
}

// convert radians to degrees
function radToDeg(rad) {
    return rad * 180 / Math.PI;
}

// set the width of the line
function width(w) {
    turtle.width = w;
    imageContext.lineWidth = w;
}

// write some text at the turtle position.
// ideally we'd like this to rotate the text based on
// the turtle orientation, but this will require some clever
// canvas transformations which aren't implemented yet.
function write(msg) {
    imageContext.save();
    centerCoords(imageContext);
    imageContext.translate(turtle.pos.x, turtle.pos.y);
    imageContext.transform(1, 0, 0, -1, 0, 0);
    imageContext.translate(-turtle.pos.x, -turtle.pos.y);
    imageContext.fillText(msg, turtle.pos.x, turtle.pos.y);
    imageContext.restore();
    drawIf();
}

// set the turtle draw shape, currently supports
// triangle (default), circle, square and turtle
function shape(s) {
    turtle.shape = s;
    draw();
}

function rectangle(width, height) {
    // start at current x,y pos (transformed)
    imageContext.save();
    centerCoords(imageContext);
    imageContext.beginPath();
    // move to width/height (what about wrap?)
    var x = turtle.pos.x;
    var y = turtle.pos.y;
    imageContext.moveTo(x, y);
    // filled rectangle, in colour of turtle...
    var newX = x+width;
    var newY = y+height;
    // ignore wrap and angle of turtle for now...
    if (turtle.penDown) {
	let r = turtle.colour.r;
	let g = turtle.colour.g;
	let b = turtle.colour.b;
	let a = turtle.colour.a;
	imageContext.fillStyle = "rgba(" + r + "," + g + "," + b + "," + a + ")";
	imageContext.fillRect(x,y,width,height);
    }
    imageContext.restore();
    drawIf();
}

// set the colour of the line using RGB values in the range 0 - 255,
// with optional alpha (between 0 and 1)
// OR set the colour of the line using a single param
// which is a recognized CSS string value
function colour(r, g, b, a) {
    if (arguments.length === 1 && (typeof r) === 'string')  {
	// it's a CSS string colour setting
	let col = r;
	imageContext.strokeStyle = col;
	// update the red/green/blue/alpha components
	let hexCol = imageContext.strokeStyle;
	// hexCol is a string of the form '#aabbcc'
	turtle.colour.r = Number('0x' + hexCol[1] + hexCol[2]);
	turtle.colour.g = Number('0x' + hexCol[3] + hexCol[4]);
	turtle.colour.b = Number('0x' + hexCol[5] + hexCol[6]);
	turtle.colour.a = 1; // assume fully opaque
    } else if (arguments.length > 1 && (typeof r) === 'number') {
	let alpha = (arguments.length==4?a:1); // default opaque
	imageContext.strokeStyle = "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
	turtle.colour.r = r;
	turtle.colour.g = g;
	turtle.colour.b = b;
	turtle.colour.a = alpha;
    }
}

// alias for US spelling
var color = colour;

// Generate a random integer between low and hi
function random(low, hi) {
    return Math.floor(Math.random() * (hi - low + 1) + low);
}

function repeat(n, action) {
    for (var count = 1; count <= n; count++)
        action();
}

function animate(f, ms) {
    return setInterval(f, ms);
}

function setFont(font) {
    imageContext.font = font;
}

//////////////////
// UI code below//
//////////////////

// Navigate command history
var commandList = [];
var currentCommand = 0;

// Moves up and down in command history
document.getElementById("command").addEventListener("keydown", (e) => {
    if (e.key == "ArrowUp") {
        currentCommand--;
        if (currentCommand < 0) currentCommand = 0;
        document.getElementById("command").value = commandList[currentCommand];
    } else if (e.key == "ArrowDown") {
        currentCommand++;
        if (currentCommand > commandList.length) currentCommand = commandList.length;
        var command = commandList[currentCommand] == undefined ? "" : commandList[currentCommand];
        document.getElementById("command").value = command;
    }
}, false);

// Execute the program when the command box is changed
// (when the user presses enter)
$('#command').change(function() {
    var commandText = $(this).val();
    commandList.push(commandText);
    var definitionsText = $('#definitions').val();
    try {
        // execute any code in the definitions box
        eval(definitionsText);
        // execute the code in the command box
        eval(commandText);
    } catch (e) {
        alert('Exception thrown:\n' + e);
        throw e;
    } finally {
        // clear the command box
        $(this).val('');
    }
});

$('#resetButton').click(function() {
    reset();
});

reset();
