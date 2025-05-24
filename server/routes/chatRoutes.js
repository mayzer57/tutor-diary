const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/authMiddleware');
const multer = require('multer');

//  Хранилище для файлов (в папке /uploads)
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });


//  Получить все сообщения между репетитором и учеником
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

// Отправка сообщения (с возможным файлом)
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

//  Список всех чатов репетитора
router.get('/chats', auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        s.id AS student_id,
        s.name,
        MAX(m.created_at) AS last_message_at,
        COUNT(CASE 
          WHEN m.sender_type = 'student' AND m.receiver_id = $1 AND m.read = FALSE 
          THEN 1 END
        ) AS unread_count
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
router.post('/mark-as-read', auth, async (req, res) => {
  const { student_id, tutor_id } = req.body;

  const isTutor = !!req.tutor;
  const userType = isTutor ? 'tutor' : 'student';
  const opponentType = userType === 'student' ? 'tutor' : 'student';
  const selfId = isTutor ? req.tutor.id : req.student.id;

  try {
    await db.query(`
      UPDATE messages 
      SET read = TRUE
      WHERE sender_type = $1
        AND sender_id = $2
        AND receiver_id = $3
    `, [opponentType, userType === 'student' ? tutor_id : student_id, selfId]);

    res.json({ success: true });
  } catch (err) {
    console.error('Ошибка пометки как прочитано:', err.message);
    res.status(500).json({ error: 'Ошибка пометки' });
  }
});

//  Получить кол-во непрочитанных сообщений
router.get('/unread-count', auth, async (req, res) => {
  const { id } = req.tutor || req.student;
  const userType = req.tutor ? 'tutor' : 'student';

  try {
    const { rows } = await db.query(`
      SELECT COUNT(*) FROM messages
      WHERE receiver_id = $1 AND sender_type != $2 AND read = FALSE
    `, [id, userType]);

    res.json({ count: parseInt(rows[0].count) });
  } catch (err) {
    console.error('Ошибка при получении количества непрочитанных:', err.message);
    res.status(500).json({ error: 'Ошибка подсчета непрочитанных' });
  }
});


module.exports = router;
