import { App } from "../core/app";
import SceneChangeListener from "../core/scene-change-listener";
import { Renderer } from "./renderer";
import stringify from "json-stringify-pretty-compact";

export default class CodeRenderer implements Renderer<App>, SceneChangeListener {
  codeBox: HTMLTextAreaElement | null;
  timeout: any;

  constructor() {
    this.codeBox = document.getElementById('code') as HTMLTextAreaElement;
  }

  render(app: App, appIndex?: number): void {
    if (appIndex !== undefined && app.appIndex !== appIndex) {
      return;
    }
    if (!this.codeBox) {
      return;
    }
    const scene = app.scenes?.[app.sceneIndex ?? 0];
    this.codeBox.value = scene ? stringify(scene) : "";
    this.timeout = setTimeout(() => this.render(app), 100);
  }

  onChange(app: App): void {
    clearTimeout(this.timeout);
    this.render(app);
  }
}
