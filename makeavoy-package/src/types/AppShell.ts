import App from "./App";
import { systemInstance } from "../Main.js";

export default class AppShell {
  instance?: App;
  instanceLoaded: boolean = false;
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
    public instanceClass: string,
    moduleLoader: Promise<any>
  ) {
    this.containerId = this.id > 5 ? 1 : 0;
    this.element.style.top = Math.random() * document.body.offsetWidth + "px";
    this.element.style.left = Math.random() * document.body.offsetHeight + "px";
    this.element.addEventListener("pointerdown", (ev) => {
      systemInstance.appSelect(this, ev);
    });
    this.element.addEventListener("dragstart", (ev) => {
      ev.preventDefault();
    });
    moduleLoader.then((module) => {
      // module
      const app: App = new module.default(this.element);
      if (app instanceof App) {
        this.instance = app;
        this.instanceLoaded = true;
      }
      // const app: App = Object.create(module); ////window[instanceClass].prototype);
      // app.constructor.apply(app, element);
      // if (app && app instanceof App) {
      //   this.instance = app;
      //   this.instanceLoaded = true;
      // }
    });
  }

  select(cursorX: number, cursorY: number) {
    this.pos = {
      x: parseInt(this.element.style.left),
      y: parseInt(this.element.style.top),
    };
    this.offset = { x: this.pos.x - cursorX, y: this.pos.y - cursorY };
    this.element.classList.add("appMove");
    this.isMoving = false;

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
