const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const studentAuth = require('../middleware/studentAuthMiddleware');
const pool = require('../db');

// Обновление профиля ученика
router.patch('/:id', studentAuth, async (req, res) => {
  const { name, login, email } = req.body;

  try {
    if (req.student.id !== parseInt(req.params.id)) {
      return res.status(403).json({ message: 'Нет доступа к этому профилю' });
    }

    await pool.query(
      `UPDATE students SET 
        name = $1, 
        login = $2 
       WHERE id = $3`,
      [name, login, req.params.id]
    );

    res.json({ message: 'Профиль ученика обновлен' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка обновления профиля ученика' });
  }
});

// Обновление профиля репетитора
router.patch('/tutor/:id', auth, async (req, res) => {
  const { name, email } = req.body;

  try {
    if (req.tutor.id !== parseInt(req.params.id)) {
      return res.status(403).json({ message: 'Нет доступа к этому профилю' });
    }

    await pool.query(
      `UPDATE tutors SET 
        name = $1, 
        email = $2 
       WHERE id = $3`,
      [name, email, req.params.id]
    );

    res.json({ message: 'Профиль репетитора обновлен' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка обновления профиля репетитора' });
  }
});

module.exports = router;
