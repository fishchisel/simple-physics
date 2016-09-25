import {Plane, Particle, Wall} from './interfaces';

const PARTICLE_RADIUS = 3;
const LINE_WIDTH = 2;

let shouldClear = true;

let toggleClear = () => shouldClear = !shouldClear;

/** Clears the given canvas and draws on it the contents of the given plane. */
function draw (plane: Plane, canvas: HTMLCanvasElement) {

  let ctx = canvas.getContext("2d");
  if (ctx) {
    if (shouldClear) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    for (let particle of plane.particles) {
      drawParticle(particle, ctx);
    }

    for (let wall of plane.walls) {
      drawWall(wall, ctx);
    }
  }
}

/* Draws the given particle */
function drawParticle(particle: Particle, ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.lineWidth = 1;
  ctx.arc(particle.pos.x, particle.pos.y, PARTICLE_RADIUS, 0, 360);
  if (particle.col) ctx.fillStyle = particle.col;
  
  ctx.fill();
}

/* Drags the given line */
function drawWall(wall: Wall, ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.lineWidth = LINE_WIDTH;
  ctx.moveTo(wall.start.x, wall.start.y);
  ctx.lineTo(wall.end.x, wall.end.y);
  ctx.stroke();
}

export {draw, toggleClear};
