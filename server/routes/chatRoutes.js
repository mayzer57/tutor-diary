const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/authMiddleware');
const multer = require('multer');

// 📂 Хранилище для файлов (в папке /uploads)
const upload = multer({ dest: 'uploads/' });

// 📩 Получить все сообщения между репетитором и учеником
router.get('/', async (req, res) => {
  const { student_id, tutor_id } = req.query;
  if (!student_id || !tutor_id) {
    return res.status(400).json({ error: 'Оба ID обязательны' });
  }

  try {
    const messages = await db.query(`
      SELECT * FROM messages 
      WHERE 
        (sender_type = 'student' AND sender_id = $1 AND receiver_id = $2)
        OR
        (sender_type = 'tutor' AND sender_id = $2 AND receiver_id = $1)
      ORDER BY created_at ASC
    `, [student_id, tutor_id]);

    res.json(messages.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения сообщений' });
  }
});

// ✉️ Отправка сообщения (с возможным файлом)
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { sender_type, sender_id, receiver_id, message } = req.body;
    const file_url = req.file ? `/uploads/${req.file.filename}` : null;

    await db.query(`
      INSERT INTO messages (sender_type, sender_id, receiver_id, message, file_url)
      VALUES ($1, $2, $3, $4, $5)
    `, [sender_type, sender_id, receiver_id, message || null, file_url]);

    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Ошибка отправки сообщения:', err.message);
    res.status(500).json({ error: 'Ошибка отправки сообщения' });
  }
});

// 📜 Список всех чатов репетитора
router.get('/chats', auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        s.id AS student_id,
        s.name,
        MAX(m.created_at) AS last_message_at
      FROM students s
      LEFT JOIN messages m ON 
        (m.sender_type = 'student' AND m.sender_id = s.id AND m.receiver_id = $1)
        OR 
        (m.sender_type = 'tutor' AND m.sender_id = $1 AND m.receiver_id = s.id)
      WHERE s.tutor_id = $1
      GROUP BY s.id, s.name
      ORDER BY last_message_at DESC NULLS LAST
    `, [req.tutor.id]);

    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка загрузки чатов:', err.message);
    res.status(500).json({ error: 'Ошибка загрузки чатов' });
  }
});

module.exports = router;
