import {Vector2d} from './interfaces'

/* Fetches coordinates on canvas from mouse click */
export function getCursorPos(canvas : HTMLCanvasElement, event) : Vector2d {
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    return {x: x, y: y};
}

/* Returns a random velocity between 1% - 5% of the size of the canvas */
export function getRandomVel(canvas: HTMLCanvasElement) : Vector2d {
  let w = canvas.width;
  let h = canvas.height;
  let x = (w * 0.01) + (w * 0.04 * Math.random());
  let y = (h * 0.01) + (h * 0.04 * Math.random());
  return {x: x, y: y};
}
