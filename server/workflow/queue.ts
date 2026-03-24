import { Queue } from "bullmq";
import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
export const workflowConnection = new IORedis(redisUrl);

export const workflowQueue = new Queue("workflow-executions", {
  connection: workflowConnection,
});
