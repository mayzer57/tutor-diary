const pool = require('../db');

// 🔹 Получение уроков преподавателя по неделе
const getLessonsByWeek = async (req, res) => {
  const { start, end } = req.query;
  try {
    const result = await pool.query(`
      SELECT l.*, s.name AS student_name
      FROM lessons l
      JOIN students s ON l.student_id = s.id
      WHERE l.tutor_id = $1 AND l.date BETWEEN $2 AND $3
      ORDER BY l.date, l.time
    `, [req.tutor.id, start, end]);

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Ошибка получения уроков:', err.message);
    res.status(500).json({ error: 'Ошибка при получении уроков' });
  }
};

// 🔹 Добавление нового урока
const addLesson = async (req, res) => {
  const { student_id, date, time, homework, homework_file, grade } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO lessons (tutor_id, student_id, date, time, homework, homework_file, grade)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [req.tutor.id, student_id, date, time, homework || '', homework_file || '', grade || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Ошибка при добавлении урока:', err.message);
    res.status(500).json({ error: 'Ошибка при добавлении урока' });
  }
};

// 🔹 Обновление урока
const updateLesson = async (req, res) => {
  const { id } = req.params;
  const { time, homework, grade, homework_file } = req.body;

  try {
    const result = await pool.query(`
      UPDATE lessons
      SET time = $1, homework = $2, grade = $3, homework_file = $4
      WHERE id = $5 RETURNING *`,
      [time, homework, grade, homework_file, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Ошибка обновления урока:', err.message);
    res.status(500).json({ error: 'Ошибка обновления урока' });
  }
};

// 🔹 Удаление урока
const deleteLesson = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`DELETE FROM lessons WHERE id = $1`, [id]);
    res.json({ message: 'Урок удалён' });
  } catch (err) {
    console.error('❌ Ошибка удаления урока:', err.message);
    res.status(500).json({ error: 'Ошибка удаления урока' });
  }
};

module.exports = {
  getLessonsByWeek,
  addLesson,
  updateLesson,
  deleteLesson,
};
