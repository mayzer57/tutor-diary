const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/authMiddleware');

// 📊 Получить финансы репетитора (только по проведённым урокам)
router.get('/summary', auth, async (req, res) => {
  const { period = 'month', start, end } = req.query;
  const tutorId = req.tutor?.id;

  if (!tutorId) return res.status(403).json({ error: 'Только для репетитора' });

  const now = new Date();
  let startDate, endDate;

  if (start && end) {
    startDate = new Date(start);
    endDate = new Date(end);
  } else {
    endDate = now;
    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'month':
      default:
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }
  }

  const from = startDate.toISOString().split('T')[0];
  const to = endDate.toISOString().split('T')[0];

  try {
    const summaryRes = await pool.query(
      `
      SELECT 
        COUNT(*) AS lessons_count,
        COALESCE(SUM(price), 0) AS total_earned,
        COALESCE(AVG(price), 0) AS avg_price
      FROM lessons
      WHERE tutor_id = $1 AND conducted = TRUE AND date BETWEEN $2 AND $3
    `,
      [tutorId, from, to]
    );

    const chartRes = await pool.query(
      `
      SELECT date, SUM(price) as day_total
      FROM lessons
      WHERE tutor_id = $1 AND conducted = TRUE AND date BETWEEN $2 AND $3
      GROUP BY date
      ORDER BY date ASC
    `,
      [tutorId, from, to]
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