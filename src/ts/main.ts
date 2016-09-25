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
  attachTrailsHandler();
  //addParticles(plane,canvas,5);
  addWalls(plane,canvas);
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

/* Adds walls around the canvas edge */
function addWalls(plane: Plane, canvas: HTMLCanvasElement) {
  let p1 = {x: 10, y: 10};
  let p2 = {x: 10, y: canvas.height - 10};
  let p3 = {x: canvas.width - 10, y: canvas.height - 10};
  let p4 = {x : canvas.width - 10, y: 10 };

  plane.addWall(p1,p2);
  plane.addWall(p2,p3);
  plane.addWall(p3,p4);
  plane.addWall(p4,p1);
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

      if (evt.altKey) { // Draw Wall
        plane.addWall(startPos, pos);
      }
      else if (evt.ctrlKey) { // Change gravity
        let vel = {x: pos.x - startPos.x, y: pos.y - startPos.y};
        plane.gravity = vel;
      }
      else { // Draw particle
        let vel = {x: pos.x - startPos.x, y: pos.y - startPos.y};
        plane.addParticle(pos, vel);
      }
      startPos = null;
    }
  };
}

/* Spacebar turns trails on/off for particles */
function attachTrailsHandler() {
  const SPACE_BAR = 32;
  document.onkeypress = function (e) {
    console.log("test", e);
    if (e.charCode == SPACE_BAR) {
      draw.toggleClear();
    }
  }
}

//
start();
