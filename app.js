import express from 'express';
import uploadRouter from './routes/upload.js';
import uploadRoutes from './routes/upload.js';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/upload', uploadRouter);
app.use('/upload', uploadRoutes);
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
