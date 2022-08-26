import SlideScene from "../../scenes/slide-scene";
import CanvasRenderer, { RenderingStatus } from "./canvas-renderer";
import { ReturnData } from "./return-data";

const DEFAULT_CROP = [0, 0, 0, 0];

export default class SlideRenderer extends CanvasRenderer<SlideScene> {
  performRendering(data: SlideScene, timestamp: DOMHighResTimeStamp): RenderingStatus {
    return this.renderSlides(data, timestamp);
  }

  saveReturnData(data: SlideScene): ReturnData | undefined {
    return data.returnData;
  }
}