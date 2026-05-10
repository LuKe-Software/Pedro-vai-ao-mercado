// Máquina de estados para gerenciamento de cenas.
// Cada cena implementa: enter(payload), update(dt), render(alpha), exit().

class SceneManager {
  constructor() {
    this.scenes = new Map();
    this.current = null;
  }

  register(name, scene) {
    this.scenes.set(name, scene);
  }

  switch(name, payload = {}) {
    if (this.current?.exit) this.current.exit();
    this.current = this.scenes.get(name);
    if (!this.current) throw new Error(`Cena não registrada: ${name}`);
    if (this.current.enter) this.current.enter(payload);
  }

  update(dt) {
    if (this.current?.update) this.current.update(dt);
  }

  render(alpha) {
    if (this.current?.render) this.current.render(alpha);
  }
}

// Singleton — importado por todas as cenas para solicitar transições
export const sceneManager = new SceneManager();
