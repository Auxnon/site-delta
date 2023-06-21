// import * as THREE from "./lib/three.module.js";
import * as THREE from "three";
import * as Render from "../Render.js";

//pass in name, and a pointer to a complete function which dictates everything has loaded,
//we keep track inside the mini class by counting  resources and incrementing till count is complete then, complte()
//animate is called every render, deint... not used yet

export default class App {
  id = 0;
  // offset: { x: number; y: number };
  container: number;
  sizeOverride?: { width: number; height: number };
  scene: THREE.Scene;
  /** Use to set app as fully loaded, use completed field for promise */
  resolver: (a?: any) => void;
  completed = new Promise((resolve) => {
    this.resolver = resolve;
  });
  constructor(public element: HTMLElement) {}
  //called at first run, plugs in all the goods
  init(index, dom, complete) {}

  //runs every frame
  animate(delta) {}

  //unused for now, would deload everything for memory reasons
  deinit() {}

  //called when toggled to this app, on a page load with app ideally it would run init and immediately run open after
  //also passes in the canvas in case the app wants to do something wacky with it like resize it or place it somewhere else
  //return true if changes were made and it wont follow the default
  open(canvas) {}
  //called when app is closed out for another one
  close() {}
  adjust(amount: number) {}
}
