import { App } from "./app";

export default interface SceneChangeListener {
  onChange(app: App, changeApp: boolean): void;
}