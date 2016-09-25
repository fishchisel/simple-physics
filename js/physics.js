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
