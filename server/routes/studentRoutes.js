const express = require('express');
const router = express.Router();
const { 
  createStudent, 
  getStudents,
  loginStudent,
  getStudentProfile
} = require('../controllers/studentController');
const auth = require('../middleware/authMiddleware');
const studentAuth = require('../middleware/studentAuthMiddleware');
const { check } = require('express-validator');

// Маршруты для репетиторов
router.post('/', auth, [
  check('name').notEmpty().withMessage('Имя обязательно'),
  check('subject').notEmpty().withMessage('Предмет обязателен'),
  check('login').notEmpty().withMessage('Логин обязателен'),
  check('password').isLength({ min: 6 }).withMessage('Пароль должен быть не менее 6 символов')
], createStudent);

router.get('/', auth, getStudents);

// Маршруты для учеников
router.post('/login', [
  check('login').notEmpty().withMessage('Логин обязателен'),
  check('password').notEmpty().withMessage('Пароль обязателен')
], loginStudent);

router.get('/me', studentAuth, getStudentProfile);

module.exports = router;