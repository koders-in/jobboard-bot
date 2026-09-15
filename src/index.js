const { Client, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

const { fetchJobs } = require("./jobSource");
const { formatJob } = require("./jobFormatter");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    const jobs = await fetchJobs();

    console.log(`Fetched ${jobs.length} jobs`);

    const channel = await client.channels.fetch(
      process.env.DISCORD_CHANNEL_ID
    );

    if (!channel) {
      throw new Error("Discord channel not found");
    }

    for (const job of jobs.slice(0, 5)) {
      await channel.send(formatJob(job));
    }

    console.log("Jobs posted successfully");
  } catch (error) {
    console.error("Failed to fetch or post jobs:", error);
  }
});

client.login(process.env.DISCORD_TOKEN);
