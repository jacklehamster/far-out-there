import Action from "../renderer/types/action";
import Animation from "../renderer/types/animation";
import { ReturnData } from "../renderer/types/return-data";
import CanvasScene, { Position } from "./canvas-scene";

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

  opened?: boolean;

  blocks?: [
    [string, string, string, string, string],
    [string, string, string, string, string],
    [string, string, string, string, string],
    [string, string, string, string, string],
  ];

  portal?: Record<string, ReturnData>;

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
      lock: [Anim, Anim, Anim];
      stairs: Anim;
      chest: [Anim, Anim, Anim];
      guard: Anim;
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

  treasures?: Record<string, string | undefined>;

  events?: Record<string, Action[]>;
}
