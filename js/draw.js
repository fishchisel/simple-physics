"use strict";
var PARTICLE_RADIUS = 3;
var LINE_WIDTH = 2;
var shouldClear = true;
var toggleClear = function () { return shouldClear = !shouldClear; };
exports.toggleClear = toggleClear;
/** Clears the given canvas and draws on it the contents of the given plane. */
function draw(plane, canvas) {
    var ctx = canvas.getContext("2d");
    if (ctx) {
        if (shouldClear) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        for (var _i = 0, _a = plane.particles; _i < _a.length; _i++) {
            var particle = _a[_i];
            drawParticle(particle, ctx);
        }
        for (var _b = 0, _c = plane.walls; _b < _c.length; _b++) {
            var wall = _c[_b];
            drawWall(wall, ctx);
        }
    }
}
exports.draw = draw;
/* Draws the given particle */
function drawParticle(particle, ctx) {
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.arc(particle.pos.x, particle.pos.y, PARTICLE_RADIUS, 0, 360);
    if (particle.col)
        ctx.fillStyle = particle.col;
    ctx.fill();
}
/* Drags the given line */
function drawWall(wall, ctx) {
    ctx.beginPath();
    ctx.lineWidth = LINE_WIDTH;
    ctx.moveTo(wall.start.x, wall.start.y);
    ctx.lineTo(wall.end.x, wall.end.y);
    ctx.stroke();
}
