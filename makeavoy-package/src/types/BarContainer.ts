import AppShell from "./AppShell";
import { Container } from "./Container";
import * as NavLine from "../NavLine";

export class BarContainer extends Container {
  barHandle: HTMLElement;
  /** Position of bar on the screen */
  barPos: number = 1;
  sideways: boolean = false;
  barMove: boolean = false;
  appPoints: { x: number; y: number }[];

  constructor(id: number, target: HTMLElement) {
    super(id, target);
    this.element.classList.add("bar-container");
    this.barHandle = document.createElement("div");
    this.barHandle.classList.add("bar-handle");
    this.element.appendChild(this.barHandle);

    /*barHandle.addEventListener('pointerup',ev=>{
        barMove=false;
    })*/

    this.appPoints = [];

    this.barHandle.style.transform = "translate(-50%,-200%)";
    this.element.style.left = "50%";
    this.element.style.top = document.body.offsetHeight - 64 + "px";
  }

  handleDrag(ev: PointerEvent) {
    this.barMove = true; //{x:ev.clientX-xx,y:ev.clientY-yy};

    NavLine.reactivate();

    window.dispatchEvent(new Event("navlinereset"));
  }

  applyApps(apps: AppShell[], hovering?: boolean, targetApp?: AppShell) {
    const appBarCount = apps.length;
    const sideWays = this.barPos == 0 || this.barPos == 2;
    this.sideways = sideWays;

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

    // if (!notate) {
    if (sideWays)
      apps.sort(function (a, b) {
        return parseInt(a.element.style.top) - parseInt(b.element.style.top);
      });
    else
      apps.sort(function (a, b) {
        return parseInt(a.element.style.left) - parseInt(b.element.style.left);
      });
    // }
    apps.forEach((app, index) => {
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
      else app.move(this.appPoints[id].x, this.appPoints[id].y); //appsInRow[i]
    });
  }

  barAdjust(mainTitle: HTMLElement) {
    if (this.barPos == 2) {
      //right
      this.element.style.left = document.body.offsetWidth - 64 + "px";
      this.element.style.top = "50%"; //window.innerHeight/2;
      // this.barCalculate();
      this.barHandle.style.transform = "translate(-200%,-50%)";
      this.barHandle.style.width = "32px";
      this.barHandle.style.height = "80%";
      mainTitle.style.top = "8px";
    } else if (this.barPos == 3) {
      //top
      this.barHandle.style.transform = "translate(-50%,100%)";
      this.element.style.left = "50%";
      this.element.style.top = "64px"; //-196+window.innerWidth/2
      mainTitle.style.top = "calc(100% - 120px)";
      // this.barCalculate();
      this.barHandle.style.height = "32px";
      this.barHandle.style.width = "80%";
    } else if (this.barPos == 1) {
      //bottom
      this.barHandle.style.transform = "translate(-50%,-200%)";
      this.element.style.left = "50%";
      this.element.style.top = document.body.offsetHeight - 64 + "px"; //-196+window.innerWidth/2
      mainTitle.style.top = "8px";
      // this.barCalculate();
      this.barHandle.style.height = "32px";
      this.barHandle.style.width = "80%";
    } else {
      //left
      this.barHandle.style.transform = "translate(100%,-50%)";
      this.element.style.left = "64px";
      this.element.style.top = "50%";
      // this.barCalculate();
      this.barHandle.style.width = "32px";
      this.barHandle.style.height = "80%";
      mainTitle.style.top = "8px";
    }
    this.resize();
  }

  barMoveHandler(ev: PointerEvent) {
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
      target.containerId = 0;
      target.element.style.zIndex = "1";
    }
    return true;
  }

  animate() {}

  calculate(notate?: boolean) {}
  select(): void {}
}
