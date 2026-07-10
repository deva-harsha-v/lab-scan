const STAGE_DURATION_MS = 60 * 1000; // 60 seconds

function getStage1Key(experimentId) {
  return `labscan_stage1_${experimentId}`;
}

function getStage2Key(experimentId) {
  return `labscan_stage2_${experimentId}`;
}

// ─── Stage 1 → unlocks Stage 2 ───────────────────────────────────────────────

export function recordStage1Start(experimentId) {
  const key = getStage1Key(experimentId);
  if (!sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, JSON.stringify({ startedAt: Date.now() }));
  }
}

export function isStage2Unlocked(experimentId) {
  const raw = sessionStorage.getItem(getStage1Key(experimentId));
  if (!raw) return false;
  const { startedAt } = JSON.parse(raw);
  return Date.now() - startedAt >= STAGE_DURATION_MS;
}

export function getStage2RemainingSeconds(experimentId) {
  const raw = sessionStorage.getItem(getStage1Key(experimentId));
  if (!raw) return Math.ceil(STAGE_DURATION_MS / 1000);
  const { startedAt } = JSON.parse(raw);
  return Math.max(0, Math.ceil((STAGE_DURATION_MS - (Date.now() - startedAt)) / 1000));
}

// ─── Stage 2 → unlocks Stage 3 ───────────────────────────────────────────────

export function recordStage2Start(experimentId) {
  const key = getStage2Key(experimentId);
  if (!sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, JSON.stringify({ startedAt: Date.now() }));
  }
}

export function isStage3Unlocked(experimentId) {
  const raw = sessionStorage.getItem(getStage2Key(experimentId));
  if (!raw) return false;
  const { startedAt } = JSON.parse(raw);
  return Date.now() - startedAt >= STAGE_DURATION_MS;
}

export function getStage3RemainingSeconds(experimentId) {
  const raw = sessionStorage.getItem(getStage2Key(experimentId));
  if (!raw) return Math.ceil(STAGE_DURATION_MS / 1000);
  const { startedAt } = JSON.parse(raw);
  return Math.max(0, Math.ceil((STAGE_DURATION_MS - (Date.now() - startedAt)) / 1000));
}
