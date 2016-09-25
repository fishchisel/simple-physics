"use strict";
function getRandomColor(letters) {
    if (letters === void 0) { letters = '0123456789ABCDEF'; }
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
/* Provides a simple Plane implementation. */
var Plane = (function () {
    function Plane(gravity) {
        this.particles = [];
        this.walls = [];
        this.gravity = gravity;
    }
    Plane.prototype.addParticle = function (pos, vel) {
        var col = getRandomColor('89ABCDEF');
        this.particles.push({ pos: pos, vel: vel, col: col });
    };
    Plane.prototype.addWall = function (start, end) {
        this.walls.push({ start: start, end: end });
    };
    return Plane;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Plane;
