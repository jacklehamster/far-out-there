import { NewgroundsCredentials } from "../renderer/achievements/achievement";
import Action from "../renderer/types/action";
import Animation from "../renderer/types/animation";
import Music from "../renderer/types/music";
import { ReturnData } from "../renderer/types/return-data";
import { Position } from "../scenes/canvas-scene";

export default class Scene {
  type?: string;
  title?: string;
  subtitle?: string;
  persistState?: boolean;
  startTime?: number;
  music?: Music;
  mute?: boolean;
  destination?: string;
  destinationPosition?: Position;
  destinationDirection?: number;
  vars?: Record<string, string>;
  returnData?: ReturnData;
  returnPosition?: Position;
  returnDirection?: number;
  onStart?: Action[];

  sounds?: {
    heal: Music;
    miss: Music;
    foeHit: Music;
    playerHit: Music;
    door: Music;
    pickup: Music;
    jingle: Music;
  }
}
