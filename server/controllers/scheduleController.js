const pool = require('../db');

exports.addSchedule = async (req, res) => {
  const { day_of_week, time_from, time_to, subject } = req.body;
  const tutor_id = req.tutor.id;
  try {
    const { rows } = await pool.query(
      `INSERT INTO schedule (tutor_id, day_of_week, time_from, time_to, subject)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [tutor_id, day_of_week, time_from, time_to, subject]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSchedule = async (req, res) => {
  const tutor_id = req.tutor.id;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM schedule WHERE tutor_id = $1 ORDER BY day_of_week, time_from',
      [tutor_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
