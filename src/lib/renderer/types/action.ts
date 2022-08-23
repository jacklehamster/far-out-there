import Music from "./music";
import { ReturnData } from "./return-data";

export default interface Action {
  action?: string;
  destination?: ReturnData;
  itemsRequired?: string[];
  itemsForbidden?: string[];
  secretRequired?: string[];
  secretForbidden?: string[];
  message: string;
  itemBonus?: string[];
  itemRemove?: string[];
  chance?: number;
  sound?: Music;
  subMenu?: string;

  item?: string;
  cost?: number;
  amount?: number;
  secrets?: string[];
  hero?: number;

  actions?: Action[];
}