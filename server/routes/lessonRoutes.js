const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/authMiddleware');


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
  l.price,
  l.conducted,
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
  l.price,
  l.conducted,
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


router.post('/', auth, async (req, res) => {
  const { subject_id, date, time, homework, homework_file, grade, price, conducted } = req.body;

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
      `INSERT INTO lessons 
       (tutor_id, subject_id, date, time, homework, homework_file, grade, price, conducted)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.tutor.id, subject_id, date, time, homework || '', homework_file || '', grade ?? null, price ?? null, conducted ?? false]
    );

    const createdLesson = result.rows[0];

    const studentRes = await pool.query(
      `SELECT student_id FROM student_subjects WHERE id = $1`,
      [subject_id]
    );

    if (studentRes.rows.length > 0) {
      const student_id = studentRes.rows[0].student_id;
      const message = `📅 Назначен новый урок на ${date} в ${time.slice(0, 5)}`;
      await pool.query(
        `INSERT INTO notifications (student_id, message, read)
         VALUES ($1, $2, FALSE)`,
        [student_id, message]
      );
    }

    res.status(201).json(createdLesson);
  } catch (err) {
    console.error('❌ Ошибка при добавлении урока:', err.message);
    res.status(500).json({ error: 'Ошибка при добавлении урока' });
  }
});



router.patch('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { subject_id, time, homework, homework_file, grade, price, conducted } = req.body;

  try {
    const result = await pool.query(
      `UPDATE lessons
       SET subject_id = $1, time = $2, homework = $3, homework_file = $4, grade = $5, price = $6, conducted = $7
       WHERE id = $8 AND tutor_id = $9
       RETURNING *`,
      [
        subject_id,
        time,
        homework || '',
        homework_file || '',
        grade ?? null,
        price ?? null,
        conducted ?? false,
        id,
        req.tutor.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Урок не найден' });
    }

    const updated = result.rows[0];

    const studentRes = await pool.query(
      `SELECT student_id FROM student_subjects WHERE id = $1`,
      [updated.subject_id]
    );

    if (studentRes.rows.length > 0) {
      const student_id = studentRes.rows[0].student_id;

      if (homework) {
        await pool.query(
          `INSERT INTO notifications (student_id, message, read)
           VALUES ($1, $2, FALSE)`,
          [student_id, '📚 Новое домашнее задание от репетитора!']
        );
      }

      if (grade !== undefined && grade !== null) {
        await pool.query(
          `INSERT INTO notifications (student_id, message, read)
           VALUES ($1, $2, FALSE)`,
          [student_id, `✅ Ваша оценка за ${updated.date}: ${grade}`]
        );
      }
    }

    res.json(updated);
  } catch (err) {
    console.error('Ошибка при обновлении урока:', err.message);
    res.status(500).json({ error: 'Ошибка обновления' });
  }
});


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


router.post('/templates', auth, async (req, res) => {
  const { subject_id, weekday, time, price } = req.body;

  const result = await pool.query(`
    INSERT INTO lesson_templates (tutor_id, subject_id, weekday, time, price)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [req.tutor.id, subject_id, weekday, time, price ?? null]);

  res.status(201).json(result.rows[0]);
});


router.delete('/templates/:id', auth, async (req, res) => {
  await pool.query(`DELETE FROM lesson_templates WHERE id = $1 AND tutor_id = $2`, [
    req.params.id,
    req.tutor.id,
  ]);
  res.json({ success: true });
});


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

   
      const insertRes = await pool.query(`
        INSERT INTO lessons (tutor_id, subject_id, date, time, homework, homework_file, grade, price, conducted)
        VALUES ($1, $2, $3, $4, '', '', NULL, $5, FALSE)
        RETURNING id
      `, [req.tutor.id, t.subject_id, dateStr, t.time, t.price || null]);


      const studentRes = await pool.query(
        `SELECT student_id FROM student_subjects WHERE id = $1`,
        [t.subject_id]
      );

      if (studentRes.rows.length > 0) {
        const student_id = studentRes.rows[0].student_id;

        await pool.query(
          `INSERT INTO notifications (student_id, message, read)
           VALUES ($1, $2, FALSE)`,
          [student_id, `📅 Назначен новый урок по шаблону на ${dateStr} в ${t.time.slice(0, 5)}`]
        );
      }

      inserted++;
    }

    res.json({ success: true, inserted });
  } catch (err) {
    console.error('❌ Ошибка применения шаблона:', err.message);
    res.status(500).json({ error: 'Ошибка применения шаблона' });
  }
});


router.get('/grades', auth, async (req, res) => {
  const { start, end, offset = 0, limit = 100, student, subject } = req.query;

  if (!req.tutor?.id) {
    return res.status(403).json({ error: 'Только для репетитора' });
  }


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
    
    const updated = result.rows[0];
    

    const studentRes = await pool.query(`
      SELECT ss.student_id 
      FROM student_subjects ss
      JOIN lessons l ON ss.id = l.subject_id
      WHERE l.id = $1
    `, [id]);
    
    if (studentRes.rows.length > 0) {
      const student_id = studentRes.rows[0].student_id;
      await pool.query(`
        INSERT INTO notifications (student_id, message, read)
        VALUES ($1, $2, FALSE)
      `, [student_id, `✅ Ваша оценка за ${updated.date}: ${grade}`]);
    }
    
    res.json(updated);
  } catch (err) {
    console.error('❌ Ошибка при обновлении оценки:', err.message);
    res.status(500).json({ error: 'Ошибка при обновлении оценки' });
  }
});
module.exports = router;