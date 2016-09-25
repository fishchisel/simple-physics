import {Plane, Vector2d, Line2d, Particle} from './interfaces';

const PARTICLE_ELASTICITY = 0.9;

/* Advances time on the plane by the given number of seconds, applying
 * velocity and gravity. */
function advanceTime(plane: Plane, seconds: number) : Plane {

  for (let particle of plane.particles) {
    moveParticle(particle, plane, seconds);
  }

  return plane;
}

/* Moves the given particle, bouncing if the particle hits a wall. */
function moveParticle(particle: Particle, plane: Plane, seconds: number) {
  particle.vel.x += plane.gravity.x * seconds;
  particle.vel.y += plane.gravity.y * seconds;

  let desiredMove = {
    x: particle.pos.x + particle.vel.x * seconds,
    y: particle.pos.y + particle.vel.y * seconds
  }

  for (let wall of plane.walls) {
    let intersect = doLineSegmentsIntersect(particle.pos, desiredMove,
                                            wall.start, wall.end);
    if (intersect) {
      let wallLine = pointsToLine2d(wall.start, wall.end);

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
function reflect(p: Vector2d, line: Line2d) : Vector2d {
  let normal = {
    a: -line.b,
    b: line.a,
    c: (-line.b * p.x) + (line.a * p.y)
  }
  let intersect = <Vector2d>doLinesIntersect(line, normal);

  let reflectedPoint =  {
    x: 2*intersect.x - p.x,
    y: 2*intersect.y - p.y
  }

  return reflectedPoint;
}

/* Determines whether two line segments p and q intersect. If they do, returns
 * the intersection point. */
function doLineSegmentsIntersect(p1: Vector2d, p2: Vector2d,
                                 q1: Vector2d, q2: Vector2d) : Vector2d | null {
  let pLine = pointsToLine2d(p1, p2);
  let qLine = pointsToLine2d(q1, q2);

  // If lines are parallel, no intersection
  let intersect = doLinesIntersect(pLine, qLine);
  if (!intersect) return null;

  let p1Hit = isPointOnSegment(intersect, p1, p2);
  let p2Hit = isPointOnSegment(intersect, q1, q2);

  if (p1Hit && p2Hit) {
    return intersect;
  }
  return null;
}

/* Determines whether the given point is on the given line segment. The point is
 * assumed to lie on the line defined by the segment. */
function isPointOnSegment(p: Vector2d, s1: Vector2d, s2: Vector2d) : boolean {
  const epsilon = 0.01;
  let xHit = (Math.min(s1.x , s2.x) - epsilon <= p.x) &&
             (Math.max(s1.x , s2.x) + epsilon >= p.x);
  let yHit = (Math.min(s1.y , s2.y) - epsilon <= p.y) &&
             (Math.max(s1.y , s2.y) + epsilon >= p.y);
  return xHit && yHit;
}

/** Determines whether two lines p and q intersect. If they do, returns
  * the intersection point. */
function doLinesIntersect(p: Line2d, q: Line2d) : Vector2d | null {
  let det = (p.a * q.b) - (q.a * p.b);

  if (det == 0) {
    return null;
  }
  else {
    return {
      x: (q.b * p.c - p.b * q.c) / det,
      y: (p.a * q.c - q.a * p.c) / det
    }
  }
}

/* Converts the given points to a Line2d that runs through both points. */
function pointsToLine2d(p1: Vector2d, p2: Vector2d) : Line2d {
  return {
    a: p2.y - p1.y,
    b: p1.x - p2.x,
    c: ((p2.y - p1.y) * p1.x) + ((p1.x - p2.x) * p1.y)
  };
}

export {advanceTime}
