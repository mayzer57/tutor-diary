const jwt = require('jsonwebtoken');
const pool = require('../db');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ 
      code: 'TOKEN_MISSING',
      message: 'Authorization header is required'
    });
  }

  const [bearer, token] = authHeader.split(' ');

  if (bearer !== 'Bearer' || !token) {
    return res.status(401).json({
      code: 'INVALID_TOKEN_FORMAT',
      message: 'Invalid token format'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Проверка существования пользователя в БД
    pool.query('SELECT id FROM tutors WHERE id = $1', [decoded.id])
      .then(result => {
        if (result.rows.length === 0) {
          return res.status(401).json({
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          });
        }
        
        req.tutor = { id: decoded.id };
        next();
      })
      .catch(err => {
        console.error(err);
        res.status(500).json({
          code: 'SERVER_ERROR',
          message: 'Server error'
        });
      });
    
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
}

module.exports = authMiddleware;