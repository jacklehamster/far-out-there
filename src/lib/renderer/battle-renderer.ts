import BattleScene from "../scenes/battle-scene";
import KeyboardRenderer from "./keyboard-renderer";
import { RenderingStatus } from "./types/canvas-renderer";

const DEFAULT_CROP = [0, 0, 0, 0];

export default class BattleRenderer extends KeyboardRenderer<BattleScene> {
  attackOptions: ["ATTACK", "BLOCK", "FLEE"];
  time: DOMHighResTimeStamp;

  constructor() {
    super();
    this.attackOptions = [
      "ATTACK",
      "BLOCK",
      "FLEE",
    ];
    this.time = 0;
  }

  reset(data: BattleScene) {
    super.reset(data);
    data.menuIndex = 0;
    delete data.selectedIndex;
  }

  performRendering(data: BattleScene, timestamp: DOMHighResTimeStamp): RenderingStatus {
    this.time = timestamp;
    if (this.context) {
      this.drawAnimation(data.background, timestamp, data?.startTime, true);

      if (data.foeAttackTime) {
        this.drawAnimation(data.foe?.attack, timestamp, data.foeAttackTime, false);
      } else {
        this.drawAnimation(data.foe?.idle, timestamp, data?.startTime, false);
      }

      if (data.attackTime) {
        this.drawAnimation(data.strike, timestamp, data.attackTime ?? 0, false);
      }
    }
    return RenderingStatus.RENDERING;
  }


  createKeyHandlerDown(data: BattleScene): (e: KeyboardEvent) => void {
    const numOptions = this.attackOptions.length;
    return (e) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          data.menuIndex = ((data.menuIndex ?? 0) - 1) % numOptions;
          break;
        case "KeyS":
        case "ArrowDown":
          data.menuIndex = ((data.menuIndex ?? 0) + 1 + numOptions) % numOptions;
          break;
        case "Space":
          data.selectedIndex = data.menuIndex;
          data.attackTime = this.time;
          break;
      }
    };
  }
}