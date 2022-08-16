import LoadScene from "../../scenes/load-scene";
import CanvasRenderer, { RenderingStatus } from "./canvas-renderer";
import { ReturnData } from "./return-data";

export default class LoadRenderer extends CanvasRenderer<LoadScene> {
  performRendering(data: LoadScene, timestamp: DOMHighResTimeStamp): RenderingStatus {
    if (data.persist?.game?.returnData) {
      const returnData: ReturnData = data.persist.game.returnData;
      data.destination = returnData.scene;
      data.destinationPosition = returnData.position;
      data.destinationDirection = returnData.direction;
    } else {
      data.destination = "space";
    }
    return RenderingStatus.COMPLETED;
  }
}