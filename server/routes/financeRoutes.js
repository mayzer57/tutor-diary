const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/authMiddleware');

// 📊 Финансовая аналитика по всей неделе/месяцу/году
router.get('/summary', auth, async (req, res) => {
  const { period = 'month', start, end, debug = false } = req.query;
  const tutorId = req.tutor?.id;

  if (!tutorId) return res.status(403).json({ error: 'Только для репетитора' });

  const now = new Date();
  let startDate, endDate;

  if (start && end) {
    startDate = new Date(start);
    endDate = new Date(end);
  } else {
    switch (period) {
      case 'week': {
        const day = now.getDay(); // 0 (вс) -> 6 (сб)
        const diffToMonday = (day === 0 ? -6 : 1) - day;
        startDate = new Date(now);
        startDate.setDate(now.getDate() + diffToMonday);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        break;
      }

      case 'month': {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // последний день месяца
        break;
      }

      case 'year': {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      }

      default: {
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        endDate = now;
        break;
      }
    }
  }

  const from = startDate.toISOString().split('T')[0];
  const to = endDate.toISOString().split('T')[0];

  try {
    const summaryRes = await pool.query(`
      SELECT 
        COUNT(*) AS lessons_count,
        COALESCE(SUM(price), 0) AS total_earned,
        COALESCE(AVG(price), 0) AS avg_price
      FROM lessons
      WHERE tutor_id = $1 AND conducted = TRUE AND date BETWEEN $2 AND $3
    `, [tutorId, from, to]);

    const chartRes = await pool.query(`
      SELECT date, SUM(price) as day_total
      FROM lessons
      WHERE tutor_id = $1 AND conducted = TRUE AND date BETWEEN $2 AND $3
      GROUP BY date
      ORDER BY date ASC
    `, [tutorId, from, to]);

    let debugLessons = [];
    if (debug === 'true') {
      const debugRes = await pool.query(`
        SELECT id, date, time, subject_id, price, conducted
        FROM lessons
        WHERE tutor_id = $1 AND date BETWEEN $2 AND $3
        ORDER BY date ASC
      `, [tutorId, from, to]);
      debugLessons = debugRes.rows;
    }

    res.json({
      range: { from, to },
      summary: summaryRes.rows[0],
      chart: chartRes.rows,
      ...(debug === 'true' && { debug: { raw_lessons: debugLessons } })
    });

  } catch (err) {
    console.error('[FINANCE] ❌ Ошибка получения данных:', err.message);
    res.status(500).json({ error: 'Ошибка получения финансовых данных' });
  }
});

module.exports = router;