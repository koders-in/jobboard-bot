const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
require("dotenv").config();

const { fetchJobs } = require("./jobSource");
const { formatJob } = require("./jobFormatter");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const POSTED_JOBS_FILE = "./postedJobs.json";

function loadPostedJobs() {
  if (!fs.existsSync(POSTED_JOBS_FILE)) {
    return [];
  }

  return JSON.parse(fs.readFileSync(POSTED_JOBS_FILE, "utf8"));
}

function savePostedJobs(postedJobs) {
  fs.writeFileSync(
    POSTED_JOBS_FILE,
    JSON.stringify(postedJobs, null, 2)
  );
}

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

    const postedJobs = loadPostedJobs();
    let newJobsPosted = 0;

    for (const job of jobs.slice(0, 5)) {
      if (postedJobs.includes(job.url)) {
        console.log(`Skipping duplicate job: ${job.title}`);
        continue;
      }

      await channel.send(formatJob(job));

      postedJobs.push(job.url);
      newJobsPosted++;
    }

    savePostedJobs(postedJobs);

    console.log(`${newJobsPosted} new jobs posted successfully`);
  } catch (error) {
    console.error("Failed to fetch or post jobs:", error);
  }
});

client.login(process.env.DISCORD_TOKEN);
