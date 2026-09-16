const { EmbedBuilder } = require("discord.js");

function formatJob(job) {
  const embed = new EmbedBuilder()
    .setTitle(`💼 ${job.title}`)
    .addFields(
      {
        name: "🏢 Company",
        value: job.company || "Not specified",
        inline: true,
      },
      {
        name: "📍 Location",
        value: job.location || "Remote",
        inline: true,
      },
      {
        name: "📂 Category",
        value: job.category || "Other",
        inline: true,
      },
      {
        name: "📝 Description",
        value: (job.description || "No description provided.").slice(0, 1024),
      }
    )
    .setURL(job.url)
    .setFooter({ text: "FlashForge Job Board" })
    .setTimestamp();

  return embed;
}

module.exports = { formatJob };
