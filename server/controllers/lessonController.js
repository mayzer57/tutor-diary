const pool = require('../db');

exports.createLesson = async (req, res) => {
  const { student_id, date, homework, grade, note } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO lessons (student_id, date, homework, grade, note) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [student_id, date, homework, grade, note]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLessons = async (req, res) => {
  const { student_id } = req.params;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM lessons WHERE student_id = $1 ORDER BY date DESC',
      [student_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
