import AppShell from "./AppShell";
import { Container } from "./Container";

export class WindowContainer extends Container {
  dragOver(target: AppShell): boolean {
    throw new Error("Method not implemented.");
  }
  //   constructor(id: number) {
  //     super(id);
  //   }
  applyApps(apps: AppShell[]) {
    throw new Error("Method not implemented.");
  }

  handleDrag(ev: PointerEvent) {}
  select(): void {}
}
