const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/notifications?student_id=1
router.get('/', async (req, res) => {
  const { student_id } = req.query;
  if (!student_id) return res.status(400).json({ error: 'student_id обязателен' });

  try {
    const result = await db.query(
      'SELECT * FROM notifications WHERE student_id = $1 ORDER BY created_at DESC',
      [student_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка получения уведомлений:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/notifications
router.post('/', async (req, res) => {
  const { student_id, message } = req.body;
  if (!student_id || !message) {
    return res.status(400).json({ error: 'student_id и message обязательны' });
  }

  try {
    await db.query(
      'INSERT INTO notifications (student_id, message) VALUES ($1, $2)',
      [student_id, message]
    );
    res.status(201).json({ message: 'Уведомление создано' });
  } catch (err) {
    console.error('Ошибка добавления уведомления:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
// Удаление всех уведомлений студента
router.delete('/clear', async (req, res) => {
  const { student_id } = req.query;
  if (!student_id) return res.status(400).json({ error: 'student_id обязателен' });

  try {
    await db.query('DELETE FROM notifications WHERE student_id = $1', [student_id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Ошибка удаления уведомлений:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
router.patch('/:id/read', async (req, res) => {
  const notifId = req.params.id;

  try {
    await db.query('UPDATE notifications SET read = TRUE WHERE id = $1', [notifId]);
    res.send({ success: true });
  } catch (err) {
    console.error('Ошибка при обновлении уведомления:', err);
    res.status(500).json({ error: 'Ошибка обновления уведомления' });
  }
});
router.delete('/:id', async (req, res) => {
  const notifId = req.params.id;

  try {
    await db.query('DELETE FROM notifications WHERE id = $1', [notifId]);
    res.send({ success: true });
  } catch (err) {
    console.error('Ошибка удаления уведомления:', err);
    res.status(500).json({ error: 'Ошибка удаления уведомления' });
  }
});

module.exports = router;
