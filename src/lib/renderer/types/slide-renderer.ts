import SlideScene from "../../scenes/slide-scene";
import CanvasRenderer, { RenderingStatus } from "./canvas-renderer";

const DEFAULT_CROP = [0, 0, 0, 0];

export default class SlideRenderer extends CanvasRenderer<SlideScene> {
  performRendering(data: SlideScene, timestamp: DOMHighResTimeStamp): RenderingStatus {
    const { slides } = data;
    if (slides) {
      let minRateEllapsed = 1;
      const timeEllapsed = timestamp - (data.startTime ?? 0);
      for (let slide of slides) {
        const rateEllapsed = Math.min(slide?.duration ? timeEllapsed / (slide.duration * 1000) : 1, 1);
        const x = (slide.to.x * rateEllapsed + slide.from.x * (1 - rateEllapsed));
        const y = (slide.to.y * rateEllapsed + slide.from.y * (1 - rateEllapsed));
        minRateEllapsed = Math.min(rateEllapsed, minRateEllapsed);
        if (this.context) {
          this.context.save();
          if (slide.scale) {
            this.context.scale(slide.scale, slide.scale);
          }
          if (slide?.asset?.image) {
            this.context.drawImage(slide.asset?.image, x, y);
          }
          const animation = slide?.animation;
          if (animation?.asset?.image) {
            const frame = timeEllapsed && animation?.frameRate ? Math.floor(animation.frameRate * timeEllapsed / 1000) : 0;
            const [sx, sy, width, height] = animation?.getCrop(frame) ?? DEFAULT_CROP;
            this.context.drawImage(
              animation?.asset?.image,
              sx, sy, width, height,
              x,
              y,
              width, height);
          }
          this.context.restore();
        }
      }

      if (minRateEllapsed >= 1) {
        if (!this.areDialogsCompleted(data)) {
          return RenderingStatus.RENDERING;
        }

        return RenderingStatus.COMPLETED;
      }
    }
    return RenderingStatus.RENDERING;
  }
}