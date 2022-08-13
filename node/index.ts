import express, { Application, Request, Response } from 'express';
import serve from "express-static";
import fs from "fs";
import { extname } from 'path';

const app: Application = express();
const PORT = process.env.PORT || 8000;
const publicGameFolder = './public/game';
app.get("/", async (req: Request, res: Response): Promise<void> => {
  res.writeHead(200, { "Content-Type": "text/html" });
  const files = (await fs.promises.readdir(publicGameFolder))
    .filter(file => extname(file).toLocaleLowerCase() === '.json' && file !== 'index.json')
    .map(file => ({ type: "reference", "path": file }));
  const indexContent = fs.existsSync(`${publicGameFolder}/index.json`) ? await fs.promises.readFile(`${publicGameFolder}/index.json`, "utf8") : null;
  const indexContentToWrite = JSON.stringify(files, null, "\t");
  if (indexContent !== indexContentToWrite) {
    await fs.promises.writeFile(`${publicGameFolder}/index.json`, indexContentToWrite);
  }
  const html = await fs.promises.readFile(`./public/index.html`);
  res.write(html);
  res.end();
});

//@ts-ignore
app.use(serve("./public", null));

app.listen(PORT, (): void => {
  console.log(`Server Running here 👉 https://localhost:${PORT}`);
});


function sum(num1: number, num2: number) {
  return num1 + num2;
}
console.log(sum(8, 4));