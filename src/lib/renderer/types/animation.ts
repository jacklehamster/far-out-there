import BlobType from "./blob";


export default class Animation {
  type = "animation";
  asset?: BlobType;
  sprite: {
    width: number;
    height: number;
  } = { width: 0, height: 0 };
  frameRate: number;
  totalFrames: number;
  range?: [number, number];
  flip?: boolean;
  position?: { x: number; y: number };
  #tempVar: [number, number, number, number, boolean] = [0, 0, 0, 0, false];

  constructor({ asset, sprite, frameRate, totalFrames, range, flip, position }: { asset?: BlobType; sprite?: { width: number, height: number }; frameRate?: number; totalFrames?: number; range?: [number, number]; flip?: boolean; position?: { x: number; y: number } }) {
    this.asset = asset;
    this.sprite.width = sprite?.width ?? 0;
    this.sprite.height = sprite?.height ?? 0;
    this.frameRate = frameRate ?? 0;
    this.totalFrames = totalFrames ?? 0;
    this.range = range;
    this.flip = flip;
    this.position = position;
  }

  getLocalFrame(frame: number, totalFrames: number, looping = false): { localFrame: number; animating: boolean } {
    if (!this.range) {
      return { localFrame: looping ? frame % totalFrames : Math.min(frame, totalFrames - 1), animating: looping || frame < totalFrames };
    }
    const rsize = this.range[1] - this.range[0] + 1;
    const f = looping ? frame % rsize : Math.min(frame, rsize - 1);
    return { localFrame: this.range[0] + f, animating: looping || frame < rsize };
  }

  getCrop(frame: number, looping = false) {
    const naturalWidth = this.asset?.image.naturalWidth ?? 0;
    const naturalHeight = this.asset?.image.naturalHeight ?? 0;
    const spriteWidth = this.sprite?.width ?? 0;
    const spriteHeight = this.sprite?.height ?? 0;
    const numCols = spriteWidth ? naturalWidth / spriteWidth : 1;
    const numRows = spriteHeight ? naturalHeight / spriteHeight : 1;
    const totalFrames = this.totalFrames || numCols * numRows;
    const { localFrame, animating } = this.getLocalFrame(frame, totalFrames, looping);
    const col = localFrame % numCols;
    const row = Math.floor(localFrame / numCols);
    this.#tempVar[0] = col * spriteWidth;
    this.#tempVar[1] = row * spriteHeight;
    this.#tempVar[2] = spriteWidth;
    this.#tempVar[3] = spriteHeight;
    this.#tempVar[4] = looping || animating;
    return this.#tempVar;
  }

  getFrame(timestamp: DOMHighResTimeStamp, startTime?: DOMHighResTimeStamp) {
    const timeEllapsed = timestamp - (startTime ?? 0);
    const frame = timeEllapsed && this?.frameRate ? Math.floor(this.frameRate * timeEllapsed / 1000) : 0;
    return frame;
  }

  getTotalFrames() {
    if (this.totalFrames) {
      return this.totalFrames;
    }
    if (this.range) {
      return (this.range[1] - this.range[0]) + 1;
    }
    const naturalWidth = this.asset?.image.naturalWidth ?? 0;
    const naturalHeight = this.asset?.image.naturalHeight ?? 0;
    const spriteWidth = this.sprite?.width ?? 0;
    const spriteHeight = this.sprite?.height ?? 0;
    const numCols = spriteWidth ? naturalWidth / spriteWidth : 1;
    const numRows = spriteHeight ? naturalHeight / spriteHeight : 1;
    return numCols * numRows;
  }

  toJSON() {
    return {
      type: this.type,
      asset: this.asset,
      sprite: this.sprite,
      frameRate: this.frameRate,
      totalFrames: this.totalFrames,
      range: this.range,
      flip: this.flip,
    }
  }
}
