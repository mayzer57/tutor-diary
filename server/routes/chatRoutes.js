const express = require('express');
const router = express.Router();
const db = require('../db');

// Получить все сообщения между репетитором и учеником
router.get('/', async (req, res) => {
  const { student_id, tutor_id } = req.query;
  if (!student_id || !tutor_id) return res.status(400).json({ error: 'Оба ID обязательны' });

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

// Отправка сообщения
router.post('/', async (req, res) => {
  const { sender_type, sender_id, receiver_id, message, file_url } = req.body;

  try {
    await db.query(`
      INSERT INTO messages (sender_type, sender_id, receiver_id, message, file_url)
      VALUES ($1, $2, $3, $4, $5)
    `, [sender_type, sender_id, receiver_id, message || null, file_url || null]);

    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка отправки сообщения' });
  }
});

module.exports = router;