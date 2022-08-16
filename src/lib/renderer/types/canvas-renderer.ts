import CompleteListener from "../../core/complete-listener";
import CanvasScene from "../../scenes/canvas-scene";
import { DialogRenderer } from "../dialog-renderer";
import { Renderer } from "../renderer";
import { resolve } from "url";
import Music from "./music";
import { ReturnData } from "./return-data";
import Action from "./action";

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
  saveTimeout: any;

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

    const persist = JSON.parse(localStorage.getItem(`persist_game`) ?? "{}");
    data.persist = persist;
  }

  saveProp(data: T, prop: string, value: any) {
    if (!data.persist) {
      return;
    }
    const sceneData = data.persist[data.title ?? ''] ?? (data.persist[data.title ?? ''] = {});
    sceneData[prop] = value;
    localStorage.setItem(`persist_game`, JSON.stringify(data.persist));
    this.saveTime(data);
  }

  getProp(data: T, prop: string) {
    return data?.persist?.[data.title ?? '']?.[prop];
  }

  saveStats(data: T, hp: number, max: number) {
    if (!data.persist) {
      return;
    }
    const gameData = data.persist.game ?? (data.persist.game = {});
    const stats = gameData.stats ?? (gameData.stats = { hp: 0, max: 0 });
    stats.max = max;
    stats.hp = Math.max(0, Math.min(hp, max));
    localStorage.setItem(`persist_game`, JSON.stringify(data.persist));
    this.saveTime(data);
  }

  addHp(data: T, hp: number) {
    this.saveStats(data, (data.persist?.game.stats?.hp ?? 0) + hp, data.persist?.game.stats?.max ?? 0);
  }

  removeHp(data: T, hp: number) {
    this.saveStats(data, (data.persist?.game.stats?.hp ?? 0) - hp, data.persist?.game.stats?.max ?? 0);
  }

  saveGameProp(data: T, prop: string, value: any) {
    if (!data.persist) {
      return;
    }
    const gameData = data.persist?.game ?? (data.persist.game = {});
    gameData[prop] = value;
    localStorage.setItem(`persist_game`, JSON.stringify(data.persist));
    this.saveTime(data);
  }

  addItem(data: T, item: string) {
    if (!data.persist) {
      return;
    }
    const gameData = data.persist.game ?? (data.persist.game = {});
    const inventory = gameData.inventory ?? (gameData.inventory = {});
    inventory[item] = (inventory[item] ?? 0) + 1;
    localStorage.setItem(`persist_game`, JSON.stringify(data.persist));
    this.saveTime(data);
  }

  removeItem(data: T, item: string) {
    if (!data.persist) {
      return;
    }
    const gameData = data.persist.game ?? (data.persist.game = {});
    const inventory = gameData.inventory ?? (gameData.inventory = {});
    inventory[item] = (inventory[item] ?? 0) - 1;
    if (inventory[item] < 0) {
      delete inventory[item];
    }
    localStorage.setItem(`persist_game`, JSON.stringify(data.persist));
    this.saveTime(data);
  }

  saveTime(data: T) {
    if (!data.persist) {
      return;
    }
    const sceneData = data.persist.game ?? (data.persist.game = {});
    sceneData.saveTime = new Date().getTime();
    localStorage.setItem(`persist_game`, JSON.stringify(data.persist));
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

  performStart(data: T) {
    data.onStart?.forEach(action => {
      this.performAction(data, action);
    });
  }

  startLoop(data: T): void {
    const loop = (timestamp: DOMHighResTimeStamp): void => {
      this.requestID = requestAnimationFrame(loop);
      if (!data.startTime) {
        data.startTime = timestamp;
        this.performStart(data);
      }
      const status = this.performRendering(data, timestamp);
      if (data.dialog) {
        this.dialogRenderer.render(data, timestamp);
      }

      this.applyFade(data, timestamp);

      this.applyItemUpdate(data);

      if (status === RenderingStatus.COMPLETED) {
        this.performCompletionSteps(data, timestamp);
      }
    };
    this.requestID = requestAnimationFrame(loop);
  }

  applyItemUpdate(data: T): void {
    if (data.itemBonus) {
      data.itemBonus?.forEach(item => {
        this.addItem(data, item);
      });
      delete data.itemBonus;
    }
    if (data.itemRemove) {
      data.itemRemove?.forEach(item => {
        this.removeItem(data, item);
      });
      delete data.itemRemove;
    }
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
        case "hideLoading":
          const loadingText = document.getElementById("loadingText");
          if (loadingText) {
            loadingText.style.display = "none";
          }
          data.step++;
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

  saveReturnData(data: T): ReturnData {
    return { scene: data.title };
  }

  stopRendering() {
    this.context?.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
    cancelAnimationFrame(this.requestID);
    this.dialogRenderer.stopRendering();
  }

  autoSave(data: T) {
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      const returnData = this.saveReturnData(data);
      this.saveGameProp(data, "returnData", returnData);
    }, 1000);
  }

  performAction(data: T, action?: Action) {
    if (!action) {
      return;
    }
    if (action.itemsForbidden?.some(item => data.persist?.game?.inventory?.[item])) {
      return;
    }
    if (action.itemsRequired && !action.itemsRequired?.some(item => data.persist?.game?.inventory?.[item])) {
      return;
    }
    if (action?.message) {
      data.message = action.message;
    }
    if (action?.itemBonus) {
      data.itemBonus = action?.itemBonus;
    }
    if (action?.itemRemove) {
      data.itemRemove = action?.itemRemove;
    }

    switch (action?.action) {
      case "clearCache":
        localStorage.removeItem("persist_game");
        break;
      case "goto":
        data.destination = action.destination?.scene;
        data.destinationDirection = action.destination?.direction;
        data.destinationPosition = action.destination?.position;
        break;
      case "showStats":
        const stats = data.persist?.game.stats ?? { hp: 0, max: 0 };
        data.message = `HP: ${stats.hp} / ${stats.max}. ATK: ${this.getAttack(data)}`;
        break;
      case "showInventory":
        const items = Object.keys(data.persist?.game?.inventory ?? {}).filter(item => {
          return data.persist?.game?.inventory?.[item];
        });
        data.message = items.length ? items.join(", ") : "No items.";
        break;
      case "saveStats":
        this.saveStats(data, 100, 100);
        break;
    }
  }

  getAttack(data: T) {
    return data.persist?.game.inventory?.["sword"] ? 10 : 2;
  }

  pickItem(data: T, item?: string) {
    if (!item) {
      data.message = `The chest is empty.`;
    } else {
      this.addItem(data, item);
      data.message = `You found a ${item}`;
    }
  }
}  
