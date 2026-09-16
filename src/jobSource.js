async function fetchJobs() {
  const response = await fetch("https://remoteok.com/api");

  if (!response.ok) {
    throw new Error("Failed to fetch jobs");
  }

  const jobs = await response.json();

  return jobs
    .filter((job) => job.position)
    .filter((job) => {
      const location = (job.location || "").toLowerCase();
      return location.includes("india");
    })
    .map((job) => ({
      title: job.position,
      company: job.company,
      location: job.location,
      url: job.url,
      description: job.description || "",
      category: categorizeJob(job.position, job.description || "")
    }))
    .filter((job) => job.category !== "Other");
}
