const URL_PROTOCOL_REGEX = /^(?:https?:|data:)/i;
const ASSET_PREFIX_REGEX = /^(?:\.\.\/+|\.\/+)*Assets\//i;

const buildCandidatePaths = (relativePath) => {
  if (!relativePath || typeof relativePath !== "string") {
    return [];
  }

  const normalized = relativePath.replace(/\\/g, "/");
  const candidates = [];

  const push = (value) => {
    if (!value || candidates.includes(value)) {
      return;
    }
    candidates.push(value);
  };

  push(normalized);

  if (ASSET_PREFIX_REGEX.test(normalized)) {
    const withoutAssets = normalized.replace(ASSET_PREFIX_REGEX, "");
    push(`Assets/${withoutAssets}`);
    push(withoutAssets);
  } else if (/^Assets\//i.test(normalized)) {
    const stripped = normalized.replace(/^Assets\//i, "");
    push(stripped);
  }

  return candidates;
};

const resolveCandidateUrl = (candidate) => {
  if (URL_PROTOCOL_REGEX.test(candidate)) {
    return candidate;
  }

  if (typeof window === "undefined") {
    return candidate;
  }

  // Avoid root-relative paths when running from file:// origins
  if (window.location?.protocol === "file:" && candidate.startsWith("/")) {
    const trimmed = candidate.replace(/^\/+/, "");
    return new URL(trimmed, window.location.href).href;
  }

  try {
    return new URL(candidate, window.location.href).href;
  } catch (error) {
    return candidate;
  }
};

export const createAudioElement = (
  relativePath,
  { volume = 1, loop = false } = {}
) => {
  if (typeof window === "undefined" || typeof Audio === "undefined") {
    return null;
  }

  const candidates = buildCandidatePaths(relativePath);
  if (!candidates.length) {
    console.warn("Audio load skipped, no candidates for", relativePath);
    return null;
  }

  const audio = new Audio();
  audio.loop = loop;
  audio.volume = volume;
  audio.preload = "auto";

  let currentIndex = 0;

  const applyNextCandidate = () => {
    if (currentIndex >= candidates.length) {
      audio.removeEventListener("error", onErrorHandler);
      console.warn("Audio load failed for", relativePath, candidates);
      return;
    }

    const candidate = candidates[currentIndex];
    currentIndex += 1;

    try {
      const resolvedSrc = resolveCandidateUrl(candidate);
      audio.src = resolvedSrc;
      if (typeof audio.load === "function") {
        audio.load();
      }
    } catch (error) {
      applyNextCandidate();
    }
  };

  const onErrorHandler = () => {
    applyNextCandidate();
  };

  const onReadyHandler = () => {
    audio.removeEventListener("error", onErrorHandler);
  };

  audio.addEventListener("error", onErrorHandler);
  audio.addEventListener("canplay", onReadyHandler, { once: true });
  audio.addEventListener("canplaythrough", onReadyHandler, { once: true });

  applyNextCandidate();

  return audio;
};
