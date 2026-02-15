const BUCKET_HOURS = 2;
const EN_DASH = "–";

function formatBucketLabel(startHour) {
  const start = `${startHour}`.padStart(2, "0");
  const end = `${startHour + BUCKET_HOURS}`.padStart(2, "0");
  return `${start}${EN_DASH}${end}`;
}

function getTimeBucket(dateObj) {
  const date = dateObj instanceof Date ? dateObj : new Date(dateObj);
  if (Number.isNaN(date.getTime())) return "";
  const hour = date.getHours();
  const startHour = Math.floor(hour / BUCKET_HOURS) * BUCKET_HOURS;
  return formatBucketLabel(startHour);
}

function runTimeBucketTests() {
  const cases = [
    { date: new Date(2024, 0, 1, 0, 5), expected: "00–02" },
    { date: new Date(2024, 0, 1, 1, 59), expected: "00–02" },
    { date: new Date(2024, 0, 1, 2, 0), expected: "02–04" },
    { date: new Date(2024, 0, 1, 7, 30), expected: "06–08" },
    { date: new Date(2024, 0, 1, 14, 0), expected: "14–16" },
    { date: new Date(2024, 0, 1, 23, 59), expected: "22–24" },
  ];

  const results = cases.map(({ date, expected }) => ({
    expected,
    actual: getTimeBucket(date),
  }));

  const allPass = results.every((r) => r.actual === r.expected);
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.log("Time bucket tests:", results, allPass ? "PASS" : "FAIL");
  }
  return allPass;
}

export { BUCKET_HOURS, formatBucketLabel, getTimeBucket, runTimeBucketTests };
