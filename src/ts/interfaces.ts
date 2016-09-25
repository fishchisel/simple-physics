
/* Represents a two dimenional vector */
interface Vector2d {
  x: number,
  y: number
}

/* Represents a line in the form Ax + By = C */
interface Line2d {
  a: number,
  b: number,
  c: number
}

/** A sizeless particle on a 2d plane with position and velocity. Units are
  * meters and meters/second */
interface Particle {
  pos: Vector2d,
  vel: Vector2d,

  /* Color (RGB string) to render the particle. Please excuse the view / logic
   * bleed through. */
  col?: string
}

/** An immovable barrier in 2d space */
interface Wall {
  start: Vector2d,
  end: Vector2d
}

/** A plane on which things happen */
interface Plane {
  particles: Particle[],
  walls: Wall[],
  /* m/s^2 */
  gravity: Vector2d,

  addParticle(pos: Vector2d, vel: Vector2d),
  addWall(start: Vector2d, end: Vector2d)
}


export { Particle, Wall, Plane, Vector2d, Line2d };
