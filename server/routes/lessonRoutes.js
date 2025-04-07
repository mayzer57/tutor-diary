const express = require('express');
const router = express.Router();
const { createLesson, getLessons } = require('../controllers/lessonController');
const auth = require('../middleware/authMiddleware');
const studentAuth = require('../middleware/studentAuthMiddleware');

// Создание урока (только для репетиторов)
router.post('/', auth, createLesson);

// Получение уроков (доступно и репетиторам и ученикам)
router.get('/:student_id', auth, studentAuth, getLessons);

module.exports = router;  // Важно экспортировать router