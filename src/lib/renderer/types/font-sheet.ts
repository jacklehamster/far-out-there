import Animation from "./animation";
import BlobType from "./blob";

export default class FontSheet extends Animation {
  type = "fontSheet";
  letterWidth: number[] = [];
  tempCanvas: HTMLCanvasElement = document.createElement("canvas");
  tempContext: CanvasRenderingContext2D | null;
  code: string;
  codeToFrame: { [key: string]: number } = {};

  constructor({ asset, sprite, code }: { asset?: BlobType; sprite?: { width: number, height: number }, code: string }) {
    super({ asset, sprite });
    this.tempCanvas.width = sprite?.width ?? asset?.image.naturalWidth ?? 0;
    this.tempCanvas.height = sprite?.height ?? asset?.image.naturalHeight ?? 0;
    this.tempContext = this.tempCanvas.getContext("2d");
    this.code = code;
    code.split("").forEach((letter, index) => this.codeToFrame[letter] = index);
  }

  getCropForLetter(letter: string) {
    return this.getCrop(this.codeToFrame[letter]);
  }

  getCrop(frame: number) {
    const crop = super.getCrop(frame);
    if (typeof (this.letterWidth[frame]) === 'undefined') {
      this.letterWidth[frame] = crop[2];
      if (this.tempContext && this.asset?.image) {
        const naturalWidth = this.asset?.image.naturalWidth ?? 0;
        const naturalHeight = this.asset?.image.naturalHeight ?? 0;
        const spriteWidth = this.sprite?.width ?? 0;
        const spriteHeight = this.sprite?.height ?? 0;
        const numCols = spriteWidth ? naturalWidth / spriteWidth : 1;
        const numRows = spriteHeight ? naturalHeight / spriteHeight : 1;
        const totalFrames = this.totalFrames || numCols * numRows;
        const localFrame = Math.min(frame, totalFrames - 1);
        const col = localFrame % numCols;
        const row = Math.floor(localFrame / numCols);
        this.tempContext.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
        this.tempContext.drawImage(this.asset?.image, col * spriteWidth, row * spriteHeight, spriteWidth, spriteHeight, 0, 0, spriteWidth, spriteHeight);
        this.letterWidth[frame] = this.findSmallestWidth(this.tempContext);
      }
    }
    crop[2] = this.letterWidth[frame];
    return crop;
  }

  findSmallestWidth(context: CanvasRenderingContext2D): number {
    const data = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
    for (let w = data.width; w > 0; w--) {
      for (let y = 0; y < data.height; y++) {
        const i = ((w - 1) + y * data.width) * 4;
        if (data.data[i + 3] > 0) {
          return w; //  found non-blank pixel.
        }
      }
    }
    return 1;
  }
}