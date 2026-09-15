function formatJob(job) {
  const description = (job.description || "No description provided.")
    .replace(/<[^>]*>/g, "")
    .slice(0, 1500);

  return `
💼 **${job.title}**

🏢 **Company:** ${job.company}
📍 **Location:** ${job.location || "Remote"}
🔗 **Apply:** ${job.url}

📝 **Description:** ${description}
`;
}

module.exports = { formatJob };
