import Animation from "../renderer/types/animation";
import CanvasScene from "./canvas-scene";

export default class BattleScene extends CanvasScene {
  type = "battleScene";
  background?: Animation;
  foe?: Animation;
  attack?: Animation;
}
