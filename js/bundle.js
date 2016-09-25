(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{}],2:[function(require,module,exports){
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
        console.log("test", e);
        if (e.charCode == SPACE_BAR) {
            draw.toggleClear();
        }
    };
}
//
start();
},{"./draw":1,"./physics":3,"./plane":4,"./util":5}],3:[function(require,module,exports){
"use strict";
var PARTICLE_ELASTICITY = 0.9;
/* Advances time on the plane by the given number of seconds, applying
 * velocity and gravity. */
function advanceTime(plane, seconds) {
    for (var _i = 0, _a = plane.particles; _i < _a.length; _i++) {
        var particle = _a[_i];
        moveParticle(particle, plane, seconds);
    }
    return plane;
}
exports.advanceTime = advanceTime;
/* Moves the given particle, bouncing if the particle hits a wall. */
function moveParticle(particle, plane, seconds) {
    particle.vel.x += plane.gravity.x * seconds;
    particle.vel.y += plane.gravity.y * seconds;
    var desiredMove = {
        x: particle.pos.x + particle.vel.x * seconds,
        y: particle.pos.y + particle.vel.y * seconds
    };
    for (var _i = 0, _a = plane.walls; _i < _a.length; _i++) {
        var wall = _a[_i];
        var intersect = doLineSegmentsIntersect(particle.pos, desiredMove, wall.start, wall.end);
        if (intersect) {
            var wallLine = pointsToLine2d(wall.start, wall.end);
            // make wallLine pass through origin, so that we can reflect velocity
            // vector over it
            wallLine.c = 0;
            particle.vel = reflect(particle.vel, wallLine);
            particle.vel.x *= PARTICLE_ELASTICITY;
            particle.vel.y *= PARTICLE_ELASTICITY;
            return;
        }
    }
    particle.pos = desiredMove;
}
/* Reflects the given point across the line */
function reflect(p, line) {
    var normal = {
        a: -line.b,
        b: line.a,
        c: (-line.b * p.x) + (line.a * p.y)
    };
    var intersect = doLinesIntersect(line, normal);
    var reflectedPoint = {
        x: 2 * intersect.x - p.x,
        y: 2 * intersect.y - p.y
    };
    return reflectedPoint;
}
/* Determines whether two line segments p and q intersect. If they do, returns
 * the intersection point. */
function doLineSegmentsIntersect(p1, p2, q1, q2) {
    var pLine = pointsToLine2d(p1, p2);
    var qLine = pointsToLine2d(q1, q2);
    // If lines are parallel, no intersection
    var intersect = doLinesIntersect(pLine, qLine);
    if (!intersect)
        return null;
    var p1Hit = isPointOnSegment(intersect, p1, p2);
    var p2Hit = isPointOnSegment(intersect, q1, q2);
    if (p1Hit && p2Hit) {
        return intersect;
    }
    return null;
}
/* Determines whether the given point is on the given line segment. The point is
 * assumed to lie on the line defined by the segment. */
function isPointOnSegment(p, s1, s2) {
    var epsilon = 0.01;
    var xHit = (Math.min(s1.x, s2.x) - epsilon <= p.x) &&
        (Math.max(s1.x, s2.x) + epsilon >= p.x);
    var yHit = (Math.min(s1.y, s2.y) - epsilon <= p.y) &&
        (Math.max(s1.y, s2.y) + epsilon >= p.y);
    return xHit && yHit;
}
/** Determines whether two lines p and q intersect. If they do, returns
  * the intersection point. */
function doLinesIntersect(p, q) {
    var det = (p.a * q.b) - (q.a * p.b);
    if (det == 0) {
        return null;
    }
    else {
        return {
            x: (q.b * p.c - p.b * q.c) / det,
            y: (p.a * q.c - q.a * p.c) / det
        };
    }
}
/* Converts the given points to a Line2d that runs through both points. */
function pointsToLine2d(p1, p2) {
    return {
        a: p2.y - p1.y,
        b: p1.x - p2.x,
        c: ((p2.y - p1.y) * p1.x) + ((p1.x - p2.x) * p1.y)
    };
}
},{}],4:[function(require,module,exports){
"use strict";
function randomRgbString(letters) {
    if (letters === void 0) { letters = '0123456789ABCDEF'; }
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * letters.length)];
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
        // random dark color
        var col = randomRgbString('123456788');
        this.particles.push({ pos: pos, vel: vel, col: col });
    };
    Plane.prototype.addWall = function (start, end) {
        this.walls.push({ start: start, end: end });
    };
    return Plane;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Plane;
},{}],5:[function(require,module,exports){
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
},{}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvdHMvZHJhdy50cyIsInNyYy90cy9tYWluLnRzIiwic3JjL3RzL3BoeXNpY3MudHMiLCJzcmMvdHMvcGxhbmUudHMiLCJzcmMvdHMvdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNFQSxJQUFNLGVBQWUsR0FBRyxDQUFDLENBQUM7QUFDMUIsSUFBTSxVQUFVLEdBQUcsQ0FBQyxDQUFDO0FBRXJCLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQztBQUV2QixJQUFJLFdBQVcsR0FBRyxjQUFNLE9BQUEsV0FBVyxHQUFHLENBQUMsV0FBVyxFQUExQixDQUEwQjtBQXdDcEMsbUJBQVcsZUF4QzBCO0FBRW5ELCtFQUErRTtBQUMvRSxjQUFlLEtBQVksRUFBRSxNQUF5QjtJQUVwRCxJQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2xDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDUixFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBQ2hCLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNuRCxDQUFDO1FBRUQsR0FBRyxDQUFDLENBQWlCLFVBQWUsRUFBZixLQUFBLEtBQUssQ0FBQyxTQUFTLEVBQWYsY0FBZSxFQUFmLElBQWUsQ0FBQztZQUFoQyxJQUFJLFFBQVEsU0FBQTtZQUNmLFlBQVksQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDN0I7UUFFRCxHQUFHLENBQUMsQ0FBYSxVQUFXLEVBQVgsS0FBQSxLQUFLLENBQUMsS0FBSyxFQUFYLGNBQVcsRUFBWCxJQUFXLENBQUM7WUFBeEIsSUFBSSxJQUFJLFNBQUE7WUFDWCxRQUFRLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQ3JCO0lBQ0gsQ0FBQztBQUNILENBQUM7QUFxQk8sWUFBSSxRQXJCWDtBQUVELDhCQUE4QjtBQUM5QixzQkFBc0IsUUFBa0IsRUFBRSxHQUE2QjtJQUNyRSxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDaEIsR0FBRyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7SUFDbEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxlQUFlLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ2pFLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUM7UUFBQyxHQUFHLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUM7SUFFL0MsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ2IsQ0FBQztBQUVELDBCQUEwQjtBQUMxQixrQkFBa0IsSUFBVSxFQUFFLEdBQTZCO0lBQ3pELEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUNoQixHQUFHLENBQUMsU0FBUyxHQUFHLFVBQVUsQ0FBQztJQUMzQixHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdkMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25DLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUNmLENBQUM7QUFFMEI7O0FDL0MzQixJQUFZLE9BQU8sV0FBTSxXQUFXLENBQUMsQ0FBQTtBQUNyQyxJQUFZLElBQUksV0FBTSxRQUFRLENBQUMsQ0FBQTtBQUMvQixzQkFBa0IsU0FBUyxDQUFDLENBQUE7QUFDNUIsSUFBWSxJQUFJLFdBQU0sUUFBUSxDQUFDLENBQUE7QUFHL0IsSUFBSSxzQkFBc0IsR0FBRyxFQUFFLENBQUMsQ0FBQyxVQUFVO0FBRTNDLDBCQUEwQjtBQUMxQixpQkFBaUIsTUFBeUIsRUFBRSxLQUFZO0lBQ3RELElBQUksY0FBYyxDQUFDO0lBRW5CLCtDQUErQztJQUMvQyxnQkFBZ0IsU0FBaUI7UUFDL0IscUJBQXFCLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFOUIsRUFBRSxDQUFDLENBQUMsU0FBUyxHQUFHLGNBQWMsR0FBRyxzQkFBc0IsQ0FBQyxDQUFDLENBQUM7WUFDeEQsTUFBTSxDQUFDO1FBQ1QsQ0FBQztRQUNELE9BQU8sQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUMsU0FBUyxHQUFHLGNBQWMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO1FBQ2hFLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3pCLGNBQWMsR0FBRyxTQUFTLENBQUM7SUFDN0IsQ0FBQztJQUVELG9EQUFvRDtJQUNwRCxxQkFBcUIsQ0FBQyxVQUFTLFNBQVM7UUFDdEMsY0FBYyxHQUFHLFNBQVMsQ0FBQztRQUMzQixxQkFBcUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNoQyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFBQSxDQUFDO0FBRUYsc0RBQXNEO0FBQ3REO0lBQ0UsSUFBSSxLQUFLLEdBQUcsSUFBSSxlQUFLLENBQUMsRUFBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBQyxFQUFFLEVBQUMsQ0FBQyxDQUFDO0lBRXBDLElBQUksTUFBTSxHQUFzQixRQUFRLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2xFLE1BQU0sQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQztJQUNqQyxNQUFNLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUM7SUFFbkMsaUJBQWlCLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2pDLG1CQUFtQixFQUFFLENBQUM7SUFDdEIsK0JBQStCO0lBQy9CLFFBQVEsQ0FBQyxLQUFLLEVBQUMsTUFBTSxDQUFDLENBQUM7SUFDdkIsT0FBTyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztBQUN6QixDQUFDO0FBRUQsOENBQThDO0FBQzlDLHNCQUFzQixLQUFZLEVBQUUsTUFBeUIsRUFBRSxHQUFXO0lBQ3hFLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDN0IsSUFBSSxHQUFHLEdBQUcsRUFBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLEtBQUssR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFDLENBQUM7UUFDdEQsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNwQyxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBQyxHQUFHLENBQUMsQ0FBQztJQUM3QixDQUFDO0FBQ0gsQ0FBQztBQUVELHVDQUF1QztBQUN2QyxrQkFBa0IsS0FBWSxFQUFFLE1BQXlCO0lBQ3ZELElBQUksRUFBRSxHQUFHLEVBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFDLENBQUM7SUFDeEIsSUFBSSxFQUFFLEdBQUcsRUFBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsTUFBTSxHQUFHLEVBQUUsRUFBQyxDQUFDO0lBQ3hDLElBQUksRUFBRSxHQUFHLEVBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxLQUFLLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsTUFBTSxHQUFHLEVBQUUsRUFBQyxDQUFDO0lBQ3ZELElBQUksRUFBRSxHQUFHLEVBQUMsQ0FBQyxFQUFHLE1BQU0sQ0FBQyxLQUFLLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQztJQUV6QyxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBQyxFQUFFLENBQUMsQ0FBQztJQUNyQixLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBQyxFQUFFLENBQUMsQ0FBQztJQUNyQixLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBQyxFQUFFLENBQUMsQ0FBQztJQUNyQixLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBQyxFQUFFLENBQUMsQ0FBQztBQUN2QixDQUFDO0FBRUQsdUVBQXVFO0FBQ3ZFLDJCQUEyQixNQUF5QixFQUFFLEtBQVk7SUFDaEUsSUFBSSxRQUEwQixDQUFDO0lBQy9CLE1BQU0sQ0FBQyxXQUFXLEdBQUcsVUFBUyxHQUFHO1FBQy9CLFFBQVEsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQztJQUM1QyxDQUFDLENBQUM7SUFDRixNQUFNLENBQUMsU0FBUyxHQUFHLFVBQVMsR0FBRztRQUM3QixFQUFFLENBQUMsQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNyQixJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBQyxHQUFHLENBQUMsQ0FBQztZQUV4QyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDZixLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUMvQixDQUFDO1lBQ0QsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUNyQixJQUFJLEdBQUcsR0FBRyxFQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUMsRUFBQyxDQUFDO2dCQUN6RCxLQUFLLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQztZQUN0QixDQUFDO1lBQ0QsSUFBSSxDQUFDLENBQUM7Z0JBQ0osSUFBSSxHQUFHLEdBQUcsRUFBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLEVBQUMsQ0FBQztnQkFDekQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDOUIsQ0FBQztZQUNELFFBQVEsR0FBRyxJQUFJLENBQUM7UUFDbEIsQ0FBQztJQUNILENBQUMsQ0FBQztBQUNKLENBQUM7QUFFRCxnREFBZ0Q7QUFDaEQ7SUFDRSxJQUFNLFNBQVMsR0FBRyxFQUFFLENBQUM7SUFDckIsUUFBUSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7UUFDL0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdkIsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQzVCLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUNyQixDQUFDO0lBQ0gsQ0FBQyxDQUFBO0FBQ0gsQ0FBQztBQUVELEVBQUU7QUFDRixLQUFLLEVBQUUsQ0FBQzs7O0FDeEdSLElBQU0sbUJBQW1CLEdBQUcsR0FBRyxDQUFDO0FBRWhDOzJCQUMyQjtBQUMzQixxQkFBcUIsS0FBWSxFQUFFLE9BQWU7SUFFaEQsR0FBRyxDQUFDLENBQWlCLFVBQWUsRUFBZixLQUFBLEtBQUssQ0FBQyxTQUFTLEVBQWYsY0FBZSxFQUFmLElBQWUsQ0FBQztRQUFoQyxJQUFJLFFBQVEsU0FBQTtRQUNmLFlBQVksQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQ3hDO0lBRUQsTUFBTSxDQUFDLEtBQUssQ0FBQztBQUNmLENBQUM7QUF5R08sbUJBQVcsZUF6R2xCO0FBRUQscUVBQXFFO0FBQ3JFLHNCQUFzQixRQUFrQixFQUFFLEtBQVksRUFBRSxPQUFlO0lBQ3JFLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQztJQUM1QyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUM7SUFFNUMsSUFBSSxXQUFXLEdBQUc7UUFDaEIsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLE9BQU87UUFDNUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLE9BQU87S0FDN0MsQ0FBQTtJQUVELEdBQUcsQ0FBQyxDQUFhLFVBQVcsRUFBWCxLQUFBLEtBQUssQ0FBQyxLQUFLLEVBQVgsY0FBVyxFQUFYLElBQVcsQ0FBQztRQUF4QixJQUFJLElBQUksU0FBQTtRQUNYLElBQUksU0FBUyxHQUFHLHVCQUF1QixDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsV0FBVyxFQUN6QixJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM5RCxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQ2QsSUFBSSxRQUFRLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRXBELHFFQUFxRTtZQUNyRSxpQkFBaUI7WUFDakIsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFZixRQUFRLENBQUMsR0FBRyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQy9DLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLG1CQUFtQixDQUFDO1lBQ3RDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLG1CQUFtQixDQUFDO1lBQ3RDLE1BQU0sQ0FBQztRQUNULENBQUM7S0FDRjtJQUVELFFBQVEsQ0FBQyxHQUFHLEdBQUcsV0FBVyxDQUFDO0FBQzdCLENBQUM7QUFFRCw4Q0FBOEM7QUFDOUMsaUJBQWlCLENBQVcsRUFBRSxJQUFZO0lBQ3hDLElBQUksTUFBTSxHQUFHO1FBQ1gsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDVixDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDVCxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3BDLENBQUE7SUFDRCxJQUFJLFNBQVMsR0FBYSxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFFekQsSUFBSSxjQUFjLEdBQUk7UUFDcEIsQ0FBQyxFQUFFLENBQUMsR0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLENBQUMsRUFBRSxDQUFDLEdBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztLQUN2QixDQUFBO0lBRUQsTUFBTSxDQUFDLGNBQWMsQ0FBQztBQUN4QixDQUFDO0FBRUQ7NkJBQzZCO0FBQzdCLGlDQUFpQyxFQUFZLEVBQUUsRUFBWSxFQUMxQixFQUFZLEVBQUUsRUFBWTtJQUN6RCxJQUFJLEtBQUssR0FBRyxjQUFjLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ25DLElBQUksS0FBSyxHQUFHLGNBQWMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFFbkMseUNBQXlDO0lBQ3pDLElBQUksU0FBUyxHQUFHLGdCQUFnQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUMvQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFFNUIsSUFBSSxLQUFLLEdBQUcsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNoRCxJQUFJLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBRWhELEVBQUUsQ0FBQyxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ25CLE1BQU0sQ0FBQyxTQUFTLENBQUM7SUFDbkIsQ0FBQztJQUNELE1BQU0sQ0FBQyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQ7d0RBQ3dEO0FBQ3hELDBCQUEwQixDQUFXLEVBQUUsRUFBWSxFQUFFLEVBQVk7SUFDL0QsSUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDO0lBQ3JCLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4QyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwRCxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEQsTUFBTSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUM7QUFDdEIsQ0FBQztBQUVEOzhCQUM4QjtBQUM5QiwwQkFBMEIsQ0FBUyxFQUFFLENBQVM7SUFDNUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRXBDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2IsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNkLENBQUM7SUFDRCxJQUFJLENBQUMsQ0FBQztRQUNKLE1BQU0sQ0FBQztZQUNMLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHO1lBQ2hDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHO1NBQ2pDLENBQUE7SUFDSCxDQUFDO0FBQ0gsQ0FBQztBQUVELDBFQUEwRTtBQUMxRSx3QkFBd0IsRUFBWSxFQUFFLEVBQVk7SUFDaEQsTUFBTSxDQUFDO1FBQ0wsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDZCxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUNkLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQ25ELENBQUM7QUFDSixDQUFDO0FBRW1COztBQ3BIcEIseUJBQXlCLE9BQTBCO0lBQTFCLHVCQUEwQixHQUExQiw0QkFBMEI7SUFDL0MsSUFBSSxLQUFLLEdBQUcsR0FBRyxDQUFDO0lBQ2hCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFHLENBQUM7UUFDMUIsS0FBSyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUNqRSxDQUFDO0lBQ0QsTUFBTSxDQUFDLEtBQUssQ0FBQztBQUNqQixDQUFDO0FBRUQsNkNBQTZDO0FBQzdDO0lBS0UsZUFBWSxPQUFpQjtRQUo3QixjQUFTLEdBQWUsRUFBRSxDQUFDO1FBQzNCLFVBQUssR0FBVyxFQUFFLENBQUM7UUFJakIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7SUFDekIsQ0FBQztJQUVELDJCQUFXLEdBQVgsVUFBWSxHQUFhLEVBQUUsR0FBYTtRQUN0QyxvQkFBb0I7UUFDcEIsSUFBSSxHQUFHLEdBQUcsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUMsQ0FBQyxDQUFDO0lBRXRELENBQUM7SUFDRCx1QkFBTyxHQUFQLFVBQVEsS0FBZSxFQUFFLEdBQWE7UUFDcEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUMsQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFDSCxZQUFDO0FBQUQsQ0FsQkEsQUFrQkMsSUFBQTtBQUVEO2tCQUFlLEtBQUssQ0FBQzs7O0FDN0JyQixvREFBb0Q7QUFDcEQsc0JBQTZCLE1BQTBCLEVBQUUsS0FBSztJQUMxRCxJQUFJLElBQUksR0FBRyxNQUFNLENBQUMscUJBQXFCLEVBQUUsQ0FBQztJQUMxQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7SUFDbEMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO0lBQ2pDLE1BQU0sQ0FBQyxFQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBQyxDQUFDO0FBQ3hCLENBQUM7QUFMZSxvQkFBWSxlQUszQixDQUFBO0FBRUQseUVBQXlFO0FBQ3pFLHNCQUE2QixNQUF5QjtJQUNwRCxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO0lBQ3JCLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDdEIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBQ2hELElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztJQUNoRCxNQUFNLENBQUMsRUFBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUMsQ0FBQztBQUN0QixDQUFDO0FBTmUsb0JBQVksZUFNM0IsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQge1BsYW5lLCBQYXJ0aWNsZSwgV2FsbH0gZnJvbSAnLi9pbnRlcmZhY2VzJztcclxuXHJcbmNvbnN0IFBBUlRJQ0xFX1JBRElVUyA9IDM7XHJcbmNvbnN0IExJTkVfV0lEVEggPSAyO1xyXG5cclxubGV0IHNob3VsZENsZWFyID0gdHJ1ZTtcclxuXHJcbmxldCB0b2dnbGVDbGVhciA9ICgpID0+IHNob3VsZENsZWFyID0gIXNob3VsZENsZWFyO1xyXG5cclxuLyoqIENsZWFycyB0aGUgZ2l2ZW4gY2FudmFzIGFuZCBkcmF3cyBvbiBpdCB0aGUgY29udGVudHMgb2YgdGhlIGdpdmVuIHBsYW5lLiAqL1xyXG5mdW5jdGlvbiBkcmF3IChwbGFuZTogUGxhbmUsIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQpIHtcclxuXHJcbiAgbGV0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XHJcbiAgaWYgKGN0eCkge1xyXG4gICAgaWYgKHNob3VsZENsZWFyKSB7XHJcbiAgICAgIGN0eC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKGxldCBwYXJ0aWNsZSBvZiBwbGFuZS5wYXJ0aWNsZXMpIHtcclxuICAgICAgZHJhd1BhcnRpY2xlKHBhcnRpY2xlLCBjdHgpO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAobGV0IHdhbGwgb2YgcGxhbmUud2FsbHMpIHtcclxuICAgICAgZHJhd1dhbGwod2FsbCwgY3R4KTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbi8qIERyYXdzIHRoZSBnaXZlbiBwYXJ0aWNsZSAqL1xyXG5mdW5jdGlvbiBkcmF3UGFydGljbGUocGFydGljbGU6IFBhcnRpY2xlLCBjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCkge1xyXG4gIGN0eC5iZWdpblBhdGgoKTtcclxuICBjdHgubGluZVdpZHRoID0gMTtcclxuICBjdHguYXJjKHBhcnRpY2xlLnBvcy54LCBwYXJ0aWNsZS5wb3MueSwgUEFSVElDTEVfUkFESVVTLCAwLCAzNjApO1xyXG4gIGlmIChwYXJ0aWNsZS5jb2wpIGN0eC5maWxsU3R5bGUgPSBwYXJ0aWNsZS5jb2w7XHJcbiAgXHJcbiAgY3R4LmZpbGwoKTtcclxufVxyXG5cclxuLyogRHJhZ3MgdGhlIGdpdmVuIGxpbmUgKi9cclxuZnVuY3Rpb24gZHJhd1dhbGwod2FsbDogV2FsbCwgY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpIHtcclxuICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgY3R4LmxpbmVXaWR0aCA9IExJTkVfV0lEVEg7XHJcbiAgY3R4Lm1vdmVUbyh3YWxsLnN0YXJ0LngsIHdhbGwuc3RhcnQueSk7XHJcbiAgY3R4LmxpbmVUbyh3YWxsLmVuZC54LCB3YWxsLmVuZC55KTtcclxuICBjdHguc3Ryb2tlKCk7XHJcbn1cclxuXHJcbmV4cG9ydCB7ZHJhdywgdG9nZ2xlQ2xlYXJ9O1xyXG4iLCJpbXBvcnQgKiBhcyBwaHlzaWNzIGZyb20gJy4vcGh5c2ljcyc7XHJcbmltcG9ydCAqIGFzIGRyYXcgZnJvbSAnLi9kcmF3JztcclxuaW1wb3J0IFBsYW5lIGZyb20gJy4vcGxhbmUnO1xyXG5pbXBvcnQgKiBhcyB1dGlsIGZyb20gJy4vdXRpbCc7XHJcbmltcG9ydCB7VmVjdG9yMmR9IGZyb20gJy4vaW50ZXJmYWNlcyc7XHJcblxyXG5sZXQgTUlOX01TX0JFVFdFRU5fVVBEQVRFUyA9IDIwOyAvLyB+NTAgRlBTXHJcblxyXG4vKiBTdGFydHMgdGhlIG1haW4gbG9vcCAqL1xyXG5mdW5jdGlvbiBhbmltYXRlKGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQsIHBsYW5lOiBQbGFuZSkge1xyXG4gIGxldCBsYXN0VXBkYXRlVGltZTtcclxuXHJcbiAgLy8gSGFuZGxlcyBhbGwgYW5pbWF0aW9uIGZyYW1lcyBhZnRlciB0aGUgZmlyc3RcclxuICBmdW5jdGlvbiB1cGRhdGUodGltZXN0YW1wOiBudW1iZXIpIHtcclxuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSh1cGRhdGUpO1xyXG5cclxuICAgIGlmICh0aW1lc3RhbXAgPCBsYXN0VXBkYXRlVGltZSArIE1JTl9NU19CRVRXRUVOX1VQREFURVMpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgcGh5c2ljcy5hZHZhbmNlVGltZShwbGFuZSwgKHRpbWVzdGFtcCAtIGxhc3RVcGRhdGVUaW1lKSAvIDEwMDApO1xyXG4gICAgZHJhdy5kcmF3KHBsYW5lLCBjYW52YXMpO1xyXG4gICAgbGFzdFVwZGF0ZVRpbWUgPSB0aW1lc3RhbXA7XHJcbiAgfVxyXG5cclxuICAvLyBQZXJmb3JtIGluaXRpYWwgc2V0dXAgdGhlbiBzZXQgYW5pbWF0aW9uIHJ1bm5pbmcuXHJcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uKHRpbWVzdGFtcCkge1xyXG4gICAgbGFzdFVwZGF0ZVRpbWUgPSB0aW1lc3RhbXA7XHJcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodXBkYXRlKTtcclxuICB9KTtcclxufTtcclxuXHJcbi8qIENyZWF0ZXMgaW5pdGlhbCBvYmplY3RzIGFuZCBzdGFydHMgdGhlIG1haW4gbG9vcCAqL1xyXG5mdW5jdGlvbiBzdGFydCgpIHtcclxuICBsZXQgcGxhbmUgPSBuZXcgUGxhbmUoe3g6IDAsIHk6MzB9KTtcclxuXHJcbiAgbGV0IGNhbnZhcyA9IDxIVE1MQ2FudmFzRWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FudmFzJyk7XHJcbiAgY2FudmFzLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XHJcbiAgY2FudmFzLmhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcclxuXHJcbiAgYXR0YWNoRHJhZ0hhbmRsZXIoY2FudmFzLCBwbGFuZSk7XHJcbiAgYXR0YWNoVHJhaWxzSGFuZGxlcigpO1xyXG4gIC8vYWRkUGFydGljbGVzKHBsYW5lLGNhbnZhcyw1KTtcclxuICBhZGRXYWxscyhwbGFuZSxjYW52YXMpO1xyXG4gIGFuaW1hdGUoY2FudmFzLCBwbGFuZSk7XHJcbn1cclxuXHJcbi8qIEFkZHMgJ251bScgcmFuZG9tIHBhcnRpY2xlcyB0byB0aGUgcGxhbmUgKi9cclxuZnVuY3Rpb24gYWRkUGFydGljbGVzKHBsYW5lOiBQbGFuZSwgY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCwgbnVtOiBudW1iZXIpIHtcclxuICBmb3IgKGxldCBpID0gMDsgaSA8IG51bTsgaSsrKSB7XHJcbiAgICBsZXQgcG9zID0ge3g6IGNhbnZhcy53aWR0aCAvIDIsIHk6IGNhbnZhcy5oZWlnaHQgLyAyfTtcclxuICAgIGxldCB2ZWwgPSB1dGlsLmdldFJhbmRvbVZlbChjYW52YXMpO1xyXG4gICAgcGxhbmUuYWRkUGFydGljbGUocG9zLHZlbCk7XHJcbiAgfVxyXG59XHJcblxyXG4vKiBBZGRzIHdhbGxzIGFyb3VuZCB0aGUgY2FudmFzIGVkZ2UgKi9cclxuZnVuY3Rpb24gYWRkV2FsbHMocGxhbmU6IFBsYW5lLCBjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50KSB7XHJcbiAgbGV0IHAxID0ge3g6IDEwLCB5OiAxMH07XHJcbiAgbGV0IHAyID0ge3g6IDEwLCB5OiBjYW52YXMuaGVpZ2h0IC0gMTB9O1xyXG4gIGxldCBwMyA9IHt4OiBjYW52YXMud2lkdGggLSAxMCwgeTogY2FudmFzLmhlaWdodCAtIDEwfTtcclxuICBsZXQgcDQgPSB7eCA6IGNhbnZhcy53aWR0aCAtIDEwLCB5OiAxMCB9O1xyXG5cclxuICBwbGFuZS5hZGRXYWxsKHAxLHAyKTtcclxuICBwbGFuZS5hZGRXYWxsKHAyLHAzKTtcclxuICBwbGFuZS5hZGRXYWxsKHAzLHA0KTtcclxuICBwbGFuZS5hZGRXYWxsKHA0LHAxKTtcclxufVxyXG5cclxuLyogQXR0YWNoZXMgZXZlbnRzIHRvIHRoZSBjYW52YXMgdG8gZmFjaWxpYXRlIG5ldyBwYXJ0aWNsZSBjcmVhdGlvbi4gKi9cclxuZnVuY3Rpb24gYXR0YWNoRHJhZ0hhbmRsZXIoY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCwgcGxhbmU6IFBsYW5lKSB7XHJcbiAgbGV0IHN0YXJ0UG9zIDogVmVjdG9yMmQgfCBudWxsO1xyXG4gIGNhbnZhcy5vbm1vdXNlZG93biA9IGZ1bmN0aW9uKGV2dCkge1xyXG4gICAgc3RhcnRQb3MgPSB1dGlsLmdldEN1cnNvclBvcyhjYW52YXMsIGV2dCk7XHJcbiAgfTtcclxuICBjYW52YXMub25tb3VzZXVwID0gZnVuY3Rpb24oZXZ0KSB7XHJcbiAgICBpZiAoc3RhcnRQb3MgIT0gbnVsbCkge1xyXG4gICAgICBsZXQgcG9zID0gdXRpbC5nZXRDdXJzb3JQb3MoY2FudmFzLGV2dCk7XHJcblxyXG4gICAgICBpZiAoZXZ0LmFsdEtleSkgeyAvLyBEcmF3IFdhbGxcclxuICAgICAgICBwbGFuZS5hZGRXYWxsKHN0YXJ0UG9zLCBwb3MpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKGV2dC5jdHJsS2V5KSB7IC8vIENoYW5nZSBncmF2aXR5XHJcbiAgICAgICAgbGV0IHZlbCA9IHt4OiBwb3MueCAtIHN0YXJ0UG9zLngsIHk6IHBvcy55IC0gc3RhcnRQb3MueX07XHJcbiAgICAgICAgcGxhbmUuZ3Jhdml0eSA9IHZlbDtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHsgLy8gRHJhdyBwYXJ0aWNsZVxyXG4gICAgICAgIGxldCB2ZWwgPSB7eDogcG9zLnggLSBzdGFydFBvcy54LCB5OiBwb3MueSAtIHN0YXJ0UG9zLnl9O1xyXG4gICAgICAgIHBsYW5lLmFkZFBhcnRpY2xlKHBvcywgdmVsKTtcclxuICAgICAgfVxyXG4gICAgICBzdGFydFBvcyA9IG51bGw7XHJcbiAgICB9XHJcbiAgfTtcclxufVxyXG5cclxuLyogU3BhY2ViYXIgdHVybnMgdHJhaWxzIG9uL29mZiBmb3IgcGFydGljbGVzICovXHJcbmZ1bmN0aW9uIGF0dGFjaFRyYWlsc0hhbmRsZXIoKSB7XHJcbiAgY29uc3QgU1BBQ0VfQkFSID0gMzI7XHJcbiAgZG9jdW1lbnQub25rZXlwcmVzcyA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcInRlc3RcIiwgZSk7XHJcbiAgICBpZiAoZS5jaGFyQ29kZSA9PSBTUEFDRV9CQVIpIHtcclxuICAgICAgZHJhdy50b2dnbGVDbGVhcigpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuLy9cclxuc3RhcnQoKTtcclxuIiwiaW1wb3J0IHtQbGFuZSwgVmVjdG9yMmQsIExpbmUyZCwgUGFydGljbGV9IGZyb20gJy4vaW50ZXJmYWNlcyc7XHJcblxyXG5jb25zdCBQQVJUSUNMRV9FTEFTVElDSVRZID0gMC45O1xyXG5cclxuLyogQWR2YW5jZXMgdGltZSBvbiB0aGUgcGxhbmUgYnkgdGhlIGdpdmVuIG51bWJlciBvZiBzZWNvbmRzLCBhcHBseWluZ1xyXG4gKiB2ZWxvY2l0eSBhbmQgZ3Jhdml0eS4gKi9cclxuZnVuY3Rpb24gYWR2YW5jZVRpbWUocGxhbmU6IFBsYW5lLCBzZWNvbmRzOiBudW1iZXIpIDogUGxhbmUge1xyXG5cclxuICBmb3IgKGxldCBwYXJ0aWNsZSBvZiBwbGFuZS5wYXJ0aWNsZXMpIHtcclxuICAgIG1vdmVQYXJ0aWNsZShwYXJ0aWNsZSwgcGxhbmUsIHNlY29uZHMpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHBsYW5lO1xyXG59XHJcblxyXG4vKiBNb3ZlcyB0aGUgZ2l2ZW4gcGFydGljbGUsIGJvdW5jaW5nIGlmIHRoZSBwYXJ0aWNsZSBoaXRzIGEgd2FsbC4gKi9cclxuZnVuY3Rpb24gbW92ZVBhcnRpY2xlKHBhcnRpY2xlOiBQYXJ0aWNsZSwgcGxhbmU6IFBsYW5lLCBzZWNvbmRzOiBudW1iZXIpIHtcclxuICBwYXJ0aWNsZS52ZWwueCArPSBwbGFuZS5ncmF2aXR5LnggKiBzZWNvbmRzO1xyXG4gIHBhcnRpY2xlLnZlbC55ICs9IHBsYW5lLmdyYXZpdHkueSAqIHNlY29uZHM7XHJcblxyXG4gIGxldCBkZXNpcmVkTW92ZSA9IHtcclxuICAgIHg6IHBhcnRpY2xlLnBvcy54ICsgcGFydGljbGUudmVsLnggKiBzZWNvbmRzLFxyXG4gICAgeTogcGFydGljbGUucG9zLnkgKyBwYXJ0aWNsZS52ZWwueSAqIHNlY29uZHNcclxuICB9XHJcblxyXG4gIGZvciAobGV0IHdhbGwgb2YgcGxhbmUud2FsbHMpIHtcclxuICAgIGxldCBpbnRlcnNlY3QgPSBkb0xpbmVTZWdtZW50c0ludGVyc2VjdChwYXJ0aWNsZS5wb3MsIGRlc2lyZWRNb3ZlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdhbGwuc3RhcnQsIHdhbGwuZW5kKTtcclxuICAgIGlmIChpbnRlcnNlY3QpIHtcclxuICAgICAgbGV0IHdhbGxMaW5lID0gcG9pbnRzVG9MaW5lMmQod2FsbC5zdGFydCwgd2FsbC5lbmQpO1xyXG5cclxuICAgICAgLy8gbWFrZSB3YWxsTGluZSBwYXNzIHRocm91Z2ggb3JpZ2luLCBzbyB0aGF0IHdlIGNhbiByZWZsZWN0IHZlbG9jaXR5XHJcbiAgICAgIC8vIHZlY3RvciBvdmVyIGl0XHJcbiAgICAgIHdhbGxMaW5lLmMgPSAwO1xyXG5cclxuICAgICAgcGFydGljbGUudmVsID0gcmVmbGVjdChwYXJ0aWNsZS52ZWwsIHdhbGxMaW5lKTtcclxuICAgICAgcGFydGljbGUudmVsLnggKj0gUEFSVElDTEVfRUxBU1RJQ0lUWTtcclxuICAgICAgcGFydGljbGUudmVsLnkgKj0gUEFSVElDTEVfRUxBU1RJQ0lUWTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcGFydGljbGUucG9zID0gZGVzaXJlZE1vdmU7XHJcbn1cclxuXHJcbi8qIFJlZmxlY3RzIHRoZSBnaXZlbiBwb2ludCBhY3Jvc3MgdGhlIGxpbmUgKi9cclxuZnVuY3Rpb24gcmVmbGVjdChwOiBWZWN0b3IyZCwgbGluZTogTGluZTJkKSA6IFZlY3RvcjJkIHtcclxuICBsZXQgbm9ybWFsID0ge1xyXG4gICAgYTogLWxpbmUuYixcclxuICAgIGI6IGxpbmUuYSxcclxuICAgIGM6ICgtbGluZS5iICogcC54KSArIChsaW5lLmEgKiBwLnkpXHJcbiAgfVxyXG4gIGxldCBpbnRlcnNlY3QgPSA8VmVjdG9yMmQ+ZG9MaW5lc0ludGVyc2VjdChsaW5lLCBub3JtYWwpO1xyXG5cclxuICBsZXQgcmVmbGVjdGVkUG9pbnQgPSAge1xyXG4gICAgeDogMippbnRlcnNlY3QueCAtIHAueCxcclxuICAgIHk6IDIqaW50ZXJzZWN0LnkgLSBwLnlcclxuICB9XHJcblxyXG4gIHJldHVybiByZWZsZWN0ZWRQb2ludDtcclxufVxyXG5cclxuLyogRGV0ZXJtaW5lcyB3aGV0aGVyIHR3byBsaW5lIHNlZ21lbnRzIHAgYW5kIHEgaW50ZXJzZWN0LiBJZiB0aGV5IGRvLCByZXR1cm5zXHJcbiAqIHRoZSBpbnRlcnNlY3Rpb24gcG9pbnQuICovXHJcbmZ1bmN0aW9uIGRvTGluZVNlZ21lbnRzSW50ZXJzZWN0KHAxOiBWZWN0b3IyZCwgcDI6IFZlY3RvcjJkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxMTogVmVjdG9yMmQsIHEyOiBWZWN0b3IyZCkgOiBWZWN0b3IyZCB8IG51bGwge1xyXG4gIGxldCBwTGluZSA9IHBvaW50c1RvTGluZTJkKHAxLCBwMik7XHJcbiAgbGV0IHFMaW5lID0gcG9pbnRzVG9MaW5lMmQocTEsIHEyKTtcclxuXHJcbiAgLy8gSWYgbGluZXMgYXJlIHBhcmFsbGVsLCBubyBpbnRlcnNlY3Rpb25cclxuICBsZXQgaW50ZXJzZWN0ID0gZG9MaW5lc0ludGVyc2VjdChwTGluZSwgcUxpbmUpO1xyXG4gIGlmICghaW50ZXJzZWN0KSByZXR1cm4gbnVsbDtcclxuXHJcbiAgbGV0IHAxSGl0ID0gaXNQb2ludE9uU2VnbWVudChpbnRlcnNlY3QsIHAxLCBwMik7XHJcbiAgbGV0IHAySGl0ID0gaXNQb2ludE9uU2VnbWVudChpbnRlcnNlY3QsIHExLCBxMik7XHJcblxyXG4gIGlmIChwMUhpdCAmJiBwMkhpdCkge1xyXG4gICAgcmV0dXJuIGludGVyc2VjdDtcclxuICB9XHJcbiAgcmV0dXJuIG51bGw7XHJcbn1cclxuXHJcbi8qIERldGVybWluZXMgd2hldGhlciB0aGUgZ2l2ZW4gcG9pbnQgaXMgb24gdGhlIGdpdmVuIGxpbmUgc2VnbWVudC4gVGhlIHBvaW50IGlzXHJcbiAqIGFzc3VtZWQgdG8gbGllIG9uIHRoZSBsaW5lIGRlZmluZWQgYnkgdGhlIHNlZ21lbnQuICovXHJcbmZ1bmN0aW9uIGlzUG9pbnRPblNlZ21lbnQocDogVmVjdG9yMmQsIHMxOiBWZWN0b3IyZCwgczI6IFZlY3RvcjJkKSA6IGJvb2xlYW4ge1xyXG4gIGNvbnN0IGVwc2lsb24gPSAwLjAxO1xyXG4gIGxldCB4SGl0ID0gKE1hdGgubWluKHMxLnggLCBzMi54KSAtIGVwc2lsb24gPD0gcC54KSAmJlxyXG4gICAgICAgICAgICAgKE1hdGgubWF4KHMxLnggLCBzMi54KSArIGVwc2lsb24gPj0gcC54KTtcclxuICBsZXQgeUhpdCA9IChNYXRoLm1pbihzMS55ICwgczIueSkgLSBlcHNpbG9uIDw9IHAueSkgJiZcclxuICAgICAgICAgICAgIChNYXRoLm1heChzMS55ICwgczIueSkgKyBlcHNpbG9uID49IHAueSk7XHJcbiAgcmV0dXJuIHhIaXQgJiYgeUhpdDtcclxufVxyXG5cclxuLyoqIERldGVybWluZXMgd2hldGhlciB0d28gbGluZXMgcCBhbmQgcSBpbnRlcnNlY3QuIElmIHRoZXkgZG8sIHJldHVybnNcclxuICAqIHRoZSBpbnRlcnNlY3Rpb24gcG9pbnQuICovXHJcbmZ1bmN0aW9uIGRvTGluZXNJbnRlcnNlY3QocDogTGluZTJkLCBxOiBMaW5lMmQpIDogVmVjdG9yMmQgfCBudWxsIHtcclxuICBsZXQgZGV0ID0gKHAuYSAqIHEuYikgLSAocS5hICogcC5iKTtcclxuXHJcbiAgaWYgKGRldCA9PSAwKSB7XHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB4OiAocS5iICogcC5jIC0gcC5iICogcS5jKSAvIGRldCxcclxuICAgICAgeTogKHAuYSAqIHEuYyAtIHEuYSAqIHAuYykgLyBkZXRcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbi8qIENvbnZlcnRzIHRoZSBnaXZlbiBwb2ludHMgdG8gYSBMaW5lMmQgdGhhdCBydW5zIHRocm91Z2ggYm90aCBwb2ludHMuICovXHJcbmZ1bmN0aW9uIHBvaW50c1RvTGluZTJkKHAxOiBWZWN0b3IyZCwgcDI6IFZlY3RvcjJkKSA6IExpbmUyZCB7XHJcbiAgcmV0dXJuIHtcclxuICAgIGE6IHAyLnkgLSBwMS55LFxyXG4gICAgYjogcDEueCAtIHAyLngsXHJcbiAgICBjOiAoKHAyLnkgLSBwMS55KSAqIHAxLngpICsgKChwMS54IC0gcDIueCkgKiBwMS55KVxyXG4gIH07XHJcbn1cclxuXHJcbmV4cG9ydCB7YWR2YW5jZVRpbWV9XHJcbiIsImltcG9ydCB7IFBsYW5lIGFzIElQbGFuZSwgVmVjdG9yMmQsIFBhcnRpY2xlLCBXYWxsIH0gZnJvbSAnLi9pbnRlcmZhY2VzJztcclxuXHJcbmZ1bmN0aW9uIHJhbmRvbVJnYlN0cmluZyhsZXR0ZXJzPScwMTIzNDU2Nzg5QUJDREVGJykge1xyXG4gICAgbGV0IGNvbG9yID0gJyMnO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCA2OyBpKysgKSB7XHJcbiAgICAgICAgY29sb3IgKz0gbGV0dGVyc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBsZXR0ZXJzLmxlbmd0aCldO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGNvbG9yO1xyXG59XHJcblxyXG4vKiBQcm92aWRlcyBhIHNpbXBsZSBQbGFuZSBpbXBsZW1lbnRhdGlvbi4gKi9cclxuY2xhc3MgUGxhbmUgaW1wbGVtZW50cyBJUGxhbmUge1xyXG4gIHBhcnRpY2xlczogUGFydGljbGVbXSA9IFtdO1xyXG4gIHdhbGxzOiBXYWxsW10gPSBbXTtcclxuICBncmF2aXR5OiBWZWN0b3IyZDtcclxuXHJcbiAgY29uc3RydWN0b3IoZ3Jhdml0eTogVmVjdG9yMmQpIHtcclxuICAgIHRoaXMuZ3Jhdml0eSA9IGdyYXZpdHk7XHJcbiAgfVxyXG5cclxuICBhZGRQYXJ0aWNsZShwb3M6IFZlY3RvcjJkLCB2ZWw6IFZlY3RvcjJkKSB7XHJcbiAgICAvLyByYW5kb20gZGFyayBjb2xvclxyXG4gICAgbGV0IGNvbCA9IHJhbmRvbVJnYlN0cmluZygnMTIzNDU2Nzg4Jyk7XHJcbiAgICB0aGlzLnBhcnRpY2xlcy5wdXNoKHtwb3M6IHBvcywgdmVsOiB2ZWwsIGNvbDogY29sfSk7XHJcblxyXG4gIH1cclxuICBhZGRXYWxsKHN0YXJ0OiBWZWN0b3IyZCwgZW5kOiBWZWN0b3IyZCkge1xyXG4gICAgdGhpcy53YWxscy5wdXNoKHtzdGFydDogc3RhcnQsIGVuZDogZW5kfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBQbGFuZTtcclxuIiwiaW1wb3J0IHtWZWN0b3IyZH0gZnJvbSAnLi9pbnRlcmZhY2VzJ1xyXG5cclxuLyogRmV0Y2hlcyBjb29yZGluYXRlcyBvbiBjYW52YXMgZnJvbSBtb3VzZSBjbGljayAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3Vyc29yUG9zKGNhbnZhcyA6IEhUTUxDYW52YXNFbGVtZW50LCBldmVudCkgOiBWZWN0b3IyZCB7XHJcbiAgICBsZXQgcmVjdCA9IGNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICAgIGxldCB4ID0gZXZlbnQuY2xpZW50WCAtIHJlY3QubGVmdDtcclxuICAgIGxldCB5ID0gZXZlbnQuY2xpZW50WSAtIHJlY3QudG9wO1xyXG4gICAgcmV0dXJuIHt4OiB4LCB5OiB5fTtcclxufVxyXG5cclxuLyogUmV0dXJucyBhIHJhbmRvbSB2ZWxvY2l0eSBiZXR3ZWVuIDElIC0gNSUgb2YgdGhlIHNpemUgb2YgdGhlIGNhbnZhcyAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmFuZG9tVmVsKGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQpIDogVmVjdG9yMmQge1xyXG4gIGxldCB3ID0gY2FudmFzLndpZHRoO1xyXG4gIGxldCBoID0gY2FudmFzLmhlaWdodDtcclxuICBsZXQgeCA9ICh3ICogMC4wMSkgKyAodyAqIDAuMDQgKiBNYXRoLnJhbmRvbSgpKTtcclxuICBsZXQgeSA9IChoICogMC4wMSkgKyAoaCAqIDAuMDQgKiBNYXRoLnJhbmRvbSgpKTtcclxuICByZXR1cm4ge3g6IHgsIHk6IHl9O1xyXG59XHJcbiJdfQ==
