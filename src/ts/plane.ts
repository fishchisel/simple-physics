import { Plane as IPlane, Vector2d, Particle, Wall } from './interfaces';

function randomRgbString(letters='0123456789ABCDEF') {
    let color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * letters.length)];
    }
    return color;
}

/* Provides a simple Plane implementation. */
class Plane implements IPlane {
  particles: Particle[] = [];
  walls: Wall[] = [];
  gravity: Vector2d;

  constructor(gravity: Vector2d) {
    this.gravity = gravity;
  }

  addParticle(pos: Vector2d, vel: Vector2d) {
    // random dark color
    let col = randomRgbString('123456788');
    this.particles.push({pos: pos, vel: vel, col: col});

  }
  addWall(start: Vector2d, end: Vector2d) {
    this.walls.push({start: start, end: end});
  }
}

export default Plane;
