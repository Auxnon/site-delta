import AppShell, { AppLocation } from "./AppShell";
import "../style/container.scss";
import { Position } from "./Position";

export abstract class Container {
  element = document.createElement("div");
  handle = document.createElement("div");
  size: DOMRect;
  pos: Position = { x: 0, y: 0 };
  offset: Position = { x: 0, y: 0 };
  isMoving: boolean = false;
  constructor(protected id: number, target: HTMLElement) {
    this.element.id = `container-${id}`;
    this.element.classList.add("container");
    this.handle.classList.add("container-handle");

    this.element.appendChild(this.handle);
    this.handle.addEventListener("pointerdown", (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      this.handleDrag(ev);
      this.select();
    });

    this.handle.addEventListener("dragstart", (ev) => {
      ev.preventDefault();
    });

    this.element.addEventListener("pointerdown", (ev) => {
      this.select();
    });

    const c = target.querySelectorAll(".container");
    // insert after the last container
    if (c.length > 0) {
      target.insertBefore(this.element, c[c.length - 1]);
    } else {
      target.prepend(this.element);
    }
    this.resize();
  }

  abstract handleDrag(ev: PointerEvent): void;

  getSize() {
    return this.size;
  }

  inBounds(x: number, y: number) {
    return (
      x > this.size.left &&
      x < this.size.right &&
      y > this.size.top &&
      y < this.size.bottom
    );
  }

  addActionLine() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    svg.appendChild(path);
    this.handle.appendChild(svg);
    this.drawActionLine();
  }

  /** Only redraws if it exists, bar container does something different */
  drawActionLine() {
    const svg = this.handle.querySelector("svg");
    if (!svg) return;
    const path = svg.querySelector("path");
    if (!path) return;
    const rect = this.handle.getBoundingClientRect();
    svg.setAttribute("width", rect.width + "");
    svg.setAttribute("height", rect.height + "");
    const d = `M 3 ${rect.height / 2} H${rect.width - 3}`;
    path.setAttribute("d", d);
    svg.appendChild(path);
  }

  /** target is over comntainer, return truthywhether it's accepted or not */
  abstract dragOver(target: AppShell): boolean;

  draw() {
    this.element.style.left = this.pos.x + "px";
    this.element.style.top = this.pos.y + "px";
  }

  resize() {
    this.size = this.element.getBoundingClientRect();
    this.drawActionLine();
  }

  center() {
    this.pos.x = document.body.offsetWidth / 2;
    this.pos.y = document.body.offsetHeight / 2;
    this.draw();
  }

  move(x: number, y: number) {
    this.pos.x = x;
    this.pos.y = y;
    this.draw();
  }
  destroy() {
    this.element.remove();
  }
  getId() {
    return this.id;
  }
  abstract select(): void;
  deselect() {}

  abstract applyApps(
    apps: AppShell[] | undefined,
    hovering?: boolean,
    targetApp?: AppShell
  ): void;
}
