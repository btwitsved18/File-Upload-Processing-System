import { Queue } from 'bullmq';
import { connection } from './connection.js';

const uploadQueue = new Queue('uploadQueue', {
  connection,
  defaultJobOptions: {
    attempts: 3,               // max 3 retries
    backoff: {
      type: 'exponential',
      delay: 5000              // initial delay 5s
    },
    removeOnComplete: true,
    removeOnFail: false        // keep failed jobs for DLQ
  }
});

export default uploadQueue;
