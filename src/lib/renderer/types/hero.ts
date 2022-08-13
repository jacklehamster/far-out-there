import MapScene, { Tile } from "../../scenes/map-scene";
import { Position } from "../../scenes/slide-scene";
import Animation from "./animation";

export default class Hero {
  type = "hero";
  position?: Position;
  fromPosition: Position = { x: 0, y: 0 };
  animation: Animation;
  moveTime?: DOMHighResTimeStamp;
  moveDuration?: number;
  #tempPosition: Position = { x: 0, y: 0 };

  constructor({ animation, moveDuration }: { animation: Animation; moveDuration: number }) {
    this.animation = animation;
    this.moveDuration = moveDuration;
  }

  moveTo(x: number, y: number, time: DOMHighResTimeStamp, immediate?: boolean) {
    this.fromPosition.x = this.position?.x ?? 0;
    this.fromPosition.y = this.position?.y ?? 0;
    if (!this.position) {
      this.position = { x: 0, y: 0 };
    }
    this.moveTime = immediate ? undefined : time;
    this.position.x = x;
    this.position.y = y;
  }

  getTileUnderneath(map: MapScene): Tile | undefined {
    if (this.position) {
      return map.tiles[map.grid?.[this.position.y]?.[this.position.x] ?? ""] ?? map.defaultTile;
    }
    return map.defaultTile;
  }

  canMoveTo(x: number, y: number, map: MapScene): boolean {
    const tile = map.tiles[map.grid?.[y]?.[x] ?? ""] ?? map.defaultTile;
    return !tile?.block;
  }

  moveBy(dx: number, dy: number, time: DOMHighResTimeStamp) {
    if (this.isMoving(time)) {
      return;
    }
    if (this.position) {
      this.moveTo(this.position.x + dx, this.position.y + dy, time);
    }
  }

  canMoveBy(dx: number, dy: number, map: MapScene) {
    return this.position && this.canMoveTo(this.position.x + dx, this.position.y + dy, map);
  }

  isMoving(time: DOMHighResTimeStamp) {
    const moveDuration = this.moveDuration ?? .5;
    return time - (this.moveTime ?? 0) < (moveDuration) * 1000;
  }

  getPosition(time: DOMHighResTimeStamp): Position | undefined {
    if (!this.position || !this.moveTime) {
      return this.position;
    }
    const moveDuration = this.moveDuration ?? .5;
    const progress = moveDuration ? Math.min((time - this.moveTime) / moveDuration / 1000, 1) : 1;
    this.#tempPosition.x = this.fromPosition.x * (1 - progress) + this.position.x * progress;
    this.#tempPosition.y = this.fromPosition.y * (1 - progress) + this.position.y * progress;
    return this.#tempPosition;
  }

  toJSON() {
    return {
      type: this.type,
      animation: this.animation,
      position: this.position,
      fromPosition: this.fromPosition,
      moveDuration: this.moveDuration,
      moveTime: this.moveTime,
    }
  }
}