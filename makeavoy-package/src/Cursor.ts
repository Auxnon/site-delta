import { Position } from "./types/Position";
import "./style/cursor.scss";

export enum Hover {
  None,
  MakeContainer,
  Full,
  Destroy,
}

export class Cursor {
  element: HTMLElement;
  currentHover: Hover = Hover.None;
  pendHover: Hover = Hover.None;
  pos: Position = {
    x: document.body.clientWidth / 2,
    y: document.body.clientHeight / 2,
  };

  destination: Position = {
    x: this.pos.x,
    y: this.pos.y,
  };

  constructor() {
    this.element = document.createElement("div");
    this.element.classList.add("cursor");
    document.body.appendChild(this.element);
  }

  move(x: number, y: number) {
    this.destination.x = x;
    this.destination.y = y;
  }

  animate() {
    // this.cursor.style.left = ev.clientX + "px";
    // this.cursor.style.top = ev.clientY + "px";
    if (this.pendHover != this.currentHover) {
      this.element.className = "cursor";
      switch (this.pendHover) {
        case Hover.MakeContainer: {
          this.element.classList.add("cursor--make-container");
          break;
        }
        case Hover.Destroy: {
          this.element.classList.add("cursor--destroy");
          break;
        }
        case Hover.Full: {
          this.element.classList.add("cursor--full");
          break;
        }
      }
      this.currentHover = this.pendHover;
    }
    const x = this.pos.x + (this.destination.x - this.pos.x) * 0.1;
    const y = this.pos.y + (this.destination.y - this.pos.y) * 0.1;
    if (
      this.currentHover !== Hover.None &&
      (Math.round(this.pos.x) !== Math.round(x) ||
        Math.round(this.pos.y) !== Math.round(y))
    ) {
      this.element.style.left = this.pos.x + "px";
      this.element.style.top = this.pos.y + "px";
    }

    this.pos.x = x;
    this.pos.y = y;
  }

  getMode() {
    return this.currentHover;
  }

  hover(h: Hover) {
    this.pendHover = h;
  }
}
