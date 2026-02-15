import { readActivityMetrics } from "./activity-metrics.js";

function getBucketRate(bucket) {
  if (!bucket) return 0;
  if (typeof bucket.onTimeRate === "number") return bucket.onTimeRate;
  const completionCount = bucket.completionCount || 0;
  return completionCount ? (bucket.onTimeCount || 0) / completionCount : 0;
}

function getBucketSamples(bucket) {
  if (!bucket) return 0;
  return bucket.sampleSize || bucket.completionCount || 0;
}

function getTotalCompleted(activityBuckets) {
  return Object.keys(activityBuckets || {}).reduce((sum, key) => {
    const bucket = activityBuckets[key];
    return sum + (bucket?.completionCount || 0);
  }, 0);
}

function selectSingleBestInsight(metrics, options = {}) {
  if (!metrics?.buckets) return null;

  const minBucketSamples = Number.isInteger(options.minBucketSamples) ? options.minBucketSamples : 1;
  const minTotalCompleted = Number.isInteger(options.minTotalCompleted) ? options.minTotalCompleted : 1;
  const minRateDiff = typeof options.minRateDiff === "number" ? options.minRateDiff : 0;

  const activityKeys = Object.keys(metrics.buckets);
  if (!activityKeys.length) return null;

  const activityRanked = activityKeys
    .map((activityType) => ({
      activityType,
      totalCompleted: getTotalCompleted(metrics.buckets[activityType]),
    }))
    .filter((entry) => entry.totalCompleted >= minTotalCompleted)
    .sort((a, b) => b.totalCompleted - a.totalCompleted || a.activityType.localeCompare(b.activityType));

  if (!activityRanked.length) return null;

  const { activityType, totalCompleted } = activityRanked[0];
  const bucketEntries = Object.keys(metrics.buckets[activityType] || {})
    .map((bucketKey) => {
      const bucket = metrics.buckets[activityType][bucketKey];
      const samples = getBucketSamples(bucket);
      if (samples < minBucketSamples) return null;
      return {
        bucketKey,
        rate: getBucketRate(bucket),
        samples,
      };
    })
    .filter(Boolean);

  if (bucketEntries.length < 2) return null;

  const best = [...bucketEntries].sort((a, b) => b.rate - a.rate || b.samples - a.samples)[0];
  const worst = [...bucketEntries].sort((a, b) => a.rate - b.rate || b.samples - a.samples)[0];

  if (!best || !worst) return null;
  if (best.rate - worst.rate < minRateDiff) return null;

  return {
    activityType,
    bestBucket: best.bucketKey,
    bestRate: best.rate,
    bestN: best.samples,
    worstBucket: worst.bucketKey,
    worstRate: worst.rate,
    worstN: worst.samples,
    totalCompleted,
  };
}

function selectSingleBestInsightFromStorage(options = {}) {
  const metrics = readActivityMetrics();
  if (!metrics) return null;
  return selectSingleBestInsight(metrics, options);
}

export { selectSingleBestInsight, selectSingleBestInsightFromStorage };
