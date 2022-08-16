import Action from "../renderer/types/action";
import BlobType from "../renderer/types/blob";
import CanvasScene from "./canvas-scene";

export default class MenuScene extends CanvasScene {
  type = "menuScene";
  background?: BlobType;
  menuIndex?: number;
  selectedIndex?: number;
  numOptions?: number;
  actions?: Action[];
}
