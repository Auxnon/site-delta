import * as Main from "./Main";
import { APP_IDS, APPS } from "./Main";
import { init } from "./RasterTool";
import AppEnvironment from "./types/AppEnvironment";
import AppShell from "./types/AppShell";

export class System {
  currentApp?: AppShell;
  positionalData = { x: 0, y: 0 };
  targetMove?: AppShell = undefined;
  targetPoint = { x: 0, y: 0 };
  resizeDebouncer?: number;
  svg: SVGSVGElement;
  // focused: HTMLElement | undefined;
  barMoveFactor = 0;
  bar: HTMLElement;
  barHandle: HTMLElement;
  barMove = false;
  barLineFactor = 1;
  tick = false;
  barPos = 1;
  path;
  appPoints: { x: number; y: number; app?: AppShell }[] = [];
  barBox;
  points;
  count = 0;
  appHome: HTMLElement;
  mouseObj = { x: 0, y: 0 };
  mainTitle: HTMLElement;
  appFreeSortMode = false;

  constructor() {
    this.svg = document.querySelector("svg") as SVGSVGElement;
    // this.appElements = Array.from(document.querySelectorAll(".app"));
    this.path = document.querySelector("path");
    this.mainTitle = document.querySelector("#main-title") as HTMLElement;
    this.mouseObj = { x: window.document.body.offsetWidth / 2, y: -200 };
  }

  init() {
    this.initLine();
    this.barInit();
    this.sortButtonInit();
    this.brightnessButtonInit();
    this.resize();
    this.animate();
    setInterval(() => {
      this.boundaryCheck();
    }, 10000);
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("orientationchange", () => this.resize);
    window.addEventListener("pointermove", (ev) => this.mousemove(ev));
    window.addEventListener("pointerdown", (ev) => this.mousemove(ev));
    window.addEventListener("pointerup", (ev) => this.winMouseUp(ev));
    this.mainTitle.addEventListener("click", (ev) => {
      this.closeApp();
    });
  }

  mousemove(ev: PointerEvent) {
    this.positionalData = {
      x: ev.clientX / document.body.offsetWidth,
      y: ev.clientY / document.body.offsetHeight,
    };
    this.barMoveHandler(ev);
    if (this.targetMove) {
      this.barMoveFactor++;
      this.targetMove.pos = {
        x: ev.clientX + this.targetMove.offset.x,
        y: ev.clientY + this.targetMove.offset.y,
      };

      if (
        ev.clientY > this.barBox.top &&
        ev.clientY < this.barBox.bottom &&
        ev.clientX > this.barBox.left &&
        ev.clientX < this.barBox.right
      ) {
        let point = this.targetPoint;
        let d = {
          x: point.x - this.targetMove.pos.x,
          y: point.y - this.targetMove.pos.y,
        };
        this.targetMove.pos = { x: point.x - d.x / 3, y: point.y - d.y / 3 };
        if (this.targetMove.isMoving) {
          //called once per state change
          this.targetMove.isMoving = false;
          this.targetMove.containerId = 0;
          this.targetMove.element.style.zIndex = "1";
          this.barCalculate();
        }
      } else {
        if (!this.targetMove.isMoving) {
          //called once per state change
          this.targetMove.isMoving = true;
          this.targetMove.containerId = 1;
          this.targetMove.element.style.zIndex = "-1";

          this.barCalculate();
        }
      }

      this.targetMove.element.style.left = this.targetMove.pos.x + "px";
      this.targetMove.element.style.top = this.targetMove.pos.y + "px";
    } else if (this.barLineFactor == 0) {
      if (this.count > 2) {
        this.count = 0;
        this.mouseObj = { x: ev.clientX, y: ev.clientY };
      }
      this.count++;
    }
  }

  winMouseUp(ev: PointerEvent) {
    if (this.barMove) {
      this.barMove = false;
      this.barLineFactor = 1;
      console.log(this.barMoveFactor);
      if (this.barMoveFactor < 10) {
        this.closeApp();
      }
    }

    if (this.targetMove) {
      this.targetMove.element.classList.remove("appMove");
      console.log(this.barMoveFactor);
      if (this.barMoveFactor < 10) {
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
        this.barCalculate();

        console.log("fix bar also");
      }
    } else {
      this.barCalculate();
      console.log("fix bar");
    }
    this.targetMove = undefined;

    this.barMoveFactor = 0;
  }

  resize() {
    clearTimeout(this.resizeDebouncer);
    this.resizeDebouncer = window.setTimeout(() => {
      this.svg.setAttribute("width", document.body.offsetWidth + "px");
      this.svg.setAttribute("height", document.body.offsetHeight + "px");
      this.barAdjust();

      Main.rendererPromise.then((r) => r.resize());
      //UI.systemMessage('inner ' + window.innerWidth + '; screen ' + window.screen.width, 'success')
    }, 250);
  }

  animate() {
    if (this.barLineFactor > -1) {
      if (this.barLineFactor < 4) {
        if (this.barLineFactor) {
          let target = { x: 0, y: 0 };
          let rect = this.barHandle.getBoundingClientRect();
          let mid = { x: rect.width / 2, y: rect.height / 2 };

          if (this.barPos == 0 || this.barPos == 2) {
            switch (this.barLineFactor) {
              case 3:
                target = { x: rect.left + mid.x, y: rect.top };
                break;
              case 2:
                target = { x: rect.left + mid.x, y: rect.top + mid.y };
                break;
              default:
                target = { x: rect.left + mid.x, y: rect.bottom };
            }
          } else {
            switch (this.barLineFactor) {
              case 3:
                target = { x: rect.left, y: rect.top + mid.y };
                break;
              case 2:
                target = { x: rect.left + mid.x, y: rect.top + mid.y };
                break;
              default:
                target = { x: rect.right, y: rect.top + mid.y };
            }
          }

          let dx = this.mouseObj.x - target.x;
          let dy = this.mouseObj.y - target.y;
          let dr = Math.sqrt(dx * dx + dy * dy);
          this.mouseObj.x -= dx / 2;
          this.mouseObj.y -= dy / 2;
          if (dr < 1 && this.barLineFactor < 4) this.barLineFactor++;
        }

        let diff = {
          x: this.mouseObj.x - this.points[0].x,
          y: this.mouseObj.y - this.points[0].y,
        };
        let dr = Math.sqrt(diff.x * diff.x + diff.y * diff.y);

        if (dr > 40) {
          let nextVector;
          if (this.barLineFactor > 1) {
            //straight to next point
            nextVector = { x: this.mouseObj.x, y: this.mouseObj.y };
          } else {
            //wiggle the line
            nextVector = {
              x: this.mouseObj.x - ((this.tick ? 1 : -1) * 20 * diff.y) / dr,
              y: this.mouseObj.y + ((this.tick ? 1 : -1) * 20 * diff.x) / dr,
            };
          }

          let dir = Math.abs(diff.x) > Math.abs(diff.y);
          let pos = dir ? diff.x > 0 : diff.y > 0;
          this.tick = !this.tick;

          this.drawBarLine(nextVector);
        }
      } else {
        if (this.barLineFactor % 5 == 1) {
          let target = this.points.shift();
          if (this.points.length <= 3) {
            this.barLineFactor = -1;
            this.barCalculate();
          } else {
            this.drawBarLine(target);
          }
        }
        if (this.barLineFactor != -1) this.barLineFactor++;
      }
    }

    requestAnimationFrame(() => this.animate());
  }

  appSelect(app: AppShell, ev: PointerEvent) {
    if (!app.active) {
      app.select(ev.clientX, ev.clientY);
      this.targetMove = app;
      this.targetPoint = { x: app.pos.x, y: app.pos.y };
    }
  }

  // clearPendApp(id: number, canvas?: HTMLCanvasElement) {
  //   APPS[id]?.clearPend(canvas);
  // }

  boundaryCheck() {
    APPS.forEach((app) => {
      if (app && !app.active) {
        const ele = app.element;
        let rect = ele.getBoundingClientRect();

        let x = rect.left;
        let y = rect.top;
        let w2 = (rect.right - rect.left) / 2;
        let h2 = (rect.bottom - rect.top) / 2;

        if (x < 0) {
          ele.style.left = w2 + "px";
        } else if (x > window.innerWidth - w2 * 2) {
          ele.style.left = window.innerWidth - w2 + "px";
        }
        if (y < 0) {
          ele.style.top = h2 + "px";
        } else if (y > document.body.offsetHeight - h2 * 2) {
          ele.style.top = document.body.offsetHeight - h2 + "px";
        }
      }
    });
  }

  shrinkTitle() {
    this.mainTitle.classList.add("shrink");
  }

  /** return mouse position relative to window as a percentage */
  getPosPercent() {
    return this.positionalData;
  }

  barInit() {
    this.appHome = document.querySelector("#app-center") as HTMLElement;
    this.bar = document.querySelector("#bar") as HTMLElement;
    this.barHandle = document.querySelector("#barHandle") as HTMLElement;
    this.barHandle.addEventListener("pointerdown", (ev) => {
      let xx = this.barBox.left; //-(barBox.right-barBox.left)/2
      let yy = this.barBox.top; //-(barBox.bottom-barBox.top)/2

      this.barMove = true; //{x:ev.clientX-xx,y:ev.clientY-yy};

      if (this.points.length < 10) {
        //rebuild are point array
        let startPoint = this.points[0];
        let array = Array(7).fill(startPoint);
        this.points = array.concat(this.points);
      }

      this.barLineFactor = 0;
    });
    this.barHandle.addEventListener("dragstart", (ev) => {
      ev.preventDefault();
    });
    /*barHandle.addEventListener('pointerup',ev=>{
        barMove=false;
    })*/

    this.appPoints = [];

    this.barHandle.style.transform = "translate(-50%,-200%)";
    this.bar.style.left = "50%";
    this.bar.style.top = document.body.offsetHeight - 64 + "px";

    this.barCalculate(true);
  }

  initLine() {
    this.points = [];
    for (let i = 0; i < 10; i++) {
      this.points.push({ x: this.mouseObj.x, y: this.mouseObj.y });
    }
  }

  barCalculate(notate?: boolean) {
    //first determine  how many apps will be visibly part of the app bar
    let count = 0;
    let appsInRow: AppShell[] = [];
    let appsInHome: AppShell[] = [];
    let sideWays = this.barPos == 0 || this.barPos == 2;

    APPS.forEach((app) => {
      if (app) {
        if (app.containerId == 0) {
          appsInRow.push(app);
          count++;
        } else {
          appsInHome.push(app);
        }
      }
    });

    if (sideWays) {
      this.bar.style.height = (count > 0 ? count : 1) * 64 + "px";
      this.bar.style.width = "64px";
    } else {
      this.bar.style.width = (count > 0 ? count : 1) * 64 + "px";
      this.bar.style.height = "64px";
    }

    let barRect = this.bar.getBoundingClientRect();
    this.barBox = barRect;
    let width = barRect.width;
    let height = barRect.height;

    let ratio;
    if (sideWays) ratio = height / count;
    else ratio = width / count;

    if (!notate) {
      if (sideWays)
        appsInRow.sort(function (a, b) {
          return parseInt(a.element.style.top) - parseInt(b.element.style.top);
        });
      else
        appsInRow.sort(function (a, b) {
          return (
            parseInt(a.element.style.left) - parseInt(b.element.style.left)
          );
        });
    }

    let relativeIndex = -1;
    appsInRow.forEach((app, relativeIndex) => {
      let i = app.id;
      if (sideWays)
        this.appPoints[i] = {
          x: barRect.left + width / 2,
          y: 32 + barRect.top + relativeIndex * ratio,
        };
      else
        this.appPoints[i] = {
          x: 32 + barRect.left + relativeIndex * ratio,
          y: barRect.top + height / 2,
        };

      if (this.targetMove && this.targetMove == app)
        //appsInRow[i])
        this.targetPoint = this.appPoints[i];

      if (notate) {
        // app.spot = relativeIndex;
        this.appPoints[i].app = app; //appsInRow[i]
      }
      app.move(this.appPoints[i].x, this.appPoints[i].y); //appsInRow[i]
    });
    if (this.appFreeSortMode) {
      let homeRect = this.appHome.getBoundingClientRect();
      let rows = (appsInHome.length * (56 + 28) + 28) / homeRect.width;
      rows = Math.ceil(rows);
      let perRow = appsInHome.length / rows;
      console.log("rows", rows);
      let homeRatio = (homeRect.width - 112) / (appsInHome.length - 1);
      appsInHome.forEach((app, relativeIndex) => {
        const i = app.id;
        this.appPoints[i] = {
          x: 56 + homeRect.left + relativeIndex * homeRatio,
          y: homeRect.top + 56,
        };
        app.move(this.appPoints[i].x, this.appPoints[i].y);
      });
    }
    if (this.barLineFactor == -1) {
      let handle = this.barHandle.getBoundingClientRect();
      if (sideWays) {
        let xx = handle.left + handle.width / 2;
        this.drawSimpleBarLine(
          { x: xx, y: handle.top },
          { x: xx, y: handle.bottom }
        );
      } else {
        let yy = handle.top + handle.height / 2;
        this.drawSimpleBarLine(
          { x: handle.left, y: yy },
          { x: handle.right, y: yy }
        );
      }
    }

    this.adjustApps(this.barPos);
  }

  adjustApps(amount: number) {
    APPS.forEach((app) => {
      if (app && app.active) {
        app.adjust(amount);
      }
    });
  }

  drawBarLine(nextVector) {
    let st = "M" + this.mouseObj.x + " " + this.mouseObj.y;
    let last = { x: nextVector.x, y: nextVector.y };
    for (let i = 0; i < this.points.length; i++) {
      let halfy = (this.points[i].y - last.y) / 2;
      let halfx = (this.points[i].x - last.x) / 2;
      let midx = last.x + halfx;
      let midy = last.y + halfy;
      st += "Q" + last.x + " " + last.y + " " + midx + " " + midy; //+points[i].x+" "+points[i].y

      let prev = { x: this.points[i].x, y: this.points[i].y };
      this.points[i] = { x: last.x, y: last.y };
      last = prev;
    }
    this.path.setAttribute("d", st);
  }

  drawSimpleBarLine(one, two) {
    let st = "M" + one.x + " " + one.y + "L" + two.x + " " + two.y;
    this.path.setAttribute("d", st);
  }

  barAdjust() {
    if (this.barPos == 2) {
      //right
      this.bar.style.left = document.body.offsetWidth - 64 + "px";
      this.bar.style.top = "50%"; //window.innerHeight/2;
      this.barCalculate();
      this.barHandle.style.transform = "translate(-200%,-50%)";
      this.barHandle.style.width = "32px";
      this.barHandle.style.height = "80%";
      this.mainTitle.style.top = "8px";
    } else if (this.barPos == 3) {
      //top
      this.barHandle.style.transform = "translate(-50%,100%)";
      this.bar.style.left = "50%";
      this.bar.style.top = "64px"; //-196+window.innerWidth/2
      this.mainTitle.style.top = "calc(100% - 120px)";
      this.barCalculate();
      this.barHandle.style.height = "32px";
      this.barHandle.style.width = "80%";
    } else if (this.barPos == 1) {
      //bottom
      this.barHandle.style.transform = "translate(-50%,-200%)";
      this.bar.style.left = "50%";
      this.bar.style.top = document.body.offsetHeight - 64 + "px"; //-196+window.innerWidth/2
      this.mainTitle.style.top = "8px";
      this.barCalculate();
      this.barHandle.style.height = "32px";
      this.barHandle.style.width = "80%";
    } else {
      //left
      this.barHandle.style.transform = "translate(100%,-50%)";
      this.bar.style.left = "64px";
      this.bar.style.top = "50%";
      this.barCalculate();
      this.barHandle.style.width = "32px";
      this.barHandle.style.height = "80%";
      this.mainTitle.style.top = "8px";
    }
  }

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

  barMoveHandler(ev: PointerEvent) {
    if (this.barMove) {
      this.barMoveFactor++;
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
          this.barAdjust();
        }
      } else if (ar < 0.75) {
        //top or bottom
        if (r < 0) {
          //top
          if (this.barPos != 3) {
            this.barPos = 3;
            this.barAdjust();
          }
        } else {
          //botttom
          if (this.barPos != 1) {
            this.barPos = 1;
            this.barAdjust();
          }
        }
      } else {
        //left
        if (this.barPos != 0) {
          this.barPos = 0;
          this.barAdjust();
        }
      }

      /*
                        if(window.innerWidth>window.innerHeight){ //landscape
                            let half=(window.innerWidth - window.innerHeight)/2
                            if(xx<half){ //left
                                bar.style.transform='rotate(90deg)'
                                barHandle.style.transform='translate(-50%,-200%)'
                            }else if(xx>window.innerWidth-half){ //right
                                bar.style.transform='rotate(90deg)'
                                barHandle.style.transform='translate(-50%,100%)'
                            }else{
                                bar.style.transform='rotate(0deg)'
                                if(yy>window.innerHeight/2){
                                    barHandle.style.transform='translate(-50%,-200%)'
                                }else{
                                    barHandle.style.transform='translate(-50%,100%)'
                                }
                            }
                        }else{ //portrait
                            let half=(window.innerHeight - window.innerWidth)/2
                            if(yy<half){ //top
                                bar.style.transform='rotate(0deg)'
                                barHandle.style.transform='translate(-50%,-200%)'
                            }else if(yy>window.innerHeight-half){ //bottom
                                bar.style.transform='rotate(0deg)'
                                barHandle.style.transform='translate(-50%,100%)'
                            }else{
                                bar.style.transform='rotate(90deg)'
                                if(xx>window.innerWidth/2){
                                    barHandle.style.transform='translate(-50%,-200%)'
                                }else{
                                    barHandle.style.transform='translate(-50%,100%)'
                                }
                            }
                        }*/
    }
  }

  sortButtonInit() {
    let sortButton = document.querySelector("button#app-sort-button");
    if (sortButton)
      sortButton.addEventListener("click", (ev) => {
        this.appFreeSortMode = !this.appFreeSortMode;
        if (ev.target instanceof HTMLElement) {
          if (this.appFreeSortMode) ev.target.classList.add("sorting--enabled");
          else ev.target.classList.remove("sorting--enabled");
        }

        this.barCalculate();
      });
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

    app.max();
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
    // this.currentAppId = 0;
  }
}
