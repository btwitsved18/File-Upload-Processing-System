import { Worker, QueueEvents } from 'bullmq';
import { connection } from '../queues/connection.js';
import { initDB } from '../db/database.js';
import fs from 'fs';
import crypto from 'crypto';

const uploadWorker = new Worker('uploadQueue', async job => {
  const db = await initDB();
  const { upload_id, filePath } = job.data;

  try {
    await db.run(`UPDATE uploads SET status = ?, progress = ? WHERE id = ?`, ['processing', '0%', upload_id]);

    // Simulate progress
    for (let i = 1; i <= 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10s * 3 = 30s
      await db.run(`UPDATE uploads SET progress = ? WHERE id = ?`, [`${i * 30}%`, upload_id]);
    }

    // Simulate checksum
    const fileBuffer = fs.readFileSync(filePath);
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    await db.run(`UPDATE uploads SET status = ?, progress = ?, error = ? WHERE id = ?`, [
      'done', '100%', null, upload_id
    ]);

    console.log(`✅ Upload ID ${upload_id} processed. Checksum: ${checksum}`);
  } catch (err) {
    console.error(`❌ Failed to process upload ID ${upload_id}`, err);
    throw err; // triggers retry
  }
}, { connection });

// DLQ Logging (Failed Jobs)
const queueEvents = new QueueEvents('uploadQueue', { connection });

queueEvents.on('failed', async ({ jobId, failedReason }) => {
  const db = await initDB();
  const job = await uploadWorker.getJob(jobId);

  if (job && job.attemptsMade >= 3) {
    const { upload_id } = job.data;
    await db.run(`UPDATE uploads SET status = ?, error = ? WHERE id = ?`, [
      'failed',
      failedReason,
      upload_id
    ]);
    console.log(`❌ Moved to DLQ: Upload ID ${upload_id} failed permanently.`);
  }
});
