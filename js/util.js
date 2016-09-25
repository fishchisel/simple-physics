"use strict";
/* Fetches coordinates on canvas from mouse click */
function getCursorPos(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    return { x: x, y: y };
}
exports.getCursorPos = getCursorPos;
/* Returns a random velocity between 1% - 5% of the size of the canvas */
function getRandomVel(canvas) {
    var w = canvas.width;
    var h = canvas.height;
    var x = (w * 0.01) + (w * 0.04 * Math.random());
    var y = (h * 0.01) + (h * 0.04 * Math.random());
    return { x: x, y: y };
}
exports.getRandomVel = getRandomVel;
