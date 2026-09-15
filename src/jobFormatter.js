function formatJob(job) {
  return `
💼 **${job.title}**

🏢 **Company:** ${job.company}
📍 **Location:** ${job.location || "Remote"}
🔗 **Apply:** ${job.url}

📝 **Description:** ${job.description || "No description provided."}
`;
}

module.exports = { formatJob };
