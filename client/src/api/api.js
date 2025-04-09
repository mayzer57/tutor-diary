const API_URL = 'http://localhost:5001/api';

// 🔐 Заголовок авторизации
export const authHeader = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

// 🧯 Безопасный парсинг JSON
export const safeJson = async (res) => {
  const contentType = res.headers.get('content-type');
  if (res.status === 204 || !contentType || !contentType.includes('application/json')) {
    return {};
  }
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  } catch (err) {
    console.warn('[safeJson] JSON Parse error:', err.message);
    return {};
  }
};

// ✅ Регистрация репетитора
export const register = async (name, email, password) => {
  const response = await fetch(`${API_URL}/tutors/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    const errorData = await safeJson(response);
    const error = new Error(errorData.message || 'Ошибка регистрации');
    error.code = errorData.code || 'REGISTRATION_FAILED';
    throw error;
  }

  return await safeJson(response);
};

// ✅ Вход репетитора
export const login = async (email, password) => {
  const response = await fetch(`${API_URL}/tutors/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await safeJson(response);

  if (!response.ok) throw new Error(data.message || 'Ошибка входа');

  localStorage.setItem('token', data.token);
  localStorage.setItem('userType', 'tutor');
  localStorage.setItem('user', JSON.stringify(data.user));
  return data;
};

// ✅ Вход ученика
export const loginStudent = async (login, password) => {
  const response = await fetch(`${API_URL}/students/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, password }),
  });

  const data = await safeJson(response);

  if (!response.ok) throw new Error(data.message || 'Ошибка входа ученика');

  localStorage.setItem('token', data.token);
  localStorage.setItem('userType', 'student');
  localStorage.setItem('user', JSON.stringify(data.user));
  return data;
};

// 👤 Профиль ученика
export const getStudentProfile = async () => {
  const res = await fetch(`${API_URL}/students/me`, {
    headers: authHeader(),
  });
  if (!res.ok) throw new Error('Ошибка загрузки профиля ученика');
  return await safeJson(res);
};

// 👤 Получить список учеников
export const getStudents = async () => {
  const res = await fetch(`${API_URL}/students`, {
    headers: authHeader(),
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/auth';
    throw new Error('Сессия истекла');
  }

  if (!res.ok) throw new Error('Ошибка при загрузке учеников');
  return await safeJson(res);
};

// 👤 Добавить ученика
export const addStudent = async (student) => {
  const res = await fetch(`${API_URL}/students`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(student),
  });
  return await safeJson(res);
};

// 📅 Уроки репетитора
export const getTutorLessons = async () => {
  const res = await fetch(`${API_URL}/lessons`, {
    headers: authHeader(),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || 'Ошибка загрузки уроков');
  return data;
};

// 📅 Уроки ученика
export const getStudentLessons = async () => {
  const res = await fetch(`${API_URL}/lessons/student`, {
    headers: authHeader(),
  });
  if (!res.ok) throw new Error('Ошибка загрузки расписания ученика');
  return await safeJson(res);
};

// 📅 Уроки по неделе
export const getLessonsByWeek = async (startDate, endDate) => {
  const res = await fetch(`${API_URL}/lessons?start=${startDate}&end=${endDate}`, {
    headers: authHeader(),
  });
  if (!res.ok) throw new Error('Ошибка при получении уроков');
  return await safeJson(res);
};

// ➕ Добавить урок
export const addLesson = async (lesson) => {
  const res = await fetch(`${API_URL}/lessons`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(lesson),
  });
  if (!res.ok) throw new Error('Ошибка при добавлении урока');
  return await safeJson(res);
};

// ✏️ Обновить урок
export const updateLesson = async (id, updates) => {
  const res = await fetch(`${API_URL}/lessons/${id}`, {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const error = await safeJson(res);
    throw new Error(error.message || 'Ошибка при обновлении урока');
  }
  return await safeJson(res);
};

// ❌ Удалить урок
export const deleteLesson = async (id) => {
  const res = await fetch(`${API_URL}/lessons/${id}`, {
    method: 'DELETE',
    headers: authHeader(),
  });
  if (!res.ok) throw new Error('Ошибка при удалении урока');
  return await safeJson(res);
};

// 🧬 Клонировать недели
export const cloneMultipleWeeks = async (fromDate, weeks = 4) => {
  const res = await fetch(`${API_URL}/lessons/clone-multiple`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({ from: fromDate, weeks }),
  });
  if (!res.ok) throw new Error('Ошибка клонирования');
  return await safeJson(res);
};

// 📋 Получить шаблоны
export const getTemplates = async () => {
  const res = await fetch(`${API_URL}/lessons/templates`, {
    headers: authHeader(),
  });
  if (!res.ok) throw new Error('Ошибка загрузки шаблонов');
  return await safeJson(res);
};

// ➕ Добавить шаблон
export const addTemplate = async (template) => {
  const res = await fetch(`${API_URL}/lessons/templates`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(template),
  });
  if (!res.ok) throw new Error('Ошибка добавления шаблона');
  return await safeJson(res);
};

// ❌ Удалить шаблон
export const deleteTemplate = async (id) => {
  const res = await fetch(`${API_URL}/lessons/templates/${id}`, {
    method: 'DELETE',
    headers: authHeader(),
  });
  if (!res.ok) throw new Error('Ошибка удаления шаблона');
  return await safeJson(res);
};

// 📅 Применить шаблон на неделю
export const applyTemplateToWeek = async (startDate) => {
  const res = await fetch(`${API_URL}/lessons/apply-template`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({ start: startDate }),
  });
  if (!res.ok) throw new Error('Ошибка применения шаблона');
  return await safeJson(res);
};

// ⚙️ Обновление профиля (ученик/репетитор)
export const updateUserProfile = async (id, updates) => {
  const isTutor = localStorage.getItem('userType') === 'tutor';
  const endpoint = isTutor ? `/users/tutor/${id}` : `/users/${id}`;

  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const error = await safeJson(res);
    throw new Error(error.message || 'Ошибка обновления профиля');
  }
  return await safeJson(res);
};

// 🔑 Смена пароля
export const changePassword = async ({ userId, userType, newPassword }) => {
  const res = await fetch(`${API_URL}/auth/change-password`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({ userId, userType, newPassword }),
  });

  if (!res.ok) {
    const error = await safeJson(res);
    throw new Error(error.message || 'Ошибка смены пароля');
  }

  return await safeJson(res);
};