// 📁 server/routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const auth = require('../middleware/authMiddleware');

// ✅ Получение всех учеников (только для репетитора)
router.get('/', auth, async (req, res) => {
  if (!req.tutor) {
    return res.status(403).json({ error: 'Нет доступа: только для репетитора' });
  }

  try {
    const result = await pool.query(`
      SELECT id, name, subject, login FROM students WHERE tutor_id = $1
    `, [req.tutor.id]);

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Ошибка загрузки учеников:', err.message);
    res.status(500).json({ error: 'Ошибка загрузки учеников' });
  }
});

// ✅ Добавление ученика
router.post('/', auth, [
  check('name').notEmpty(),
  check('subject').notEmpty(),
  check('login').notEmpty(),
  check('password').isLength({ min: 6 })
], async (req, res) => {
  if (!req.tutor) return res.status(403).json({ error: 'Нет доступа' });

  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, subject, login, password } = req.body;

  try {
    const existing = await pool.query('SELECT id FROM students WHERE login = $1', [login]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Логин уже занят' });

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO students (name, subject, login, password, tutor_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, subject, login`,
      [name, subject, login, hashed, req.tutor.id]
    );

    res.status(201).json({
      message: 'Ученик успешно добавлен!',
      student: result.rows[0]
    });
    
  } catch (err) {
    console.error('❌ Ошибка при добавлении ученика:', err.message);
    res.status(500).json({ error: 'Ошибка при добавлении ученика' });
  }
});
router.delete('/:id', auth, async (req, res) => {
  await pool.query('DELETE FROM students WHERE id = $1', [req.params.id]);
  res.json({ message: 'Ученик удалён' });
});
// ✅ Логин ученика
router.post('/login', async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) return res.status(400).json({ error: 'Введите логин и пароль' });

  try {
    const result = await pool.query('SELECT * FROM students WHERE login = $1', [login]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Логин не найден. Проверьте правильность данных' });
    }

    const student = result.rows[0];
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Неверный пароль. Попробуйте снова' });
    }

    const token = jwt.sign(
      { id: student.id, role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...data } = student;
    res.json({ token, user: data });
  } catch (err) {
    console.error('❌ Ошибка входа ученика:', err.message);
    res.status(500).json({ error: 'Ошибка сервера при входе. Попробуйте позже.' });

  }
});

// ✅ Профиль ученика
router.get('/me', auth, async (req, res) => {
  if (!req.student) return res.status(403).json({ error: 'Нет доступа' });

  try {
    const result = await pool.query(`
      SELECT s.id, s.name, s.subject, s.login, t.name as tutor_name
      FROM students s
      JOIN tutors t ON s.tutor_id = t.id
      WHERE s.id = $1
    `, [req.student.id]);

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Ученик не найден' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Ошибка загрузки профиля:', err.message);
    res.status(500).json({ error: 'Ошибка загрузки профиля' });
  }
});
router.patch('/:id', auth, async (req, res) => {
  const { name, subject, login } = req.body;

  if (!name || !subject || !login) {
    return res.status(400).json({ error: 'Все поля обязательны для обновления' });
  }

  try {
    const result = await pool.query(
      `UPDATE students
       SET name = $1, subject = $2, login = $3
       WHERE id = $4
       RETURNING id, name, subject, login`,
      [name, subject, login, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ученик не найден' });
    }

    res.json({ message: 'Ученик успешно обновлён', student: result.rows[0] });
  } catch (err) {
    console.error('Ошибка при обновлении ученика:', err.message);
    res.status(500).json({ error: 'Ошибка сервера при обновлении ученика' });
  }
});

module.exports = router;