import Action from "../renderer/types/action";
import Animation from "../renderer/types/animation";
import CanvasScene from "./canvas-scene";

export default class BattleScene extends CanvasScene {
  type = "battleScene";
  background?: Animation;
  foe?: {
    name?: string;
    idle?: Animation;
    attack?: Animation;
    hurt?: Animation;
  };
  chestClose?: Animation;
  chestOpen?: Animation;

  strike?: Animation;
  hurt?: Animation;
  foeLife?: number;
  foeMaxLife?: number;
  foeAttackTime?: number;
  foeStrength?: number;
  attackTime?: number;
  menuIndex?: number;
  selectedIndex?: number;
  foeHurtTime?: number;
  hurtTime?: number;
  attackSequence?: boolean;
  missed?: boolean;
  foeMissed?: boolean;
  waitTime?: number;
  battleOver?: boolean;
  failedEscape?: boolean;
  chest?: {
    opened: number;
  };
  showChest?: boolean;

  xp?: number;
  gold?: number;
  collected?: boolean;
  heroName?: string;
}
