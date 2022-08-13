import Animation from "../renderer/types/animation";
import CanvasScene from "./canvas-scene";

export default class AnimationScene extends CanvasScene {
  type = "animationScene";
  animation?: Animation;
  frameRate?: number;
}
