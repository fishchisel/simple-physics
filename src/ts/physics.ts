import {Plane} from './interfaces';

/* Advances time on the plane by the given number of seconds, applying
 * velocity and gravity. */
function advanceTime(plane: Plane, seconds: number) : Plane {
  let particles = plane.particles;
  let lines = plane.lines;

  for (let particle of particles) {
      particle.vel.x += plane.gravity.x * seconds;
      particle.vel.y += plane.gravity.y * seconds;

      particle.pos.x += particle.vel.x * seconds;
      particle.pos.y += particle.vel.y * seconds;
  }

  return plane;
}

export {advanceTime}
