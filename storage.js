// Persistência via localStorage (high score, configurações).

const KEY = 'pedroMercado_v1';

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    // localStorage pode estar desabilitado (modo privado restrito)
  }
}

export function loadState() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}
