import AppShell, { AppLocation } from "./AppShell";
import { Container } from "./Container";

export class FolderContainer extends Container {
  items: number[] = [];
  appSortOrganized = true;

  constructor(id: number, target: HTMLElement) {
    super(id, target);
    this.sortButtonInit();
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

  applyApps(apps: AppShell[], targetApp?: AppShell) {
    let rect = this.getSize();
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
      const offsetX = rect.x + colRemainder;
      const offsetY = rect.y + rowRemainder;
      let reserved = [];
      // sort by distance from 0,0
      apps.sort((a, b) => {
        const aDist = Math.sqrt(Math.pow(a.pos.x, 2) + Math.pow(a.pos.y, 2));
        const bDist = Math.sqrt(Math.pow(b.pos.x, 2) + Math.pow(b.pos.y, 2));
        return aDist - bDist;
      });

      // if (targetApp) {
      // const targetPos = {
      //   x: Math.round(targetApp.pos.x - rect.x) / 72,
      //   y: Math.round(targetApp.pos.y - rect.y) / 72,
      // };

      apps.forEach((app, i) => {
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
        app.constrain(rect.x, rect.y, rect.width, rect.height);
      });
    }
  }

  dragOver(target: AppShell): boolean {
    // throw new Error("Method not implemented.");
    return true;
  }
}
