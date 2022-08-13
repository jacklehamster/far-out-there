import Animation from "../renderer/types/animation";
import Hero from "../renderer/types/hero";
import CanvasScene from "./canvas-scene";
import { Position } from "./slide-scene";

export interface Tile {
  images?: Animation[];
  startPosition?: boolean;
  block?: boolean;
  portal?: string;
  portalPosition?: Position;
}

export default class MapScene extends CanvasScene {
  type = "mapScene";
  grid?: string[][];
  gridWidth?: number;
  gridHeight?: number;
  tiles: Record<string, Tile> = {};
  defaultTile?: Tile;
  heroes: Hero[] = [];
  moveAction?: Position;
}