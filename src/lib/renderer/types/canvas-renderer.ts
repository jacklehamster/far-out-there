import CompleteListener from "../../core/complete-listener";
import CanvasScene from "../../scenes/canvas-scene";
import { DialogRenderer } from "../dialog-renderer";
import { Renderer } from "../renderer";
import { resolve } from "url";
import Music from "./music";
import { ReturnData } from "./return-data";

export enum RenderingStatus {
  RENDERING,
  COMPLETED,
}

export default class CanvasRenderer<T extends CanvasScene> implements Renderer<T> {
  canvas: HTMLCanvasElement | null;
  context: CanvasRenderingContext2D | null;
  requestID: number = 0;
  listeners: Set<CompleteListener> = new Set<CompleteListener>();
  dialogRenderer: DialogRenderer = new DialogRenderer();
  audio: HTMLAudioElement | null;

  constructor() {
    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
    this.context = this.canvas?.getContext("2d");
    this.audio = document.getElementById("audio") as HTMLAudioElement;
  }

  getConnectionTag(data: T): string | undefined {
    return;
  }

  addCompleteListener(listener: CompleteListener) {
    this.listeners.add(listener);
  }

  changeMusic(music?: Music) {
    if (this.audio && (this.audio.src !== resolve(location.href, music?.path ?? '') || this.audio.paused)) {
      if (music) {
        this.audio.src = music.path;
        this.audio.play();
        this.audio.loop = music.loop === undefined || music.loop;
      } else {
        this.audio.pause();
      }
    }
  }

  reset(data: T) {
    data.step = 0;
    delete data.stepProgress;
    delete data.startTime;

    delete data.scroll;
    delete data.scrollStart;
    delete data.scrollBackwards;
    delete data.destination;
  }

  render(data: T): void {
    if (!data.persistState) {
      this.reset(data);
    }
    this.listeners.clear();
    this.startLoop(data);
    this.changeMusic(data.music);
  }

  areDialogsCompleted(data: T) {
    return this.dialogRenderer.isCompleted(data);
  }

  performRendering(data: T, timestamp: DOMHighResTimeStamp): RenderingStatus {
    return RenderingStatus.RENDERING;
  }

  startLoop(data: T): void {
    const loop = (timestamp: DOMHighResTimeStamp): void => {
      this.requestID = requestAnimationFrame(loop);
      if (!data.startTime) {
        data.startTime = timestamp;
      }
      const status = this.performRendering(data, timestamp);
      if (data.dialog) {
        this.dialogRenderer.render(data, timestamp);
      }

      this.applyFade(data, timestamp);

      if (status === RenderingStatus.COMPLETED) {
        this.performCompletionSteps(data, timestamp);
      }
    };
    this.requestID = requestAnimationFrame(loop);
  }

  startFade(data: T, timestamp: DOMHighResTimeStamp) {
    data.stepProgress = {
      fadeStart: timestamp,
    };
  }

  applyFade(data: T, timestamp: DOMHighResTimeStamp, fadeSeconds?: number) {
    if (!data.stepProgress?.fadeStart) {
      return;
    }
    const fade = Math.min(1, (timestamp - data.stepProgress.fadeStart) / (fadeSeconds ?? .5) / 1000);
    if (fade && this.context) {
      this.context.fillStyle = `rgb(0, 0, 0, ${fade ?? 0})`;
      this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);
    }
  }

  performCompletionSteps(data: T, timestamp: DOMHighResTimeStamp) {
    if (data.onEnd) {
      if (!data.step) {
        data.step = 1;
      }
      const [command, param] = data.onEnd[data.step - 1];
      switch (command) {
        case "wait":
          if (!data.stepProgress) {
            data.stepProgress = {
              deadline: timestamp + (param ?? 1) * 1000,
            };
          }
          if (timestamp >= data.stepProgress.deadline) {
            delete data.stepProgress;
            data.step++;
          }
          break;
        case "fade":
          if (!data.stepProgress) {
            this.startFade(data, timestamp);
          }
          const fade = Math.min(1, (timestamp - data.stepProgress.fadeStart) / 1000);
          if (fade >= 1) {
            delete data.stepProgress;
            data.step++;
          }
          break;
        case "next":
          {
            const listeners = [];
            for (let listener of this.listeners) {
              listeners.push(listener);
            }
            this.listeners.clear();
            const returnData = this.saveReturnData(data);
            this.reset(data);
            listeners.forEach(listener => listener.onComplete?.(returnData));
          }
          break;
        case "goto":
          {
            const listeners = [];
            for (let listener of this.listeners) {
              listeners.push(listener);
            }
            this.listeners.clear();
            const tag = this.getConnectionTag(data);
            const destination = data.destination;
            const destinationPosition = data.destinationPosition;
            const destinationDirection = data.destinationDirection;
            const returnData = this.saveReturnData(data);
            this.reset(data);
            listeners.forEach(listener => listener.onGoto?.(destination, returnData, destinationPosition, destinationDirection, tag));
          }
          break;
        case "return":
          {
            const listeners = [];
            for (let listener of this.listeners) {
              listeners.push(listener);
            }
            this.listeners.clear();
            const destination = data.returnData?.scene;
            const destinationPosition = data.returnData?.position;
            const destinationDirection = data.returnData?.direction;
            const returnData = this.saveReturnData(data);
            this.reset(data);
            listeners.forEach(listener => listener.onGoto?.(destination, returnData, destinationPosition, destinationDirection));
          }
          break;
      }
    }
  }

  saveReturnData(data: T): ReturnData | undefined {
    return undefined;
  }

  stopRendering() {
    this.context?.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
    cancelAnimationFrame(this.requestID);
    this.dialogRenderer.stopRendering();
  }
}  
