import { ReturnData } from "../renderer/types/return-data";
import { Position } from "../scenes/slide-scene";

export default interface CompleteListener {
  onComplete?: (returnData?: ReturnData) => void;
  onGoto?: (name?: string, returnData?: ReturnData, position?: Position, direction?: number, tag?: string) => void;
}