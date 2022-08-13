import MenuScene from "../../scenes/menu-scene";
import KeyboardRenderer from "../keyboard-renderer";
import { RenderingStatus } from "./canvas-renderer";

export default class MenuRenderer extends KeyboardRenderer<MenuScene> {
  reset(data: MenuScene) {
    super.reset(data);
    data.menuIndex = 0;
    delete data.selectedIndex;
  }

  performRendering(data: MenuScene, timestamp: DOMHighResTimeStamp): RenderingStatus {
    if (data.background?.image) {
      this.context?.drawImage(data.background?.image, 0, 0);
    }
    return data.selectedIndex === undefined ? RenderingStatus.RENDERING : RenderingStatus.COMPLETED;
  }

  createKeyHandlerDown(data: MenuScene): (e: KeyboardEvent) => void {
    const numOptions = data.numOptions ?? 2;
    return (e) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          data.menuIndex = ((data.menuIndex ?? 0) + 1) % numOptions;
          break;
        case "KeyS":
        case "ArrowDown":
          data.menuIndex = ((data.menuIndex ?? 0) - 1 + 2) % numOptions;
          break;
        case "Space":
          data.selectedIndex = data.menuIndex;
          this.unregisterListener();
          break;
      }
    };
  }
}