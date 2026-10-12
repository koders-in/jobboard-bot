const {
  Client,
  GatewayIntentBits
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const { fetchJobs } = require("./jobSource");
const { formatJob } = require("./jobFormatter");

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

const CHECK_INTERVAL = 30 * 60 * 1000;
const POSTED_JOBS_FILE = path.join(__dirname, "..", "postedJobs.json");

if (!TOKEN || !CHANNEL_ID) {
  console.error(
    "Missing DISCORD_TOKEN or DISCORD_CHANNEL_ID environment variable."
  );
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

let isChecking = false;

function loadPostedJobs() {
  try {
    if (!fs.existsSync(POSTED_JOBS_FILE)) {
      return [];
    }

    const data = JSON.parse(
      fs.readFileSync(POSTED_JOBS_FILE, "utf8")
    );

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("[JOBS] Could not read postedJobs.json:", error.message);
    return [];
  }
}

function savePostedJobs(jobs) {
  try {
    fs.writeFileSync(
      POSTED_JOBS_FILE,
      JSON.stringify(jobs, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error("[JOBS] Could not save postedJobs.json:", error.message);
  }
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function checkAndPostJobs() {
  if (isChecking) {
    console.log("[JOBS] Previous check is still running. Skipping this run.");
    return;
  }

  isChecking = true;

  try {
    console.log("[JOBS] Checking job sources...");

    const jobs = await fetchJobs();

    console.log(`[JOBS] ${jobs.length} eligible jobs found.`);

    const channel = await client.channels.fetch(CHANNEL_ID);

    if (!channel || !channel.isTextBased()) {
      throw new Error("The configured Discord channel is unavailable.");
    }

    const postedJobs = loadPostedJobs();
    const postedSet = new Set(postedJobs);

    let newJobsPosted = 0;

    for (const job of jobs) {
      if (postedSet.has(job.url)) {
        console.log(`[JOBS] Duplicate skipped: ${job.title}`);
        continue;
      }

      try {
        await channel.send({
          embeds: [formatJob(job)]
        });

        postedSet.add(job.url);
        postedJobs.push(job.url);
        newJobsPosted++;

        savePostedJobs(postedJobs);

        console.log(`[JOBS] Posted: ${job.title}`);

        // Small delay to reduce the chance of hitting Discord rate limits.
        await wait(1200);
      } catch (error) {
        console.error(
          `[JOBS] Could not post "${job.title}":`,
          error.message
        );
      }
    }

    console.log(`[JOBS] Check complete. ${newJobsPosted} new jobs posted.`);
  } catch (error) {
    console.error("[JOBS] Job check failed:", error.message);
  } finally {
    isChecking = false;
  }
}

client.once("ready", async () => {
  console.log(`[BOT] Logged in as ${client.user.tag}`);

  await checkAndPostJobs();

  setInterval(() => {
    checkAndPostJobs();
  }, CHECK_INTERVAL);

  console.log("[BOT] Automatic job checks are scheduled every 30 minutes.");
});

client.on("error", (error) => {
  console.error("[BOT] Discord client error:", error.message);
});

process.on("unhandledRejection", (error) => {
  console.error("[BOT] Unhandled rejection:", error);
});

client.login(TOKEN);
