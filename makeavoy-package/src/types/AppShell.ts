import AppEnvironment from "./AppEnvironment";
import { renderer, rendererPromise, systemInstance } from "../Main.js";
import attachIcon from "../Shaper";
import { Position } from "./Position";
import { Container } from "./Container";
import "../style/app.scss";

enum AppStatus {
  Full,
  Partial,
  None,
}

export interface AppLocation {
  id: number;
  x: number;
  y: number;
}
export default class AppShell {
  element: HTMLElement;
  preloader?: () => Promise<AppEnvironment | void>;
  instancePromise?: Promise<AppEnvironment | void>;
  active: boolean = false;
  openHook?: () => void;
  status: AppStatus = AppStatus.None;
  isMoving: boolean = false;
  /** offset the cursor has from the element origin */
  offset: Position = { x: 0, y: 0 };
  /** the object position  that will eventually become the html element position*/
  pos: Position = { x: 0, y: 0 };
  magnetPos: Position = { x: 0, y: 0 };
  /** ID represents a container object, 0 being the bar, 1 being the home screen, etc*/
  private containerId: number = 0;
  containerHistory?: number;
  failed: boolean = false;
  /** a render override that always takes priority */
  sizeOverride?: { width: number; height: number };
  /** current size as dictated by a container in partial mode */
  partialSize?: { width: number; height: number };

  /** Pass in parameters to create an app including the async module to load. Replace the module loader with a function instead to treat the app shell like a button*/
  constructor(
    host: HTMLElement,
    public id: number,
    public instanceClass: string,
    public asset: string,
    moduleLoader: Promise<any> | (() => void)
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
      systemInstance.appSelect(this, ev.clientX, ev.clientY);
    });
    this.element.addEventListener("dragstart", (ev) => {
      ev.preventDefault();
    });
    this.element.classList.add("app-" + this.instanceClass.toLowerCase());
    host.appendChild(this.element);

    if (moduleLoader instanceof Promise) {
      this.preloader = async () => {
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
      };
    } else {
      this.openHook = moduleLoader;
    }
  }

  select(cursorX: number, cursorY: number) {
    this.pos = {
      x: parseInt(this.element.style.left),
      y: parseInt(this.element.style.top),
    };
    this.offset = { x: this.pos.x - cursorX, y: this.pos.y - cursorY };
    this.element.classList.add("app--moving");
    this.isMoving = false;

    this.element.style.zIndex = `${this.id > 5 ? -1 : 1}`;
  }

  hide() {
    this.element.style.opacity = "0";
  }

  show() {
    this.element.style.opacity = "1";
  }
  /** runs open method, which is either an application or a singular one-off function. Returns false for one-offs*/
  open(): boolean {
    this.reset();
    if (this.openHook) {
      this.openHook();
      return false;
    }
    this.max();
    this.openLogic();
    return true;
  }

  isOneOff() {
    return this.openHook != undefined;
  }

  reset() {
    this.partialSize = undefined;
  }

  /** set container id and set history of last container */
  setContainerId(id: number) {
    this.containerHistory = this.containerId;
    this.containerId = id;
  }

  getContainerId() {
    return this.containerId;
  }

  openPartial(container?: Container): boolean {
    if (this.openHook) {
      return false;
    }
    if (container) {
      this.partial(container);
      this.partialSize = container.size;
    }
    this.openLogic();
    if (container) this.centerTo(container);
    return true;
  }

  private openLogic() {
    this.pend();
    if (this.preloader) {
      this.instancePromise = this.preloader();
      this.preloader = undefined;
    }
    this.instancePromise?.then((instance) => {
      if (instance instanceof AppEnvironment) {
        rendererPromise.then((r) => r.setApp(this, instance));
      }
    });
  }

  /** provide the render canvas to this app shell, completing the opening processes */
  applyCanvas(canvas: HTMLElement) {
    let current = this.element.querySelector(".canvas-holder");
    if (current == canvas) {
      this.loadInstance(canvas);
      return;
    }
    if (current) current.remove();
    this.element.appendChild(canvas);

    this.loadInstance(canvas);
  }

  isPartial() {
    return this.status == AppStatus.Partial;
  }

  /** runs app close procedures like minimize */
  close() {
    this.reset();
    this.min();
  }

  pend() {
    let cube = document.querySelector(".loader");
    if (!cube) {
      cube = document.createElement("div");
      cube.classList.add("loader");
      const cubeInner = document.createElement("cube");
      cube.appendChild(cubeInner);

      this.element.appendChild(cube);
    }
  }

  /** fit to whole screen */
  max() {
    // app-max
    this.element.classList.remove("app-partial");
    this.element.classList.add("app-max");
    this.active = true;
    this.status = AppStatus.Full;
    this.element.style.zIndex = "0";
  }

  partial(target: Container) {
    this.element.classList.remove("app-max");
    this.element.classList.add("app-partial");
    this.active = true;
    this.status = AppStatus.Partial;
    this.element.style.zIndex = "0";
    this.centerTo(target);
  }

  /** Center to a container */
  centerTo(target: Container) {
    this.move(target.pos.x, target.pos.y);
    this.element.style.setProperty("--partial-width", `${target.size.width}px`);
    this.element.style.setProperty(
      "--partial-height",
      `${target.size.height}px`
    );
  }

  /** sets the zIndex based on whether app is within a bar or within a container */
  setZ() {
    if (this.containerId > 0) this.element.style.zIndex = "-1";
    else this.element.style.zIndex = "1";
  }

  min() {
    this.element.classList.remove("app-max", "app-partial");
    this.active = false;
    this.status = AppStatus.None;
    this.setZ();

    this.instancePromise?.then((instance) => {
      if (instance instanceof AppEnvironment) {
        instance.close();
      }
    });
    this.clearPend();

    //  this.focused=undefined;
  }

  adjust(amount: number) {
    this.instancePromise?.then((instance) => {
      if (instance instanceof AppEnvironment) {
        instance.adjust(amount);
      }
    });
  }

  loadInstance(canvas?: HTMLElement) {
    this.instancePromise?.then((instance) => {
      if (instance instanceof AppEnvironment) {
        instance.open(canvas);
        this.clearPend();
      }
    });
  }

  clearPend() {
    this.element.querySelector(".loader")?.remove();
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

  incrementPosition(p: Position) {
    this.pos.x += p.x;
    this.pos.y += p.y;
    this.draw();
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

  startResize() {
    if (this.active)
      this.instancePromise?.then((instance) => {
        if (instance instanceof AppEnvironment) {
          instance.startResize();
        }
      });
  }

  resized() {
    if (this.active)
      this.instancePromise?.then((instance) => {
        if (instance instanceof AppEnvironment) {
          instance.resized();
        }
      });
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

  getPartialSize() {
    return this.partialSize;
  }

  // getScene() {
  //   return this.instance?.scene;
  // }
}
