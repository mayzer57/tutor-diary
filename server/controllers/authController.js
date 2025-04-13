// server/controllers/authController.js
const bcrypt = require('bcryptjs');

const pool = require('../db');

const changeUserPassword = async (req, res) => {
  const { userId, userType, newPassword } = req.body;

  if (!userId || !userType || !newPassword) {
    return res.status(400).json({ message: 'Недостаточно данных' });
  }

  try {
    const hashed = await bcrypt.hash(newPassword, 10);

    if (userType === 'student') {
      await pool.query(`UPDATE students SET password = $1 WHERE id = $2`, [hashed, userId]);
    } else if (userType === 'tutor') {
      await pool.query(`UPDATE tutors SET password = $1 WHERE id = $2`, [hashed, userId]);
    } else {
      return res.status(400).json({ message: 'Неверный тип пользователя' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Ошибка смены пароля:', err.message);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
};

module.exports = { changeUserPassword };
