import Condition from "../../core/condition";

export interface Label {
  text: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  blinkRate?: Condition | [number, number];
  hidden?: Condition | boolean;
  box: boolean;
}