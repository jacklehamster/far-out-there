import AnimationScene from "../../scenes/animation-scene";
import CanvasRenderer, { RenderingStatus } from "./canvas-renderer";

const DEFAULT_CROP = [0, 0, 0, 0];

export default class AnimationRenderer extends CanvasRenderer<AnimationScene> {
  performRendering(data: AnimationScene, timestamp: DOMHighResTimeStamp): RenderingStatus {
    const { animation } = data;
    if (data.animation?.asset?.image) {
      const frame = animation?.getFrame(timestamp, data.startTime) ?? 0;
      const [x, y, width, height] = animation?.getCrop(frame) ?? DEFAULT_CROP;
      if (this.context) {
        this.context.drawImage(data.animation?.asset?.image, x, y, width, height, 0, 0, this.canvas?.width ?? 0, this.canvas?.height ?? 0);
      }
      if (frame >= data.animation.getTotalFrames()) {
        return RenderingStatus.COMPLETED;
      }
    }

    return RenderingStatus.RENDERING;
  }
}