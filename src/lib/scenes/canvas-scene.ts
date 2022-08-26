import Condition from "../core/condition";
import Scene from "../core/scene";
import { NewgroundsCredentials } from "../renderer/achievements/achievement";
import Action from "../renderer/types/action";
import Animation from "../renderer/types/animation";
import BlobType from "../renderer/types/blob";
import FontSheet from "../renderer/types/font-sheet";
import { Label as Label } from "../renderer/types/label";
import Music from "../renderer/types/music";

type Step = [string, number | undefined, Action | undefined];

export const LEVEL_PROGRESSION = [
  [
    { xp: 0, hp: 100, attack: 1 },
    { xp: 400, hp: 120, attack: 1.1 },
    { xp: 800, hp: 150, attack: 1.2 },
    { xp: 1200, hp: 180, attack: 1.5 },
    { xp: 3000, hp: 250, attack: 2.0 },
    { xp: 5000, hp: 500, attack: 3.0 },
  ],
  [
    { xp: 0, hp: 60, attack: .5 },
    { xp: 500, hp: 80, attack: .6 },
    { xp: 1000, hp: 100, attack: .7 },
    { xp: 1500, hp: 120, attack: .8 },
    { xp: 3000, hp: 200, attack: .9 },
    { xp: 5000, hp: 300, attack: 1 },
  ],
  [
    { xp: 0, hp: 80, attack: .8 },
    { xp: 600, hp: 100, attack: .9 },
    { xp: 900, hp: 120, attack: 1.0 },
    { xp: 1200, hp: 130, attack: 1.1 },
    { xp: 3000, hp: 150, attack: 1.5 },
    { xp: 5000, hp: 200, attack: 2.0 },
  ],
  [
    { xp: 0, hp: 100, attack: 0 },
    { xp: 400, hp: 100, attack: 0 },
    { xp: 800, hp: 100, attack: 0 },
    { xp: 1200, hp: 100, attack: 0 },
    { xp: 3000, hp: 100, attack: 0 },
    { xp: 5000, hp: 100, attack: 10.0 },
  ],
];
export interface Dialog {
  labels?: Label[];
  fontSheet?: FontSheet;
  hidden?: boolean;
  lastDialog?: boolean;
}

export interface PersistData {
  game: {
    stats?: {
      heroes: {
        hp: number;
        max: number;
        xp: number;
        level: number;
        attack: number;
        xpNext: number;
        active?: boolean;
      }[];
      gold: number;
    }
    inventory?: Record<string, number>;
    secret?: Record<string, number>;
    [key: string]: any;
    startTime?: number;
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
  hidden: boolean | Condition;
  looping?: boolean;
  timeAnim?: number;
  currentlyHidden: boolean = false;

  constructor({ asset, from, to, duration, animation, hidden, looping }: { asset: BlobType; animation?: Animation; from: Position; to: Position; duration: number; hidden?: boolean; looping?: boolean }) {
    this.asset = asset;
    this.animation = animation;
    this.from = from;
    this.to = to;
    this.duration = duration;
    this.hidden = hidden ?? false;
    this.looping = looping;
  }
}
export interface Position {
  x: number;
  y: number;
}

export default class CanvasScene extends Scene {
  step?: number;
  stepProgress?: any;
  fadeStart?: number;
  dialog?: Dialog;
  dialogs?: Dialog[];
  onEnd?: Step[];
  scroll?: number;
  scrollStart?: DOMHighResTimeStamp;
  scrollBackwards?: boolean;
  message?: string;
  messages?: Action[];
  justPickedUp?: boolean;
  persist?: PersistData;

  itemBonus?: string[];
  itemRemove?: string[];
  slides?: Slide[];

  subMenu?: boolean;
  restartOnDone?: boolean;

  inventory?: string[];
  secret?: Record<string, number>;
  itemActions?: Record<string, Action>;
  completed?: boolean;

  mainHeroStats?: any;
  hero?: number;

  newgrounds?: {
    credentials: NewgroundsCredentials;
    animation: Animation;
    sound: Music;
  }
  medalStart?: number;
}
