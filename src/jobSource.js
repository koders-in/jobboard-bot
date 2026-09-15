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
      description: job.description || ""
    }));
}

module.exports = { fetchJobs };
