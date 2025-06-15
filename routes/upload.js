import express from 'express';
import multer from 'multer';
import { initDB } from '../db/database.js';
import fs from 'fs';
import path from 'path';


import uploadQueue from '../queues/uploadQueue.js';

const router = express.Router();
const uploadDir = './uploads';

// Make sure uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// ✅ POST /upload - Upload file with metadata
router.post('/', upload.single('file'), async (req, res) => {
  const db = await initDB();

  try {
    const file = req.file;
    const metadata = JSON.parse(req.body.metadata); // assuming it's a JSON string

    if (!file) {
      return res.status(400).json({ error: 'File is required.' });
    }

    const result = await db.run(`
      INSERT INTO uploads (filename, originalname, metadata, status, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [
      file.filename,
      file.originalname,
      JSON.stringify(metadata),
      'processing',
      new Date().toISOString()
    ]);

    const uploadId = result.lastID;

    res.status(201).json({
      upload_id: uploadId,
      status: 'processing'
    });
    await uploadQueue.add('processFile', {
  upload_id: uploadId,
  filePath: file.path
});

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed.' });
  }
});

// ✅ GET /status/:upload_id - Track status
router.get('/status/:upload_id', async (req, res) => {
  const db = await initDB();
  const { upload_id } = req.params;

  try {
    const upload = await db.get(`SELECT * FROM uploads WHERE id = ?`, [upload_id]);

    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    const progress = upload.status === 'processing' ? '70%' : '100%';

    res.status(200).json({
      upload_id: upload.id.toString(),
      filename: upload.originalname,
      metadata: JSON.parse(upload.metadata),
      status: upload.status,
      progress,
      error: null
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve upload status' });
  }
});

router.get('/files', async (req, res) => {
  const db = await initDB();

  try {
    const rows = await db.all(`
      SELECT id as upload_id, originalname as filename, status, created_at
      FROM uploads
      ORDER BY created_at DESC
    `);

    res.json(rows);

  } catch (err) {
    console.error('Error fetching files:', err);
    res.status(500).json({ error: 'Failed to retrieve files' });
  }
});







router.get('/files/:upload_id/download', async (req, res) => {
  const db = await initDB();
  const { upload_id } = req.params;

  try {
    const result = await db.get(`
      SELECT filename, originalname, status 
      FROM uploads 
      WHERE id = ?
    `, [upload_id]);

    if (!result) {
      return res.status(404).json({ error: 'File not found.' });
    }

    if (result.status !== 'done') {
      return res.status(400).json({ error: 'File is not ready for download yet.' });
    }

    const filePath = path.join('uploads', result.filename);
    return res.download(filePath, result.originalname);

  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: 'Could not download file.' });
  }
});


export default router;
