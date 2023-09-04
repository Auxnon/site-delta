import { BarContainer } from "./types/BarContainer";
import { Position } from "./types/Position";

let points: Position[] = [];

let navLineMoveFactor = 0;
let navLineState = 1;
let tick = false;
let svg: SVGSVGElement = document.querySelector("#nav-line") as any;
let path: SVGPathElement = svg.querySelector("path") as any;

export function init(mouse: Position) {
  points = [];
  for (let i = 0; i < 10; i++) {
    points.push({ x: mouse.x, y: mouse.y });
  }
  window.addEventListener("navlinereset", (ev) => {
    resetState();
  });
}

export function move() {
  navLineMoveFactor++;
}

export function resetMovement() {
  navLineMoveFactor = 0;
}

export function setState(state: number) {
  navLineState = state;
}
export function getMovement() {
  return navLineMoveFactor;
}
export function getState() {
  return navLineState;
}

export function resetState() {
  navLineState = 0;
}

export function reactivate() {
  if (points.length < 10) {
    //rebuild are point array
    let startPoint = points[0];
    let array = Array(7).fill(startPoint);
    points = array.concat(points);
  }
}

export function animate(bar: BarContainer, mouseObj: Position) {
  if (navLineState > -1) {
    if (navLineState < 4) {
      if (navLineState) {
        const barPos = bar.barPos;
        let target = { x: 0, y: 0 };
        let rect = bar.barHandle.getBoundingClientRect();
        let mid = { x: rect.width / 2, y: rect.height / 2 };

        if (barPos == 0 || barPos == 2) {
          switch (navLineState) {
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
          switch (navLineState) {
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

        let dx = mouseObj.x - target.x;
        let dy = mouseObj.y - target.y;
        let dr = Math.sqrt(dx * dx + dy * dy);
        mouseObj.x -= dx / 2;
        mouseObj.y -= dy / 2;
        if (dr < 1 && navLineState < 4) navLineState++;
      }

      let diff = {
        x: mouseObj.x - points[0].x,
        y: mouseObj.y - points[0].y,
      };
      let dr = Math.sqrt(diff.x * diff.x + diff.y * diff.y);

      if (dr > 40) {
        let nextVector;
        if (navLineState > 1) {
          //straight to next point
          nextVector = { x: mouseObj.x, y: mouseObj.y };
        } else {
          //wiggle the line
          nextVector = {
            x: mouseObj.x - ((tick ? 1 : -1) * 20 * diff.y) / dr,
            y: mouseObj.y + ((tick ? 1 : -1) * 20 * diff.x) / dr,
          };
        }

        let dir = Math.abs(diff.x) > Math.abs(diff.y);
        let pos = dir ? diff.x > 0 : diff.y > 0;
        tick = !tick;

        drawBarLine(nextVector, mouseObj);
      }
    } else {
      if (navLineState % 5 == 1) {
        let target = points.shift();
        if (points.length <= 3) {
          navLineState = -1;
          //   barCalculate();
        } else {
          drawBarLine(target, mouseObj);
        }
      }
      if (navLineState != -1) navLineState++;
    }
  }
}

export function resize(w: number, h: number) {
  svg.setAttribute("width", document.body.offsetWidth + "px");
  svg.setAttribute("height", document.body.offsetHeight + "px");
}

export function calculate(handle: DOMRect, sideways: boolean) {
  if (navLineState == -1) {
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
  let st = "M" + one.x + " " + one.y + "L" + two.x + " " + two.y;
  path.setAttribute("d", st);
}
