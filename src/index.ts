import Assembler from "./lib/objects/assembler";
import registration from "./lib/core/registration";

async function start() {
  const registry = await registration();
  const assetManager: Record<string, string> = {};
  const assembler = new Assembler(assetManager);
  const data = await assembler.assemble({
    apps: {
      type: "reference",
      path: 'game/index.json',
    },
    renderers: ["Toolbar"],
    assetManager,
  });
  data.appIndex = 0;
  data.apps.forEach((app: { entry: boolean, appIndex: number }, index: number) => {
    app.appIndex = index;
    if (app.entry) {
      data.appIndex = index;
    }
  });
  console.log(assembler.filesLoaded);

  registry.render(data);
}


document.addEventListener("DOMContentLoaded", () => {
  start();
});
