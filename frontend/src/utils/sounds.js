const TONE_NAMES = {
  digital: "Digital beep",
  chime: "Chime",
  bell: "Soft bell",
  marimba: "Marimba",
  siren: "Siren",
  alert: "Alert",
};

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playNote(ctx, { freq, type = "sine", start, duration = 0.3, volume = 0.25, slideTo = null }) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

function playDigital(ctx) {
  const t = ctx.currentTime;
  for (let i = 0; i < 3; i++) {
    playNote(ctx, { freq: 880, type: "square", start: t + i * 0.22, duration: 0.18, volume: 0.18 });
  }
}

function playChime(ctx) {
  const t = ctx.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
    playNote(ctx, { freq: f, type: "sine", start: t + i * 0.15, duration: 0.55, volume: 0.3 });
  });
}

function playBell(ctx) {
  const t = ctx.currentTime;
  playNote(ctx, { freq: 880, type: "sine", start: t, duration: 1.2, volume: 0.35 });
  playNote(ctx, { freq: 1318.5, type: "sine", start: t, duration: 1.0, volume: 0.12 });
  playNote(ctx, { freq: 880, type: "sine", start: t + 0.5, duration: 1.2, volume: 0.35 });
}

function playMarimba(ctx) {
  const t = ctx.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
    playNote(ctx, { freq: f, type: "triangle", start: t + i * 0.12, duration: 0.25, volume: 0.4 });
  });
}

function playSiren(ctx) {
  const t = ctx.currentTime;
  for (let i = 0; i < 3; i++) {
    playNote(ctx, { freq: 400, type: "sawtooth", start: t + i * 0.8, duration: 0.7, volume: 0.12, slideTo: 900 });
  }
}

function playAlert(ctx) {
  const t = ctx.currentTime;
  [1000, 800, 1000].forEach((f, i) => {
    playNote(ctx, { freq: f, type: "square", start: t + i * 0.28, duration: 0.24, volume: 0.18 });
  });
}

const PLAYERS = {
  digital: playDigital,
  chime: playChime,
  bell: playBell,
  marimba: playMarimba,
  siren: playSiren,
  alert: playAlert,
};

export const TONE_OPTIONS = Object.entries(TONE_NAMES).map(([value, label]) => ({
  value,
  label,
}));

export function playTone(name) {
  try {
    const ctx = getCtx();
    const player = PLAYERS[name] || playDigital;
    player(ctx);
  } catch {
    // audio not available
  }
}