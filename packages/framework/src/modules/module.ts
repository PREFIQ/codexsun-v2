export type FrameworkModule = {
  name: string;
  register(): Promise<void> | void;
};

export class ModuleRegistry {
  private readonly modules = new Map<string, FrameworkModule>();

  register(module: FrameworkModule) {
    if (this.modules.has(module.name)) {
      throw new Error(`Module already registered: ${module.name}`);
    }

    this.modules.set(module.name, module);
  }

  async boot() {
    for (const module of this.modules.values()) {
      await module.register();
    }
  }

  list() {
    return [...this.modules.keys()];
  }
}
