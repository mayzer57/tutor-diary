const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Проверка подключения и создание таблиц при необходимости
const initializeDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tutors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      )
    `);
    
    // В функции initializeDatabase обновляем создание таблицы students
    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        tutor_id INTEGER REFERENCES tutors(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        subject VARCHAR(50) NOT NULL,
        login VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
    )
`);
    
    console.log('База данных инициализирована');
  } catch (err) {
    console.error('Ошибка инициализации БД:', err);
  }
};

initializeDatabase();

module.exports = pool;