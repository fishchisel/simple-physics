import {Plane, Particle, Line} from './interfaces';

const PARTICLE_RADIUS = 3;
const LINE_WIDTH = 2;

/** Clears the given canvas and draws on it the contents of the given plane. */
function draw (plane: Plane, canvas: HTMLCanvasElement) {

  let ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let particle of plane.particles) {
      drawParticle(particle, ctx);
    }

    for (let line of plane.lines) {
      drawLine(line, ctx);
    }
  }
}

/* Draws the given particle */
function drawParticle(particle: Particle, ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.lineWidth = 1;
  ctx.arc(particle.pos.x, particle.pos.y, PARTICLE_RADIUS, 0, 360);
  ctx.fill();
}

/* Drags the given line */
function drawLine(line: Line, ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.lineWidth = LINE_WIDTH;
  ctx.moveTo(line.start.x, line.start.y);
  ctx.lineTo(line.end.x, line.end.y);
  ctx.stroke();
}

export {draw};
