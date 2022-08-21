import { App, Workspace } from "../core/app";
import SceneChangeListener from "../core/scene-change-listener";
import { Renderer } from "./renderer";
import { resolve } from "url";

declare global {
  interface Window { workspace: Workspace; resolve: typeof resolve }
}

export default class Registry implements Renderer<Workspace>, SceneChangeListener {
  renderers: Record<string, Renderer<any>> = {};
  listeners: Set<SceneChangeListener> = new Set<SceneChangeListener>();

  async register<T extends Renderer<any>>(name: string, renderer: T): Promise<T> {
    this.renderers[name] = renderer;
    return renderer;
  }

  async addSceneChangeListener<T extends SceneChangeListener>(sceneChangeListener: T): Promise<T> {
    this.listeners.add(sceneChangeListener);
    return sceneChangeListener;
  }

  getRenderer<T>(name: string): Renderer<T> {
    return this.renderers[name];
  }

  render(workspace: Workspace) {
    window.workspace = workspace;
    window.resolve = resolve;
    this.deepRender(workspace, workspace.appIndex);
  }

  deepRender(obj: any | { renderers: Renderer<any>[] }, appIndex?: number): void {
    if (typeof (obj) !== 'object' || !obj) {
      return;
    }
    if (obj instanceof HTMLImageElement) {
      return;
    }
    if (obj instanceof HTMLCanvasElement) {
      return;
    }
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        this.deepRender(obj[i], appIndex);
      }
    } else {
      if (obj.renderers) {
        obj.renderers.forEach((renderer: string) => {
          this.renderers[renderer]?.render(obj, appIndex);
        });
      }
      for (let i in obj) {
        if (!(obj[i] instanceof HTMLImageElement)) {
          this.deepRender(obj[i], appIndex);
        }
      }
    }
  }

  onChange(app: App, changeApp: boolean): void {
    this.listeners.forEach(listener => listener.onChange(app, changeApp));
  }
}