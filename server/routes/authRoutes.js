const express = require('express');
const router = express.Router();
const { changeUserPassword } = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');
const studentAuth = require('../middleware/studentAuthMiddleware');

router.post('/change-password', async (req, res) => {
  const { userId, userType, newPassword } = req.body;

  if (!userId || !userType || !newPassword) {
    return res.status(400).json({ message: 'Недостаточно данных' });
  }

  try {
    const bcrypt = require('bcrypt');
    const hashed = await bcrypt.hash(newPassword, 10);
    const pool = require('../db');

    if (userType === 'student') {
      await pool.query(`UPDATE students SET password = $1 WHERE id = $2`, [hashed, userId]);
    } else if (userType === 'tutor') {
      await pool.query(`UPDATE tutors SET password = $1 WHERE id = $2`, [hashed, userId]);
    } else {
      return res.status(400).json({ message: 'Неизвестный тип пользователя' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Ошибка смены пароля:', err.message);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;