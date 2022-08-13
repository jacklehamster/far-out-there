import CanvasScene from "../scenes/canvas-scene";
import CanvasRenderer from "./types/canvas-renderer";

export default class KeyboardRenderer<T extends CanvasScene> extends CanvasRenderer<T> {
  onKeyDown?: (e: KeyboardEvent) => void;
  onKeyUp?: (e: KeyboardEvent) => void;

  createKeyHandlerDown(data: T): undefined | ((e: KeyboardEvent) => void) {
    return undefined;
  }

  createKeyHandlerUp(data: T): undefined | ((e: KeyboardEvent) => void) {
    return undefined;
  }

  render(data: T): void {
    super.render(data);
    this.registerListener(data);
  }

  registerListener(data: T) {
    if (!this.onKeyDown) {
      this.onKeyDown = this.createKeyHandlerDown(data);
      if (this.onKeyDown) {
        document.addEventListener("keydown", this.onKeyDown);
      }
    }
    if (!this.onKeyUp) {
      this.onKeyUp = this.createKeyHandlerUp(data);
      if (this.onKeyUp) {
        document.addEventListener("keyup", this.onKeyUp);
      }
    }
  }

  unregisterListener() {
    if (this.onKeyDown) {
      document.removeEventListener("keydown", this.onKeyDown);
      this.onKeyDown = undefined;
    }
    if (this.onKeyUp) {
      document.removeEventListener("keyup", this.onKeyUp);
      this.onKeyUp = undefined;
    }
  }

  stopRendering() {
    super.stopRendering();
    this.unregisterListener();
  }
}
