import Condition from "../core/condition";
import Hero from "../renderer/types/hero";
import Animation from "../renderer/types/animation";
import BlobType from "../renderer/types/blob";
import FontSheet from "../renderer/types/font-sheet";
import { Slide } from "../scenes/slide-scene";
import stringify from "json-stringify-pretty-compact";

export default class Assembler {
  assetsManager: Record<string, string>;
  cache: Record<string, { blob: Blob; base64: string | ArrayBuffer | null }> = {};

  constructor(assetsManager: Record<string, string>) {
    this.assetsManager = assetsManager;
  }

  async blobToBase64(blob: Blob): Promise<string | ArrayBuffer | null> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.addEventListener("loadend", () => resolve(reader.result));
    });
  }

  async loadImage(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
      const image = new Image();
      image.addEventListener("load", () => {
        resolve(image);
      });
      image.src = URL.createObjectURL(blob);
    });
  }

  async fetchWithCache(path: string): Promise<{ blob: Blob; base64: string | ArrayBuffer | null }> {
    if (!this.cache[path]) {
      const response = await fetch(path);
      const blob = await response.blob();
      const base64 = await this.blobToBase64(blob);
      this.cache[path] = { blob, base64: base64 ?? "" };
    }
    return this.cache[path];
  }

  paramsReplacement(obj: any, params?: Record<string, any>): any {
    if (!params) {
      return obj;
    }
    if (typeof (obj) === "string" && typeof (params[obj]) !== "undefined") {
      return params[obj];
    }
    if (typeof (obj) !== 'object' || !obj) {
      return obj;
    }
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        obj[i] = this.paramsReplacement(obj[i], params);
      }
    } else {
      for (const i in obj) {
        if (obj.hasOwnProperty(i)) {
          obj[i] = this.paramsReplacement(obj[i], params);
        }
      }
    }
    return obj;
  }

  async assemble(obj: any, dir?: string) {
    if (typeof (obj) !== 'object' || !obj) {
      return obj;
    }
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        obj[i] = await this.assemble(obj[i], dir);
      }
    } else {
      for (const i in obj) {
        obj[i] = await this.assemble(obj[i], dir);
      }
    }

    if ((obj.type === "reference" || obj.type === "ref") && obj.path) {
      return await this.load(`${dir ?? ''}${obj.path}`, obj);
    }
    if (obj.type === "text" && obj.path) {
      return await this.loadText(`${dir ?? ''}${obj.path}`, obj);
    }
    if (obj.type === "image" && obj.path) {
      const { blob, base64 } = await this.fetchWithCache(`${dir}${obj.path}`);

      this.assetsManager[obj.path] = base64 as string;

      const image = await this.loadImage(blob);

      return new BlobType({
        path: obj.path,
        blob,
        image,
      });
    }
    if (obj.type === "music" && obj.path && !obj.pathFixed) {
      return {
        ...obj,
        path: `${dir ?? ''}${obj.path}`,
        pathFixed: true,
      };
    }
    if (obj.type === "animation") {
      return new Animation(obj);
    }
    if (obj.type === "fontSheet") {
      return new FontSheet(obj);
    }
    if (obj.type === "condition") {
      return new Condition(obj);
    }
    if (obj.type === "slide") {
      return new Slide(obj);
    }
    if (obj.type === "hero") {
      return new Hero(obj);
    }
    return obj;
  }

  async load(path: string, obj: any): Promise<any> {
    const dir = path.substring(0, path.lastIndexOf("/") + 1);
    const response = await fetch(path);
    const json = await response.json();
    const replacedJson = this.paramsReplacement(json, obj.params);
    return await this.assemble(replacedJson, dir);
  }

  async loadText(path: string, { splitLines, splitCells }: { splitLines?: boolean; splitCells?: boolean }): Promise<any> {
    const dir = path.substring(0, path.lastIndexOf("/") + 1);
    const response = await fetch(path);
    const text = await response.text();
    return splitLines || splitCells ? text.split("\n").map(line => splitCells ? line.match(/.{1,2}/g) : line) : text;
  }
}
