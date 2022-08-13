export default class BlobType {
  type = "blob";
  path: string;
  blob: Blob;
  image: HTMLImageElement;

  constructor({ path, blob, image }: { path: string, blob: Blob, image: HTMLImageElement }) {
    this.path = path;
    this.blob = blob;
    this.image = image;
  }

  toJSON() {
    return {
      type: this.type,
      path: this.path,
    }
  }
}
