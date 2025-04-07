const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// Регистрация нового репетитора
const register = async (req, res) => {
  const { name, email, password } = req.body; // Только необходимые поля

  try {
    // Проверка существования пользователя
    const userExists = await pool.query(
      'SELECT * FROM tutors WHERE email = $1', 
      [email]
    );
    
    if (userExists.rows.length > 0) {
      return res.status(400).json({ 
        code: 'EMAIL_EXISTS', 
        message: 'Этот email уже зарегистрирован' 
      });
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Создание пользователя
    const newUser = await pool.query(
      'INSERT INTO tutors (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hashedPassword]
    );

    // Генерация токена
    const token = jwt.sign(
      { id: newUser.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      token,
      user: newUser.rows[0]
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      code: 'SERVER_ERROR',
      message: 'Ошибка сервера' 
    });
  }
};
// Авторизация репетитора
const login = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await pool.query(
      'SELECT * FROM tutors WHERE email = $1', 
      [email]
    );
    
    if (user.rows.length === 0) {
      return res.status(400).json({ 
        code: 'USER_NOT_FOUND',
        message: 'Пользователь не найден' 
      });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    
    if (!validPassword) {
      return res.status(400).json({
        code: 'INVALID_PASSWORD',
        message: 'Неверный пароль'
      });
    }

    const token = jwt.sign(
      { id: user.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Не возвращаем пароль в ответе
    const { password: _, ...userData } = user.rows[0];

    res.json({ 
      token,
      user: userData
    });
    
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Ошибка сервера'
    });
  }
};

// Получение профиля репетитора
const getProfile = async (req, res) => {
  try {
    const tutor = await pool.query(
      `SELECT id, name, email, phone, subjects, created_at 
       FROM tutors WHERE id = $1`,
      [req.tutor.id]
    );
    
    if (tutor.rows.length === 0) {
      return res.status(404).json({
        code: 'TUTOR_NOT_FOUND',
        message: 'Репетитор не найден'
      });
    }

    res.json(tutor.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Ошибка сервера'
    });
  }
};

// Обновление профиля репетитора
const updateProfile = async (req, res) => {
  const { name, phone, subjects } = req.body;
  
  try {
    const updatedTutor = await pool.query(
      `UPDATE tutors 
       SET name = $1, phone = $2, subjects = $3 
       WHERE id = $4 
       RETURNING id, name, email, phone, subjects`,
      [name, phone, subjects, req.tutor.id]
    );
    
    res.json(updatedTutor.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Ошибка сервера'
    });
  }
};

// Смена пароля
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  try {
    // Получаем текущий пароль
    const tutor = await pool.query(
      'SELECT password FROM tutors WHERE id = $1',
      [req.tutor.id]
    );
    
    // Проверяем текущий пароль
    const validPassword = await bcrypt.compare(
      currentPassword, 
      tutor.rows[0].password
    );
    
    if (!validPassword) {
      return res.status(400).json({
        code: 'INVALID_PASSWORD',
        message: 'Текущий пароль неверен'
      });
    }

    // Хешируем новый пароль
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Обновляем пароль
    await pool.query(
      'UPDATE tutors SET password = $1 WHERE id = $2',
      [hashedPassword, req.tutor.id]
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Ошибка сервера'
    });
  }
};

module.exports = { 
  register, 
  login, 
  getProfile, 
  updateProfile, 
  changePassword 
};