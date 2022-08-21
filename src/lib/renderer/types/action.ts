import Music from "./music";
import { ReturnData } from "./return-data";

export default interface Action {
  action?: string;
  destination?: ReturnData;
  itemsRequired?: string[];
  itemsForbidden?: string[];
  message: string;
  itemBonus?: string[];
  itemRemove?: string[];
  chance?: number;
  sound?: Music;
}