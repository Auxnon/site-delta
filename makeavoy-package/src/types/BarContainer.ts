import AppShell from "./AppShell";
import { Container } from "./Container";
import { systemInstance } from "../Main";

export class BarContainer extends Container {
  sideways: boolean = false;
  appPoints: { x: number; y: number }[];
  appDrawer?: AppShell;
  private maxAppsBeforeDrawer: number = 8;

  constructor(id: number, target: HTMLElement) {
    super(id, target);
    this.element.classList.add("bar-container");

    this.handle.style.width = "80%";
    /*barHandle.addEventListener('pointerup',ev=>{
        barMove=false;
    })*/

    this.appPoints = [];

    this.element.style.left = "50%";
    this.element.style.top = document.body.offsetHeight - 64 + "px";
  }

  applyApps(apps: AppShell[], hovering?: boolean, targetApp?: AppShell) {
    const sideWays = this.barPos == 0 || this.barPos == 2;
    this.sideways = sideWays;

    // Check if we need an app drawer
    const needsDrawer = this.checkCapacity(apps);
    let visibleApps = apps;
    let hiddenApps: AppShell[] = [];

    if (needsDrawer) {
      // Split apps into visible and hidden
      visibleApps = apps.slice(0, this.maxAppsBeforeDrawer - 1);
      hiddenApps = apps.slice(this.maxAppsBeforeDrawer - 1);

      // Create or update app drawer
      if (!this.appDrawer) {
        this.appDrawer = this.createAppDrawer();
      }

      // Add drawer to visible apps
      visibleApps.push(this.appDrawer);

      // Hide overflow apps
      hiddenApps.forEach((app) => {
        app.hide();
        app.element.style.pointerEvents = "none";
      });

      // Update drawer with hidden apps
      this.updateAppDrawer(hiddenApps);
    } else {
      // Remove app drawer if it exists
      if (this.appDrawer) {
        this.removeAppDrawer();
      }

      // Show all apps
      apps.forEach((app) => {
        app.show();
        app.element.style.pointerEvents = "auto";
      });
    }

    const appBarCount = visibleApps.length;
    const dim = (appBarCount > 0 ? appBarCount : 1) * 72;

    if (sideWays) {
      this.element.style.height = dim + "px";
      if (dim !== this.size.height) this.resize();
      this.element.style.width = "72px";
    } else {
      this.element.style.width = dim + "px";
      if (dim !== this.size.width) this.resize();
      this.element.style.height = "72px";
    }

    let width = this.size.width;
    let height = this.size.height;

    let ratio;
    if (sideWays) ratio = height / appBarCount;
    else ratio = width / appBarCount;

    // Sort visible apps
    if (sideWays)
      visibleApps.sort(function (a, b) {
        return parseInt(a.element.style.top) - parseInt(b.element.style.top);
      });
    else
      visibleApps.sort(function (a, b) {
        return parseInt(a.element.style.left) - parseInt(b.element.style.left);
      });

    // Position visible apps
    visibleApps.forEach((app, index) => {
      let id = app.id;
      if (sideWays)
        this.appPoints[id] = {
          x: this.size.left + width / 2,
          y: 36 + this.size.top + index * ratio,
        };
      else
        this.appPoints[id] = {
          x: 36 + this.size.left + index * ratio,
          y: this.size.top + height / 2,
        };

      if (targetApp && targetApp == app)
        app.setMagnet(this.appPoints[id].x, this.appPoints[id].y);
      else app.move(this.appPoints[id].x, this.appPoints[id].y);
    });
  }

  resize() {
    this.barAdjust();
    super.resize();
  }

  barAdjust() {
    if (this.barPos == 2) {
      //right
      this.element.style.left = document.body.offsetWidth - 64 + "px";
      this.element.style.top = "50%"; //window.innerHeight/2;
      // this.barHandle.style.transform = "translate(-200%,-50%)";
      // this.barHandle.style.width = "32px";
      // this.barHandle.style.height = "80%";
    } else if (this.barPos == 3) {
      //top
      // this.barHandle.style.transform = "translate(-50%,100%)";
      this.element.style.left = "50%";
      this.element.style.top = "64px"; //-196+window.innerWidth/2
      // this.barHandle.style.height = "32px";
      // this.barHandle.style.width = "80%";
    } else if (this.barPos == 1) {
      //bottom
      // this.barHandle.style.transform = "translate(-50%,-200%)";
      this.element.style.left = "50%";
      this.element.style.top = document.body.offsetHeight - 64 + "px"; //-196+window.innerWidth/2
      // this.barHandle.style.height = "32px";
      // this.barHandle.style.width = "80%";
    } else {
      //left
      // this.barHandle.style.transform = "translate(100%,-50%)";
      this.element.style.left = "64px";
      this.element.style.top = "50%";
      // this.barHandle.style.width = "32px";
      // this.barHandle.style.height = "80%";
    }
  }

  barMoveHandler(ev: PointerEvent) {
    // TODO should we fix this
    return;
    if (this.barMove) {
      // this.barMoveFactor++;
      let xx = ev.clientX;
      let yy = ev.clientY;
      let dx = xx - document.body.offsetWidth / 2;
      let dy = yy - document.body.offsetHeight / 2;
      let r = Math.atan2(dy, dx) / Math.PI;
      let ar = Math.abs(r);
      if (ar < 0.25) {
        //right
        if (this.barPos != 2) {
          this.barPos = 2;
        }
      } else if (ar < 0.75) {
        //top or bottom
        if (r < 0) {
          //top
          if (this.barPos != 3) {
            this.barPos = 3;
          }
        } else {
          //botttom
          if (this.barPos != 1) {
            this.barPos = 1;
          }
        }
      } else {
        //left
        if (this.barPos != 0) {
          this.barPos = 0;
        }
      }
    }
  }

  dragOver(target: AppShell): boolean {
    console.log("over bar");
    let point = target.magnetPos;
    let d = {
      x: point.x - target.pos.x,
      y: point.y - target.pos.y,
    };
    target.pos = { x: point.x - d.x / 3, y: point.y - d.y / 3 };
    if (target.isMoving) {
      //called once per state change
      target.isMoving = false;
      target.setContainerId(0);
      target.element.style.zIndex = "1";
    }
    return true;
  }

  animate() {}

  calculate(notate?: boolean) {}
  drawActionLine(): void {}
  addActionLine(): void {}
  select(): void {}

  private checkCapacity(apps: AppShell[]): boolean {
    // For bar container, check if apps would overflow the screen
    const sideWays = this.barPos == 0 || this.barPos == 2;
    const appSize = 72; // Size of each app
    const requiredSpace = apps.length * appSize;

    if (sideWays) {
      return requiredSpace > document.body.offsetHeight - 128; // Leave some margin
    } else {
      return requiredSpace > document.body.offsetWidth - 128; // Leave some margin
    }
  }

  private createAppDrawer(): AppShell {
    const drawerId = 9999; // Special ID for app drawer
    const drawer = systemInstance.createAppDrawer(drawerId, this.id);
    drawer.element.classList.add("app-drawer-shell");
    return drawer;
  }

  private updateAppDrawer(hiddenApps: AppShell[]) {
    if (this.appDrawer) {
      // This will be handled by the AppDrawer instance
      systemInstance.updateAppDrawer(this.appDrawer, hiddenApps, this.id);
    }
  }

  private removeAppDrawer() {
    if (this.appDrawer) {
      systemInstance.removeAppDrawer(this.appDrawer);
      this.appDrawer = undefined;
    }
  }
}
