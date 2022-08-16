import Animation from "../renderer/types/animation";
import CanvasScene from "./canvas-scene";

export default class BattleScene extends CanvasScene {
  type = "battleScene";
  background?: Animation;
  foe?: {
    idle?: Animation;
    attack?: Animation;
  };
  strike?: Animation;
  foeLife?: number;
  foeAttackTime?: number;
  attackTime?: number;
  menuIndex?: number;
  selectedIndex?: number;
}
