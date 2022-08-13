import CodeRenderer from "../renderer/code-renderer";
import Registry from "../renderer/registry";
import SceneRenderer from "../renderer/scene-renderer";
import Toolbar from "../ui/toolbar";

export default async function registration(): Promise<Registry> {
  const registry = new Registry();

  await registry.register("Toolbar", new Toolbar())
    .then(toolbar => registry.addSceneChangeListener(toolbar))
    .then(toolbar => toolbar.listeners.add(registry));
  await registry.register("SceneRenderer", new SceneRenderer())
    .then(listener => registry.addSceneChangeListener(listener))
    .then(renderer => renderer.listeners.add(registry));
  await registry.register("CodeRenderer", new CodeRenderer())
    .then(listener => registry.addSceneChangeListener(listener));
  return registry;
}
