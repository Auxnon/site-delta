// import * as THREE from "./lib/three.module.js";
import * as THREE from "three";
import * as Render from "../Render.js";

//pass in name, and a pointer to a complete function which dictates everything has loaded,
//we keep track inside the mini class by counting  resources and incrementing till count is complete then, complte()
//animate is called every render, deint... not used yet

export default abstract class AppEnvironment {
  // offset: { x: number; y: number };
  container: number;
  sizeOverride?: { width: number; height: number };
  scene: THREE.Scene;
  /** Use to set app as fully loaded*/
  resolver: (a?: any) => void;
  completed = new Promise((resolve) => {
    console.log("completed" + this.id);
    this.resolver = (a) => {
      console.log("resolved", this.id, a);
      resolve(a);
    };
  });
  constructor(public element: HTMLElement, public id: number) {}

  onCompletion(): Promise<unknown> {
    return this.completed;
  }
  //runs every frame
  animate(delta) {}

  //unused for now, would deload everything for memory reasons
  deinit() {}

  //called when toggled to this app, on a page load with app ideally it would run init and immediately run open after
  //also passes in the canvas in case the app wants to do something wacky with it like resize it or place it somewhere else
  //return true if changes were made and it wont follow the default
  open(canvas?: HTMLElement) {}
  //called when app is closed out for another one
  close() {}
  adjust(amount: number) {}
  resized() {}
  startResize() {}
}
