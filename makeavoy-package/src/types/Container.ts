import AppShell, { AppLocation } from "./AppShell";
import "../style/container.scss";

export abstract class Container {
  element = document.createElement("div");
  handle = document.createElement("div");
  size: DOMRect;
  constructor(private id: number, target: HTMLElement) {
    this.element.id = `container-${id}`;
    this.element.classList.add("container");
    this.handle.classList.add("container-handle");
    this.element.appendChild(this.handle);
    const c = target.querySelectorAll(".container");
    // insert after the last container
    if (c.length > 0) {
      target.insertBefore(this.element, c[c.length - 1]);
    } else {
      target.prepend(this.element);
    }
  }

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

  /** target is over comntainer, return truthywhether it's accepted or not */
  abstract dragOver(target: AppShell): boolean;

  resize() {
    this.size = this.element.getBoundingClientRect();
  }

  abstract applyApps(apps: AppShell[], targetApp?: AppShell): void;
}
