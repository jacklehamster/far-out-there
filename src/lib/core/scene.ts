import Music from "../renderer/types/music";
import { ReturnData } from "../renderer/types/return-data";
import { Position } from "../scenes/slide-scene";

export default class Scene {
  type?: string;
  title?: string;
  subtitle?: string;
  persistState?: boolean;
  startTime?: number;
  music?: Music;
  destination?: string;
  destinationPosition?: Position;
  destinationDirection?: number;
  vars?: Record<string, string>;
  returnData?: ReturnData;
  returnPosition?: Position;
  returnDirection?: number;
}
