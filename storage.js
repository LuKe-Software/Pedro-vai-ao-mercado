// Persistência via localStorage (high score, ranking, configurações).

const KEY = 'pedroMercado_v1';

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {}
}

export function loadState() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

// ── Ranking ───────────────────────────────────────────────────────────────────

export function loadScores() {
  return loadState().scores || [];
}

// Retorna true se total entra no top 10 (lista não cheia ou bate o último lugar).
export function isTopTen(total) {
  const scores = loadScores();
  return scores.length < 10 || total > scores[scores.length - 1].total;
}

// Insere entrada, ordena, mantém top 10. Retorna índice 0-based da entrada.
// entry = { name: 'ABCD', total: 400, won: true }
export function addScore(entry) {
  const state = loadState();
  const scores = state.scores || [];
  scores.push(entry);
  scores.sort((a, b) => b.total - a.total);
  if (scores.length > 10) scores.length = 10;
  state.scores = scores;
  if (entry.total > (state.highScore || 0)) state.highScore = entry.total;
  saveState(state);
  return scores.indexOf(entry);
}
