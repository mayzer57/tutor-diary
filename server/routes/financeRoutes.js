const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/authMiddleware');

// 📊 Финансовая аналитика по всей неделе/месяцу/году
// 📊 Получить финансы репетитора с фильтрацией по предмету/ученику и точным периодом
router.get('/summary', auth, async (req, res) => {
  const { period, start, end, student, subject } = req.query;
  const tutorId = req.tutor?.id;

  if (!tutorId) return res.status(403).json({ error: 'Только для репетитора' });

  const now = new Date();
  let startDate, endDate;

  const getMonthRange = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return [firstDay, lastDay];
  };

  if (start && end) {
    startDate = new Date(start);
    endDate = new Date(end);
  } else {
    switch (period) {
      case 'week': {
        const monday = new Date(now);
        monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7)); // Monday of this week
        const sunday = new Date(monday);
        sunday.setDate(sunday.getDate() + 6);
        [startDate, endDate] = [monday, sunday];
        break;
      }
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      case 'month':
      default:
        [startDate, endDate] = getMonthRange(now);
        break;
    }
  }

  const from = startDate.toISOString().split('T')[0];
  const to = endDate.toISOString().split('T')[0];

  const values = [tutorId, from, to];
  let filterSQL = `l.tutor_id = $1 AND l.conducted = TRUE AND l.date BETWEEN $2 AND $3`;

  if (student) {
    values.push(`%${student}%`);
    filterSQL += ` AND s.name ILIKE $${values.length}`;
  }

  if (subject) {
    values.push(`%${subject}%`);
    filterSQL += ` AND ss.subject ILIKE $${values.length}`;
  }

  try {
    const summaryRes = await pool.query(
      `
      SELECT 
        COUNT(*) AS lessons_count,
        COALESCE(SUM(l.price), 0) AS total_earned,
        COALESCE(AVG(l.price), 0) AS avg_price
      FROM lessons l
      JOIN student_subjects ss ON l.subject_id = ss.id
      JOIN students s ON ss.student_id = s.id
      WHERE ${filterSQL}
    `,
      values
    );

    const chartRes = await pool.query(
      `
      SELECT l.date, SUM(l.price) as day_total
      FROM lessons l
      JOIN student_subjects ss ON l.subject_id = ss.id
      JOIN students s ON ss.student_id = s.id
      WHERE ${filterSQL}
      GROUP BY l.date
      ORDER BY l.date ASC
    `,
      values
    );

    res.json({
      range: { from, to },
      summary: summaryRes.rows[0],
      chart: chartRes.rows,
    });
  } catch (err) {
    console.error('[FINANCE] ❌ Ошибка получения данных:', err.message);
    res.status(500).json({ error: 'Ошибка получения финансовых данных' });
  }
});

module.exports = router;