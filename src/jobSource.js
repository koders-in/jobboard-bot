const INDIA_KEYWORDS = [
  "india",
  "indian",
  "new delhi",
  "bengaluru",
  "bangalore",
  "hyderabad",
  "pune",
  "mumbai",
  "chennai",
  "gurugram",
  "gurgaon",
  "noida",
  "kolkata",
  "jaipur",
  "remote - india",
  "remote india"
];

function cleanText(value = "") {
  return String(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function categorizeJob(title = "", description = "") {
  const text = `${title} ${description}`.toLowerCase();

  if (
    /developer|engineer|software|frontend|backend|full.?stack|javascript|react|node|python|java|flutter|devops|data|qa|testing|cyber|cloud|it support/.test(text)
  ) {
    return "Technology";
  }

  if (/designer|ui|ux|graphic|figma|visual|product design/.test(text)) {
    return "Design";
  }

  if (/content|writer|copywriter|editor|technical writer|blog/.test(text)) {
    return "Content";
  }

  return "Other";
}

function isIndiaRelevant(job) {
  const text = [
    job.location,
    job.title,
    job.description,
    job.company
  ]
    .join(" ")
    .toLowerCase();

  return INDIA_KEYWORDS.some((keyword) => text.includes(keyword));
}

function isJobExpired(job) {
  if (!job.date) return false;

  const timestamp = new Date(job.date).getTime();

  if (!Number.isFinite(timestamp)) return false;

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  return timestamp < thirtyDaysAgo;
}

function normalizeJob(job) {
  const title = cleanText(job.title);
  const description = cleanText(job.description || "");
  const company = cleanText(job.company || "Not specified");
  const location = cleanText(job.location || "Not specified");
  const url = String(job.url || "").trim();

  if (!title || !url || !/^https?:\/\//i.test(url)) {
    return null;
  }

  return {
    title,
    company,
    location,
    url,
    date: job.date || null,
    description: description || "No description provided.",
    category: categorizeJob(title, description),
    source: job.source || "Job Board"
  };
}

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "User-Agent": "FlashForgeJobBoard/1.0",
      Accept: "application/json",
      ...(options.headers || {})
    },
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

async function fetchRemoteOK() {
  const data = await fetchJSON("https://remoteok.com/api");

  return data
    .filter((item) => item.position && item.url)
    .map((item) => ({
      title: item.position,
      company: item.company,
      location: item.location || "",
      url: item.url,
      date: item.date,
      description: item.description,
      source: "RemoteOK"
    }));
}

async function fetchJobicy() {
  const data = await fetchJSON(
    "https://jobicy.com/api/v2/remote-jobs?count=100"
  );

  return (data.jobs || []).map((item) => ({
    title: item.jobTitle,
    company: item.companyName,
    location: item.jobGeo || "",
    url: item.url,
    date: item.pubDate,
    description: item.jobExcerpt || item.jobDescription || "",
    source: "Jobicy"
  }));
}

async function fetchArbeitnow() {
  const data = await fetchJSON(
    "https://www.arbeitnow.com/api/job-board-api"
  );

  return (data.data || []).map((item) => ({
    title: item.title,
    company: item.company_name,
    location: item.location || "",
    url: item.url,
    date: item.created_at,
    description: item.description || "",
    source: "Arbeitnow"
  }));
}

async function fetchWeWorkRemotely() {
  const response = await fetch(
    "https://weworkremotely.com/remote-jobs.rss",
    {
      headers: {
        "User-Agent": "FlashForgeJobBoard/1.0",
        Accept: "application/rss+xml, application/xml, text/xml"
      },
      signal: AbortSignal.timeout(15000)
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const xml = await response.text();
  const items = xml.match(/<item\b[^>]*>[\s\S]*?<\/item>/gi) || [];

  return items.map((item) => {
    function getTag(tag) {
      const match = item.match(
        new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i")
      );

      if (!match) return "";

      return cleanText(
        match[1]
          .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
          .replace(/<[^>]*>/g, " ")
      );
    }

    const title = getTag("title");
    const url = getTag("link");
    const description = getTag("description");

    const parts = title.split(":");

    return {
      title: parts.length > 1 ? parts.slice(1).join(":").trim() : title,
      company: parts.length > 1 ? parts[0].trim() : "Not specified",
      location: "",
      url,
      date: getTag("pubDate"),
      description,
      source: "We Work Remotely"
    };
  });
}

async function fetchAdzuna() {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) return [];

  const url =
    `https://api.adzuna.com/v1/api/jobs/in/search/1` +
    `?app_id=${encodeURIComponent(appId)}` +
    `&app_key=${encodeURIComponent(appKey)}` +
    `&results_per_page=50&what=developer`;

  const data = await fetchJSON(url);

  return (data.results || []).map((item) => ({
    title: item.title,
    company: item.company?.display_name,
    location: item.location?.display_name || "India",
    url: item.redirect_url,
    date: item.created,
    description: item.description,
    source: "Adzuna"
  }));
}

async function fetchJooble() {
  const apiKey = process.env.JOOBLE_API_KEY;

  if (!apiKey) return [];

  const response = await fetch(
    `https://jooble.org/api/${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "FlashForgeJobBoard/1.0"
      },
      body: JSON.stringify({
        keywords: process.env.JOB_KEYWORD || "developer",
        location: "India"
      }),
      signal: AbortSignal.timeout(15000)
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();

  return (data.jobs || []).map((item) => ({
    title: item.title,
    company: item.company,
    location: item.location || "India",
    url: item.link,
    date: item.updated,
    description: item.snippet,
    source: "Jooble"
  }));
}

async function runSource(name, fetchFunction) {
  try {
    const jobs = await fetchFunction();
    console.log(`[JOBS] ${name}: fetched ${jobs.length} jobs`);
    return jobs;
  } catch (error) {
    console.error(`[JOBS] ${name} failed: ${error.message}`);
    return [];
  }
}

async function fetchJobs() {
  const sources = [
    ["RemoteOK", fetchRemoteOK],
    ["Jobicy", fetchJobicy],
    ["Arbeitnow", fetchArbeitnow],
    ["We Work Remotely", fetchWeWorkRemotely],
    ["Adzuna", fetchAdzuna],
    ["Jooble", fetchJooble]
  ];

  const results = await Promise.all(
    sources.map(([name, fetchFunction]) =>
      runSource(name, fetchFunction)
    )
  );

  const uniqueJobs = new Map();

  for (const list of results) {
    for (const rawJob of list) {
      const job = normalizeJob(rawJob);

      if (!job) continue;
      if (job.category === "Other") continue;
      if (!isIndiaRelevant(job)) continue;
      if (isJobExpired(job)) continue;

      const keyword = process.env.JOB_KEYWORD;

      if (
        keyword &&
        !`${job.title} ${job.description} ${job.company}`
          .toLowerCase()
          .includes(keyword.toLowerCase())
      ) {
        continue;
      }

      const key = job.url.replace(/\/+$/, "").toLowerCase();

      if (!uniqueJobs.has(key)) {
        uniqueJobs.set(key, job);
      }
    }
  }

  return [...uniqueJobs.values()].sort(
    (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
  );
}

module.exports = {
  fetchJobs,
  categorizeJob
};
