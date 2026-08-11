import { Queue } from "bullmq";
import { queueConnection } from "./redisConnection";

export const weeklyDigestQueue = new Queue("WeeklyDigestQueue", {
  connection: queueConnection,
  defaultJobOptions: {
    removeOnComplete: { count: 20 },
    removeOnFail: { count: 20 },
  },
});
