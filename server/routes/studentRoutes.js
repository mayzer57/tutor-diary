const express = require('express');
const router = express.Router();
const pool = require('../db');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const auth = require('../middleware/authMiddleware');

// ✅ Получение всех учеников
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id AS student_id, 
        s.name, 
        s.login, 
        ss.id AS subject_id, 
        ss.subject,
        EXISTS (
          SELECT 1 FROM messages m
          WHERE (
            (m.sender_type = 'student' AND m.sender_id = s.id AND m.receiver_id = $1)
            OR
            (m.sender_type = 'tutor' AND m.sender_id = $1 AND m.receiver_id = s.id)
          )
        ) AS has_messages
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
          has_messages: row.has_messages,
          subjects: []
        };
      }

      if (row.subject_id && row.subject) {
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


// ✅ Добавление ученика
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
    const result = await pool.query(
      `INSERT INTO students (name, login, password, tutor_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, login`,
      [name, login, hashed, req.tutor.id]
    );

    const studentId = result.rows[0].id;

    for (const subject of subjects) {
      await pool.query(
        `INSERT INTO student_subjects (student_id, subject) VALUES ($1, $2)`,
        [studentId, subject]
      );
    }

    res.status(201).json({ message: 'Ученик добавлен', student: result.rows[0] });
  } catch (err) {
    console.error('❌ Ошибка при добавлении ученика:', err.message);
    res.status(500).json({ error: 'Ошибка при добавлении ученика' });
  }
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
    const studentInfo = await pool.query(`
      SELECT s.id, s.name, s.login, s.tutor_id, t.name as tutor_name
      FROM students s
      JOIN tutors t ON s.tutor_id = t.id
      WHERE s.id = $1
    `, [req.student.id]); // <-- ✅ теперь вернёт tutor_id

    if (studentInfo.rows.length === 0)
      return res.status(404).json({ error: 'Ученик не найден' });

    const subjects = await pool.query(
      `SELECT id, subject FROM student_subjects WHERE student_id = $1`,
      [req.student.id]
    );

    const profile = {
      ...studentInfo.rows[0],
      subjects: subjects.rows.map(sub => ({ id: sub.id, name: sub.subject }))
    };

    res.json(profile);
  } catch (err) {
    console.error('❌ Ошибка загрузки профиля:', err.message);
    res.status(500).json({ error: 'Ошибка загрузки профиля' });
  }
});


// ✅ Обновление ученика
router.patch('/:id', auth, async (req, res) => {
  const { name, login, subjects } = req.body;

  if (!name || !login || !Array.isArray(subjects)) {
    return res.status(400).json({ error: 'Неверные данные для обновления' });
  }

  try {
    await pool.query(`UPDATE students SET name = $1, login = $2 WHERE id = $3`, [name, login, req.params.id]);

    const result = await pool.query(`SELECT subject FROM student_subjects WHERE student_id = $1`, [req.params.id]);
    const existingSubjects = result.rows.map(r => r.subject);

    const subjectsToAdd = subjects.filter(sub => !existingSubjects.includes(sub));
    const subjectsToRemove = existingSubjects.filter(sub => !subjects.includes(sub));

    for (const subject of subjectsToRemove) {
      // Найдём ID записи subject_id
      const subRes = await pool.query(`
        SELECT id FROM student_subjects WHERE student_id = $1 AND subject = $2
      `, [req.params.id, subject]);

      if (subRes.rows.length > 0) {
        const subjectId = subRes.rows[0].id;

        // Удалим уроки и шаблоны по этому subject_id
        await pool.query(`DELETE FROM lessons WHERE subject_id = $1`, [subjectId]);
        await pool.query(`DELETE FROM lesson_templates WHERE subject_id = $1`, [subjectId]);

        // Удалим сам subject
        await pool.query(`DELETE FROM student_subjects WHERE id = $1`, [subjectId]);
      }
    }

    for (const subject of subjectsToAdd) {
      await pool.query(`INSERT INTO student_subjects (student_id, subject) VALUES ($1, $2)`, [req.params.id, subject]);
    }

    res.json({ message: 'Ученик обновлён' });
  } catch (err) {
    console.error('Ошибка обновления ученика:', err.message);
    res.status(500).json({ error: 'Ошибка обновления ученика' });
  }
});

// ✅ Удаление ученика
router.delete('/:id', auth, async (req, res) => {
  try {
    const studentId = req.params.id;

    await pool.query(`
      DELETE FROM lessons 
      WHERE subject_id IN (
        SELECT id FROM student_subjects WHERE student_id = $1
      )`, [studentId]);

    await pool.query(`
      DELETE FROM lesson_templates 
      WHERE subject_id IN (
        SELECT id FROM student_subjects WHERE student_id = $1
      )`, [studentId]);

    await pool.query(`DELETE FROM students WHERE id = $1 AND tutor_id = $2`, [
      studentId,
      req.tutor.id,
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error('Ошибка при удалении ученика:', err.message);
    res.status(500).json({ error: 'Ошибка при удалении ученика' });
  }
});


router.get('/my-grades', auth, async (req, res) => {
  try {
    const studentId = req.student?.id;
    if (!studentId) return res.status(403).json({ error: 'Нет доступа к данным ученика' });

    const result = await pool.query(`
      SELECT 
        l.date, 
        l.grade, 
        ss.subject,
        s.name AS student
      FROM lessons l
      JOIN student_subjects ss ON l.subject_id = ss.id
      JOIN students s ON ss.student_id = s.id
      WHERE ss.student_id = $1 AND l.grade IS NOT NULL
      ORDER BY l.date ASC
    `, [studentId]);

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Ошибка при получении оценок:', err.message);
    res.status(500).json({ error: 'Ошибка при получении оценок' });
  }
});
router.get('/ranking', auth, async (req, res) => {
  try {
    const studentId = req.student?.id;
    if (!studentId) return res.status(403).json({ error: 'Нет доступа к рейтингу' });

    const tutorRes = await pool.query(`
      SELECT l.tutor_id
      FROM lessons l
      JOIN student_subjects ss ON l.subject_id = ss.id
      WHERE ss.student_id = $1
      LIMIT 1
    `, [studentId]);

    const tutorId = tutorRes.rows[0]?.tutor_id;
    if (!tutorId) return res.json([]);

    const result = await pool.query(`
      SELECT s.name, SUM(CASE 
        WHEN l.grade = 5 THEN 5
        WHEN l.grade = 4 THEN 3
        WHEN l.grade = 3 THEN 1
        ELSE 0 END) AS points
      FROM lessons l
      JOIN student_subjects ss ON l.subject_id = ss.id
      JOIN students s ON ss.student_id = s.id
      WHERE l.tutor_id = $1 AND l.grade IS NOT NULL
      GROUP BY s.name
      ORDER BY points DESC
    `, [tutorId]);

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Ошибка при получении рейтинга:', err.message);
    res.status(500).json({ error: 'Ошибка при получении рейтинга' });
  }
});
// 🔔 Уведомления ученика
router.get('/notifications', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, message, created_at
       FROM notifications
       WHERE student_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.student.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка при получении уведомлений:', err.message);
    res.status(500).json({ error: 'Ошибка при получении уведомлений' });
  }
});

module.exports = router;