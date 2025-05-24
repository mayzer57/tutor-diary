const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const { check, validationResult } = require('express-validator');

const auth = require('../middleware/authMiddleware');


router.post('/register', [
  check('name').notEmpty().withMessage('Имя обязательно'),
  check('email').isEmail().withMessage('Некорректный email'),
  check('password').isLength({ min: 6 }).withMessage('Пароль должен быть не менее 6 символов')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(`
      INSERT INTO tutors (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, name, email
    `, [name, email, hashedPassword]);

    const token = jwt.sign(
      { id: result.rows[0].id, role: 'tutor' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({ token, userType: 'tutor' });
  } catch (err) {
    console.error('❌ Ошибка при регистрации репетитора:', err.message);
    res.status(500).json({ error: 'Ошибка регистрации' });
  }
});

// 🔐 Вход
// 🔐 Вход
router.post('/login', [
  check('email').isEmail().withMessage('Некорректный email'),
  check('password').notEmpty().withMessage('Пароль обязателен')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  try {
    console.log('[LOGIN] body:', req.body); // 👈 логируем вход

    const result = await pool.query('SELECT * FROM tutors WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Пользователь не найден' });

    const tutor = result.rows[0];
    const match = await bcrypt.compare(password, tutor.password);
    if (!match) return res.status(401).json({ error: 'Неверный пароль' });

    const token = jwt.sign(
      { id: tutor.id, role: 'tutor' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ 
      token, 
      userType: 'tutor',
      user: { id: tutor.id, name: tutor.name, email: tutor.email }
    });
    
  } catch (err) {
    console.error('❌ Ошибка входа:', err); // 👈 логируем ошибку полностью
    res.status(500).json({ error: 'Ошибка входа' });
  }
});



router.get('/profile', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email FROM tutors WHERE id = $1', [req.tutor.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения профиля' });
  }
});


router.put('/profile', auth, [
  check('name').optional().notEmpty(),
  check('phone').optional().isMobilePhone(),
  check('subjects').optional().isArray()
], async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query(`
      UPDATE tutors SET name = $1 WHERE id = $2 RETURNING id, name, email
    `, [name, req.tutor.id]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка обновления профиля' });
  }
});


router.put('/change-password', auth, [
  check('currentPassword').notEmpty(),
  check('newPassword').isLength({ min: 6 })
], async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const result = await pool.query('SELECT * FROM tutors WHERE id = $1', [req.tutor.id]);
    const tutor = result.rows[0];

    const isMatch = await bcrypt.compare(currentPassword, tutor.password);
    if (!isMatch) return res.status(403).json({ error: 'Неверный текущий пароль' });

    const newHashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE tutors SET password = $1 WHERE id = $2', [newHashed, req.tutor.id]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка смены пароля' });
  }
});

module.exports = router;
