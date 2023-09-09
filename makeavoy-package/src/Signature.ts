import { Position } from "./types/Position";

interface TimePoint {
  x: number;
  y: number;
  t: number;
  n?: boolean;
}

// let points: TimePoint[] = [
//   { x: document.body.offsetWidth / 2, y: document.body.offsetHeight / 2 },
// ];
let rendering = true;
let complete = false;

let title: TimePoint[] = [
  { x: 329, y: 100, t: 0, n: true },
  { x: 332, y: 88, t: 6 },
  { x: 342, y: 59, t: 7 },
  { x: 350, y: 41, t: 8 },
  { x: 357, y: 51, t: 14 },
  { x: 357, y: 69, t: 15 },
  { x: 357, y: 80, t: 16 },
  { x: 357, y: 93, t: 17 },
  { x: 366, y: 80, t: 21 },
  { x: 370, y: 65, t: 22 },
  { x: 381, y: 34, t: 24 },
  { x: 385, y: 21, t: 25 },
  { x: 388, y: 31, t: 31 },
  { x: 390, y: 44, t: 32 },
  { x: 390, y: 65, t: 33 },
  { x: 390, y: 77, t: 34 },
  { x: 390, y: 88, t: 35 },
  { x: 423, y: 65, t: 59, n: true },
  { x: 413, y: 72, t: 65 },
  { x: 408, y: 87, t: 67 },
  { x: 420, y: 91, t: 69 },
  { x: 434, y: 79, t: 71 },
  { x: 433, y: 69, t: 73 },
  { x: 419, y: 70, t: 75 },
  { x: 417, y: 51, t: 93, n: true },
  { x: 430, y: 59, t: 99 },
  { x: 436, y: 79, t: 100 },
  { x: 438, y: 93, t: 101 },
  { x: 452, y: 30, t: 133, n: true },
  { x: 451, y: 54, t: 142 },
  { x: 451, y: 79, t: 143 },
  { x: 451, y: 95, t: 144 },
  { x: 451, y: 68, t: 158, n: true },
  { x: 466, y: 55, t: 161 },
  { x: 483, y: 45, t: 162 },
  { x: 493, y: 42, t: 164 },
  { x: 457, y: 68, t: 174, n: true },
  { x: 458, y: 80, t: 177 },
  { x: 468, y: 87, t: 179 },
  { x: 500, y: 76, t: 202, n: true },
  { x: 510, y: 77, t: 206 },
  { x: 515, y: 68, t: 209 },
  { x: 503, y: 66, t: 211 },
  { x: 483, y: 75, t: 213 },
  { x: 483, y: 88, t: 215 },
  { x: 492, y: 95, t: 216 },
  { x: 506, y: 98, t: 217 },
  { x: 517, y: 94, t: 218 },
  { x: 532, y: 88, t: 264, n: true },
  { x: 531, y: 98, t: 266 },
  { x: 534, y: 80, t: 270 },
  { x: 538, y: 63, t: 271 },
  { x: 543, y: 37, t: 272 },
  { x: 549, y: 19, t: 273 },
  { x: 553, y: 34, t: 280 },
  { x: 556, y: 56, t: 282 },
  { x: 559, y: 75, t: 283 },
  { x: 562, y: 90, t: 284 },
  { x: 536, y: 65, t: 296, n: true },
  { x: 549, y: 65, t: 302 },
  { x: 559, y: 63, t: 303 },
  { x: 576, y: 58, t: 324, n: true },
  { x: 578, y: 77, t: 330 },
  { x: 584, y: 91, t: 331 },
  { x: 598, y: 73, t: 334 },
  { x: 602, y: 62, t: 335 },
  { x: 626, y: 62, t: 365, n: true },
  { x: 615, y: 65, t: 369 },
  { x: 608, y: 76, t: 370 },
  { x: 616, y: 88, t: 372 },
  { x: 629, y: 80, t: 374 },
  { x: 634, y: 69, t: 376 },
  { x: 622, y: 65, t: 378 },
  { x: 641, y: 52, t: 422, n: true },
  { x: 644, y: 62, t: 429 },
  { x: 651, y: 73, t: 430 },
  { x: 659, y: 83, t: 432 },
  { x: 666, y: 40, t: 462, n: true },
  { x: 668, y: 63, t: 473 },
  { x: 666, y: 73, t: 474 },
  { x: 657, y: 86, t: 476 },
  { x: 645, y: 93, t: 477 },
  { x: 629, y: 98, t: 479 },
  { x: 619, y: 100, t: 480 },
  { x: 605, y: 101, t: 481 },
  { x: 587, y: 104, t: 482 },
  { x: 570, y: 107, t: 483 },
  { x: 557, y: 108, t: 484 },
  { x: 536, y: 111, t: 485 },
  { x: 521, y: 111, t: 486 },
  { x: 499, y: 112, t: 487 },
  { x: 482, y: 112, t: 488 },
  { x: 466, y: 112, t: 489 },
  { x: 452, y: 112, t: 490 },
  { x: 422, y: 111, t: 492 },
  { x: 406, y: 111, t: 493 },
  { x: 391, y: 112, t: 494 },
  { x: 370, y: 118, t: 496 },
  { x: 359, y: 122, t: 497 },
  { x: 345, y: 128, t: 499 },
  { x: 357, y: 137, t: 503 },
  { x: 369, y: 137, t: 504 },
  { x: 395, y: 133, t: 506 },
  { x: 420, y: 126, t: 507 },
  { x: 455, y: 118, t: 508 },
  { x: 475, y: 114, t: 509 },
  { x: 508, y: 108, t: 510 },
  { x: 538, y: 104, t: 511 },
  { x: 555, y: 102, t: 512 },
  { x: 576, y: 100, t: 513 },
  { x: 597, y: 101, t: 515 },
  { x: 583, y: 114, t: 518 },
  { x: 563, y: 122, t: 519 },
  { x: 539, y: 132, t: 520 },
  { x: 508, y: 142, t: 521 },
  { x: 479, y: 153, t: 522 },
  { x: 458, y: 160, t: 523 },
  { x: 443, y: 161, t: 524 },
  { x: 455, y: 151, t: 527 },
  { x: 485, y: 143, t: 528 },
  { x: 515, y: 139, t: 529 },
  { x: 562, y: 136, t: 530 },
  { x: 584, y: 133, t: 531 },
  { x: 598, y: 132, t: 532 },
  { x: 597, y: 142, t: 534 },
  { x: 576, y: 156, t: 535 },
  { x: 553, y: 170, t: 536 },
];
let points: TimePoint[] = title.slice();
if (points.length > 0) {
  rendering = true;
}
let counter = 0;
let wind = 0;

let svg: SVGSVGElement = document.querySelector("#sig-line") as any;
let path: SVGPathElement = svg.querySelector("path") as any;
let size = 100;
let timer = 0;
let isDown = false;
let skip = 0;

export function init() {
  window.addEventListener("pointermove", (ev) => mousemove(ev));
  window.addEventListener("pointerdown", (ev) => pdown(ev));
  window.addEventListener("pointerup", (ev) => pup(ev));
  window.addEventListener("keydown", (ev) => {
    if (ev.key == "Escape") {
      points = title.slice();
      timer = 0;
    }
  });
}

function mousemove(ev: PointerEvent) {
  //   counter++;
  //   if (counter > 2) {
  // counter = 0;
  if (isDown && !rendering) {
    point(ev.clientX, ev.clientY, timer);
    //   }
  }
}
function pdown(ev: PointerEvent) {
  isDown = true;
  point(ev.clientX, ev.clientY, timer, true);
}
function point(ex: number, ey: number, t: number, n?: boolean) {
  const w = document.body.clientWidth;
  const h = document.body.clientHeight;
  const xf = w > h ? (w - h) / 2 : 0;
  const df = w > h ? h : w;
  const x = Math.round((1000 * (ex - xf)) / df);
  const y = Math.round((1000 * ey) / df);
  points.push({ x, y, t, n });
}
function pup(ev: PointerEvent) {
  isDown = false;
}

export function animate(mouse: Position, throttle: boolean) {
  //   circler();
  draw(mouse, throttle);
}
export function resize(w: number, h: number) {
  //   points[0] = { x: w / 2, y: h / 2 };
  size = Math.min(w, h) / 2;
}

function draw(mouse: Position, throttle: boolean) {
  const stagger = false;
  let d = "";
  timer++;
  let last;
  if (!rendering) {
    points = points.filter((p, i) => {
      // weigh towards last
      if (last) {
        const dx = p.x - last.x;
        const dy = p.y - last.y;
        const r = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
        const rate = 1; //i / points.length;
        //   p.x -= (dx / r) * rate;
        //   p.y -= (dy / r) * rate;
        if (r < 10 && !p.n) {
          return false;
        }
      }

      last = p;
      if (p.n) {
        d += `M${p.x} ${p.y}`;
      } else {
        d += ` L${p.x} ${p.y}`;
      }
      return true;
    });
  } else {
    if (stagger) {
      if (skip < 1000) {
        skip++;
        return;
      } else {
        skip = 0;
      }
    }
    if (timer > points[points.length - 1].t) {
      complete = true;
      if (throttle) {
        timer--;
        return;
      }
    }
    wind += stagger ? 100 : 0.1;
    const w = document.body.clientWidth;
    const h = document.body.clientHeight;
    const xf = w > h ? (w - h) / 2 : 0;
    const df = w > h ? h : w;
    const mox = Math.round((1000 * (mouse.x - xf)) / df);
    const moy = Math.round((1000 * mouse.y) / df);

    points.forEach((p) => {
      if (timer > p.t) {
        let mx = mox - p.x;
        let my = moy - p.y;
        let mr = Math.max(Math.sqrt(Math.pow(mx, 2) + Math.pow(my, 2)), 0.1);
        let x = p.x + Math.sin(wind + p.x / 6) * 0.8;
        x += (20 * mx) / mr;
        let y = p.y + (20 * my) / mr;
        last = p;
        if (p.n) {
          d += `M${x} ${y}`;
        } else {
          d += ` L${x} ${y}`;
        }
      }
    });
  }

  path.setAttribute("d", d);
}

function bake() {
  let start = points[0].t;
  points.forEach((p) => (p.t -= start));
  console.log(JSON.stringify(points));
  timer = 0;
  rendering = true;
}
// @ts-ignore
window.bake = bake;

function rnd() {
  return Math.random() * 10 - 5;
}

export function reset() {
  timer = 0;
  rendering = true;
}

export function newArt() {
  points = [];
  timer = 0;
  rendering = false;
}

// TODO neato
// let i = 0;
// function circler() {
//   counter++;
//   if (counter > 2) {
//     counter = 0;
//     i += 0.1;
//     points.push({
//       x:
//         size * Math.cos(i) +
//         Math.sin(i * 8) * 20 +
//         document.body.offsetWidth / 2,
//       y:
//         size * Math.sin(i) +
//         Math.cos(i * 8) * 20 +
//         document.body.offsetHeight / 2,
//     });
//   }
// }

// function shrinkDraw() {
//   let d = "";
//   let last;
//   points = points.filter((p, i) => {
//     // weigh towards last
//     if (last) {
//       const dx = p.x - last.x;
//       const dy = p.y - last.y;
//       const r = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

//       p.x -= dx / r;
//       p.y -= dy / r;
//       if (r < 10) {
//         return false;
//       }
//     }

//     last = p;
//     if (i == 0) {
//       d += `M${p.x} ${p.y}`;
//     } else {
//       d += ` L${p.x} ${p.y}`;
//     }
//     return true;
//   });
//   path.setAttribute("d", d);
// }
