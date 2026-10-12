const { EmbedBuilder } = require("discord.js");

function formatJob(job) {
  const description = String(
    job.description || "No description provided."
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1000);

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle(`💼 ${job.title}`.slice(0, 256))
    .setURL(job.url)
    .setDescription(description)
    .addFields(
      {
        name: "🏢 Company",
        value: String(job.company || "Not specified").slice(0, 1024),
        inline: true
      },
      {
        name: "📍 Location",
        value: String(job.location || "Not specified").slice(0, 1024),
        inline: true
      },
      {
        name: "📂 Category",
        value: String(job.category || "Other").slice(0, 1024),
        inline: true
      },
      {
        name: "🔗 Source",
        value: String(job.source || "Job Board").slice(0, 1024),
        inline: true
      }
    )
    .setFooter({ text: "FlashForge Job Board • Check the original listing" })
    .setTimestamp();

  return embed;
}

module.exports = { formatJob };
