const API_URL = 'http://localhost:5001/api';

export const authHeader = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
};

// src/api/api.js
export const register = async (name, email, password) => {
  try {
    const response = await fetch(`${API_URL}/tutors/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      // Создаем настоящий объект Error
      const error = new Error(errorData.message || 'Ошибка регистрации');
      error.code = errorData.code || 'REGISTRATION_FAILED';
      throw error;
    }

    return await response.json();
  } catch (err) {
    console.error('API Error:', err);
    throw err; // Перебрасываем существующую ошибку
  }
};
export const login = async (email, password) => {
  try {
    console.log('Sending login request...'); // Логирование запроса
    const response = await fetch(`${API_URL}/tutors/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    console.log('Response status:', response.status); // Логирование статуса
    
    const data = await response.json();
    console.log('Response data:', data); // Логирование данных ответа

    if (!response.ok) {
      throw new Error(data.message || 'Ошибка входа');
    }

    return data;
  } catch (err) {
    console.error('Login API error:', err);
    throw err;
  }
};

export const getStudents = async () => {
  try {
    const res = await fetch(`${API_URL}/students`, { 
      headers: authHeader() 
    });
    
    if (res.status === 401) {
      // При 401 ошибке очищаем токен и перенаправляем
      localStorage.removeItem('token');
      window.location.href = '/auth';
      throw new Error('Сессия истекла');
    }
    
    if (!res.ok) {
      throw new Error('Ошибка при загрузке учеников');
    }
    
    return await res.json();
  } catch (err) {
    console.error('Ошибка при загрузке учеников:', err);
    throw err;
  }
};

export const addStudent = async (student) => {
  const res = await fetch(`${API_URL}/students`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(student)
  });
  return res.json();
};
// Добавляем новые методы для работы с учениками
export const loginStudent = async (login, password) => {
  try {
    const response = await fetch(`${API_URL}/students/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Ошибка входа ученика');
    return data;
  } catch (err) {
    console.error('Student login error:', err);
    throw err;
  }
};

export const getStudentProfile = async () => {
  try {
    const res = await fetch(`${API_URL}/students/me`, { 
      headers: authHeader() 
    });
    if (!res.ok) throw new Error('Ошибка загрузки профиля ученика');
    return await res.json();
  } catch (err) {
    console.error('Ошибка загрузки профиля:', err);
    throw err;
  }
};
// В api.js заменяем функции:

export const updateUserProfile = async (id, updates) => {
  const isTutor = localStorage.getItem('userType') === 'tutor';
  const endpoint = isTutor ? `/users/tutor/${id}` : `/users/${id}`;

  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify(updates)
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Ошибка обновления профиля');
  }
  return await res.json();
};

export const changePassword = async ({ userId, userType, newPassword }) => {
  const res = await fetch(`${API_URL}/auth/change-password`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({ userId, userType, newPassword })
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Ошибка смены пароля');
  }

  return res.json();
};
