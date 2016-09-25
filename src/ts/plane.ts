import { Plane as IPlane, Vector2d, Particle, Line } from './interfaces';

/* Provides a simple Plane implementation. */
class Plane implements IPlane {
  particles: Particle[] = [];
  lines: Line[] = [];
  gravity: Vector2d;

  constructor(gravity: Vector2d) {
    this.gravity = gravity;
  }

  addParticle(pos: Vector2d, vel: Vector2d) {
    this.particles.push({pos: pos, vel: vel});
  }
  addLine(start: Vector2d, end: Vector2d) {
    this.lines.push({start: start, end: end});
  }
}

export default Plane;
