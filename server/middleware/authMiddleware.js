
const jwt = require('jsonwebtoken');
const pool = require('../db');

async function authMiddleware(req, res, next) {
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

    if (decoded.role === 'tutor') {
      const tutor = await pool.query('SELECT id FROM tutors WHERE id = $1', [decoded.id]);
      if (tutor.rows.length === 0) {
        return res.status(401).json({ code: 'USER_NOT_FOUND', message: 'Репетитор не найден' });
      }
      req.tutor = { id: decoded.id };
    } else if (decoded.role === 'student') {
      const student = await pool.query('SELECT id FROM students WHERE id = $1', [decoded.id]);
      if (student.rows.length === 0) {
        return res.status(401).json({ code: 'USER_NOT_FOUND', message: 'Ученик не найден' });
      }
      req.student = { id: decoded.id };
    } else {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Неизвестная роль' });
    }

    next();
  } catch (err) {
    console.error('JWT Error:', err.message);
    const errorType = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
    res.status(401).json({
      code: errorType,
      message: err.message
    });
  }
}

module.exports = authMiddleware;
