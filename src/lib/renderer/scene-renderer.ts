import { App } from "../core/app";
import Scene from "../core/scene";
import SceneChangeListener from "../core/scene-change-listener";
import AnimationScene from "../scenes/animation-scene";
import MapScene from "../scenes/map-scene";
import MazeScene from "../scenes/maze-scene";
import MenuScene from "../scenes/menu-scene";
import SlideScene, { Position } from "../scenes/slide-scene";
import MazeRenderer from "./maze-renderer";
import { Renderer } from "./renderer";
import AnimationRenderer from "./types/animation-renderer";
import MapRenderer from "./types/map-renderer";
import MenuRenderer from "./types/menu-renderer";
import { ReturnData } from "./types/return-data";
import SlideRenderer from "./types/slide-renderer";
import md5 from "md5";

export default class SceneRenderer implements Renderer<App>, SceneChangeListener {
  canvas: HTMLElement | null;
  renderers = {
    animation: new AnimationRenderer(),
    menu: new MenuRenderer(),
    slide: new SlideRenderer(),
    map: new MapRenderer(),
    maze: new MazeRenderer(),
  };
  rendering: Set<Renderer<any>> = new Set();
  listeners: Set<SceneChangeListener> = new Set();
  audio: HTMLAudioElement | null;

  constructor() {
    this.canvas = document.getElementById('canvas');
    this.audio = document.getElementById("audio") as HTMLAudioElement;
  }

  render(app: App, appIndex?: number): void {
    if (appIndex !== undefined && app.appIndex !== appIndex) {
      return;
    }
    this.clearRendering();

    const scene = app.scenes?.[app.sceneIndex ?? 0];
    this.renderScene(app, scene);
  }

  renderScene(app: App, scene?: Scene) {
    switch (scene?.type) {
      case "animationScene": {
        const renderer = this.renderers.animation;
        this.hookRendering(renderer, scene as AnimationScene);
        renderer.addCompleteListener({
          onComplete: (returnData) => this.nextScene(app, returnData),
          onGoto: (name, returnData, position, direction) => {
            this.gotoScene(app, name, returnData, position, direction, renderer.getConnectionTag(scene as AnimationScene));
          },
        });
        break;
      }
      case "menuScene": {
        const renderer = this.renderers.menu;
        this.hookRendering(renderer, scene as MenuScene);
        renderer.addCompleteListener({
          onComplete: (returnData) => this.nextScene(app, returnData),
          onGoto: (name, returnData, position, direction, tag) => {
            this.gotoScene(app, name, returnData, position, direction, tag);
          },
        });
        break;
      }
      case "slideScene": {
        const renderer = this.renderers.slide;
        this.hookRendering(renderer, scene as SlideScene);
        renderer.addCompleteListener({
          onComplete: (returnData) => this.nextScene(app, returnData),
          onGoto: (name, returnData, position, direction, tag) => {
            this.gotoScene(app, name, returnData, position, direction, tag);
          },
        });
        break;
      }
      case "mapScene": {
        const renderer = this.renderers.map;
        this.hookRendering(renderer, scene as MapScene);
        renderer.addCompleteListener({
          onComplete: (returnData) => this.nextScene(app, returnData),
          onGoto: (name, returnData, position, direction, tag) => {
            this.gotoScene(app, name, returnData, position, direction, tag);
          },
        });
        break;
      }
      case "mazeScene": {
        const renderer = this.renderers.maze;
        this.hookRendering(renderer, scene as MazeScene);
        renderer.addCompleteListener({
          onComplete: (returnData) => this.nextScene(app, returnData),
          onGoto: (name, returnData, position, direction, tag) => {
            this.gotoScene(app, name, returnData, position, direction, tag);
          },
        });
        break;
      }
    }
  }

  gotoScene(app: App, name?: string, returnData?: ReturnData, position?: Position, direction?: number, tag?: string) {
    console.log("TAG", tag, md5(tag ?? ''));
    const nextIndex = app.scenes?.findIndex(scene => scene.title === name) ?? app.sceneIndex ?? 0;
    app.sceneIndex = nextIndex >= 0 ? nextIndex : app.sceneIndex ?? 0;
    if (app.scenes) {
      app.scenes[app.sceneIndex].returnData = returnData;
      app.scenes[app.sceneIndex].returnPosition = position;
      app.scenes[app.sceneIndex].returnDirection = direction;
    }
    this.listeners.forEach(listener => listener.onChange(app, false));
  }

  nextScene(app: App, returnData?: ReturnData) {
    app.sceneIndex = (app.sceneIndex ?? 0) + 1;
    if (app.scenes) {
      app.scenes[app.sceneIndex].returnData = returnData;
    }
    this.listeners.forEach(listener => listener.onChange(app, false));
  }

  clearRendering() {
    this.rendering.forEach(renderer => renderer.stopRendering?.());
    this.rendering.clear();
  }

  hookRendering<T>(renderer: Renderer<T>, scene: T): void {
    renderer.render(scene);
    this.rendering.add(renderer);
  }

  onChange(app: App, changeApp: boolean): void {
    if (changeApp) {
      this.audio?.pause();
    }
    this.render(app);
  }
}
