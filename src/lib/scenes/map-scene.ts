import Action from "../renderer/types/action";
import Animation from "../renderer/types/animation";
import Hero from "../renderer/types/hero";
import CanvasScene, { Position } from "./canvas-scene";

export interface Tile {
  images?: Animation[];
  startPosition?: boolean;
  block?: boolean;
  portal?: string;
  portalPosition?: Position;
  portalDirection?: number;
  portalDisabled?: boolean;
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
  spaceAction?: Action;
  onCellActions?: Action[];
  stepsTaken?: number;
  movePending?: boolean;
}
