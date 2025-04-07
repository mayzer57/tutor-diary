
const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getProfile, 
  updateProfile, 
  changePassword 
} = require('../controllers/tutorController');
const auth = require('../middleware/authMiddleware');
const { check } = require('express-validator');

// Публичные маршруты
router.post('/register', [
  check('name').notEmpty().withMessage('Имя обязательно'),
  check('email').isEmail().withMessage('Некорректный email'),
  check('password')
    .isLength({ min: 6 })
    .withMessage('Пароль должен быть не менее 6 символов')
], register);

router.post('/login', [
  check('email').isEmail().withMessage('Некорректный email'),
  check('password').notEmpty().withMessage('Пароль обязателен')
], login);

// Защищенные маршруты (требуют аутентификации)
router.get('/profile', auth, getProfile);
router.put('/profile', auth, [
  check('name').optional().notEmpty(),
  check('phone').optional().isMobilePhone(),
  check('subjects').optional().isArray()
], updateProfile);

router.put('/change-password', auth, [
  check('currentPassword').notEmpty().withMessage('Текущий пароль обязателен'),
  check('newPassword').isLength({ min: 6 }).withMessage('Новый пароль должен быть не менее 6 символов')
], changePassword);

module.exports = router;