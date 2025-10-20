import { systemInstance } from "../Main";
import AppShell, { AppLocation } from "./AppShell";
import { Container } from "./Container";

export class FolderContainer extends Container {
  appSortOrganized = true;
  windowed = true;
  appDrawer?: AppShell;
  private maxAppsBeforeDrawer: number = 16; // 4x4 grid before drawer needed

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
    targetApp?: AppShell,
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

    if (this.appSortOrganized) {
      const padding = 72;
      const pw = rect.width - padding;
      const ph = rect.height - padding;
      const cols = Math.floor(pw / 72);
      const rows = Math.floor(ph / 72);
      const maxApps = cols * rows;

      // Check if we need an app drawer
      const needsDrawer = apps.length > maxApps;
      let visibleApps = apps;
      let hiddenApps: AppShell[] = [];

      if (needsDrawer) {
        // Split apps into visible and hidden
        visibleApps = apps.slice(0, maxApps - 1);
        hiddenApps = apps.slice(maxApps - 1);

        // Create or update app drawer
        if (!this.appDrawer) {
          this.appDrawer = this.createAppDrawer();
        }

        // Add drawer to visible apps
        visibleApps.push(this.appDrawer);

        // Hide overflow apps
        hiddenApps.forEach((app) => {
          app.hide();
          app.element.style.pointerEvents = "none";
        });

        // Update drawer with hidden apps
        this.updateAppDrawer(hiddenApps);
      } else {
        // Remove app drawer if it exists
        if (this.appDrawer) {
          this.removeAppDrawer();
        }

        // Show all apps
        apps.forEach((app) => {
          app.show();
          app.element.style.pointerEvents = "auto";
        });
      }

      const colRemainder = (72 + (rect.width - cols * padding)) / 2;
      const rowRemainder = (72 + (rect.height - rows * padding)) / 2;
      const offsetX = cx + colRemainder;
      const offsetY = cy + rowRemainder;
      let reserved: AppShell[] = [];

      // sort by distance from 0,0
      visibleApps.sort((a, b) => {
        const aDist = Math.sqrt(Math.pow(a.pos.x, 2) + Math.pow(a.pos.y, 2));
        const bDist = Math.sqrt(Math.pow(b.pos.x, 2) + Math.pow(b.pos.y, 2));
        return aDist - bDist;
      });

      visibleApps.forEach((app) => {
        if (app.isPartial()) {
          app.close();
        }
        const pos = {
          x: Math.min(
            Math.max(Math.round((app.pos.x - offsetX) / 72), 0),
            cols - 1,
          ),
          y: Math.min(
            Math.max(Math.round((app.pos.y - offsetY) / 72), 0),
            rows - 1,
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
    super.handleDrag(ev);
    this.offset = { x: this.pos.x - ev.clientX, y: this.pos.y - ev.clientY };
    this.isMoving = false;
    this.element.classList.add("container--moving");
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

  private createAppDrawer(): AppShell {
    const drawerId = 9998; // Special ID for app drawer
    const drawer = systemInstance.createAppDrawer(drawerId, this.id);
    drawer.element.classList.add("app-drawer-shell");
    return drawer;
  }

  private updateAppDrawer(hiddenApps: AppShell[]) {
    if (this.appDrawer) {
      systemInstance.updateAppDrawer(this.appDrawer, hiddenApps, this.id);
    }
  }

  private removeAppDrawer() {
    if (this.appDrawer) {
      systemInstance.removeAppDrawer(this.appDrawer);
      this.appDrawer = undefined;
    }
  }
}
