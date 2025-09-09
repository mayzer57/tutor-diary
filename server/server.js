const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// ✅ CORS конфиг
const allowedOrigins = [
  'https://mayzer57-tutor-diary-7435.twc1.net',
  'https://mayzer57-tutor-diary-60d0.twc1.net',
  'https://mayzer57-tutor-diary-da70.twc1.net',
  'https://mayzer57-tutor-diary-4d45.twc1.net',
  'https://mayzer57-tutor-diary-2e5c.twc1.net',
  'https://mayzer57-tutor-diary-c3a0.twc1.net',
  'https://mayzer57-tutor-diary-744f.twc1.net',
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

// JSON + кэш
app.use(express.json());
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// DB
const pool = require('./db');
pool.connect((err) => {
  if (err) console.error('Database connection error:', err.stack);
  else console.log('Database connected');
});

// Routes
const authRoutes = require('./routes/authRoutes');
const tutorRoutes = require('./routes/tutorRoutes');
const studentRoutes = require('./routes/studentRoutes');
const userRoutes = require('./routes/userRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const chatRoutes = require('./routes/chatRoutes');
app.use('/api/chat', chatRoutes);
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/lessons', lessonRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/auth', authRoutes);
const financeRoutes = require('./routes/financeRoutes');
app.use('/api/finance', financeRoutes);
app.use((err, req, res, next) => {
  console.error('Global error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });
  res.status(500).json({ error: 'Internal Server Error' });
});

app.use(express.static(path.join(__dirname, '..', 'client', 'build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});

const cron = require('node-cron');
cron.schedule('*/30 * * * *', async () => {
  console.log('[CRON] Проверка уроков на ближайшие 3 часа');
  const now = new Date();
  const in3Hours = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const nowStr = now.toISOString().split('T')[0];
  const hour = in3Hours.getHours();

  try {
    const res = await pool.query(`
      SELECT l.id, l.date, l.time, l.student_id, s.name AS student
      FROM lessons l
      JOIN students s ON s.id = l.student_id
      WHERE l.date = $1
        AND EXTRACT(HOUR FROM l.time) = $2
    `, [nowStr, hour]);

    for (const lesson of res.rows) {
      await pool.query(
        'INSERT INTO notifications (student_id, message) VALUES ($1, $2)',
        [lesson.student_id, '🕒 Напоминание: через 3 часа начнётся занятие!']
      );
    }
  } catch (error) {
    console.error('Cron error:', error);
  }
});
