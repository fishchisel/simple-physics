simple-physics
==============

A simple physics simulation in typescript. Spawn particles and walls, change
gravity, and watch stuff bounce around.

Demo
----
https://fishchisel.github.io/simple-physics/

Commands
--------

* Install: `npm install && npm install -g gulp typescript`
* Host locally: `gulp`
* Push to gh-pages: `gulp publish`

Architecture
------------

* All code is typescript (other than the gulp file).
* **interfaces.ts** and **plane.ts** define interfaces/objects that represent
  the world:
 * **Walls** are 2d lines that do not move;
 * **Particles** are 2d point masses that are subject to gravity. They bounce
   off walls but not each other;
 * **Planes** are collections of walls and particles in a 2d space with a fixed
   gravity vector.
* **draw.ts** draws a given plane onto the given canvas.
* **physics.ts** updates a given plane based on a given time delta.
* **main.ts** Starts a main loop in which to redraw and update physics, and
  binds event handlers to respond to mouse and keyboard input.
