const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// Создание ученика (теперь с логином и паролем)
const createStudent = async (req, res) => {
  const { name, subject, login, password } = req.body;
  const tutorId = req.tutor.id;
  
  try {
    // Проверка уникальности логина
    const loginExists = await pool.query(
      'SELECT id FROM students WHERE login = $1',
      [login]
    );
    
    if (loginExists.rows.length > 0) {
      return res.status(400).json({
        code: 'LOGIN_EXISTS',
        message: 'Этот логин уже занят'
      });
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newStudent = await pool.query(
      `INSERT INTO students 
       (tutor_id, name, subject, login, password) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, subject, login`,
      [tutorId, name, subject, login, hashedPassword]
    );
    
    res.status(201).json(newStudent.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      code: 'SERVER_ERROR',
      message: 'Ошибка при создании ученика' 
    });
  }
};

// Получение списка учеников
const getStudents = async (req, res) => {
  const tutorId = req.tutor.id;
  
  try {
    const students = await pool.query(
      'SELECT id, name, subject, login FROM students WHERE tutor_id = $1',
      [tutorId]
    );
    
    res.json(students.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      code: 'SERVER_ERROR',
      message: 'Ошибка при получении списка учеников' 
    });
  }
};

// Вход ученика
const loginStudent = async (req, res) => {
  const { login, password } = req.body;
  
  try {
    const student = await pool.query(
      'SELECT * FROM students WHERE login = $1', 
      [login]
    );
    
    if (student.rows.length === 0) {
      return res.status(400).json({ 
        code: 'STUDENT_NOT_FOUND',
        message: 'Ученик не найден' 
      });
    }

    const validPassword = await bcrypt.compare(password, student.rows[0].password);
    
    if (!validPassword) {
      return res.status(400).json({
        code: 'INVALID_PASSWORD',
        message: 'Неверный пароль'
      });
    }

    const token = jwt.sign(
      { id: student.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Не возвращаем пароль в ответе
    const { password: _, ...studentData } = student.rows[0];

    res.json({ 
      token,
      user: studentData
    });
    
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Ошибка сервера'
    });
  }
};

// Получение профиля ученика
const getStudentProfile = async (req, res) => {
  try {
    const student = await pool.query(
      `SELECT s.id, s.name, s.subject, s.login, t.name as tutor_name 
       FROM students s
       JOIN tutors t ON s.tutor_id = t.id
       WHERE s.id = $1`,
      [req.student.id]
    );
    
    if (student.rows.length === 0) {
      return res.status(404).json({
        code: 'STUDENT_NOT_FOUND',
        message: 'Ученик не найден'
      });
    }

    res.json(student.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Ошибка сервера'
    });
  }
};

module.exports = { 
  createStudent, 
  getStudents,
  loginStudent,
  getStudentProfile 
};