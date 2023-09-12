import { Container } from "./types/Container";
import * as Main from "./Main";
import { APP_IDS, APPS } from "./Main";
import { init } from "./RasterTool";
import AppEnvironment from "./types/AppEnvironment";
import AppShell from "./types/AppShell";
import { BarContainer } from "./types/BarContainer";
import { FolderContainer } from "./types/FolderContainer";
import * as NavLine from "./NavLine";
import * as Signature from "./Signature";
import { Cursor, Hover } from "./Cursor";
import { initBackground } from "./Background";
import { cursorMessage, systemMessage } from "./UI";

export class System {
  currentApp?: AppShell;
  positionalData = { x: 0, y: 0 };
  targetMove?: AppShell | Container = undefined;
  resizeDebouncer?: number;
  resizing: boolean = false;
  appPoints: { x: number; y: number; app?: AppShell }[] = [];
  containers: Container[] = [];
  containersHash: { [key: number]: Container } = {};
  containerIterator: number = 1;
  mousePos = { x: 0, y: 0 };
  cursor: Cursor = new Cursor();

  mainBody: HTMLElement;
  mainTitle: HTMLElement;
  mobilePortrait: boolean = false;
  /** sets whether apps are sorted in a row or allow free movements */

  constructor() {
    this.mainBody = document.querySelector("#main") as HTMLElement;
    this.mainTitle = document.querySelector("#main-title") as HTMLElement;
    this.mousePos = { x: window.document.body.offsetWidth / 2, y: -200 };
  }

  getBar(): BarContainer {
    return this.containersHash[0] as BarContainer;
  }

  init() {
    initBackground();
    this.homeInit();
    this.animate();
    // setInterval(() => {
    //   this.boundaryCheck();
    // }, 10000);
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("orientationchange", () => this.resize);
    window.addEventListener("pointermove", (ev) => this.pointerMove(ev));
    window.addEventListener("pointerdown", (ev) => this.pointerMove(ev));
    window.addEventListener("pointerup", (ev) => this.pointerRelease(ev));
    this.mainTitle.addEventListener("click", (ev) => {
      this.closeApp();
    });
    window.addEventListener("recalculate", () => this.calculatePlacements());
    setTimeout(() => {
      this.resize(true);
      this.calculatePlacements(true);
      NavLine.init({ x: window.document.body.offsetWidth / 2, y: -200 });
    }, 1000);
  }

  pointerMove(ev: PointerEvent) {
    this.cursor.hover(Hover.None);
    this.positionalData = {
      x: ev.clientX / document.body.offsetWidth,
      y: ev.clientY / document.body.offsetHeight,
    };
    this.mousePos = { x: ev.clientX, y: ev.clientY };
    this.cursor.move(ev.clientX, ev.clientY);

    this.getBar().barMoveHandler(ev);
    if (this.targetMove) {
      NavLine.move();
      this.targetMove.pos = {
        x: Math.round(ev.clientX + this.targetMove.offset.x),
        y: Math.round(ev.clientY + this.targetMove.offset.y),
      };

      if (this.targetMove instanceof AppShell) {
        const isOverContainer = this.containers.some((c, i) => {
          if (c.inBounds(ev.clientX, ev.clientY)) {
            if (c.dragOver(this.targetMove as AppShell)) {
              console.log("id", i);
              (this.targetMove as AppShell).containerId = i;
              return true;
            }
          }
        });

        if (isOverContainer) {
          // if (this.targetMove.containerId == 0) {
          //   console.log("over bar");
          //   this.targetMove.element.style.zIndex = "1";
          // } else {
          //   console.log("over con");
          //   this.targetMove.element.style.zIndex = "-1";
          // }
          this.targetMove.setZ();
          this.calculatePlacements(true);
        } else {
          this.cursor.hover(Hover.MakeContainer);
          if (!this.targetMove.isMoving) {
            //called once per state change

            this.targetMove.isMoving = true;
            // this.targetMove.containerId = 1;
            // this.targetMove.element.style.zIndex = "-1";

            this.calculatePlacements(true);
          }
        }
      } else {
        // then we have to be a container
        this.checkContainerOrder();

        const h = this.targetMove.getSize().height / 2;
        if (this.targetMove.pos.y > document.body.offsetHeight) {
          this.cursor.hover(Hover.Destroy);
        } else if (this.targetMove.pos.y < h + 96) {
          this.cursor.hover(Hover.Full);
        }
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

  pointerRelease(ev: PointerEvent) {
    this.cursor.hover(Hover.None);
    const quickMovement = NavLine.getMovement() < 10;
    if (this.getBar().barMove) {
      this.getBar().barMove = false;
      NavLine.release();
      if (quickMovement) {
        this.closeApp();
      }
    }

    if (this.targetMove instanceof AppShell) {
      this.targetMove.element.classList.remove("app--moving");
      if (quickMovement) {
        if (this.currentApp && this.currentApp == this.targetMove) {
          this.targetMove.element.classList.remove("app-max");
          this.targetMove.active = false;
          delete this.currentApp;
          //targetMove.style.zIndex = 2;
          window.history.pushState({}, "", "/");
        } else {
          this.switchApp(this.targetMove);
          //window.history.pushState({ appId: targetMove.appId }, targetMove.name, '?id=' + targetMove.appId + '&app=' + targetMove.id);
        }
      } else if (this.cursor.getMode() != Hover.None) {
        switch (this.cursor.getMode()) {
          case Hover.MakeContainer: {
            const id = this.makeContainer();
            this.targetMove.containerId = id;
            setTimeout(() => {
              this.calculatePlacements();
            }, 1);
            break;
          }
        }
      } else {
        this.targetMove = undefined;
        this.calculatePlacements();
      }
    } else if (this.targetMove instanceof Container) {
      switch (this.cursor.getMode()) {
        case Hover.Destroy: {
          this.deleteContainer(this.targetMove);
          break;
        }
        case Hover.Full: {
          this.fullContainer(this.targetMove);
          break;
        }
      }
      const target = this.targetMove;
      this.targetMove = undefined;
      this.calculatePlacements();
      target?.deselect();
    }
    this.targetMove = undefined;
    this.checkEmptyContainers();
    this.unhideApps();

    NavLine.resetMovement();
  }

  resize(force?: boolean) {
    if (!this.resizing) {
      this.resizing = true;
      this.startResizeProcess();
    }
    clearTimeout(this.resizeDebouncer);
    if (force) {
      this.resizedProcess();
    } else {
      this.resizeDebouncer = window.setTimeout(
        () => this.resizedProcess(),
        400
      );
    }
  }

  private resizedProcess() {
    this.resizing = false;
    this.mobilePortrait = window.matchMedia(
      "(min-width: 600px) and (orientation: landscape)"
    ).matches;

    NavLine.resize(document.body.offsetWidth, document.body.offsetHeight);
    Signature.resize(document.body.offsetWidth, document.body.offsetHeight);

    this.containers.forEach((c) => c.resize());
    this.getBar().barAdjust(this.mainTitle);
    this.calculatePlacements();
    APPS.forEach((app) => {
      if (app && app.active) {
        app.resized();
      }
    });

    Main.rendererPromise.then((r) => r.resize());
    //UI.systemMessage('inner ' + window.innerWidth + '; screen ' + window.screen.width, 'success')
  }

  private startResizeProcess() {
    APPS.forEach((app) => {
      if (app && app.active) {
        app.startResize();
      }
    });
  }

  animate() {
    Signature.animate(
      this.mousePos,
      !(!this.currentApp || this.currentApp.isPartial())
    );
    NavLine.animate(this.getBar(), this.mousePos);
    this.cursor.animate();

    requestAnimationFrame(() => this.animate());
  }

  getContainer(id: number) {
    return this.containersHash[id];
  }

  appSelect(app: AppShell, x: number, y: number) {
    if (!app.active) {
      app.select(x, y);
      this.targetMove = app;
      this.targetMove.resetMagnet();
    } else if (app.isPartial() && this.currentApp != app) {
      this.openPartial(app);
    }
  }

  containerDrag(id: number, container: Container, ev: PointerEvent) {
    this.targetMove = container;
    for (let i = 0; i < APPS.length; i++) {
      if (APPS[i] && APPS[i].containerId == id) {
        APPS[i].hide();
        // this.appPoints.push({ x: ev.clientX, y: ev.clientY, app: APPS[i] });
      }
    }
  }

  /** order by x position */
  checkContainerOrder() {
    const check = this.containers.map((c) => c.getId());

    if (document.body.offsetWidth < document.body.offsetHeight)
      this.containers.sort((a, b) => a.pos.y - b.pos.y);
    else this.containers.sort((a, b) => a.pos.x - b.pos.x);

    if (!check.every((a, i) => a == this.containers[i].getId())) {
      this.calculatePlacements();
    }
  }

  unhideApps() {
    for (let i = 0; i < APPS.length; i++) {
      APPS[i]?.show();
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
    const bar = new BarContainer(0, this.mainBody);
    this.containers.push(bar);
    this.containersHash[0] = bar;
    this.makeContainer();
  }

  calculatePlacements(hovering?: boolean) {
    const appLayers: { [key: number]: AppShell[] } = { 0: [] };

    if (this.containers.length == 2) {
      this.containers[1].center();
      this.containers[1].resetStaticPosition();
    } else {
      const count = this.containers.length - 1;
      const width = document.body.offsetWidth;
      const height = document.body.offsetHeight;
      if (this.mobilePortrait) {
        const w = width / count;
        const h = height / 2;
        this.containers.forEach((c, i) => {
          if (i > 0) {
            c.move((i - 0.5) * w, h);
            c.resetStaticPosition();
          }
        });
      } else {
        const w = width / 2;
        const h = height / count;
        this.containers.forEach((c, i) => {
          if (i > 0) {
            c.move(w, (i - 0.5 - 0.2 * (i - 1)) * h);
            c.resetStaticPosition();
          }
        });
      }
    }

    // assign app into array related to it's containerID, if that container is missing place in first folder found, if no folder just drop into the bar
    const backupContainer = this.getFirstFolder();
    APPS.forEach((app) => {
      if (app) {
        if (!this.containersHash[app.containerId]) {
          if (backupContainer) {
            const id = backupContainer.getId();
            app.containerId = id;
            if (!appLayers[id]) appLayers[id] = [];
            appLayers[id].push(app);
          } else {
            this.getFirstFolder();
            app.containerId = 0;
            appLayers[0].push(app);
          }
          if (this.currentApp !== app) {
            app.setZ();
            app.close();
          }
        } else {
          if (!appLayers[app.containerId]) appLayers[app.containerId] = [];
          appLayers[app.containerId].push(app);
        }
      }
    });

    // move apps in the bar or in folders to their new positions
    const target =
      this.targetMove instanceof AppShell ? this.targetMove : undefined;

    for (let i = 0; i < this.containers.length; i++) {
      const c = this.containers[i];
      c.resize();
      const apps = appLayers[c.getId()];
      if (apps) c.applyApps(apps, hovering, target);
    }

    NavLine.calculate(this.getBar().getHandleSize(), this.getBar().sideways);
  }

  // adjustApps(amount: number) {
  //   APPS.forEach((app) => {
  //     if (app && app.active) {
  //       app.adjust(amount);
  //     }
  //   });
  // }

  /** make folder container and return id */
  makeContainer(): number {
    const id = this.containerIterator;
    const container = new FolderContainer(id, this.mainBody);
    this.containerIterator++;
    this.containersHash[id] = container;
    this.containers.push(container);
    return id;
  }

  /** delete container from container arrays and run deconstructor "destory" */
  deleteContainer(target: Container) {
    const ind = this.containers.indexOf(target);
    if (ind > 0) {
      this.containers.splice(ind, 1);
    }
    delete this.containersHash[target.getId()];
    target.destroy();
  }

  fullContainer(target: Container) {
    const id = target.getId();
    this.deleteContainer(target);
    const list: AppShell[] = [];
    APPS.forEach((app) => {
      if (app && app.containerId == id) {
        list.push(app);
      }
    });
    if (list.length == 1) {
      this.switchApp(list[0]);
    }
  }

  /** Find first folder available if any */
  getFirstFolder(): FolderContainer | undefined {
    if (this.containers.length > 1) {
      for (let i = 1; i < this.containers.length; i++) {
        const c = this.containers[i];
        if (c instanceof FolderContainer && !c.isWindowed()) {
          return c;
        }
      }
    }
    return undefined;
  }

  /** check for and remove empty containers */
  checkEmptyContainers() {
    const used = {};
    for (let i = 0; i < APPS.length; i++) {
      if (APPS[i]) {
        used[APPS[i].containerId] = true;
      }
    }
    for (let i = 1; i < this.containers.length; i++) {
      const id = this.containers[i].getId();
      if (!used[id]) {
        this.deleteContainer(this.containers[i]);
      }
    }
  }

  pendApp(id: number) {
    APPS[id]?.pend();
  }

  switchApp(id: number | string | AppShell) {
    if (typeof id === "object") {
      if (this.currentApp != id) this.closeApp();
      if (this.openApp(id))
      window.location.hash = `#${id.instanceClass.toLowerCase()}`;
    } else {
      let numeric_id = 0;
      if (typeof id === "string") {
        numeric_id = APP_IDS[id];
        if (id == undefined) return;
      } else {
        numeric_id = id;
      }
      if (this.openApp(numeric_id)) {
      let hashString = Object.keys(APP_IDS).find(
        (key) => APP_IDS[key] == numeric_id
      );
      if (hashString) window.location.hash = `#${hashString}`;
    }
  }
  }

  openApp(id: number | AppShell): boolean {
    this.checkWrite();
    let app;
    if (typeof id === "number") {
      app = APPS[id];
      if (!app) return false;
    } else {
      app = id;
    }
    if (app.open()) {
      this.currentApp = app;
      document.body.classList.add("full-app");
      return true;
    }
    return false;
  }

  passivePartialOpen(containerId: number) {
    APPS.forEach((app) => {
      if (app && app.containerId == containerId) {
        this.openPartial(app);
      }
    });
  }

  /** Open partially if not a one-off, returns false if one-off function */
  openPartial(app: AppShell, container?: Container): boolean {
    if (app.openPartial(container)) {
      this.currentApp = app;
      return true;
    }
    return false;
  }

  closeApp() {
    this.currentApp?.close();
    this.currentApp = undefined;
    window.history.pushState({}, "", "/");

    // this.mainTitle.classList.remove("shrink");
    document.body.classList.remove("full-app");
  }
}
