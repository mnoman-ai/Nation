import { create } from 'zustand';
import { createNewGame } from './engine/gameState.js';
import { tick } from './engine/timeEngine.js';
import { SAVE_VERSION, deserializeGame, serializeGame } from './engine/saveMigration.js';
import { recordCampaignAction, nominatePlayer } from './engine/career.js';

const defaultPlayer = {
  name: 'Arjun Verma', age: 28, gender: 'Male', origin: 'Student Leader', status: 'Citizen',
  careerStage: 'citizen', partyId: null, reputation: 30, influence: 28, support: 25, skin: 0,
};

function stateFromGame(gameState, extras = {}) {
  return {
    ...extras,
    gameState,
    month: gameState.calendar.monthIndex,
    player: gameState.player,
    notifications: gameState.historyLog.slice(0, 40).map((entry, index) => ({
      id: `${entry.monthIndex}-${entry.type}-${index}`,
      message: entry.message,
      read: false,
    })),
  };
}

export const useGame = create((set, get) => ({
  screen: 'Main Menu',
  player: { ...defaultPlayer },
  month: 0,
  notifications: [],
  settings: { volume: 0.7 },
  saveSlots: [null, null, null],
  toast: '',
  gameState: null,
  gameConfig: null,
  lastCandidateLoad: null,
  setScreen: (screen) => set({ screen }),
  initialize: (config, seed = config?.balance?.simulation?.defaultSeed ?? 241024) => {
    const current = get();
    if (current.gameState) {
      set({ gameConfig: config });
      return current.gameState;
    }
    const gameState = createNewGame(config, seed);
    set({ ...stateFromGame(gameState), gameConfig: config, screen: 'Main Menu' });
    return gameState;
  },
  newGame: (config = get().gameConfig, seed = Date.now()) => {
    if (!config) throw new Error('Game data is still loading');
    const gameState = createNewGame(config, seed);
    set({ ...stateFromGame(gameState), gameConfig: config, screen: 'Dashboard', toast: 'New game started' });
    return gameState;
  },
  updatePlayer: (patch) => set((current) => {
    const player = { ...current.player, ...patch };
    if (!current.gameState) return { player };
    const gameState = { ...current.gameState, player: { ...current.gameState.player, ...patch } };
    if (patch.partyId && gameState.player.careerStage === 'citizen') {
      gameState.player.careerStage = 'party_worker';
      gameState.player.status = 'Party Worker';
    }
    return { player: gameState.player, gameState };
  }),
  recordCampaignAction: (action) => {
    const current = get();
    if (!current.gameState) throw new Error('Start a new game first');
    const gameState = structuredClone(current.gameState);
    recordCampaignAction(gameState, action);
    set({ ...stateFromGame(gameState), toast: `Campaign action recorded: ${action.type}` });
    return gameState;
  },
  nominatePlayer: (nomination) => {
    const current = get();
    if (!current.gameState) throw new Error('Start a new game first');
    const gameState = structuredClone(current.gameState);
    nominatePlayer(gameState, nomination);
    set({ ...stateFromGame(gameState), toast: 'Nomination recorded' });
    return gameState;
  },
  cacheCandidates: (stateId, candidatePayload) => {
    const current = get();
    if (!current.gameState) return;
    const gameState = structuredClone(current.gameState);
    gameState.world.loadedCandidatesByState[stateId] = candidatePayload;
    set({ gameState, lastCandidateLoad: { stateId, count: candidatePayload.candidates.length } });
  },
  endTurn: () => {
    const current = get();
    if (!current.gameState) {
      set({ month: current.month + 1, toast: 'Game data is still loading' });
      return;
    }
    const gameState = tick(current.gameState, 1);
    const newResults = gameState.historyLog.some((entry) => entry.type === 'election_result' && entry.monthIndex === gameState.calendar.monthIndex);
    const latest = newResults ? gameState.electionResults[gameState.electionResults.length - 1] : null;
    const notifications = gameState.historyLog.slice(0, 40).map((entry, index) => ({
      id: `${entry.monthIndex}-${entry.type}-${index}`,
      message: entry.message,
      read: false,
    }));
    set({
      ...stateFromGame(gameState),
      notifications,
      screen: newResults ? 'Election Results' : current.screen,
      toast: latest ? 'Election results declared' : `Advanced to ${gameState.calendar.dateLabel}`,
    });
  },
  save: (slot) => {
    const current = get();
    try {
      const payload = current.gameState
        ? serializeGame(current.gameState)
        : JSON.stringify({ saveVersion: SAVE_VERSION, month: current.month, player: current.player, settings: current.settings, notifications: current.notifications });
      localStorage.setItem(`nation-save-${slot}`, payload);
      set((state) => ({
        saveSlots: state.saveSlots.map((item, index) => index === slot ? { month: current.month, name: current.player.name } : item),
        toast: `Saved to slot ${slot + 1}`,
      }));
    } catch {
      set({ toast: 'Save failed: storage unavailable' });
    }
  },
  load: (slot) => {
    try {
      const raw = localStorage.getItem(`nation-save-${slot}`);
      if (!raw) { set({ toast: 'This slot is empty' }); return; }
      const saved = deserializeGame(raw);
      if (saved.calendar && saved.parties && saved.constituencies && saved.world) {
        set({ ...stateFromGame(saved), screen: 'Dashboard', toast: 'Game loaded' });
      } else {
        const current = get();
        const player = { ...current.player, ...(saved.player || {}) };
        set({ player, month: Number(saved.month) || 0, settings: { volume: 0.7, ...(saved.settings || {}) }, notifications: saved.notifications || [], screen: 'Dashboard', toast: 'Legacy save loaded; new simulation data retained' });
      }
    } catch (error) {
      set({ toast: `Could not load save: ${error.message}` });
    }
  },
  dismissToast: () => set({ toast: '' }),
}));
