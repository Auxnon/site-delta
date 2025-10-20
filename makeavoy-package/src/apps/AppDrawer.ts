import AppEnvironment from "../types/AppEnvironment";
import AppShell from "../types/AppShell";
import { systemInstance } from "../Main";
import "../style/app-drawer.scss";

export default class AppDrawer extends AppEnvironment {
  private containerApps: AppShell[] = [];
  private containerId: number = 0;

  constructor(element: HTMLElement, id: number) {
    super(element, id);
    this.element.classList.add("app-drawer");
    this.init();
  }

  init() {
    this.element.innerHTML = `
      <div class="app-drawer-header">
        <h3>App Drawer</h3>
        <button class="app-drawer-close">×</button>
      </div>
      <div class="app-drawer-content">
        <div class="app-drawer-grid"></div>
      </div>
    `;

    const closeButton = this.element.querySelector(".app-drawer-close") as HTMLButtonElement;
    closeButton.addEventListener("click", () => {
      this.close();
    });

    this.resolver();
  }

  setContainerApps(apps: AppShell[], containerId: number) {
    this.containerApps = apps;
    this.containerId = containerId;
    this.updateAppGrid();
  }

  private updateAppGrid() {
    const grid = this.element.querySelector(".app-drawer-grid") as HTMLElement;
    grid.innerHTML = "";

    this.containerApps.forEach((app) => {
      const appItem = document.createElement("div");
      appItem.classList.add("app-drawer-item");
      appItem.innerHTML = `
        <div class="app-drawer-icon">
          <img src="${app.asset}" alt="${app.instanceClass}">
        </div>
        <div class="app-drawer-name">${app.instanceClass}</div>
      `;
      
      appItem.addEventListener("click", () => {
        systemInstance.switchApp(app);
        this.close();
      });

      grid.appendChild(appItem);
    });
  }

  open(canvas?: HTMLElement) {
    // Fullscreen the container when drawer opens
    const container = systemInstance.getContainer(this.containerId);
    if (container) {
      systemInstance.fullContainer(container);
    }
    return true;
  }

  close() {
    // Restore apps visibility when drawer closes
    this.containerApps.forEach((app) => {
      app.show();
    });
    super.close();
  }
}