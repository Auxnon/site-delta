import * as THREE from "./lib/three.module.js";
import * as Render from "./Render.js";
import { system } from "./Main";

//pass in name, and a pointer to a complete function which dictates everything has loaded,
//we keep track inside the mini class by counting  resources and incrementing till count is complete then, complte()
//animate is called every render, deint... not used yet

export class App {
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

export class AppShell {
  instance?: App;
  active: boolean = false;
  isMoving: boolean = false;
  /** offset the cursor has from the element origin */
  offset = { x: 0, y: 0 };
  /** the object position  that will eventually become the html element position*/
  pos = { x: 0, y: 0 };
  /** ID represents a container object, 0 being the bar and 1 being the "home screen" */
  containerId: number = 0;
  constructor(
    public element: HTMLElement,
    public id: number,
    public instanceClass: string
  ) {
    this.containerId = this.id > 5 ? 1 : 0;
    this.element.style.top = Math.random() * document.body.offsetWidth + "px";
    this.element.style.left = Math.random() * document.body.offsetHeight + "px";
  }

  select(cursorX: number, cursorY: number) {
    this.pos = {
      x: parseInt(this.element.style.left),
      y: parseInt(this.element.style.top),
    };
    this.offset = { x: this.pos.x - cursorX, y: this.pos.y - cursorY };
    this.element.classList.add("appMove");
    this.isMoving = false;
    this.element.addEventListener("pointerdown", (ev) => {
      system.appSelect(this, ev);
    });
    this.element.addEventListener("dragstart", (ev) => {
      ev.preventDefault();
    });
    this.element.style.zIndex = `${this.id > 5 ? -1 : 1}`;
  }
  max() {
    // app-max
    this.element.classList.add("app-max");
    this.active = true;
    this.element.style.zIndex = "0";
  }
  adjust(amount: number) {
    this.instance?.adjust(amount);
  }
  clearPend(canvas?: HTMLCanvasElement) {
    const cube = this.element.querySelector("cube");
    if (cube) {
      cube.remove();
    }
    //x clearly we goofed something in the loading process, this only happens with portfolio?
    if (canvas) {
      this.element.appendChild(canvas);
    }
  }
  pend() {
    let cube = document.createElement("cube");
    if (!cube) {
      cube = document.createElement("cube");
      this.element.appendChild(cube);
    }
  }
  move(x: number, y: number, skipDom?: boolean) {
    if (!skipDom) this.pos = { x, y };
    this.element.style.left = x + "px";
    this.element.style.top = y + "px";
  }
  getScene() {
    return this.instance?.scene;
  }
}
