// 📁 server/routes/lessonRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/authMiddleware');



// 📅 Получение уроков по дате
// GET /api/lessons?start=YYYY-MM-DD&end=YYYY-MM-DD


// 📚 Получение расписания для ученика
router.get('/student', auth, async (req, res) => {
  try {
    const lessons = await pool.query(
      `SELECT l.*, s.subject
       FROM lessons l
       JOIN students s ON s.id = l.student_id
       WHERE s.id = $1
       ORDER BY l.date, l.time`,
      [req.student.id]
    );
    res.json(lessons.rows);
  } catch (err) {
    console.error('Ошибка загрузки расписания ученика:', err.message);
    res.status(500).json({ error: 'Ошибка загрузки расписания' });
  }
});


// ➕ Добавление нового урока
// ➕ Добавление нового урока
router.post('/', auth, async (req, res) => {
  const { student_id, date, time, homework, homework_file, grade } = req.body;

  if (!student_id || !date || !time) {
    return res.status(400).json({ error: 'Обязательные поля: студент, дата, время' });
  }

  try {
    // 🛡 Проверка на дубликат
    const checkExisting = await pool.query(
      `SELECT * FROM lessons 
       WHERE tutor_id = $1 AND student_id = $2 AND date = $3 AND time = $4`,
      [req.tutor.id, student_id, date, time]
    );

    if (checkExisting.rows.length > 0) {
      return res.status(409).json({ error: 'Урок уже существует' });
    }

    const result = await pool.query(
      `INSERT INTO lessons (tutor_id, student_id, date, time, homework, homework_file, grade)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.tutor.id, student_id, date, time, homework || '', homework_file || '', grade || null]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error('❌ Ошибка при добавлении урока:', err.message);
    res.status(500).json({ error: 'Ошибка при добавлении урока' });
  }
});

router.patch('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { student_id, time, homework, homework_file, grade } = req.body;

  try {
    const result = await pool.query(
      `UPDATE lessons
       SET student_id = $1, time = $2, homework = $3, homework_file = $4, grade = $5
       WHERE id = $6 AND tutor_id = $7
       RETURNING *`,
      [student_id, time, homework || '', homework_file || '', grade ?? null, id, req.tutor.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Урок не найден' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при обновлении урока:', err.message);
    res.status(500).json({ error: 'Ошибка обновления' });
  }
});
// ❌ Удаление урока
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM lessons WHERE id = $1 AND tutor_id = $2 RETURNING *',
      [id, req.tutor.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Урок не найден' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Ошибка при удалении урока:', err.message);
    res.status(500).json({ error: 'Ошибка удаления' });
  }
});
router.post('/clone-multiple', auth, async (req, res) => {
  const { from, weeks } = req.body;
  const WEEKS_TO_CLONE = weeks || 4;

  if (!from) return res.status(400).json({ error: 'Не передана дата from' });

  try {
    const lessons = await pool.query(`
      SELECT student_id, time, date
      FROM lessons
      WHERE tutor_id = $1 AND date BETWEEN $2 AND $3
    `, [req.tutor.id, from, from]);

    let inserted = 0;

    for (let week = 1; week <= WEEKS_TO_CLONE; week++) {
      for (const lesson of lessons.rows) {
        const baseDate = new Date(lesson.date);
        baseDate.setDate(baseDate.getDate() + 7 * week);
        const targetDate = baseDate.toISOString().split('T')[0];

        const exists = await pool.query(`
          SELECT 1 FROM lessons
          WHERE tutor_id = $1 AND student_id = $2 AND date = $3 AND time = $4
        `, [req.tutor.id, lesson.student_id, targetDate, lesson.time]);

        if (exists.rows.length > 0) continue;

        await pool.query(`
          INSERT INTO lessons (tutor_id, student_id, date, time, homework, homework_file, grade)
          VALUES ($1, $2, $3, $4, '', '', NULL)
        `, [req.tutor.id, lesson.student_id, targetDate, lesson.time]);

        inserted++;
      }
    }

    res.json({ success: true, inserted });
  } catch (err) {
    console.error('❌ Ошибка клонирования на несколько недель:', err.message);
    res.status(500).json({ error: 'Ошибка клонирования' });
  }
});
// Получить шаблоны
router.get('/templates', auth, async (req, res) => {
  const result = await pool.query(`
    SELECT lt.*, s.name AS student_name
    FROM lesson_templates lt
    JOIN students s ON lt.student_id = s.id
    WHERE lt.tutor_id = $1
  `, [req.tutor.id]);
  res.json(result.rows);
});

// Добавить шаблон
router.post('/templates', auth, async (req, res) => {
  const { student_id, weekday, time } = req.body;
  const result = await pool.query(`
    INSERT INTO lesson_templates (tutor_id, student_id, weekday, time)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [req.tutor.id, student_id, weekday, time]);
  res.status(201).json(result.rows[0]);
});

// Удалить
router.delete('/templates/:id', auth, async (req, res) => {
  await pool.query(`DELETE FROM lesson_templates WHERE id = $1 AND tutor_id = $2`, [
    req.params.id,
    req.tutor.id,
  ]);
  res.json({ success: true });
});

router.post('/apply-template', auth, async (req, res) => {
  const { start } = req.body;
  const weekStart = start;

  if (!weekStart) return res.status(400).json({ error: 'Неделя не указана' });

  try {
    const templates = await pool.query(`
      SELECT * FROM lesson_templates WHERE tutor_id = $1
    `, [req.tutor.id]);

    let inserted = 0;

    for (const t of templates.rows) {
      const targetDate = new Date(weekStart);
      targetDate.setUTCDate(targetDate.getUTCDate() + t.weekday); // 🛠️ вот здесь используем переменную

      const dateStr = targetDate.toISOString().split('T')[0];

      const check = await pool.query(`
        SELECT 1 FROM lessons
        WHERE tutor_id = $1 AND student_id = $2 AND date = $3 AND time = $4
      `, [req.tutor.id, t.student_id, dateStr, t.time]);

      if (check.rows.length > 0) continue;

      await pool.query(`
        INSERT INTO lessons (tutor_id, student_id, date, time, homework, homework_file, grade)
        VALUES ($1, $2, $3, $4, '', '', NULL)
      `, [req.tutor.id, t.student_id, dateStr, t.time]);

      inserted++;
    }

    res.json({ success: true, inserted });
  } catch (err) {
    console.error('❌ Ошибка применения шаблона:', err.message);
    res.status(500).json({ error: 'Ошибка применения шаблона' });
  }
});

router.get('/', auth, async (req, res) => {
  const { start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: 'Start and end dates are required' });
  }

  try {
    if (!req.tutor?.id) {
      return res.status(403).json({ error: 'Недостаточно прав. Ожидается tutor' });
    }

    const lessons = await pool.query(
      `SELECT l.*, s.name AS student_name 
       FROM lessons l
       JOIN students s ON l.student_id = s.id
       WHERE l.tutor_id = $1 AND l.date BETWEEN $2 AND $3
       ORDER BY l.date, l.time`,
      [req.tutor.id, start, end]
    );

    res.json(lessons.rows);
  } catch (err) {
    console.error('Ошибка при получении уроков (репетитор):', err.message);
    res.status(500).json({ error: 'Ошибка при получении уроков' });
  }
});

module.exports = router;