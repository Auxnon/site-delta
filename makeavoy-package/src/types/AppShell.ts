import AppEnvironment from "./AppEnvironment";
import { renderer, systemInstance } from "../Main.js";
import attachIcon from "../Shaper";
import { Position } from "./Position";
import { Container } from "./Container";

export interface AppLocation {
  id: number;
  x: number;
  y: number;
}
export default class AppShell {
  element: HTMLElement;
  instancePromise: Promise<AppEnvironment | void>;
  active: boolean = false;
  isMoving: boolean = false;
  /** offset the cursor has from the element origin */
  offset: Position = { x: 0, y: 0 };
  /** the object position  that will eventually become the html element position*/
  pos: Position = { x: 0, y: 0 };
  magnetPos: Position = { x: 0, y: 0 };
  /** ID represents a container object, 0 being the bar, 1 being the home screen, etc*/
  containerId: number = 0;
  failed: boolean = false;
  constructor(
    host: HTMLElement,
    public id: number,
    public instanceClass: string,
    public asset: string,
    moduleLoader: Promise<any>
  ) {
    this.element = document.createElement("app");
    this.element.id = "app" + id;
    this.element.classList.add("app");
    const icon = document.createElement("div");
    icon.classList.add("app-icon");
    attachIcon(icon, asset);
    this.element.appendChild(icon);
    this.containerId = this.id > 5 ? 1 : 0;
    this.pos.x = Math.random() * document.body.offsetWidth;
    this.pos.y = Math.random() * document.body.offsetHeight;
    this.draw();
    this.setZ();
    this.element.addEventListener("pointerdown", (ev) => {
      systemInstance.appSelect(this, ev);
    });
    this.element.addEventListener("dragstart", (ev) => {
      ev.preventDefault();
    });
    host.appendChild(this.element);

    this.instancePromise = (async () => {
      const module = await moduleLoader;
      // module
      const app: any = new module.default(this.element, this.id);
      if (!(app instanceof AppEnvironment)) {
        this.failed = true;
        return undefined;
      }
      app.completed;
      await app.onCompletion();

      return app;

      // const app: App = Object.create(module); ////window[instanceClass].prototype);
      // app.constructor.apply(app, element);
      // if (app && app instanceof App) {
      //   this.instance = app;
      //   this.instanceLoaded = true;
      // }
    })();
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

  open(canvas?: HTMLElement) {
    // this.max();
    this.partial(systemInstance.getContainer(this.containerId));
    if (canvas) this.element.appendChild(canvas);
    this.loadInstance(canvas);
  }

  close() {
    this.min();
  }

  pend() {
    let cube = document.querySelector("cube");
    if (!cube) {
      cube = document.createElement("cube");
      this.element.appendChild(cube);
    }
  }

  /** fit to whole screen */
  max() {
    // app-max
    this.element.classList.add("app-max");
    this.active = true;
    this.element.style.zIndex = "0";
  }

  partial(target: Container) {
    this.element.classList.add("app-partial");
    this.active = true;
    this.element.style.zIndex = "0";
    this.move(
      target.size.width / 2 + target.size.x,
      target.size.height / 2 + target.size.y
    );
    this.element.style.setProperty("--partial-width", `${target.size.width}px`);
    this.element.style.setProperty(
      "--partial-height",
      `${target.size.height}px`
    );
  }

  setZ() {
    if (this.containerId >= 1) this.element.style.zIndex = "-1";
    else this.element.style.zIndex = "1";
  }

  min() {
    this.element.classList.remove("app-max", "app-partial");
    this.active = false;
    this.setZ();

    this.instancePromise.then((instance) => {
      if (instance instanceof AppEnvironment) {
        instance.close();
      }
    });

    //  this.focused=undefined;
  }

  adjust(amount: number) {
    this.instancePromise.then((instance) => {
      if (instance instanceof AppEnvironment) {
        instance.adjust(amount);
      }
    });
  }

  loadInstance(canvas?: HTMLElement) {
    this.instancePromise.then((instance) => {
      if (instance instanceof AppEnvironment) {
        instance.open(canvas);
        this.clearPend();
      }
    });
  }

  clearPend() {
    this.element.querySelector("cube")?.remove();
    //x clearly we goofed something in the loading process, this only happens with portfolio?
    //  if (canvas) {
    //   this.element.appendChild(canvas);
    // }
  }

  move(x: number, y: number, skipDom?: boolean) {
    if (!skipDom) this.pos = { x, y };
    this.element.style.left = x + "px";
    this.element.style.top = y + "px";
  }
  resetMagnet() {
    this.magnetPos = { x: this.pos.x, y: this.pos.y };
  }
  setMagnet(x: number, y: number) {
    this.magnetPos = { x, y };
  }
  draw() {
    this.element.style.left = this.pos.x + "px";
    this.element.style.top = this.pos.y + "px";
  }

  /** assure element is within parameters of x,y,width, and height */
  constrain(x: number, y: number, width: number, height: number) {
    const rect = this.element.getBoundingClientRect();
    const aw = rect.width / 2;
    const ah = rect.height / 2;

    if (this.pos.x - aw < x) {
      this.pos.x = x + aw;
    } else if (this.pos.x + aw > x + width) {
      this.pos.x = x + width - aw;
    }

    if (this.pos.y - ah < y) {
      this.pos.y = y + ah;
    } else if (this.pos.y + ah > y + height) {
      this.pos.y = y + height - ah;
    }

    this.draw();
  }

  // getScene() {
  //   return this.instance?.scene;
  // }
}
