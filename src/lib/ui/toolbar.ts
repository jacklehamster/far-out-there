import { Renderer } from "../renderer/renderer";
import { App, Workspace } from "../core/app";
import SceneChangeListener from "../core/scene-change-listener";

export default class Toolbar implements Renderer<Workspace>, SceneChangeListener {
  toolbarDiv: HTMLElement | null;
  bars: HTMLElement[];
  listeners: Set<SceneChangeListener> = new Set();

  constructor() {
    this.toolbarDiv = document.getElementById("toolbar");
    this.bars = [
      document.createElement("div"),
      document.createElement("div"),
    ];
    this.bars.forEach(bar => {
      bar.classList.add("toolbar");
      this.toolbarDiv?.appendChild(bar);
    });
  }

  onChange(app: App): void {
    this.renderSecondaryBar(app);
  }

  render(data: Workspace) {
    const [bar] = this.bars;
    bar.innerText = ''
    const { apps, appIndex = 0 } = data;
    apps.forEach((app, i) => {
      const { title } = app;
      const selected = i === appIndex;
      const div = document.createElement("div");
      div.classList.add("toolbar-item");
      if (selected) {
        div.classList.add('selected');
      }
      div.textContent = title ?? "untitled";
      if (!selected) {
        div.addEventListener("click", () => {
          data.appIndex = i;
          this.render(data);
          this.onSceneChange(app, true);
        });
      }
      bar?.appendChild(div);
      if (selected) {
        this.renderSecondaryBar(app);
      }
    });
  }

  renderSecondaryBar(app: App) {
    const [, bar] = this.bars;
    bar.innerText = '';
    const { scenes, sceneIndex = 0 } = app;
    scenes?.forEach(({ title }, i) => {
      const selected = i === sceneIndex;
      const div = document.createElement("div");
      div.classList.add("toolbar-item");
      if (selected) {
        div.classList.add('selected');
      }
      div.textContent = title ?? "untitled";
      if (!selected) {
        div.addEventListener("click", () => {
          app.sceneIndex = i;
          this.renderSecondaryBar(app);
          this.onSceneChange(app, false);
        });
      }
      bar?.appendChild(div);
    });
  }

  onSceneChange(app: App, changeApp: boolean) {
    this.listeners.forEach(listener => listener.onChange(app, changeApp));
  }

  hook(listener: SceneChangeListener): void {
    this.listeners.add(listener);
  }
}