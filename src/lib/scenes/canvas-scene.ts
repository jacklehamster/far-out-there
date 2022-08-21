import Scene from "../core/scene";
import Animation from "../renderer/types/animation";
import BlobType from "../renderer/types/blob";
import FontSheet from "../renderer/types/font-sheet";
import { Label as Label } from "../renderer/types/label";

type Step = [string, number | undefined];

export const LEVEL_PROGRESSION = [
  { xp: 0, hp: 100, attack: 1 },
  { xp: 400, hp: 120, attack: 1.1 },
  { xp: 800, hp: 150, attack: 1.2 },
  { xp: 1200, hp: 180, attack: 1.3 },
  { xp: 3000, hp: 200, attack: 1.4 },
  { xp: 5000, hp: 250, attack: 1.5 },
];
export interface Dialog {
  labels?: Label[];
  fontSheet?: FontSheet;
  hidden?: boolean;
}

export interface PersistData {
  game: {
    stats?: {
      hp: number;
      max: number;
      xp: number;
      gold: number;
      level: number;
      attack: number;
      xpNext: number;
    }
    inventory?: Record<string, number>;
    [key: string]: any;
  }
  [key: string]: any;
}

export class Slide {
  type = "slideShow";
  asset?: BlobType;
  animation?: Animation;
  from: Position = { x: 0, y: 0 };
  to: Position = { x: 0, y: 0 };
  duration?: number;
  scale?: number;

  constructor({ asset, from, to, duration, animation }: { asset: BlobType; animation?: Animation; from: Position; to: Position; duration: number }) {
    this.asset = asset;
    this.animation = animation;
    this.from = from;
    this.to = to;
    this.duration = duration;
  }
}
export interface Position {
  x: number;
  y: number;
}

export default class CanvasScene extends Scene {
  step?: number;
  stepProgress?: any;
  dialog?: Dialog;
  dialogs?: Dialog[];
  onEnd?: Step[];
  scroll?: number;
  scrollStart?: DOMHighResTimeStamp;
  scrollBackwards?: boolean;
  message?: string;
  justPickedUp?: boolean;
  persist?: PersistData;

  itemBonus?: string[];
  itemRemove?: string[];
  slides?: Slide[];
}
