import { systemInstance } from "../Main";
import AppShell, { AppLocation } from "./AppShell";
import { Container } from "./Container";

export class FolderContainer extends Container {
  appSortOrganized = true;
  windowed = true;

  constructor(id: number, target: HTMLElement) {
    super(id, target);
    this.sortButtonInit();
    this.addActionLine();
  }

  sortButtonInit() {
    const target = this.element;
    let sortButton = document.createElement("button");
    sortButton.classList.add("app-sort-button");
    sortButton.addEventListener("click", (ev) => {
      this.appSortOrganized = !this.appSortOrganized;
      if (ev.target instanceof HTMLElement) {
        if (this.appSortOrganized) ev.target.classList.add("sorting--enabled");
        else ev.target.classList.remove("sorting--enabled");
      }
      window.dispatchEvent(new Event("recalculate"));

      //   this.barCalculate();
    });

    target.appendChild(sortButton);
  }

  applyApps(
    apps: AppShell[] | undefined,
    hovering?: boolean,
    targetApp?: AppShell
  ) {
    if (!apps) return;
    if (this.windowed) {
      if ((apps.length == 1 || hovering) && !apps[0].isOneOff()) {
        this.windowMode(apps[0]);
        return;
      } else {
        this.windowed = false;
      }
    }
    let rect = this.getSize();
    const cx = this.pos.x - rect.width / 2;
    const cy = this.pos.y - rect.height / 2;
    let locations: AppLocation[] = [];
    if (this.appSortOrganized) {
      const padding = 72;
      // const padding2 = padding / 2;
      const pw = rect.width - padding;
      const ph = rect.height - padding;
      const cols = Math.floor(pw / 72);
      const rows = Math.floor(ph / 72);
      const colRemainder = (72 + (rect.width - cols * padding)) / 2;
      const rowRemainder = (72 + (rect.height - rows * padding)) / 2;
      const offsetX = cx + colRemainder;
      const offsetY = cy + rowRemainder;
      let reserved: AppShell[] = [];
      // sort by distance from 0,0
      apps.sort((a, b) => {
        const aDist = Math.sqrt(Math.pow(a.pos.x, 2) + Math.pow(a.pos.y, 2));
        const bDist = Math.sqrt(Math.pow(b.pos.x, 2) + Math.pow(b.pos.y, 2));
        return aDist - bDist;
      });

      apps.forEach((app, i) => {
        if (app.isPartial()) {
          app.close();
        }
        const pos = {
          x: Math.min(
            Math.max(Math.round((app.pos.x - offsetX) / 72), 0),
            cols - 1
          ),
          y: Math.min(
            Math.max(Math.round((app.pos.y - offsetY) / 72), 0),
            rows - 1
          ),
        };
        let index = pos.x + pos.y * cols;
        if (reserved[index]) {
          // shift array right
          reserved.splice(index, 0, app);
        } else {
          reserved[index] = app;
        }
      });

      // filter out nulls
      reserved = reserved.filter((a) => a);

      reserved.forEach((a, i) => {
        if (a) {
          const pos = {
            x: i % cols,
            y: Math.floor(i / cols),
          };

          const l = {
            id: i,
            x: offsetX + pos.x * 72,
            y: offsetY + pos.y * 72,
          };

          if (a.id != targetApp?.id) {
            a.move(l.x, l.y);
          }
        }
      });

      // let rows = (apps.length * (56 + 28) + 28) / rect.width;
      // rows = Math.ceil(rows);
      // let perRow = apps.length / rows;
      // console.log("rows", rows);
      // let homeRatio = (rect.width - 112) / (apps.length - 1);
      // apps.forEach((app, relativeIndex) => {
      //   const i = app.id;
      //   const l = {
      //     id: i,
      //     x: 56 + rect.left + relativeIndex * homeRatio,
      //     y: rect.top + 56,
      //   };
      //   locations.push(l);
      //   app.move(l.x, l.y);
      // });
    } else {
      apps.forEach((app, i) => {
        app.incrementPosition(this.staticOffset);
        app.constrain(cx, cy, rect.width, rect.height);
        if (app.isPartial()) {
          app.close();
        }
      });
    }
  }

  windowMode(app: AppShell) {
    if (!app.isPartial()) {
      systemInstance.openPartial(app, this);
    } else {
      app.centerTo(this);
    }
  }

  isWindowed(): boolean {
    return this.windowed;
  }

  handleDrag(ev: PointerEvent) {
    this.offset = { x: this.pos.x - ev.clientX, y: this.pos.y - ev.clientY };
    this.isMoving = false;
    this.element.classList.add("container--moving");
    systemInstance.containerDrag(this.id, this, ev);
  }

  dragOver(target: AppShell): boolean {
    // throw new Error("Method not implemented.");
    return true;
  }

  select(): void {
    if (this.windowed) systemInstance.passivePartialOpen(this.id);
  }

  deselect(): void {
    this.element.classList.remove("container--moving");
  }
}
