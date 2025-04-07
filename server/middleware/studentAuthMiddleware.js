const jwt = require('jsonwebtoken');
const pool = require('../db');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ 
      code: 'TOKEN_MISSING',
      message: 'Требуется авторизация'
    });
  }

  const [bearer, token] = authHeader.split(' ');

  if (bearer !== 'Bearer' || !token) {
    return res.status(401).json({
      code: 'INVALID_TOKEN_FORMAT',
      message: 'Неверный формат токена'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Проверяем существование ученика
    const student = await pool.query(
      'SELECT id, tutor_id FROM students WHERE id = $1', 
      [decoded.id]
    );
    
    if (student.rows.length === 0) {
      return res.status(401).json({
        code: 'USER_NOT_FOUND',
        message: 'Ученик не найден'
      });
    }
    
    req.student = { 
      id: decoded.id,
      tutor_id: student.rows[0].tutor_id 
    };
    next();
    
  } catch (err) {
    console.error('JWT Error:', err.message);
    
    const errorType = err.name === 'TokenExpiredError' 
      ? 'TOKEN_EXPIRED' 
      : 'INVALID_TOKEN';

    res.status(401).json({
      code: errorType,
      message: err.message
    });
  }
};