import * as physics from './physics';
import * as draw from './draw';
import Plane from './plane';
import * as util from './util';
import {Vector2d} from './interfaces';

let MIN_MS_BETWEEN_UPDATES = 20; // ~50 FPS

/* Starts the main loop */
function animate(canvas: HTMLCanvasElement, plane: Plane) {
  let lastUpdateTime;

  // Handles all animation frames after the first
  function update(timestamp: number) {
    requestAnimationFrame(update);

    if (timestamp < lastUpdateTime + MIN_MS_BETWEEN_UPDATES) {
      return;
    }
    physics.advanceTime(plane, (timestamp - lastUpdateTime) / 1000);
    draw.draw(plane, canvas);
    lastUpdateTime = timestamp;
  }

  // Perform initial setup then set animation running.
  requestAnimationFrame(function(timestamp) {
    lastUpdateTime = timestamp;
    requestAnimationFrame(update);
  });
};

/* Creates initial objects and starts the main loop */
function start() {
  let plane = new Plane({x: 0, y:30});

  let canvas = <HTMLCanvasElement>document.getElementById('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  attachDragHandler(canvas, plane);
  addParticles(plane,canvas,10);
  animate(canvas, plane);
}

/* Adds 'num' random particles to the plane */
function addParticles(plane: Plane, canvas: HTMLCanvasElement, num: number) {
  for (let i = 0; i < num; i++) {
    let pos = {x: canvas.width / 2, y: canvas.height / 2};
    let vel = util.getRandomVel(canvas);
    plane.addParticle(pos,vel);
  }
}

/* Attaches events to the canvas to faciliate new particle creation. */
function attachDragHandler(canvas: HTMLCanvasElement, plane: Plane) {
  let startPos : Vector2d | null;
  canvas.onmousedown = function(evt) {
    startPos = util.getCursorPos(canvas, evt);
  };
  canvas.onmouseup = function(evt) {
    if (startPos != null) {
      let pos = util.getCursorPos(canvas,evt);
      let vel = {x: pos.x - startPos.x, y: pos.y - startPos.y};
      plane.addParticle(pos, vel);
      startPos = null;
    }
  };
}

//
start();
