import Animation from "../renderer/types/animation";
import BlobType from "../renderer/types/blob";
import CanvasScene from "./canvas-scene";

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

export default class SlideScene extends CanvasScene {
  type = "animationScene";
  slides?: Slide[];
}
