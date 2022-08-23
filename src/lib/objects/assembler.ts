import Condition from "../core/condition";
import Hero from "../renderer/types/hero";
import Animation from "../renderer/types/animation";
import BlobType from "../renderer/types/blob";
import FontSheet from "../renderer/types/font-sheet";
import { resolve } from "url";
import { Slide } from "../scenes/canvas-scene";

export default class Assembler {
  assetsManager: Record<string, string>;
  cache: Record<string, { blob: Blob; base64: string | ArrayBuffer | null; image: HTMLImageElement }> = {};
  pendingLoad: Record<string, ((response: any) => void)[]> = {};
  responses: Record<string, any> = {};
  filesLoaded: Record<string, any> = {};

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

  async internalFetch<T>(longpath: string, transform: (response: Response) => Promise<T>): Promise<T> {
    const path = resolve(location.href, longpath);
    return new Promise((resolve) => {
      if (this.responses[path]) {
        resolve(this.responses[path]);
        return;
      }
      if (!this.pendingLoad[path]) {
        this.pendingLoad[path] = [];
        fetch(path).then(response => transform(response)).then((result) => {
          this.responses[path] = result;
          this.pendingLoad[path].forEach(callback => callback(result));
          delete this.pendingLoad[path];

          this.filesLoaded[path.split(location.href)[1]] = result;

        });
      }
      this.pendingLoad[path].push(result => {
        resolve(result);
      });
    });
  }

  async fetchWithCache(path: string): Promise<{ blob: Blob; base64: string | ArrayBuffer | null, image: HTMLImageElement }> {
    if (!this.cache[path]) {
      const result = await this.internalFetch(path,
        response => {
          return response.blob()
            .then(blob => this.blobToBase64(blob)
              .then(base64 => ({
                blob, base64: base64 ?? ""
              }))
              .then(({ blob, base64 }) => this.loadImage(blob).then(image => ({
                blob, base64, image,
              })))
            )
        });
      this.cache[path] = result;
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

  async assemble(obj: any, dir?: string, property: string = "") {
    if (typeof (obj) !== 'object' || !obj) {
      return obj;
    }
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        obj[i] = await this.assemble(obj[i], dir, `${property}[${i}]`);
      }
    } else {
      for (const i in obj) {
        if (obj.hasOwnProperty(i)) {
          obj[i] = await this.assemble(obj[i], dir, `${property}.${i}`);
        }
      }
    }

    if ((obj.type === "reference" || obj.type === "ref") && obj.path) {
      return await this.load(`${dir ?? ''}${obj.path}`, obj, property);
    }
    if (obj.type === "text" && obj.path) {
      return await this.loadText(`${dir ?? ''}${obj.path}`, obj, property);
    }
    if (obj.type === "image" && obj.path) {
      const { blob, base64, image } = await this.fetchWithCache(`${dir}${obj.path}`);
      //      this.filesLoaded[`${dir}${obj.path}`] = blob;

      this.assetsManager[obj.path] = base64 as string;

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

  async load(path: string, obj: any, property?: string): Promise<any> {
    // console.log(">>", path, property);
    const dir = path.substring(0, path.lastIndexOf("/") + 1);
    const result = await this.internalFetch(path, response => response.json());
    const json = JSON.parse(JSON.stringify(result));
    const replacedJson = this.paramsReplacement(json, obj.params);
    return await this.assemble(replacedJson, dir, property);
  }

  async loadText(path: string, { splitLines, splitCells }: { splitLines?: boolean; splitCells?: boolean }, property?: string): Promise<any> {
    // console.log(">>", path, property);
    const text = await this.internalFetch(path, response => response.text());
    return splitLines || splitCells ? text.split("\n").map(line => splitCells ? line.match(/.{1,2}/g) : line) : text;
  }
}
