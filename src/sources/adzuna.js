// src/sources/adzuna.js
// Adzuna API se jobs laata hai aur unhe repo ke standard "job" format me convert karta hai.
// Standard format: { title, company, location, url, date, description }
// (category yaha nahi lagti, wo jobSource.js me categorizeJob() se lagti hai)

async function fetchAdzunaJobs() {
  const { ADZUNA_APP_ID, ADZUNA_APP_KEY } = process.env;

  // Keys nahi hain to error mat do, bas is source ko skip kar do
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    console.warn("[ADZUNA] Keys missing, skipping Adzuna source");
    return [];
  }

  const params = new URLSearchParams({
    app_id: ADZUNA_APP_ID,
    app_key: ADZUNA_APP_KEY,
    what: process.env.JOB_KEYWORD || "developer",
    results_per_page: "20",
    sort_by: "date",
  });

  const response = await fetch(
    `https://api.adzuna.com/v1/api/jobs/in/search/1?${params}`
  );

  if (!response.ok) {
    throw new Error(`Adzuna API failed: HTTP ${response.status}`);
  }

  const data = await response.json();

  return (data.results || []).map((item) => ({
    title: item.title,
    company: item.company?.display_name,
    location: item.location?.display_name || "India",
    url: item.redirect_url,
    date: item.created,
    description: item.description || "",
  }));
}

module.exports = { fetchAdzunaJobs };
