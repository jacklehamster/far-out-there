import { ReturnData } from "../renderer/types/return-data";

export interface Connection {
  id: string;
  tag: string;
  destination: ReturnData;
}
