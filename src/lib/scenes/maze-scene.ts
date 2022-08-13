import Animation from "../renderer/types/animation";
import CanvasScene from "./canvas-scene";
import { Position } from "./slide-scene";

type Anim = Animation | null;

export default class MazeScene extends CanvasScene {
  type = "mazeScene";
  grid?: string[][];
  gridWidth?: number;
  gridHeight?: number;

  moveAction?: Position;
  position?: { x: number; y: number };
  direction?: number;

  moveDuration?: number;
  moveTime?: number;
  moveDirection?: "FORWARD" | "BACKWARD";

  turnDuration?: number;
  turnTime?: number;
  turn?: "LEFT" | "RIGHT";

  openAction?: boolean;
  openDuration?: number;
  openTime?: number;

  openedDoor?: boolean;

  blocks?: [
    [string, string, string, string, string],
    [string, string, string, string, string],
    [string, string, string, string, string],
    [string, string, string, string, string],
  ];

  sprites?: {
    background: {
      move: [Anim, Anim, Anim],
      rotate: Anim,
    };
    walls?: {
      left?: [
        [Anim, Anim, Anim],
        [Anim, Anim, Anim],
        [Anim, Anim, Anim],
        [Anim, Anim, Anim],
      ];
      right?: [
        [Anim, Anim, Anim],
        [Anim, Anim, Anim],
        [Anim, Anim, Anim],
        [Anim, Anim, Anim],
      ];
      face?: [
        [Anim, Anim, Anim],
        [Anim, Anim, Anim],
        [Anim, Anim, Anim],
        [Anim, Anim, Anim],
      ];
      exit?: [
        [Anim, Anim, Anim],
        [Anim, Anim, Anim],
        [Anim, Anim, Anim],
        [Anim, Anim, Anim],
      ];
      door: [Anim, Anim, Anim];
      stairs: Anim;
    };
    corners?: {
      close: {
        left: Anim,
        right: Anim,
      };
      mid: Anim;
      far: {
        left: Anim;
        right: Anim;
      };
    }
  }
}
