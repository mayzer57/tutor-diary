const express = require('express');
const router = express.Router();
const pool = require('../db');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/authMiddleware');


router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.id AS student_id, s.name, s.login, ss.id AS subject_id, ss.subject
      FROM students s
      LEFT JOIN student_subjects ss ON ss.student_id = s.id
      WHERE s.tutor_id = $1
    `, [req.tutor.id]);

    const grouped = {};
    result.rows.forEach(row => {
      if (!grouped[row.student_id]) {
        grouped[row.student_id] = {
          id: row.student_id,
          name: row.name,
          login: row.login,
          subjects: [],
        };
      }
      if (row.subject) {
        grouped[row.student_id].subjects.push({
          id: row.subject_id,
          name: row.subject
        });
      }
    });

    res.json(Object.values(grouped));
  } catch (err) {
    console.error('❌ Ошибка загрузки учеников:', err.message);
    res.status(500).json({ error: 'Ошибка загрузки учеников' });
  }
});

// ➕ Добавление ученика с предметами
router.post('/', auth, [
  check('name').notEmpty(),
  check('login').notEmpty(),
  check('password').isLength({ min: 6 }),
  check('subjects').isArray({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, login, password, subjects } = req.body;

  try {
    const existing = await pool.query('SELECT id FROM students WHERE login = $1', [login]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Логин уже занят' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const studentResult = await pool.query(`
      INSERT INTO students (name, login, password, tutor_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, login
    `, [name, login, hashed, req.tutor.id]);

    const studentId = studentResult.rows[0].id;

    for (const subject of subjects) {
      await pool.query(
        `INSERT INTO student_subjects (student_id, subject) VALUES ($1, $2)`,
        [studentId, subject]
      );
    }

    res.status(201).json({ message: 'Ученик добавлен', student: studentResult.rows[0] });
  } catch (err) {
    console.error('❌ Ошибка при добавлении ученика:', err.message);
    res.status(500).json({ error: 'Ошибка при добавлении ученика' });
  }
});


router.post('/login', async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) return res.status(400).json({ error: 'Введите логин и пароль' });

  try {
    const result = await pool.query('SELECT * FROM students WHERE login = $1', [login]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Ученик не найден' });

    const student = result.rows[0];
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) return res.status(401).json({ error: 'Неверный пароль' });

    const token = jwt.sign(
      { id: student.id, role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...data } = student;
    res.json({ token, user: data });
  } catch (err) {
    console.error('❌ Ошибка входа ученика:', err.message);
    res.status(500).json({ error: 'Ошибка входа' });
  }
});

module.exports = router;