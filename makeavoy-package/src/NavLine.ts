import { BarContainer } from "./types/BarContainer";
import { Position } from "./types/Position";

enum NavLineState {
  Uninitialized,
  Inactive,
  Free,
  Grabbed,
}

let points: Position[] = [];

let navLineMoveFactor = 0;
let navLineState: NavLineState = NavLineState.Uninitialized; // -1 = inactive,
let navLineIteration = 1;
let tick = false;
let svg: SVGSVGElement = document.querySelector("#nav-line") as any;
let path: SVGPathElement = svg.querySelector("path") as any;
let localMouse = { x: 0, y: 0 };

export function init(mouse: Position) {
  points = [];
  navLineState = NavLineState.Free;
  for (let i = 0; i < 10; i++) {
    points.push({ x: mouse.x, y: mouse.y });
  }
}

export function move() {
  navLineMoveFactor++;
  // if (navLineState === NavLineState.Inactive) {
  //   reactivate();
  // }
}

export function resetMovement() {
  navLineMoveFactor = 0;
}

export function release() {
  navLineState = NavLineState.Free;
}

export function grab() {
  navLineState = NavLineState.Grabbed;
}
export function getMovement() {
  return navLineMoveFactor;
}
export function getState() {
  return navLineState;
}

export function reactivate() {
  navLineState = NavLineState.Grabbed;
  navLineIteration = 1;
  if (points.length < 10) {
    //rebuild are point array
    let startPoint = points[0];
    let endPoint = points[1];
    let dx = endPoint.x - startPoint.x;
    for (let i = 0; i < 7; i++) {
      const diff = Math.random() * (i % 2 == 0 ? 100 : -100);
      let x = startPoint.x + (dx * i) / 7;
      let y = startPoint.y + diff;
      points.push({ x: x, y: y });
    }
    // drawBarLine(endPoint, endPoint);
    // let array = Array(7).fill(startPoint);
    // points = array.concat(points);
  }
}

export function animate(bar: BarContainer, mouse: Position) {
  if (
    navLineState !== NavLineState.Inactive &&
    navLineState !== NavLineState.Uninitialized
  ) {
    console.log("animate", navLineState, navLineIteration);
    // if (navLineState === NavLineState.Grabbed) {
    if (navLineState === NavLineState.Free) {
      const barPos = bar.barPos;
      let target = { x: 0, y: 0 };
      let rect = bar.handle.getBoundingClientRect();
      let mid = { x: rect.width / 2, y: rect.height / 2 };

      if (barPos == 0 || barPos == 2) {
        switch (navLineIteration) {
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
        switch (navLineIteration) {
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

      let dx = localMouse.x - target.x;
      let dy = localMouse.y - target.y;
      let dr = Math.sqrt(dx * dx + dy * dy);
      localMouse.x -= dx / 2;
      localMouse.y -= dy / 2;
      if (dr < 1 && navLineIteration < 4) navLineIteration++;
    } else {
      localMouse = { x: mouse.x, y: mouse.y };
    }

    let diff = {
      x: localMouse.x - points[0].x,
      y: localMouse.y - points[0].y,
    };
    let dr = Math.sqrt(diff.x * diff.x + diff.y * diff.y);

    if (dr > 40) {
      let nextVector;
      if (navLineState === NavLineState.Free) {
        //straight to next point
        nextVector = { x: localMouse.x, y: localMouse.y };
      } else {
        //wiggle the line
        nextVector = {
          x: localMouse.x - ((tick ? 1 : -1) * 20 * diff.y) / dr,
          y: localMouse.y + ((tick ? 1 : -1) * 20 * diff.x) / dr,
        };
      }

      let dir = Math.abs(diff.x) > Math.abs(diff.y);
      let pos = dir ? diff.x > 0 : diff.y > 0;
      tick = !tick;

      drawBarLine(nextVector, localMouse);
    }
    if (navLineState === NavLineState.Free && navLineIteration % 5 == 1) {
      let target = points.shift();
      if (points.length <= 3) {
        navLineState = NavLineState.Inactive;
        const sideways = bar.barPos == 0 || bar.barPos == 2;
        calculate(bar.getHandleSize(), sideways);
      } else {
        drawBarLine(target, localMouse);
      }
    }
    if (navLineState == NavLineState.Free) navLineIteration++;
  }
}

export function resize(w: number, h: number) {
  svg.setAttribute("width", document.body.offsetWidth + "px");
  svg.setAttribute("height", document.body.offsetHeight + "px");
}

/** When not animating redraw the navline over the bar from a resize or other redraw event */
export function calculate(handle: DOMRect, sideways: boolean) {
  if (navLineState === NavLineState.Inactive) {
    if (sideways) {
      let xx = handle.left + handle.width / 2;
      drawSimpleBarLine({ x: xx, y: handle.top }, { x: xx, y: handle.bottom });
    } else {
      let yy = handle.top + handle.height / 2;
      drawSimpleBarLine({ x: handle.left, y: yy }, { x: handle.right, y: yy });
    }
  }
}

function drawBarLine(nextVector, mouseObj: Position) {
  let st = "M" + mouseObj.x + " " + mouseObj.y;
  let last = { x: nextVector.x, y: nextVector.y };
  for (let i = 0; i < points.length; i++) {
    let halfy = (points[i].y - last.y) / 2;
    let halfx = (points[i].x - last.x) / 2;
    let midx = last.x + halfx;
    let midy = last.y + halfy;
    st += "Q" + last.x + " " + last.y + " " + midx + " " + midy; //+points[i].x+" "+points[i].y

    let prev = { x: points[i].x, y: points[i].y };
    points[i] = { x: last.x, y: last.y };
    last = prev;
  }
  path.setAttribute("d", st);
}

function drawSimpleBarLine(one, two) {
  points = [one, two];
  let st = "M" + one.x + " " + one.y + "L" + two.x + " " + two.y;
  path.setAttribute("d", st);
}
