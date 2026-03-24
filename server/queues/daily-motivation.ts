import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { runDailyMotivationCycle } from "../services/daily-motivation";

type DailyMotivationState = {
  connection?: IORedis;
  queue?: Queue;
  worker?: Worker;
  initialized: boolean;
};

const globalState = globalThis as unknown as {
  __dailyMotivationState?: DailyMotivationState;
};

const state: DailyMotivationState =
  globalState.__dailyMotivationState || { initialized: false };
globalState.__dailyMotivationState = state;

const QUEUE_NAME = "daily-motivation";

function getConnection() {
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (!state.connection) {
    state.connection = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
  }
  return state.connection;
}

function getQueue() {
  const connection = getConnection();
  if (!connection) return null;

  if (!state.queue) {
    state.queue = new Queue(QUEUE_NAME, { connection });
  }

  return state.queue;
}

export async function initializeDailyMotivationQueue() {
  if (state.initialized) {
    return;
  }

  const queue = getQueue();
  const connection = getConnection();
  if (!queue || !connection) {
    console.warn(
      "[daily-motivation] REDIS_URL is not configured. Queue is disabled."
    );
    state.initialized = true;
    return;
  }

  state.worker = new Worker(
    QUEUE_NAME,
    async () => {
      const summary = await runDailyMotivationCycle();
      return summary;
    },
    { connection }
  );

  state.worker.on("completed", (job, result) => {
    console.log(`[daily-motivation] completed job ${job.id}`, result);
  });

  state.worker.on("failed", (job, error) => {
    console.error(`[daily-motivation] failed job ${job?.id ?? "unknown"}`, error);
  });

  // Run hourly. The processor sends only when local hour is 08:00 for each user.
  const repeatPattern = process.env.DAILY_MOTIVATION_CRON || "0 * * * *";
  await queue.add(
    "dispatch-daily-motivation",
    { trigger: "schedule" },
    {
      jobId: "dispatch-daily-motivation-schedule",
      repeat: { pattern: repeatPattern },
      removeOnComplete: 24,
      removeOnFail: 100,
    }
  );

  state.initialized = true;
}

export async function enqueueDailyMotivationNow() {
  const queue = getQueue();
  if (!queue) {
    throw new Error("Daily motivation queue is unavailable");
  }

  const job = await queue.add(
    "dispatch-daily-motivation",
    { trigger: "manual" },
    {
      removeOnComplete: 50,
      removeOnFail: 100,
    }
  );

  return job.id;
}
