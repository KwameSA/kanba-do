import { initCommon } from "./page-common.js";
import { readOrRecomputeActivityMetrics } from "./activity-metrics.js";
import { selectSingleBestInsight } from "./rhythm-insight.js";
import { ensureSimulatedDatasetCurrent } from "./simulation.js";

const THRESHOLDS = {
  minBucketSamples: 2,
  minTotalCompleted: 5,
  minRateDiff: 0.25,
};

let rhythmChart = null;
let latestInsight = null;
const SIMULATION_AFFECTED_KEYS = new Set(["kanbaTasks", "kanbaSimulated", "kanbaSimVersion", "kanbaActivityMetrics"]);

function getBucketStart(label) {
  const match = `${label}`.match(/^\d{1,2}/);
  return match ? Number(match[0]) : 0;
}

function getMostCompletedActivity(metrics) {
  if (!metrics?.buckets) return "";
  const entries = Object.keys(metrics.buckets).map((activityType) => {
    const totalCompleted = Object.values(metrics.buckets[activityType] || {}).reduce(
      (sum, bucket) => sum + (bucket?.completionCount || 0),
      0
    );
    return { activityType, totalCompleted };
  });
  entries.sort((a, b) => b.totalCompleted - a.totalCompleted || a.activityType.localeCompare(b.activityType));
  return entries[0]?.activityType || "";
}

function buildChartData(metrics, activityType) {
  const activityBuckets = metrics?.buckets?.[activityType] || {};
  const buckets = Object.keys(activityBuckets)
    .map((bucketKey) => {
      const bucket = activityBuckets[bucketKey];
      return {
        bucketKey,
        rate: bucket?.onTimeRate || 0,
        sampleSize: bucket?.sampleSize || bucket?.completionCount || 0,
      };
    })
    .filter((bucket) => bucket.sampleSize > 0)
    .sort((a, b) => getBucketStart(a.bucketKey) - getBucketStart(b.bucketKey));

  return {
    labels: buckets.map((b) => b.bucketKey),
    rates: buckets.map((b) => Math.round(b.rate * 100)),
    samples: buckets.map((b) => b.sampleSize),
  };
}

function destroyChart() {
  if (rhythmChart) {
    rhythmChart.destroy();
    rhythmChart = null;
  }
}

function renderChart(chartData) {
  const canvas = document.getElementById("rhythmChart");
  if (!canvas || !window.Chart) return;

  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#5b8def";

  destroyChart();
  rhythmChart = new window.Chart(canvas, {
    type: "bar",
    data: {
      labels: chartData.labels,
      datasets: [
        {
          label: "On-time rate",
          data: chartData.rates,
          backgroundColor: accent,
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: (value) => `${value}%`,
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const idx = context.dataIndex;
              const n = chartData.samples[idx] || 0;
              const pct = Math.round(context.parsed.y);
              return `${n} tasks • ${pct}% on time`;
            },
          },
        },
        legend: {
          display: false,
        },
      },
    },
  });
}

function setVisibility(hasInsight) {
  const empty = document.getElementById("rhythm-empty-text");
  const chartWrap = document.getElementById("rhythm-chart-wrap");
  const actions = document.getElementById("rhythm-actions");
  const insightText = document.getElementById("rhythm-insight-text");

  if (hasInsight) {
    empty?.classList.add("hidden");
    chartWrap?.classList.remove("hidden");
    actions?.classList.remove("hidden");
    insightText?.classList.remove("hidden");
  } else {
    empty?.classList.remove("hidden");
    chartWrap?.classList.add("hidden");
    actions?.classList.add("hidden");
    insightText?.classList.add("hidden");
    destroyChart();
  }
}

function updateInsightText(insight) {
  const el = document.getElementById("rhythm-insight-text");
  if (!el) return;
  el.textContent = `I've noticed that your ${insight.activityType} tasks are completed most reliably between ${insight.bestBucket}, and least reliably between ${insight.worstBucket}.`;
}

function updateEmptyState(activityType) {
  const el = document.getElementById("rhythm-empty-text");
  if (!el) return;
  const label = activityType || "these";
  el.textContent = `I'm still learning your rhythm. Complete a few more ${label} tasks to see patterns.`;
}

function readExperiments() {
  try {
    const raw = localStorage.getItem("rhythmExperiments");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function appendExperiment(insight) {
  if (!insight) return;
  const experiments = readExperiments();
  experiments.push({
    activityType: insight.activityType,
    recommendedBucket: insight.bestBucket,
    startedAt: new Date().toISOString(),
  });
  localStorage.setItem("rhythmExperiments", JSON.stringify(experiments));
}

function bindActions() {
  const tryBtn = document.getElementById("rhythm-try-btn");
  const notNowBtn = document.getElementById("rhythm-not-now-btn");

  tryBtn?.addEventListener("click", () => {
    appendExperiment(latestInsight);
  });

  notNowBtn?.addEventListener("click", () => {
    // Intentionally no-op for now.
  });
}

function renderRhythm() {
  const metrics = readOrRecomputeActivityMetrics();
  const insight = selectSingleBestInsight(metrics, THRESHOLDS);
  latestInsight = insight;

  if (!insight) {
    const activityType = getMostCompletedActivity(metrics);
    updateEmptyState(activityType);
    setVisibility(false);
    const chartData = activityType ? buildChartData(metrics, activityType) : null;
    if (chartData?.labels?.length) {
      renderChart(chartData);
      document.getElementById("rhythm-chart-wrap")?.classList.remove("hidden");
    }
    return;
  }

  updateInsightText(insight);
  updateEmptyState("");
  setVisibility(true);

  const chartData = buildChartData(metrics, insight.activityType);
  renderChart(chartData);
}

function refreshRhythm() {
  ensureSimulatedDatasetCurrent();
  renderRhythm();
}

window.addEventListener("DOMContentLoaded", () => {
  initCommon();
  bindActions();
  refreshRhythm();
});

window.addEventListener("kanba:tasks-updated", renderRhythm);
window.addEventListener("pageshow", refreshRhythm);
window.addEventListener("focus", refreshRhythm);
window.addEventListener("storage", (event) => {
  if (!event.key || SIMULATION_AFFECTED_KEYS.has(event.key)) {
    refreshRhythm();
  }
});
