import Scene from "./scene";

export type Workspace = { apps: App[], appIndex?: number };
export type App = {
  title: string;
  scenes?: Scene[];
  sceneIndex?: number;
  appIndex?: number;
};
