const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
require("dotenv").config();
const requiredEnvVars = [
  "DISCORD_TOKEN",
  "DISCORD_CHANNEL_ID",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
const { fetchJobs } = require("./jobSource");
const { formatJob } = require("./jobFormatter");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const POSTED_JOBS_FILE = "./postedJobs.json";

function logInfo(message) {
  console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
}

function logError(message, error) {
  console.error(
    `[ERROR] ${new Date().toISOString()} - ${message}`,
    error
  );
}

function loadPostedJobs() {
  try {
    if (!fs.existsSync(POSTED_JOBS_FILE)) {
      return [];
    }

    return JSON.parse(fs.readFileSync(POSTED_JOBS_FILE, "utf8"));
  } catch (error) {
    logError("Failed to load posted jobs", error);
    return [];
  }
}

function savePostedJobs(postedJobs) {
  try {
    fs.writeFileSync(
      POSTED_JOBS_FILE,
      JSON.stringify(postedJobs, null, 2)
    );
  } catch (error) {
    logError("Failed to save posted jobs", error);
  }
}

client.once("ready", async () => {
  logInfo(`Logged in as ${client.user.tag}`);

  try {
    const jobs = await fetchJobs();

    logInfo(`Fetched ${jobs.length} jobs`);

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
        logInfo(`Skipping duplicate job: ${job.title}`);
        continue;
      }

      try {
        await channel.send({ embeds: [formatJob(job)] });

        postedJobs.push(job.url);
        newJobsPosted++;

        logInfo(`Posted job: ${job.title}`);
      } catch (error) {
        logError(`Failed to post job: ${job.title}`, error);
      }
    }

    savePostedJobs(postedJobs);

    logInfo(`${newJobsPosted} new jobs posted successfully`);
  } catch (error) {
    logError("Failed to fetch or process jobs", error);
  }
});

client.on("error", (error) => {
  logError("Discord client error", error);
});

process.on("unhandledRejection", (error) => {
  logError("Unhandled promise rejection", error);
});

process.on("uncaughtException", (error) => {
  logError("Uncaught exception", error);
});

client.login(process.env.DISCORD_TOKEN).catch((error) => {
  logError("Failed to login to Discord", error);
});
