const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/authMiddleware');

// 📅 Получение уроков репетитора
// 📅 Получение уроков репетитора с поддержкой start/end/limit/offset
router.get('/', auth, async (req, res) => {
  let { start, end, limit = 50, offset = 0 } = req.query;
  limit = parseInt(limit);
  offset = parseInt(offset);

  try {
    if (!req.tutor?.id) {
      return res.status(403).json({ error: 'Недостаточно прав. Ожидается tutor' });
    }

    // Если не переданы start и end — использовать последние 30 дней
    if (!start || !end) {
      const today = new Date();
      end = today.toISOString().split('T')[0];

      const from = new Date();
      from.setDate(today.getDate() - 30);
      start = from.toISOString().split('T')[0];
    }

    const lessons = await pool.query(`
      SELECT 
        l.id,
        l.date,
        l.time,
        l.homework,
        l.homework_file,
        l.grade,
        l.subject_id,
        ss.student_id,
        s.name AS student_name,
        ss.subject AS subject_name
      FROM lessons l
      JOIN student_subjects ss ON l.subject_id = ss.id
      JOIN students s ON ss.student_id = s.id
      WHERE s.tutor_id = $1 AND l.date BETWEEN $2 AND $3
      ORDER BY l.date, l.time
      LIMIT $4 OFFSET $5
    `, [req.tutor.id, start, end, limit, offset]);

    res.json(lessons.rows);
  } catch (err) {
    console.error('Ошибка при получении уроков (репетитор):', err.message);
    res.status(500).json({ error: 'Ошибка при получении уроков' });
  }
});

// 📚 Получение расписания для ученика
router.get('/student', auth, async (req, res) => {
  try {
    const lessons = await pool.query(
      `SELECT 
        l.id,
        l.date,
        l.time,
        l.homework,
        l.homework_file,
        l.grade,
        l.subject_id,
        ss.student_id,
        ss.subject AS subject_name
      FROM lessons l
      JOIN student_subjects ss ON l.subject_id = ss.id
      WHERE ss.student_id = $1
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
router.post('/', auth, async (req, res) => {
  const { subject_id, date, time, homework, homework_file, grade } = req.body;

  if (!subject_id || !date || !time) {
    return res.status(400).json({ error: 'Обязательные поля: предмет, дата, время' });
  }

  try {
    const checkExisting = await pool.query(
      `SELECT 1 FROM lessons 
       WHERE tutor_id = $1 AND subject_id = $2 AND date = $3 AND time = $4`,
      [req.tutor.id, subject_id, date, time]
    );

    if (checkExisting.rows.length > 0) {
      return res.status(409).json({ error: 'Урок уже существует' });
    }

    const result = await pool.query(
      `INSERT INTO lessons (tutor_id, subject_id, date, time, homework, homework_file, grade)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.tutor.id, subject_id, date, time, homework || '', homework_file || '', grade || null]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error('❌ Ошибка при добавлении урока:', err.message);
    res.status(500).json({ error: 'Ошибка при добавлении урока' });
  }
});

// ✏️ Обновление урока
router.patch('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { subject_id, time, homework, homework_file, grade } = req.body;

  try {
    const result = await pool.query(
      `UPDATE lessons
       SET subject_id = $1, time = $2, homework = $3, homework_file = $4, grade = $5
       WHERE id = $6 AND tutor_id = $7
       RETURNING *`,
      [subject_id, time, homework || '', homework_file || '', grade ?? null, id, req.tutor.id]
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

// 🧬 Клонировать недели
router.post('/clone-multiple', auth, async (req, res) => {
  const { from, weeks } = req.body;
  const WEEKS_TO_CLONE = weeks || 4;

  if (!from) return res.status(400).json({ error: 'Не передана дата from' });

  try {
    const lessons = await pool.query(`
      SELECT subject_id, time, date
      FROM lessons
      WHERE tutor_id = $1 AND date = $2
    `, [req.tutor.id, from]);

    let inserted = 0;

    for (let week = 1; week <= WEEKS_TO_CLONE; week++) {
      for (const lesson of lessons.rows) {
        const baseDate = new Date(lesson.date);
        baseDate.setDate(baseDate.getDate() + 7 * week);
        const targetDate = baseDate.toISOString().split('T')[0];

        const exists = await pool.query(`
          SELECT 1 FROM lessons
          WHERE tutor_id = $1 AND subject_id = $2 AND date = $3 AND time = $4
        `, [req.tutor.id, lesson.subject_id, targetDate, lesson.time]);

        if (exists.rows.length > 0) continue;

        await pool.query(`
          INSERT INTO lessons (tutor_id, subject_id, date, time, homework, homework_file, grade)
          VALUES ($1, $2, $3, $4, '', '', NULL)
        `, [req.tutor.id, lesson.subject_id, targetDate, lesson.time]);

        inserted++;
      }
    }

    res.json({ success: true, inserted });
  } catch (err) {
    console.error('❌ Ошибка клонирования:', err.message);
    res.status(500).json({ error: 'Ошибка клонирования' });
  }
});

// 📋 Получить шаблоны
router.get('/templates', auth, async (req, res) => {
  const result = await pool.query(`
    SELECT lt.*, s.name AS student_name, ss.subject AS subject_name
    FROM lesson_templates lt
    JOIN student_subjects ss ON lt.subject_id = ss.id
    JOIN students s ON ss.student_id = s.id
    WHERE lt.tutor_id = $1
  `, [req.tutor.id]);
  res.json(result.rows);
});

// ➕ Добавить шаблон
router.post('/templates', auth, async (req, res) => {
  const { subject_id, weekday, time } = req.body;
  const result = await pool.query(`
    INSERT INTO lesson_templates (tutor_id, subject_id, weekday, time)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [req.tutor.id, subject_id, weekday, time]);
  res.status(201).json(result.rows[0]);
});

// ❌ Удалить шаблон
router.delete('/templates/:id', auth, async (req, res) => {
  await pool.query(`DELETE FROM lesson_templates WHERE id = $1 AND tutor_id = $2`, [
    req.params.id,
    req.tutor.id,
  ]);
  res.json({ success: true });
});

// 📅 Применить шаблон на неделю
router.post('/apply-template', auth, async (req, res) => {
  const { start } = req.body;

  if (!start) return res.status(400).json({ error: 'Неделя не указана' });

  try {
    const templates = await pool.query(`
      SELECT * FROM lesson_templates WHERE tutor_id = $1
    `, [req.tutor.id]);

    let inserted = 0;

    for (const t of templates.rows) {
      const targetDate = new Date(start);
      targetDate.setUTCDate(targetDate.getUTCDate() + t.weekday);
      const dateStr = targetDate.toISOString().split('T')[0];

      const check = await pool.query(`
        SELECT 1 FROM lessons
        WHERE tutor_id = $1 AND subject_id = $2 AND date = $3 AND time = $4
      `, [req.tutor.id, t.subject_id, dateStr, t.time]);

      if (check.rows.length > 0) continue;

      await pool.query(`
        INSERT INTO lessons (tutor_id, subject_id, date, time, homework, homework_file, grade)
        VALUES ($1, $2, $3, $4, '', '', NULL)
      `, [req.tutor.id, t.subject_id, dateStr, t.time]);

      inserted++;
    }

    res.json({ success: true, inserted });
  } catch (err) {
    console.error('❌ Ошибка применения шаблона:', err.message);
    res.status(500).json({ error: 'Ошибка применения шаблона' });
  }
});
// 📊 Новый маршрут: Получить все оценки
// 📊 Получить оценки за период с фильтрами и пагинацией
// 📊 Получить оценки за период с фильтрами и пагинацией
// 📊 Получить оценки за период с фильтрами и пагинацией
router.get('/grades', auth, async (req, res) => {
  const { start, end, offset = 0, limit = 100, student, subject } = req.query;

  if (!req.tutor?.id) {
    return res.status(403).json({ error: 'Только для репетитора' });
  }

  // ✅ Безопасный парсинг даты
  const parseDate = (d) => {
    const parsed = new Date(d);
    return !isNaN(parsed.getTime()) ? parsed.toISOString().split('T')[0] : null;
  };

  const from = parseDate(start) || '2000-01-01';
  const to = parseDate(end) || '2100-01-01';

  const values = [req.tutor.id, from, to];
  let filters = `l.tutor_id = $1 AND l.date BETWEEN $2 AND $3`;

  if (student) {
    values.push(`%${student}%`);
    filters += ` AND s.name ILIKE $${values.length}`;
  }

  if (subject) {
    values.push(`%${subject}%`);
    filters += ` AND ss.subject ILIKE $${values.length}`;
  }

  values.push(limit);
  values.push(offset);

  console.log('[GRADES API]', {
    tutorId: req.tutor.id,
    from,
    to,
    rawStart: start,
    rawEnd: end,
    student,
    subject,
    limit,
    offset
  });

  try {
    const result = await pool.query(`
      SELECT 
        l.id,
        l.date,
        l.grade,
        s.name AS student,
        ss.subject AS subject
      FROM lessons l
      JOIN student_subjects ss ON l.subject_id = ss.id
      JOIN students s ON ss.student_id = s.id
      WHERE ${filters}
      ORDER BY l.date ASC
      LIMIT $${values.length - 1}
      OFFSET $${values.length}
    `, values);

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Ошибка при получении оценок:', err.message);
    res.status(500).json({ error: 'Ошибка при получении оценок' });
  }
});
// 🎯 Обновление оценки урока (только grade)
router.patch('/:id/grade', auth, async (req, res) => {
  const { id } = req.params;
  const { grade } = req.body;

  if (grade === undefined || grade === null) {
    return res.status(400).json({ error: 'Оценка не передана' });
  }

  try {
    const result = await pool.query(
      `UPDATE lessons SET grade = $1 WHERE id = $2 RETURNING *`,
      [grade, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Урок не найден' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Ошибка при обновлении оценки:', err.message);
    res.status(500).json({ error: 'Ошибка при обновлении оценки' });
  }
});
module.exports = router;