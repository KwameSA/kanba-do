const TAG_ACTIVITY_KEY = "kanbaTagToActivityMap";

function normalizeTag(tag) {
  return (tag || "").trim().toLowerCase();
}

function parseTags(tags) {
  return (tags || "")
    .split(",")
    .map((tag) => normalizeTag(tag))
    .filter(Boolean);
}

function getDominantTag(tags) {
  const list = parseTags(tags);
  return list[0] || "";
}

function readTagToActivityMap() {
  try {
    const raw = localStorage.getItem(TAG_ACTIVITY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeTagToActivityMap(map) {
  try {
    localStorage.setItem(TAG_ACTIVITY_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage failures (private mode, etc.)
  }
}

function getSuggestedActivityType(tags) {
  const dominantTag = getDominantTag(tags);
  if (!dominantTag) return "";
  const map = readTagToActivityMap();
  return map[dominantTag] || "";
}

function updateTagToActivityMap(tags, activityType) {
  const dominantTag = getDominantTag(tags);
  const activity = (activityType || "").trim();
  if (!dominantTag || !activity) return;
  const map = readTagToActivityMap();
  if (map[dominantTag] === activity) return;
  map[dominantTag] = activity;
  writeTagToActivityMap(map);
}

export { getDominantTag, getSuggestedActivityType, parseTags, readTagToActivityMap, updateTagToActivityMap };
