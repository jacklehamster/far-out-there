import CompleteListener from "../../core/complete-listener";
import CanvasScene, { LEVEL_PROGRESSION } from "../../scenes/canvas-scene";
import { DialogRenderer } from "../dialog-renderer";
import { Renderer } from "../renderer";
import { resolve } from "url";
import Music from "./music";
import { ReturnData } from "./return-data";
import Action from "./action";
import Animation from "./animation";
import Condition from "../../core/condition";
import Scene from "../../core/scene";
import { Achievement } from "../achievements/achievement";

export enum RenderingStatus {
  RENDERING,
  COMPLETED,
}

const DEFAULT_CROP = [0, 0, 0, 0];

declare global {
  interface Window { renderer: Object, scene: Scene }
}


export default class CanvasRenderer<T extends CanvasScene> implements Renderer<T> {
  canvas: HTMLCanvasElement | null;
  context: CanvasRenderingContext2D | null;
  requestID: number = 0;
  listeners: Set<CompleteListener> = new Set<CompleteListener>();
  dialogRenderer: DialogRenderer = new DialogRenderer();
  audio: HTMLAudioElement | null;
  audioSFX: HTMLAudioElement | null;
  saveTimeout: any;
  achievement?: Achievement;

  constructor() {
    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
    this.context = this.canvas?.getContext("2d");
    this.audio = document.getElementById("audio") as HTMLAudioElement;
    this.audioSFX = document.getElementById("audioSFX") as HTMLAudioElement;
  }

  getAchievement() {
    return this.achievement ?? (this.achievement = new Achievement());
  }

  restart(data: T, timestamp: DOMHighResTimeStamp): void {
    this.reset(data);
    data.startTime = timestamp;
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

  playSFX(music?: Music) {
    if (this.audioSFX) {
      if (music) {
        this.audioSFX.src = music.path;
        this.audioSFX.play();
        this.audioSFX.loop = false;
      } else {
        this.audioSFX.pause();
      }
    }
  }

  reset(data: T) {
    data.step = 0;
    delete data.stepProgress;
    delete data.startTime;
    data.completed = false;

    delete data.fadeStart;
    delete data.scroll;
    delete data.scrollStart;
    delete data.scrollBackwards;
    delete data.destination;
    delete data.mute;

    if (data.dialog) {
      delete data.dialog.hidden;
      delete data.dialog.lastDialog;
    }

    const persist = JSON.parse(localStorage.getItem(`persist_game`) ?? "{}");
    data.persist = persist;
    this.updateInventory(data);
    this.updateSecret(data);

    if (data.newgrounds) {
      this.getAchievement().loginCheck(data.newgrounds.credentials);
    }
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

  initializeHero(data: T, hero: number) {
    this.getHeroStat(data, hero);
  }

  updateStatsWithLevelProgression(data: T, hero: number) {
    if (!data.persist) {
      return false;
    }
    const gameData = data.persist.game ?? (data.persist.game = {});
    const stats = gameData.stats ?? (gameData.stats = { gold: 0, heroes: [] });
    let didUpdate = false;
    const heroStat = stats.heroes[hero];
    if (!heroStat) {
      return;
    }
    for (let i = LEVEL_PROGRESSION[hero].length - 1; i >= 0; i--) {
      const progression = LEVEL_PROGRESSION[hero][i];
      if (heroStat.xp >= progression.xp) {
        const level = i + 1;
        if (heroStat.level < level) {
          heroStat.level = level;
          heroStat.attack = progression.attack;
          heroStat.max = heroStat.hp = progression.hp;

          localStorage.setItem(`persist_game`, JSON.stringify(data.persist));
          this.saveTime(data);
          didUpdate = true;
        }
      }
    };
    return didUpdate;
  }

  getHeroStat(data: T, hero: number) {
    const dataPersist = data.persist!;
    const gameData = dataPersist.game ?? (dataPersist.game = {});
    const stats = gameData.stats ?? (gameData.stats = { gold: 0, heroes: [] });
    const heroStat = stats.heroes[hero] ?? (stats.heroes[hero] = { hp: 0, max: 0, xp: 0, level: 0, attack: 0, xpNext: 0, active: true });
    return heroStat;
  }

  updateLevelProgression(data: T) {
    if (!data.persist) {
      return;
    }
    const gameData = data.persist.game ?? (data.persist.game = {});
    const stats = gameData.stats ?? (gameData.stats = { gold: 0, heroes: [] });
    stats.heroes.forEach((heroStat, hero) => {
      const nextProgression = LEVEL_PROGRESSION[hero][heroStat.level];
      const xpNext = (nextProgression?.xp ?? 10000000) - heroStat.xp;
      if (xpNext != heroStat.xpNext) {
        heroStat.xpNext = xpNext;
        localStorage.setItem(`persist_game`, JSON.stringify(data.persist));
        this.saveTime(data);
      }
    });
  }

  startTime(data: T) {
    if (!data.persist) {
      return;
    }
    this.saveTime(data);
  }

  saveStats(data: T, hp: number, max: number, hero: number) {
    if (!data.persist) {
      return;
    }
    const gameData = data.persist.game ?? (data.persist.game = {});
    const stats = gameData.stats ?? (gameData.stats = { gold: 0, heroes: [] });
    const heroStat = this.getHeroStat(data, hero);
    heroStat.max = max;

    heroStat.hp = Math.max(0, Math.min(hp, max));
    localStorage.setItem(`persist_game`, JSON.stringify(data.persist));
    this.saveTime(data);
  }

  addXP(data: T, xp: number, hero: number) {
    if (!data.persist) {
      return;
    }
    const gameData = data.persist.game ?? (data.persist.game = {});
    const stats = gameData.stats ?? (gameData.stats = { gold: 0, heroes: [] });
    const heroStat = stats.heroes[hero] ?? (stats.heroes[hero] = { hp: 0, max: 0, xp: 0, level: 0, attack: 0, xpNext: 0 });
    heroStat.xp += xp;
    localStorage.setItem(`persist_game`, JSON.stringify(data.persist));
    this.saveTime(data);
    this.playSFX(data.sounds?.jingle);
  }

  addGold(data: T, gold: number) {
    if (!data.persist) {
      return;
    }
    const gameData = data.persist.game ?? (data.persist.game = {});
    const stats = gameData.stats ?? (gameData.stats = { gold: 0, heroes: [] });
    stats.gold += gold;
    localStorage.setItem(`persist_game`, JSON.stringify(data.persist));
    this.saveTime(data);
  }

  addSecret(data: T, secret: string) {
    if (!data.persist) {
      return;
    }
    const gameData = data.persist.game ?? (data.persist.game = {});
    const secrets = gameData.secret ?? (gameData.secret = {});
    secrets[secret] = (secrets[secret] ?? 0) + 1;
    localStorage.setItem(`persist_game`, JSON.stringify(data.persist));
    this.saveTime(data);
    this.updateSecret(data);
  }

  addHp(data: T, hp: number, hero: number) {
    this.saveStats(data, (data.persist?.game.stats?.heroes[hero].hp ?? 0) + hp, data.persist?.game.stats?.heroes[hero].max ?? 0, hero);
  }

  removeHp(data: T, hp: number, hero: number) {
    this.saveStats(data, (data.persist?.game.stats?.heroes[hero].hp ?? 0) - hp, data.persist?.game.stats?.heroes[hero].max ?? 0, hero);
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
    this.updateInventory(data);
  }

  updateInventory(data: T) {
    data.inventory = Object.keys(data.persist?.game?.inventory ?? {})
      .filter(item => !data.itemActions || data.itemActions[item])
      .filter(item => (data.persist?.game?.inventory?.[item] ?? 0) > 0)

    data.inventory.sort((item1, item2) => {
      if (item1.length != item2.length) {
        return item1.length - item2.length;
      }
      return item1.localeCompare(item2);
    });
  }

  updateSecret(data: T) {
    data.secret = data.persist?.game?.secret ?? {};
    data.mainHeroStats = data.persist?.game?.stats?.heroes?.[0];
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
    this.updateInventory(data);
  }

  saveTime(data: T) {
    if (!data.persist) {
      return;
    }
    const sceneData = data.persist.game ?? (data.persist.game = {});
    sceneData.saveTime = new Date().getTime();
    if (!sceneData.startTime) {
      sceneData.startTime = new Date().getTime();
    }
    localStorage.setItem(`persist_game`, JSON.stringify(data.persist));
  }

  render(data: T): void {
    window.renderer = this;
    window.scene = data;
    if (!data.persistState) {
      this.reset(data);
    }
    this.listeners.clear();
    this.startLoop(data);
    this.changeMusic(data.mute ? undefined : data.music);
  }

  areDialogsCompleted(data: T) {
    return this.dialogRenderer.isCompleted(data);
  }

  performRendering(data: T, timestamp: DOMHighResTimeStamp): RenderingStatus {
    return RenderingStatus.RENDERING;
  }

  performStart(data: T) {
    const chance = { rand: Math.random() };
    data.onStart?.forEach(action => {
      this.performAction(data, action, chance);
    });
  }

  getRenderingStatus(): RenderingStatus {
    return RenderingStatus.RENDERING;
  }

  checkMessagesDone(data: T) {
    if (!data.message && data.messages?.length) {
      const action = data.messages.shift();
      data.scroll = 0;
      this.performAction(data, action, { rand: Math.random() });
    }

  }

  startLoop(data: T): void {
    const loop = (timestamp: DOMHighResTimeStamp): void => {
      this.requestID = requestAnimationFrame(loop);
      if (!data.startTime) {
        data.startTime = timestamp;
        this.performStart(data);
      }

      this.checkMessagesDone(data);

      const status = this.performRendering(data, timestamp);
      if (!data.completed && status === RenderingStatus.COMPLETED) {
        data.completed = true;
      }
      if (data.dialog) {
        this.dialogRenderer.render(data, timestamp);
        this.checkMessagesDone(data);
      }

      this.applyFade(data, timestamp);

      this.applyItemUpdate(data);

      if (data.justPickedUp && !data.message) {
        data.justPickedUp = false;
        this.playSFX(data.sounds?.pickup);
      }

      if (data.medalStart) {
        if (data.medalStart === 1) {
          data.medalStart = timestamp;
        }
        this.drawAnimation(data.newgrounds?.animation, timestamp, data.medalStart, false, 64 - 23, 64 - 20);
      }

      if (status === RenderingStatus.COMPLETED) {
        if (data.restartOnDone) {
          data.restartOnDone = false;
          this.restart(data, timestamp);
        } else {
          this.performCompletionSteps(data, timestamp);
        }
      }
    };
    this.requestID = requestAnimationFrame(loop);
  }

  applyItemUpdate(data: T): void {
    if (data.itemBonus) {
      data.itemBonus?.forEach(item => {
        this.pickItem(data, item, "");
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
    data.fadeStart = timestamp;
  }

  applyFade(data: T, timestamp: DOMHighResTimeStamp, fadeSeconds?: number) {
    if (!data.fadeStart) {
      return;
    }
    const fade = Math.min(1, (timestamp - data.fadeStart) / (fadeSeconds ?? .5) / 1000);
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
      const [command, param, action] = data.onEnd[data.step - 1];
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
          if (!data.fadeStart) {
            this.startFade(data, timestamp);
          }
          const fade = Math.min(1, (timestamp - (data.fadeStart ?? 0)) / 1000);
          if (fade >= 1) {
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
            const destination = param?.toString() ?? data.destination;
            const destinationPosition = data.destinationPosition;
            const destinationDirection = data.destinationDirection;
            const returnData = this.saveReturnData(data);
            this.reset(data);
            listeners.forEach(listener => listener.onGoto?.(param?.toString() ?? destination, returnData, destinationPosition, destinationDirection, tag));
          }
          break;
        case "checkGameOver":
          {
            if (data.persist?.game.stats?.heroes.every(({ hp }) => hp <= 0)) {
              const listeners = [];
              for (let listener of this.listeners) {
                listeners.push(listener);
              }
              this.listeners.clear();
              const tag = this.getConnectionTag(data);
              const destination = param?.toString() ?? data.destination;
              const destinationPosition = data.destinationPosition;
              const destinationDirection = data.destinationDirection;
              const returnData = this.saveReturnData(data);
              this.reset(data);
              listeners.forEach(listener => listener.onGoto?.(param?.toString() ?? destination, returnData, destinationPosition, destinationDirection, tag));
            } else {
              data.step++;
            }
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
        case "healFully":
          data.persist?.game.stats?.heroes.forEach((heroStat, hero) => {
            this.saveStats(data, (heroStat.max ?? 100), (heroStat.max ?? 100), hero);
          });
          this.playSFX(data.sounds?.heal);
          data.step++;
          break;
        case "hideDialogs":
          if (data.dialog) {
            data.dialog.hidden = true;
          }
          data.step++;
          break;
        case "action":
          this.performAction(data, action);
          data.step++;
          break;
        case "waitMessage":
          if (!data.message) {
            data.step++;
          }
          break;
      }
    }
  }

  saveReturnData(data: T): ReturnData | undefined {
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

  getHeroName(hero: number) {
    switch (hero ?? 0) {
      case 0:
        return "Blu";
      case 1:
        return "Rob";
      case 2:
        return "Ara";
      case 3:
        return "Stu";
    }
  }

  performAction(data: T, action?: Action, chance?: { rand: number }): boolean {
    if (!action) {
      return false;
    }
    action?.actions?.forEach(action => this.performAction(data, action, chance));

    if (action.itemsForbidden?.some(item => data.persist?.game?.inventory?.[item])) {
      return false;
    }
    if (action.itemsRequired && !action.itemsRequired.some(item => data.persist?.game?.inventory?.[item])) {
      return false;
    }
    if (action.secretForbidden?.some(item => data.persist?.game?.secret?.[item])) {
      return false;
    }
    if (action.secretRequired && !action.secretRequired.some(secret => data.persist?.game?.secret?.[secret])) {
      return false;
    }
    if (chance && action.chance) {
      const actionChance = action.chance * (data.inventory?.some(item => item === action.chanceReduced) ? .5 : 1);
      if (!chance.rand) {
        return false;
      } else if (chance.rand <= actionChance) {
        chance.rand = 0;
      } else {
        chance.rand -= actionChance;
        return false;
      }
    }

    if (action?.message) {
      data.message = action.message;
    }
    if (action?.messages) {
      data.messages = (data.messages ?? []).concat(action.messages);
    }
    if (action?.itemBonus) {
      data.itemBonus = action?.itemBonus;
    }
    if (action?.itemRemove) {
      data.itemRemove = action?.itemRemove;
    }
    if (action.sound) {
      this.playSFX(action.sound);
    }
    if (action.subMenu) {
      data.subMenu = true;
    }
    action.secrets?.forEach(secret => {
      this.addSecret(data, secret);
    });
    if (action.medal && data.newgrounds) {
      this.getAchievement().unlock({ credentials: data.newgrounds.credentials, medalName: action.medal })
        .then(({ justUnlocked }) => {
          if (justUnlocked) {
            data.medalStart = 1;
            this.playSFX(data.newgrounds?.sound);
          }
        });
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
      case "showStats": {
        const stats = data.persist?.game.stats;
        if (stats) {
          data.messages = stats.heroes.map(({ active }, index) => ({ active, index }))
            .map(({ index }) => this.getHeroName(index) +
              `: HP: ${stats.heroes[index].hp}/${stats.heroes[index].max}. ATK: ${this.getAttack(data, index)}. DEF: ${Math.floor(1 + (1 - this.getDefense(data, index)) * 10)}. XP: ${stats.heroes[index].xp}. LEVEL: ${stats.heroes[index].level}`)
            .map(message => ({ message }));
        }
        break;
      }
      case "showInventory": {
        const items = Object.keys(data.persist?.game?.inventory ?? {}).filter(item => {
          return data.persist?.game?.inventory?.[item];
        }).map(item => (data.persist?.game?.inventory?.[item] ?? 1) > 1 ? `${item}:${data.persist?.game?.inventory?.[item]}` : item);
        const stats = data.persist?.game.stats;
        if (stats && stats.gold) {
          items.push(`${stats.gold} gold.`);
        }
        data.message = items.length ? items.join(", ") : "No items.";
        break;
      }
      case "saveStats":
        this.initializeHero(data, action.hero ?? 0);
        this.updateStatsWithLevelProgression(data, action.hero ?? 0);
        this.updateLevelProgression(data);
        break;
      case "addGold":
        this.addGold(data, 100);
        this.playSFX(data.sounds?.pickup);
        data.restartOnDone = true;
        break;
      case "buy":
        if (data.persist?.game.stats?.gold && data.persist.game.stats.gold >= (action.cost ?? 0)) {
          this.addGold(data, -(action.cost ?? 0));
          this.playSFX(data.sounds?.pickup);
          this.pickItem(data, action.item, action.message ?? `Here's your ${action.item}. Anything else?`);
          data.justPickedUp = false;
        } else {
          data.message = `You don't have ${action.cost} gold!`;
        }
        data.restartOnDone = true;
        return false;
      case "noop":
        data.restartOnDone = true;
        break;
      case "hideDialogs":
        if (data.dialog) {
          data.dialog.hidden = true;
        }
        break;
      case "lastDialog":
        if (data.dialog) {
          data.dialog.lastDialog = true;
        }
        break;
      case "healFully":
        this.saveStats(data, data.persist?.game.stats?.heroes[action.hero ?? data.hero ?? 0].max ?? 100, data.persist?.game.stats?.heroes[action.hero ?? data.hero ?? 0].max ?? 100, action.hero ?? data.hero ?? 0);
        this.playSFX(data.sounds?.heal);
        break;
      case "heal":
        this.saveStats(data, (data?.persist?.game?.stats?.heroes[action.hero ?? data.hero ?? 0].hp ?? 0) + (action.amount ?? 0), (data?.persist?.game?.stats?.heroes[action.hero ?? data.hero ?? 0].max ?? 100), action.hero ?? data.hero ?? 0);
        this.playSFX(data.sounds?.heal);
        break;
      case "addHero":
        this.initializeHero(data, action.hero ?? 0);
        this.updateStatsWithLevelProgression(data, action.hero ?? 0);
        this.updateLevelProgression(data);
        break;
      case "activateHero": {
        const heroStat = data.persist?.game.stats?.heroes[action.hero ?? 0];
        if (heroStat) {
          heroStat.active = true;
        }
        break;
      }
      case "deactivateHero": {
        const heroStat = data.persist?.game.stats?.heroes[action.hero ?? 0];
        if (heroStat) {
          heroStat.active = false;
        }
        break;
      }
      case "hideLoading": {
        const loadingText = document.getElementById("loadingText");
        if (loadingText) {
          loadingText.style.display = "none";
        }
        break;
      }
      case "startTime": {
        this.startTime(data);
        break;
      }
      case "postTime": {
        if (data.persist?.game.startTime && data.newgrounds?.credentials) {
          this.getAchievement().postScore({ credentials: data.newgrounds.credentials, value: new Date().getTime() - data.persist?.game.startTime });
        }
        break;
      }
    }
    return true;
  }

  getWeaponAttack(data: T) {
    if (data.persist?.game.inventory?.["trident"]) {
      return 15;
    }
    if (data.persist?.game.inventory?.["sword"]) {
      return 10;
    }
    return 5;
  }

  getArmorReduction(data: T) {
    if (data.persist?.game.inventory?.["goldcloth"]) {
      return .5;
    }
    if (data.persist?.game.inventory?.["armor"]) {
      return .7;
    }
    return 1;
  }

  getDefense(data: T, hero: number) {
    return this.getArmorReduction(data);
  }

  getAttack(data: T, hero: number) {
    return Math.floor(this.getWeaponAttack(data) * (data.persist?.game.stats?.heroes[hero].attack ?? 1));
  }

  pickItem(data: T, item?: string, messageOverride?: string) {
    if (!item) {
      data.message = messageOverride ?? `The chest is empty.`;
    } else {
      const [, gold] = item.match(/(\d+)\sgold/) ?? [];
      if (gold) {
        if (messageOverride !== "") {
          data.message = messageOverride ?? `You found ${item}`;
        }
        this.addGold(data, parseInt(gold));
        data.justPickedUp = true;
      } else {
        this.addItem(data, item);
        if (messageOverride !== "") {
          data.message = messageOverride ?? `You found a ${item}`;
        }
        data.justPickedUp = true;
      }
    }
  }

  drawAnimation(animation: Animation | undefined,
    timestamp: DOMHighResTimeStamp,
    startTime?: DOMHighResTimeStamp,
    looping: boolean = false,
    px: number = 0, py: number = 0) {
    const timeEllapsed = timestamp - (startTime ?? 0);
    if (this.context && animation?.asset?.image) {
      const frame = timeEllapsed && animation?.frameRate ? Math.floor(animation.frameRate * timeEllapsed / 1000) : 0;
      const [sx, sy, width, height, animating] = animation?.getCrop(frame, looping) ?? DEFAULT_CROP;
      this.context.drawImage(
        animation.asset.image,
        sx, sy, width, height,
        px + (animation?.position?.x ?? 0),
        py + (animation?.position?.y ?? 0),
        width, height);
      return { animating };
    }
    return {};
  }

  renderSlides(data: T, timestamp: DOMHighResTimeStamp) {
    const { slides } = data;
    if (slides) {
      let minRateEllapsed = 1;
      const timeEllapsed = timestamp - (data.startTime ?? 0);
      for (let slide of slides) {
        if (Condition.eval(slide.hidden, { scene: data })) {
          slide.currentlyHidden = true;
          continue;
        }
        if (slide.currentlyHidden) {
          slide.currentlyHidden = false;
          slide.timeAnim = timestamp;
        }
        const animEllapsed = slide.timeAnim ? timestamp - slide.timeAnim : timeEllapsed;
        const rateEllapsed = Math.min(slide?.duration ? animEllapsed / (slide.duration * 1000) : 1, 1);
        const x = (slide.to.x * rateEllapsed + slide.from.x * (1 - rateEllapsed));
        const y = (slide.to.y * rateEllapsed + slide.from.y * (1 - rateEllapsed));
        minRateEllapsed = Math.min(rateEllapsed, minRateEllapsed);
        if (this.context) {
          this.context.save();
          if (slide.scale) {
            this.context.scale(slide.scale, slide.scale);
          }
          if (slide?.asset?.image) {
            this.context.drawImage(slide.asset?.image, x, y);
          }
          const animation = slide?.animation;
          if (animation?.asset?.image) {
            const frame = animEllapsed && animation?.frameRate ? Math.floor(animation.frameRate * animEllapsed / 1000) : 0;
            const [sx, sy, width, height] = animation?.getCrop(frame, slide.looping) ?? DEFAULT_CROP;
            this.context.drawImage(
              animation?.asset?.image,
              sx, sy, width, height,
              x,
              y,
              width, height);
          }
          this.context.restore();
        }
      }

      if (minRateEllapsed >= 1) {
        if (!this.areDialogsCompleted(data)) {
          return RenderingStatus.RENDERING;
        }

        return RenderingStatus.COMPLETED;
      }
    }
    return RenderingStatus.RENDERING;
  }
}  
