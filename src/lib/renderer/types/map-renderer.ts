import Condition from "../../core/condition";
import MapScene from "../../scenes/map-scene";
import KeyboardRenderer from "../keyboard-renderer";
import { RenderingStatus } from "./canvas-renderer";
import Hero from "./hero";
import { ReturnData } from "./return-data";

const DEFAULT_CROP = [0, 0, 0, 0];

export default class MapRenderer extends KeyboardRenderer<MapScene> {
  onKeyDown?: (e: KeyboardEvent) => void;
  keys: Set<string> = new Set();

  reset(data: MapScene): void {
    super.reset(data);
    data.heroes.forEach(hero => {
      if (hero.position) {
        delete hero.position;
      }
    });
    delete data.moveAction;
    data.stepsTaken = 0;
  }

  createKeyHandlerUp(data: MapScene): ((e: KeyboardEvent) => void) {
    return (e) => {
      this.keys.delete(e.code);
      delete data.moveAction;
    };
  }

  createKeyHandlerDown(data: MapScene): (e: KeyboardEvent) => void {
    return (e) => {
      e.preventDefault();
      this.keys.add(e.code);
      if (!data.moveAction) {
        data.moveAction = { x: 0, y: 0 };
      }
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          data.moveAction.x = 0;
          data.moveAction.y = -1;
          break;
        case "KeyS":
        case "ArrowDown":
          data.moveAction.x = 0;
          data.moveAction.y = 1;
          break;
        case "Space":
          this.performAction(data, data.spaceAction, { rand: Math.random() });
          break;
        case "ArrowLeft":
        case "KeyA":
          data.moveAction.x = -1;
          data.moveAction.y = 0;
          break;
        case "ArrowRight":
        case "KeyD":
          data.moveAction.x = 1;
          data.moveAction.y = 0;
          break;
      }
    };
  }

  saveReturnData(data: MapScene): ReturnData {
    return {
      scene: data.title,
      subtitle: data.subtitle,
      position: {
        x: data.heroes[0].fromPosition?.x,
        y: data.heroes[0].fromPosition?.y,
      },
    };
  }

  performRendering(data: MapScene, timestamp: DOMHighResTimeStamp): RenderingStatus {
    if (this.context) {
      this.context?.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
    }
    data.heroes.forEach(hero => {
      if (hero && !hero.position) {
        if (data.returnPosition) {
          hero.moveTo(data.returnPosition.x, data.returnPosition.y, timestamp, true);
        } else {
          data.grid?.forEach((row, gy) => {
            row.forEach((cell, gx) => {
              if (data.tiles[cell]?.startPosition) {
                hero.moveTo(gx, gy, timestamp, true);
              }
            });
          });
        }
      }
    });
    const mainHero = data.heroes[0];
    if (!data.moveAction) {
      data.moveAction = { x: 0, y: 0 };
    }

    if (!mainHero.isMoving(timestamp)) {
      const underTile = mainHero.getTileUnderneath(data);
      if (underTile?.portal) {
        data.destination = underTile.portal;
        data.destinationPosition = underTile.portalPosition;
        data.destinationDirection = underTile.portalDirection;
      } else {
        if (data.movePending) {
          data.movePending = false;
          data.stepsTaken = (data.stepsTaken ?? 0) + 1;
          if (data.stepsTaken > 1 && this.onCellActions(data)) {
            data.moveAction.x = 0;
            data.moveAction.y = 0;
          }
        }

        if (data.moveAction.x || data.moveAction.y) {
          if (mainHero.canMoveBy(data.moveAction.x, data.moveAction.y, data)) {
            mainHero.moveBy(data.moveAction.x, data.moveAction.y, timestamp);
            data.movePending = true;

            let leadingHero = mainHero;
            for (let i = data.heroes.indexOf(leadingHero) + 1; i < data.heroes.length; i++) {
              const nextHero = data.heroes[i];
              if (nextHero) {
                const heroStat = data.persist?.game.stats?.heroes[nextHero.id];
                if (!heroStat?.active || Condition.eval(nextHero.hidden, { scene: data })) {
                  continue;
                }
                nextHero.moveTo(leadingHero.fromPosition.x, leadingHero.fromPosition.y, timestamp);
                leadingHero = nextHero;
              }
            }

            this.autoSave(data);
          }
        }
      }
    }

    const mainHeroPosition = mainHero.getPosition(timestamp);
    const gridWidth = data.gridWidth ?? 0;
    const gridHeight = data.gridHeight ?? 0;

    for (let cy = - 3; cy <= 4; cy++) {
      for (let cx = - 3; cx <= 4; cx++) {
        const gx = Math.floor(mainHeroPosition?.x ?? 0) + cx;
        const gy = Math.floor(mainHeroPosition?.y ?? 0) + cy;
        const cell = data.grid?.[gy]?.[gx] ?? '';
        const tile = data.tiles[cell] ?? data.defaultTile;
        tile?.images?.forEach(animation => {
          if (this.context && animation?.asset) {
            const timeEllapsed = timestamp - (data.startTime ?? 0);
            const frame = timeEllapsed && animation?.frameRate ? Math.floor(animation.frameRate * timeEllapsed / 1000) : 0;
            const [x, y, width, height] = animation?.getCrop(frame) ?? DEFAULT_CROP;
            this.context.drawImage(
              animation?.asset?.image,
              x, y, width, height,
              Math.round((gx - (mainHeroPosition?.x ?? 0) + 3) * gridWidth),
              Math.round((gy - (mainHeroPosition?.y ?? 0) + 3) * gridHeight),
              width, height);
          }
        });
      }
    }

    const sortedHeroes = [...data.heroes]
      .filter(({ id }) => data.persist?.game.stats?.heroes[id ?? 0]?.active)
      .filter(({ hidden }) => !Condition.eval(hidden, { scene: data }))
      .sort((hero1: Hero, hero2: Hero) => {
        const pos1 = hero1.getPosition(timestamp);
        const pos2 = hero2.getPosition(timestamp);
        if (pos1?.y === pos2?.y) {
          return data.heroes.indexOf(hero2) - data.heroes.indexOf(hero1);
        }
        return (pos1?.y ?? 0) < (pos2?.y ?? 0) ? -1 : 1;
      });
    sortedHeroes.forEach(hero => {
      if (this.context && hero.animation?.asset?.image) {
        const [x, y, width, height] = hero.animation.getCrop(
          hero.isMoving(timestamp) ? hero.animation.getFrame(timestamp, hero.moveTime) % hero.animation.getTotalFrames() : 1);
        const pos = hero.getPosition(timestamp);
        if (pos) {
          const gx = pos.x + 3.5;
          const gy = pos.y + 4;
          this.context.drawImage(
            hero.animation?.asset?.image,
            x, y, width, height,
            Math.round((gx - (mainHeroPosition?.x ?? 0)) * gridWidth - 8),
            Math.round((gy - (mainHeroPosition?.y ?? 0)) * gridHeight - 16),
            width, height);
        }
      }
    });

    return data.destination ? RenderingStatus.COMPLETED : RenderingStatus.RENDERING;
  }

  onCellActions(data: MapScene) {
    const chance = { rand: Math.random() };
    let didAction = false;
    for (let action of data.onCellActions ?? []) {
      if (this.performAction(data, action, chance)) {
        didAction = true;
      }
    }
    return didAction;
  }

  getConnectionTag(data: MapScene): string | undefined {
    if (!data.heroes[0]?.position) {
      return;
    }
    const { x, y } = data.heroes[0].position;
    return `${data.title}|${data.subtitle ?? ''}|${x},${y}`;
  }
}
