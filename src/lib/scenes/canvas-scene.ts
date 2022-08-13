import Scene from "../core/scene";
import FontSheet from "../renderer/types/font-sheet";
import { Label as Label } from "../renderer/types/label";

type Step = [string, number | undefined];

export interface Dialog {
  labels?: Label[];
  fontSheet?: FontSheet;
}

export default class CanvasScene extends Scene {
  step?: number;
  stepProgress?: any;
  dialog?: Dialog;
  onEnd?: Step[];
  scroll?: number;
  scrollStart?: DOMHighResTimeStamp;
  scrollBackwards?: boolean;
}
