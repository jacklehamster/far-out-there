import MazeScene from "../scenes/maze-scene";
import KeyboardRenderer from "./keyboard-renderer";
import Animation from "./types/animation";
import { RenderingStatus } from "./types/canvas-renderer";
import { ReturnData } from "./types/return-data";

const DEFAULT_CROP = [0, 0, 0, 0];

export default class MazeRenderer extends KeyboardRenderer<MazeScene> {
  onKeyDown?: (e: KeyboardEvent) => void;
  keys: Set<string> = new Set();

  reset(data: MazeScene): void {
    super.reset(data);
    delete data.direction;
    delete data.moveAction;
    delete data.openAction;
    delete data.position;
    delete data.moveTime;
    delete data.turnTime;
    delete data.openTime;
    delete data.blocks;
  }

  createKeyHandlerUp(data: MazeScene): ((e: KeyboardEvent) => void) {
    return (e) => {
      this.keys.delete(e.code);
      delete data.moveAction;
      delete data.openAction;
    };
  }

  createKeyHandlerDown(data: MazeScene): (e: KeyboardEvent) => void {
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
          data.moveAction.y = 1;
          break;
        case "KeyS":
        case "ArrowDown":
          data.moveAction.x = 0;
          data.moveAction.y = -1;
          break;
        case "Space":
          data.openAction = true;
          break;
        case "ArrowLeft":
        case "KeyA":
        case "KeyQ":
          data.moveAction.x = -1;
          data.moveAction.y = 0;
          break;
        case "ArrowRight":
        case "KeyD":
        case "KeyE":
          data.moveAction.x = 1;
          data.moveAction.y = 0;
          break;
      }
    };
  }

  saveReturnData(data: MazeScene): ReturnData {
    return {
      scene: data.title,
      subtitle: data.subtitle,
      position: {
        x: data.position?.x ?? 0,
        y: data.position?.y ?? 0,
      },
    };
  }

  rotationChanged(data: MazeScene) {
    data.blocks = undefined;
  }

  getForwardCoordinates(direction?: number) {
    const forward = { x: 0, y: 0 };

    switch (direction ?? 0) {
      case 0:
        forward.y = -1;
        break;
      case 1:
        forward.x = 1;
        break;
      case 2:
        forward.y = 1;
        break;
      case 3:
        forward.x = -1;
        break;
    }
    return forward;
  }

  updateBlocks(data: MazeScene): typeof data.blocks {
    if (data.blocks || !data.position) {
      return data.blocks;
    }
    const forward = this.getForwardCoordinates(data.direction);
    const leftWall = { x: 0, y: 0 };

    switch (data.direction ?? 0) {
      case 0:
        leftWall.x = -1;
        break;
      case 1:
        leftWall.y = -1;
        break;
      case 2:
        leftWall.x = 1;
        break;
      case 3:
        leftWall.y = 1;
        break;
    }
    const rightWall = { x: -leftWall.x, y: -leftWall.y };

    const blocks: [
      [string, string, string, string, string],
      [string, string, string, string, string],
      [string, string, string, string, string],
      [string, string, string, string, string],
    ] = [
        ['', '', '', '', ''],
        ['', '', '', '', ''],
        ['', '', '', '', ''],
        ['', '', '', '', ''],
      ];

    const grid = data.grid;
    for (let level = 0; level < 4; level++) {
      const midBlock = [data.position.x + forward.x * level, data.position.y + forward.y * level];
      const leftBlock = [midBlock[0] + leftWall.x, midBlock[1] + leftWall.y];
      const leftLeftBlock = [midBlock[0] + leftWall.x * 2, midBlock[1] + leftWall.y * 2];
      const rightBlock = [midBlock[0] + rightWall.x, midBlock[1] + rightWall.y];
      const rightRightBlock = [midBlock[0] + rightWall.x * 2, midBlock[1] + rightWall.y * 2];
      blocks[level] = [
        grid?.[leftLeftBlock[1]]?.[leftLeftBlock[0]] ?? '',
        grid?.[leftBlock[1]]?.[leftBlock[0]] ?? '',
        grid?.[midBlock[1]]?.[midBlock[0]] ?? '',
        grid?.[rightBlock[1]]?.[rightBlock[0]] ?? '',
        grid?.[rightRightBlock[1]]?.[rightRightBlock[0]] ?? '',
      ];
    }
    data.blocks = blocks;
    return data.blocks;
  }

  drawAnimation(animation?: Animation | null, timestamp?: DOMHighResTimeStamp) {
    if (animation?.asset?.image && this.context) {
      const timeEllapsed = (timestamp ?? 0) - 0;
      const frame = animation?.frameRate ? Math.floor(animation.frameRate * timeEllapsed / 1000) : 0;
      const [x, y, width, height, animating] = animation?.getCrop(frame) ?? DEFAULT_CROP;
      this.context.save();
      if (animation?.flip) {
        this.context.translate(this.context.canvas.width, 0);
        this.context.scale(-1, 1);
      }

      this.context.drawImage(
        animation?.asset?.image,
        x, y, width, height,
        0,
        0,
        width, height);
      this.context.restore();
      return { animating };
    }
    return {};
  }

  canMove(data: MazeScene) {
    if (data.destination) {
      return false;
    }
    if (data.moveTime || data.turnTime) {
      return false;
    }
    if (!data.moveAction || !data.position) {
      return false;
    }
    if (data.message) {
      return false;
    }
    const forward = this.getForwardCoordinates(data.direction);
    const mul = data.moveAction.y;
    const cellEnteredCoordinates = { x: forward.x * mul, y: forward.y * mul };
    const gridBlock = data.grid?.[data.position.y + cellEnteredCoordinates.y]?.[data.position.x + cellEnteredCoordinates.x];
    return !this.isBlock(gridBlock) && gridBlock !== " $";
  }

  canTurn(data: MazeScene) {
    if (data.destination) {
      return false;
    }
    if (data.message) {
      return false;
    }
    return true;
  }

  canOpen(data: MazeScene) {
    if (data.destination || data.opened) {
      return false;
    }
    if (data.message) {
      return false;
    }
    if (this.isFrontLocked(data)) {
      return data?.persist?.game?.inventory?.key;
    }

    return this.isFrontDoor(data) || this.isFrontChest(data);
  }

  getFrontPosition(data: MazeScene) {
    const forward = this.getForwardCoordinates(data.direction);
    const cellEnteredCoordinates = { x: forward.x, y: forward.y };
    const x = (data.position?.x ?? 0) + cellEnteredCoordinates.x;
    const y = (data.position?.y ?? 0) + cellEnteredCoordinates.y;
    const tag = `${x}_${y}`;
    return { x, y, tag };
  }

  isFrontDoor(data: MazeScene) {
    if (!data.position) {
      return false;
    }
    const { x, y } = this.getFrontPosition(data);
    return data.grid?.[y]?.[x] === "DD" || data.grid?.[y]?.[x] === "LK";
  }

  isFrontLocked(data: MazeScene) {
    if (!data.position) {
      return false;
    }
    const { x, y } = this.getFrontPosition(data);
    return data.grid?.[y]?.[x] === "LK";
  }

  isFrontStairs(data: MazeScene) {
    if (!data.position) {
      return false;
    }
    const { x, y } = this.getFrontPosition(data);
    return data.grid?.[y]?.[x] === "EX";
  }

  isFrontChest(data: MazeScene) {
    if (!data.position) {
      return false;
    }
    const { x, y } = this.getFrontPosition(data);
    return data.grid?.[y]?.[x] === " $";
  }

  isFrontGuard(data: MazeScene) {
    if (!data.position) {
      return false;
    }
    const { x, y } = this.getFrontPosition(data);
    return data.grid?.[y]?.[x] === " G";
  }

  onChangeCell(data: MazeScene) {
    delete data.blocks;
    delete data.opened;
    const { tag } = this.getFrontPosition(data);
    if (this.isFrontChest(data)) {
      data.opened = this.getProp(data, `chest_${tag}_opened`);
      console.log("Chest", tag);
    }

    const chance = { rand: Math.random() };
    data.events?.[tag]?.forEach(action => {
      this.performAction(data, action, chance);
    });

    this.autoSave(data);
  }

  performRendering(data: MazeScene, timestamp: DOMHighResTimeStamp): RenderingStatus {
    if (!data.position) {
      data.position = { x: 0, y: 0 };

      if (data.returnPosition) {
        data.position.x = data.returnPosition.x;
        data.position.y = data.returnPosition.y;
        data.direction = data.returnDirection;
      } else {
        data.grid?.forEach((row, gy) => {
          row.forEach((cell, gx) => {
            if (cell === " s") {
              data.position = { x: gx, y: gy };
            }
          });
        });
      }
    }

    if (!data.moveTime && !data.turnTime && !data.openTime) {
      if (data.moveAction?.y) {
        if (data.moveAction?.y > 0) {
          if (this.isFrontDoor(data) && data.opened) {
            data.destination = data.title;
            data.destinationDirection = data.direction;
            const forward = this.getForwardCoordinates(data.direction);
            data.destinationPosition = { x: data.position.x + forward.x * 2, y: data.position.y + forward.y * 2 };
          }

          if (this.isFrontStairs(data)) {
            const { tag } = this.getFrontPosition(data);
            const dest = data.portal?.[tag];
            if (dest) {
              data.destination = dest.scene;
              data.destinationPosition = dest.position;
              data.destinationDirection = dest.direction;
            } else {
              console.log("No portal for: ", tag);
            }
          }
        }

        if (this.canMove(data)) {
          data.moveTime = timestamp + 1;
          data.moveDirection = data.moveAction.y > 0 ? "FORWARD" : "BACKWARD";
          if (data.moveDirection === "BACKWARD") {
            const forward = this.getForwardCoordinates(data.direction);
            data.position.x -= forward.x;
            data.position.y -= forward.y;
            this.onChangeCell(data);
          }
        }
      }

      if (data.moveAction?.x) {
        if (this.canTurn(data)) {
          data.turnTime = timestamp + 1;
          data.turn = data.moveAction.x < 0 ? "LEFT" : "RIGHT";
        }
      }

      if (data.openAction) {
        if (this.canOpen(data)) {
          data.openTime = timestamp + 1;
        } else if (this.isFrontLocked(data) && !data.opened) {
          data.message = "The door is locked.";
        }
      }
    }

    let moveIndex = 0;
    if (data.moveTime) {
      const moveTimeProgress = Math.ceil((timestamp - data.moveTime) / (data.moveDuration ?? 100));
      if (data.moveDirection === "FORWARD") {
        if (moveTimeProgress < 3) {
          moveIndex = moveTimeProgress;
        } else {
          delete data.moveTime;
          const forward = this.getForwardCoordinates(data.direction);
          data.position.x += forward.x;
          data.position.y += forward.y;
          this.onChangeCell(data);
        }
      } else {
        if (moveTimeProgress < 3) {
          moveIndex = 3 - moveTimeProgress;
        } else {
          delete data.moveTime;
        }
      }
    }

    let turnIndex = 0;
    if (data.turnTime) {
      const turnTimeProgress = Math.ceil((timestamp - data.turnTime) / (data.turnDuration ?? 150));
      if (turnTimeProgress < 2) {
        turnIndex = turnTimeProgress;
      } else {
        data.direction = ((data.direction ?? 0) + (data.turn === "LEFT" ? -1 : 1) + 4) % 4;
        delete data.blocks;
        delete data.turnTime;
      }
    }

    let openIndex = data.opened ? 2 : 0;
    if (data.openTime) {
      const openTimeProgress = Math.ceil((timestamp - data.openTime) / (data.openDuration ?? 100));
      if (openTimeProgress < 2) {
        openIndex = openTimeProgress;
      } else {
        delete data.openTime;
        data.opened = true;
        openIndex = 2;
        this.playSFX(data.sounds?.door);

        if (this.isFrontChest(data)) {
          const { tag } = this.getFrontPosition(data);
          this.saveProp(data, `chest_${tag}_opened`, true);

          this.pickItem(data, data.treasures?.[tag]);
        }
      }
    }

    this.updateBlocks(data);

    this.drawBackground(data, timestamp, moveIndex, turnIndex);

    this.drawBlocks(data, timestamp, moveIndex, turnIndex, openIndex);

    return data.destination && !data.message ? RenderingStatus.COMPLETED : RenderingStatus.RENDERING;
  }

  drawBackground(data: MazeScene, timestamp: DOMHighResTimeStamp, moveIndex: number, turnIndex: number) {
    if (data.turnTime) {
      this.drawAnimation(data.sprites?.background.rotate, timestamp);
    } else {
      this.drawAnimation(data.sprites?.background.move[moveIndex], timestamp);
    }
  }

  isBlock(block?: string) {
    return block === "[]" || block === "EX" || block === "DD" || block === "LK";
  }

  isExit(block: string) {
    return block === "EX" || block === "DD" || block === "LK";
  }

  isChest(block: string) {
    return block === " $";
  }

  isGuard(block: string) {
    return block === " G";
  }

  drawBlocks(data: MazeScene, timestamp: DOMHighResTimeStamp, moveIndex: number, turnIndex: number, openIndex: number) {
    const blocks = data.blocks;
    if (blocks?.length) {
      if (data.turnTime) {
        const mid = 2;
        const frontXY = { x: data.turn === "LEFT" ? mid - 1 : mid + 1, y: 1 };
        const frontBlock = blocks[frontXY.y][frontXY.x];
        const leftBlock = data.turn === "LEFT" ? blocks[0][mid - 1] : blocks[1][mid];
        const rightBlock = data.turn === "RIGHT" ? blocks[0][mid + 1] : blocks[1][mid];
        const farLeftBlock = data.turn === "LEFT" ? blocks[frontXY.y][frontXY.x - 1] : blocks[frontXY.y + 1][frontXY.x];
        const farRightBlock = data.turn === "RIGHT" ? blocks[frontXY.y][frontXY.x + 1] : blocks[frontXY.y + 1][frontXY.x];
        if (this.isBlock(farLeftBlock)) {
          this.drawAnimation(data.sprites?.corners?.far.left, timestamp);
        }
        if (this.isBlock(farRightBlock)) {
          this.drawAnimation(data.sprites?.corners?.far.right, timestamp);
        }
        if (this.isBlock(frontBlock)) {
          this.drawAnimation(data.sprites?.corners?.mid, timestamp);
        }
        if (this.isBlock(leftBlock)) {
          this.drawAnimation(data.sprites?.corners?.close.left, timestamp);
        }
        if (this.isBlock(rightBlock)) {
          this.drawAnimation(data.sprites?.corners?.close.right, timestamp);
        }
      } else {
        for (let i = blocks?.length - 1; i >= 0; i--) {
          const [leftLeft, leftBlock, midBlock, rightBlock, rightRight] = blocks[i];
          if (this.isBlock(leftBlock)) {
            this.drawAnimation(data.sprites?.walls?.left?.[i]?.[moveIndex], timestamp);
          }
          if (this.isBlock(rightBlock)) {
            this.drawAnimation(data.sprites?.walls?.right?.[i]?.[moveIndex], timestamp);
          }
          if (this.isBlock(midBlock)) {
            this.drawAnimation(data.sprites?.walls?.face?.[i]?.[moveIndex], timestamp);
            if (this.isExit(midBlock)) {
              this.drawAnimation(data.sprites?.walls?.exit?.[i]?.[moveIndex], timestamp);
            }
          }
          if (i === 1 && moveIndex === 0) {
            if (midBlock === "EX") {
              this.drawAnimation(data.sprites?.walls?.stairs, timestamp);
            } else if (midBlock === "DD") {
              this.drawAnimation(data.sprites?.walls?.door[openIndex], timestamp);
            } else if (midBlock === "LK") {
              this.drawAnimation(data.sprites?.walls?.lock[openIndex], timestamp);
            } else if (this.isChest(midBlock)) {
              this.drawAnimation(data.sprites?.walls?.chest[openIndex], timestamp);
            } else if (this.isGuard(midBlock)) {
              this.drawAnimation(data.sprites?.walls?.guard, timestamp);
            }
          }
        }
      }
    }
  }

  getConnectionTag(data: MazeScene): string | undefined {
    if (!data.position) {
      return;
    }
    const { x, y } = data.position;
    const forward = this.getForwardCoordinates(data.direction);
    return `${data.title}|${data.subtitle ?? ''}|${x + forward.x},${y + forward.y}`;
  }
}
