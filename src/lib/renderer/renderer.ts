import Auxiliary from "../aux/auxiliary";

export interface Renderer<T> extends Auxiliary {
  render(data: T, appIndex?: number): void;
  stopRendering?: () => void;
}