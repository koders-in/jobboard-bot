function categorizeJob(title, description) {
  const text = `${title} ${description}`.toLowerCase();

  if (
    /developer|engineer|software|frontend|backend|full.?stack|javascript|react|node|python|java|flutter|devops|data|qa|testing|cyber|cloud/.test(
      text
    )
  ) {
    return "Technology";
  }

  if (
    /designer|ui|ux|graphic|figma|visual|product design/.test(text)
  ) {
    return "Design";
  }

  if (
    /content|writer|copywriter|editor|technical writer|blog/.test(text)
  ) {
    return "Content";
  }

  return "Other";
}

async function fetchJobs() {
 const sourceUrl = process.env.JOB_SOURCE_URL || "https://remoteok.com/api";
const response = await fetch(sourceUrl);

  if (!response.ok) {
    throw new Error("Failed to fetch jobs");
  }

  const jobs = await response.json();

  return jobs
    .filter((job) => job.position)
    .filter((job) => {
      const location = (job.location || "").toLowerCase();
      const tags = (job.tags || []).join(" ").toLowerCase();

      return location.includes("india") || tags.includes("india");
    })
    .map((job) => ({
      title: job.position,
      company: job.company,
      location: job.location || "India",
      url: job.url,
      description: job.description || "",
      category: categorizeJob(job.position, job.description || "")
    }))
    .filter((job) => job.category !== "Other");
}

module.exports = { fetchJobs, categorizeJob };
