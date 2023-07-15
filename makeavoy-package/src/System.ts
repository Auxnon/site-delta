import { Container } from "./types/Container";
import * as Main from "./Main";
import { APP_IDS, APPS } from "./Main";
import { init } from "./RasterTool";
import AppEnvironment from "./types/AppEnvironment";
import AppShell from "./types/AppShell";
import { BarContainer } from "./types/BarContainer";
import { FolderContainer } from "./types/FolderContainer";
import * as NavLine from "./NavLine";

export class System {
  currentApp?: AppShell;
  positionalData = { x: 0, y: 0 };
  targetMove?: AppShell = undefined;
  resizeDebouncer?: number;
  svg: SVGSVGElement;
  appPoints: { x: number; y: number; app?: AppShell }[] = [];
  containers: Container[] = [];
  mousePos = { x: 0, y: 0 };
  mainBody: HTMLElement;
  mainTitle: HTMLElement;
  /** sets whether apps are sorted in a row or allow free movements */

  constructor() {
    this.mainBody = document.querySelector("#main") as HTMLElement;
    this.svg = document.querySelector("svg") as SVGSVGElement;
    this.mainTitle = document.querySelector("#main-title") as HTMLElement;
    this.mousePos = { x: window.document.body.offsetWidth / 2, y: -200 };
  }

  getBar(): BarContainer {
    return this.containers[0] as BarContainer;
  }

  init() {
    NavLine.init(this.mousePos);
    this.homeInit();
    this.resize(true);
    this.barCalculate(true);
    this.brightnessButtonInit();
    this.animate();
    // setInterval(() => {
    //   this.boundaryCheck();
    // }, 10000);
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("orientationchange", () => this.resize);
    window.addEventListener("pointermove", (ev) => this.mousemove(ev));
    window.addEventListener("pointerdown", (ev) => this.mousemove(ev));
    window.addEventListener("pointerup", (ev) => this.winMouseUp(ev));
    this.mainTitle.addEventListener("click", (ev) => {
      this.closeApp();
    });
    window.addEventListener("recalculate", () => this.barCalculate());
  }

  mousemove(ev: PointerEvent) {
    this.positionalData = {
      x: ev.clientX / document.body.offsetWidth,
      y: ev.clientY / document.body.offsetHeight,
    };
    this.getBar().barMoveHandler(ev);
    if (this.targetMove) {
      NavLine.move();
      this.targetMove.pos = {
        x: ev.clientX + this.targetMove.offset.x,
        y: ev.clientY + this.targetMove.offset.y,
      };

      let targetContainer: number;
      const isOverContainer = this.containers.some((c, i) => {
        if (c.inBounds(ev.clientX, ev.clientY)) {
          if (c.dragOver(this.targetMove)) {
            this.targetMove.containerId = i;
            targetContainer = i;
            return true;
          }
        }
      });

      if (isOverContainer) {
        if (this.targetMove.containerId == 0) {
          this.targetMove.element.style.zIndex = "1";
        } else {
          this.targetMove.element.style.zIndex = "-1";
        }
        this.barCalculate();
      } else if (!this.targetMove.isMoving) {
        //called once per state change
        this.targetMove.isMoving = true;
        // this.targetMove.containerId = 1;
        // this.targetMove.element.style.zIndex = "-1";

        this.barCalculate();
      }

      this.targetMove.draw();
    } else if (NavLine.getState() == 0) {
      // if (this.count > 2) {
      //   this.count = 0;
      //   this.mouseObj = { x: ev.clientX, y: ev.clientY };
      // }
      // this.count++;
    }
  }

  winMouseUp(ev: PointerEvent) {
    const quickMovement = NavLine.getMovement() < 10;
    if (this.getBar().barMove) {
      this.getBar().barMove = false;
      NavLine.setState(1);
      if (quickMovement) {
        this.closeApp();
      }
    }

    if (this.targetMove) {
      this.targetMove.element.classList.remove("appMove");
      if (quickMovement) {
        if (this.currentApp && this.currentApp == this.targetMove) {
          this.targetMove.element.classList.remove("app-max");
          this.targetMove.active = false;
          delete this.currentApp;
          //targetMove.style.zIndex = 2;
          window.history.pushState({}, "", "/");
        } else {
          this.switchApp(this.targetMove.id);
          //window.history.pushState({ appId: targetMove.appId }, targetMove.name, '?id=' + targetMove.appId + '&app=' + targetMove.id);
        }
      } else {
        this.targetMove = undefined;
        this.barCalculate();
      }
    } else {
      this.targetMove = undefined;
      this.barCalculate();
    }
    this.targetMove = undefined;

    NavLine.resetMovement();
  }

  resize(force?: boolean) {
    const closure = () => {
      this.svg.setAttribute("width", document.body.offsetWidth + "px");
      this.svg.setAttribute("height", document.body.offsetHeight + "px");
      this.containers.forEach((c) => c.resize());
      this.getBar().barAdjust(this.mainTitle);
      this.barCalculate();

      Main.rendererPromise.then((r) => r.resize());
      //UI.systemMessage('inner ' + window.innerWidth + '; screen ' + window.screen.width, 'success')
    };

    clearTimeout(this.resizeDebouncer);
    if (force) {
      closure();
    } else {
      this.resizeDebouncer = window.setTimeout(closure, 250);
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
  }

  getContainer(id: number) {
    return this.containers[id];
  }

  appSelect(app: AppShell, ev: PointerEvent) {
    if (!app.active) {
      app.select(ev.clientX, ev.clientY);
      this.targetMove = app;
      this.targetMove.resetMagnet();
    }
  }

  // boundaryCheck() {
  //   APPS.forEach((app) => {
  //     if (app && !app.active) {
  //       const ele = app.element;
  //       let rect = ele.getBoundingClientRect();

  //       let x = rect.left;
  //       let y = rect.top;
  //       let w2 = (rect.right - rect.left) / 2;
  //       let h2 = (rect.bottom - rect.top) / 2;

  //       if (x < 0) {
  //         ele.style.left = w2 + "px";
  //       } else if (x > window.innerWidth - w2 * 2) {
  //         ele.style.left = window.innerWidth - w2 + "px";
  //       }
  //       if (y < 0) {
  //         ele.style.top = h2 + "px";
  //       } else if (y > document.body.offsetHeight - h2 * 2) {
  //         ele.style.top = document.body.offsetHeight - h2 + "px";
  //       }
  //     }
  //   });
  // }

  shrinkTitle() {
    this.mainTitle.classList.add("shrink");
  }

  /** return mouse position relative to window as a percentage */
  getPosPercent() {
    return this.positionalData;
  }

  homeInit() {
    this.containers.push(new BarContainer(0, this.mainBody));
    this.containers.push(new FolderContainer(1, this.mainBody));
    this.containers.push(new FolderContainer(2, this.mainBody));
  }

  barCalculate(notate?: boolean) {
    const appLayers: AppShell[][] = [[]];

    APPS.forEach((app) => {
      if (app) {
        if (!this.containers[app.containerId - 1]) {
          app.containerId = 0;
          appLayers[0].push(app);
        } else {
          if (!appLayers[app.containerId]) appLayers[app.containerId] = [];
          appLayers[app.containerId].push(app);
        }
      }
    });

    // move apps in the bar or in folders to their new positions
    for (let i = 0; i < appLayers.length; i++) {
      this.containers[i].applyApps(appLayers[i], this.targetMove);
    }

    NavLine.calculate(this.getBar().getSize(), this.getBar().sideways);
  }

  // adjustApps(amount: number) {
  //   APPS.forEach((app) => {
  //     if (app && app.active) {
  //       app.adjust(amount);
  //     }
  //   });
  // }

  pendApp(id: number) {
    APPS[id]?.pend();
  }

  switchApp(iid: number | string) {
    this.closeApp();
    let id = 0;
    if (typeof iid === "string") {
      id = APP_IDS[iid];
      if (iid == undefined) return;
    } else {
      id = iid;
    }
    this.openApp(id);
    let ar = Object.keys(APP_IDS);
    let hashString = ar[id - 1]; //as we offset our app ids to start at 1, new arrays need id -1
    if (hashString) window.location.hash = "#" + hashString;
  }

  brightnessButtonInit() {
    let brightness = document.querySelector("#brightness");
    if (brightness) {
      brightness.addEventListener("click", (ev) => {
        if (!brightness?.classList.toggle("brightness--dark")) {
          document.body.classList.add("dark-mode");
        } else {
          document.body.classList.remove("dark-mode");
        }
      });
    }
  }

  async openApp(id: number) {
    const app = APPS[id];
    if (!app) return;

    // app.max();
    app.open();
    app.pend();

    app.instancePromise.then((instance) => {
      if (instance instanceof AppEnvironment) {
        Main.rendererPromise.then((r) => r.setApp(app, instance));
      }
    });
    this.currentApp = app;
  }

  closeApp() {
    this.currentApp?.close();
    window.history.pushState({}, "", "/");

    this.mainTitle.classList.remove("shrink");
  }
}
