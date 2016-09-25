"use strict";
var physics = require('./physics');
var draw = require('./draw');
var plane_1 = require('./plane');
var util = require('./util');
var MIN_MS_BETWEEN_UPDATES = 20; // ~50 FPS
/* Starts the main loop */
function animate(canvas, plane) {
    var lastUpdateTime;
    // Handles all animation frames after the first
    function update(timestamp) {
        requestAnimationFrame(update);
        if (timestamp < lastUpdateTime + MIN_MS_BETWEEN_UPDATES) {
            return;
        }
        physics.advanceTime(plane, (timestamp - lastUpdateTime) / 1000);
        draw.draw(plane, canvas);
        lastUpdateTime = timestamp;
    }
    // Perform initial setup then set animation running.
    requestAnimationFrame(function (timestamp) {
        lastUpdateTime = timestamp;
        requestAnimationFrame(update);
    });
}
;
/* Creates initial objects and starts the main loop */
function start() {
    var plane = new plane_1.default({ x: 0, y: 30 });
    var canvas = document.getElementById('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    attachDragHandler(canvas, plane);
    attachTrailsHandler();
    //addParticles(plane,canvas,5);
    addWalls(plane, canvas);
    animate(canvas, plane);
}
/* Adds 'num' random particles to the plane */
function addParticles(plane, canvas, num) {
    for (var i = 0; i < num; i++) {
        var pos = { x: canvas.width / 2, y: canvas.height / 2 };
        var vel = util.getRandomVel(canvas);
        plane.addParticle(pos, vel);
    }
}
/* Adds walls around the canvas edge */
function addWalls(plane, canvas) {
    var p1 = { x: 10, y: 10 };
    var p2 = { x: 10, y: canvas.height - 10 };
    var p3 = { x: canvas.width - 10, y: canvas.height - 10 };
    var p4 = { x: canvas.width - 10, y: 10 };
    plane.addWall(p1, p2);
    plane.addWall(p2, p3);
    plane.addWall(p3, p4);
    plane.addWall(p4, p1);
}
/* Attaches events to the canvas to faciliate new particle creation. */
function attachDragHandler(canvas, plane) {
    var startPos;
    canvas.onmousedown = function (evt) {
        startPos = util.getCursorPos(canvas, evt);
    };
    canvas.onmouseup = function (evt) {
        if (startPos != null) {
            var pos = util.getCursorPos(canvas, evt);
            if (evt.altKey) {
                plane.addWall(startPos, pos);
            }
            else if (evt.ctrlKey) {
                var vel = { x: pos.x - startPos.x, y: pos.y - startPos.y };
                plane.gravity = vel;
            }
            else {
                var vel = { x: pos.x - startPos.x, y: pos.y - startPos.y };
                plane.addParticle(pos, vel);
            }
            startPos = null;
        }
    };
}
/* Spacebar turns trails on/off for particles */
function attachTrailsHandler() {
    var SPACE_BAR = 32;
    document.onkeypress = function (e) {
        if (e.keyCode == SPACE_BAR) {
            draw.toggleClear();
        }
    };
}
//
start();
