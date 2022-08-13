import Condition from "../core/condition";
import CanvasScene from "../scenes/canvas-scene";
import FontSheet from "./types/font-sheet";
import { Label } from "./types/label";

export class DialogRenderer {
  canvas: HTMLCanvasElement | null;
  context: CanvasRenderingContext2D | null;
  onKey?: {
    down(e: KeyboardEvent): void;
    up(e: KeyboardEvent): void;
  }
  time: DOMHighResTimeStamp = 0;

  constructor() {
    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
    this.context = this.canvas?.getContext("2d");
  }

  getActualScroll(scene: CanvasScene, time: DOMHighResTimeStamp) {
    const direction = scene.scrollBackwards ? -1 : 1;
    const scroll = Math.max(0, (scene.scroll ?? 0) + (scene.scrollStart ? direction * Math.floor((time - scene.scrollStart) / 20) : 0));
    return scroll;
  }

  isCompleted(scene: CanvasScene): boolean {
    if (!scene.dialog?.labels || !scene.dialog?.fontSheet) {
      return true;
    }
    const lastLabel = scene.dialog?.labels[scene.dialog.labels.length - 1];

    let shift = 0;
    lastLabel.text.split("").forEach(letter => {
      if (scene.dialog?.fontSheet) {
        const [lx, ly, lw, lh] = scene.dialog.fontSheet.getCropForLetter(letter);
        shift += lw + 1;
      }
    });

    return !scene.scrollStart && (scene.scroll ?? 0) > shift;
  }

  addListener(scene: CanvasScene) {
    if (!this.onKey) {
      this.onKey = {
        down: (e: KeyboardEvent) => {
          if (e.code === "Space" || e.code === "ArrowRight" || e.code === "ArrowLeft" || e.code === "ArrowDown" || e.code === "ArrowUp") {
            if (!scene.scrollStart) {
              scene.scrollStart = this.time;
            }
            scene.scrollBackwards = e.code === "ArrowLeft" || e.code === "ArrowUp" ? true : undefined;
          }
        },
        up: (e: KeyboardEvent) => {
          scene.scroll = this.getActualScroll(scene, this.time);
          delete scene.scrollBackwards;
          scene.scrollStart = undefined;
        }
      };
      document.addEventListener("keydown", this.onKey.down);
      document.addEventListener("keyup", this.onKey.up);
    }
  }

  removeListener() {
    if (this.onKey) {
      document.removeEventListener("keydown", this.onKey.down);
      document.removeEventListener("keyup", this.onKey.up);
      delete this.onKey;
    }
  }

  render(menu: CanvasScene, timestamp: DOMHighResTimeStamp): void {
    this.time = timestamp;
    const { dialog } = menu;
    if (dialog) {
      const { labels, fontSheet } = dialog;
      if (fontSheet) {
        labels?.forEach(label => this.renderLabel(label, fontSheet, menu, timestamp));
      }
    }
  }

  stopRendering() {
    this.removeListener();
  }

  renderLabel(label: Label, fontSheet: FontSheet, menu: CanvasScene, timestamp: DOMHighResTimeStamp) {
    const { x, y, text, hidden } = label;
    const blinkRate = Condition.eval(label.blinkRate, { scene: menu });
    if (blinkRate) {
      if (!menu.startTime) {
        menu.startTime = timestamp;
      }
      const ellapsed = timestamp - menu.startTime;
      const progress = ellapsed % ((blinkRate[0] + blinkRate[1]) * 1000);
      if (progress > blinkRate[0] * 1000) {
        return;
      }
      if (Condition.eval(hidden, { scene: menu })) {
        return;
      }
    }
    let shift = 0;
    if (this.context) {
      this.context.save();
      if (label.box) {
        let minX = Number.MAX_SAFE_INTEGER, minY = Number.MAX_SAFE_INTEGER, maxX = 0, maxY = 0;
        text.split("").forEach(letter => {
          const [, , lw, lh] = fontSheet.getCropForLetter(letter);
          minX = Math.min(minX, x + shift);
          maxX = Math.max(maxX, x + shift + lw);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y + lh);
          shift += lw + 1;
        });
        this.context.fillStyle = "#00000077";
        const rectX = minX - 1;
        const rectY = minY;
        const rectWidth = Math.min(maxX - minX, label.width ?? maxX - minX) + 2;
        const rectHeight = Math.min(maxY - minY, label.height ?? maxY - minY) + 5;
        this.context.fillRect(rectX, rectY, rectWidth, rectHeight);

        const completed = this.isCompleted(menu);
        if (!completed) {
          this.addListener(menu);
        } else {
          this.removeListener();
        }

        if (timestamp % 450 < 300 && !menu.scrollStart && !completed) {
          this.context.fillStyle = "white";
          this.context.lineWidth = 1;
          this.context.beginPath();
          this.context.moveTo(rectX + rectWidth - 1, rectY + rectHeight - 4);
          this.context.lineTo(rectX + rectWidth - 3.5, rectY + rectHeight - 1.5);
          this.context.lineTo(rectX + rectWidth - 6, rectY + rectHeight - 4);
          this.context.closePath();
          this.context.fill();
        }

        if (label.width && label.height) {
          this.context.beginPath();
          this.context.moveTo(x, y);
          this.context.lineTo(x + label.width, y);
          this.context.lineTo(x + label.width, y + label.height);
          this.context.lineTo(x, y + label.height);
          this.context.closePath();
          this.context.clip();
        }
      }
      shift = 0;
      text.split("").forEach(letter => {
        if (this.context && fontSheet.asset?.image) {
          const [lx, ly, lw, lh] = fontSheet.getCropForLetter(letter);
          this.context.drawImage(fontSheet.asset?.image, lx, ly, lw, lh,
            x + shift - this.getActualScroll(menu, timestamp), y, lw, lh);
          shift += lw + 1;
        }
      });
      this.context.restore();
    }
  }
}