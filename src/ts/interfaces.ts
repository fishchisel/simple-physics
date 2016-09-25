
/* Represents a two dimenional vector */
interface Vector2d {
  x: number,
  y: number
}

/** A sizeless particle on a 2d plane with position and velocity. Units are
  * meters and meters/second */
interface Particle {
  pos: Vector2d,
  vel: Vector2d
}

/** An immovable line in 2d space */
interface Line {
  start: Vector2d,
  end: Vector2d
}

/** A plane on which things happen */
interface Plane {
  particles: Particle[],
  lines: Line[],
  /* m/s^2 */
  gravity: Vector2d,

  addParticle(pos: Vector2d, vel: Vector2d),
  addLine(start: Vector2d, end: Vector2d)
}


export { Particle, Line, Plane, Vector2d };
