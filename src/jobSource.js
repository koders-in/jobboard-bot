function categorizeJob(title, description) {
  const text = `${title} ${description}`.toLowerCase();

  if (
    /developer|engineer|software|frontend|backend|full.?stack|javascript|react|node|python|java|flutter|devops|data|qa|tester|technical/.test(
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
  const response = await fetch("https://remoteok.com/api");

  if (!response.ok) {
    throw new Error("Failed to fetch jobs");
  }

  const jobs = await response.json();

  return jobs
    .filter((job) => job.position)
    .map((job) => ({
      title: job.position,
      company: job.company,
      location: job.location || "Remote",
      url: job.url,
      description: job.description || "",
      category: categorizeJob(job.position, job.description || "")
    }))
    .filter((job) => job.category !== "Other");
}

module.exports = { fetchJobs };
