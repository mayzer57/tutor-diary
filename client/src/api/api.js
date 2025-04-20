export const API_URL = "https://mayzer57-tutor-diary-2e5c.twc1.net/api";



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

  if (!response.ok) {
    const error = new Error(data.error || data.message || 'Ошибка входа');
    error.code = response.status;
    throw error;
  }

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

  if (!response.ok) {
    const error = new Error(data.error || data.message || 'Ошибка входа ученика');
    error.code = response.status;
    throw error;
  }

  localStorage.setItem('token', data.token);
  localStorage.setItem('userType', 'student');
  localStorage.setItem('user', JSON.stringify(data.user));
  return data;
};
export const deleteStudent = async (id) => {
  const res = await fetch(`${API_URL}/students/${id}`, {
    method: 'DELETE',
    headers: authHeader()
  });

  if (!res.ok) {
    const error = await safeJson(res);
    throw new Error(error.message || 'Ошибка удаления ученика');
  }

  return await safeJson(res);
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
    body: JSON.stringify({
      name: student.name,
      login: student.login,
      password: student.password,
      subjects: student.subjects, // обязательно массив строк
    }),
  });

  const data = await safeJson(res);

  if (!res.ok) {
    console.error('Ошибка создания ученика:', data);
    const error = new Error(data?.error || 'Ошибка добавления ученика');
    error.code = res.status;
    throw error;
  }

  return data;
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
export const updateStudent = async (student) => {
  const res = await fetch(`${API_URL}/students/${student.id}`, {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify({
      name: student.name,
      login: student.login,
      subjects: Array.isArray(student.subjects)
        ? student.subjects.map(s => typeof s === 'string' ? s : s.name)
        : [],
    }),
  });

  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(data.error || 'Ошибка обновления ученика');
  }

  return data;
};

// 📚 Получить все оценки репетитора

// src/api/api.js
export async function getTutorGrades(
  period,
  offset = 0,
  limit = 50,
  filters = {},
  customRange = null
) {
  const now = new Date();
  let startDate = null;
  let endDate = now.toISOString().split('T')[0];

  if (customRange && customRange.start && customRange.end) {
    startDate = customRange.start;
    endDate = customRange.end;
  } else if (period !== 'all') {
    const daysMap = {
      '7': 7,
      '30': 30,
      '90': 90,
      '365': 365,
      '3 месяца': 90,
      'Год': 365
    };

    let daysBack = daysMap[period];

    // 💡 Пробуем парсить как число
    if (daysBack === undefined && !isNaN(Number(period))) {
      daysBack = Number(period);
    }

    if (typeof daysBack === 'number' && daysBack > 0) {
      const start = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
      startDate = start.toISOString().split('T')[0];
    } else {
      console.warn('[getTutorGrades] ❌ Invalid period value:', period);
      startDate = null; // fallback
    }
  }

  console.log({ startDate, endDate });

  const params = new URLSearchParams({
    limit,
    offset,
    ...(startDate && { start: startDate, end: endDate }),
    ...(filters.student && { student: filters.student }),
    ...(filters.subject && { subject: filters.subject }),
  });

  const res = await fetch(`${API_URL}/lessons/grades?${params.toString()}`, {
    headers: authHeader(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`[getTutorGrades] Ошибка ответа: ${res.status} - ${errText}`);
  }

  return await res.json();
}
// 🔁 Обновление только оценки
export async function updateLessonGrade(id, grade) {
  const res = await fetch(`${API_URL}/lessons/${id}/grade`, {
    method: 'PATCH',
    headers: {
      ...authHeader(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ grade: Number(grade) })
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || 'Ошибка обновления оценки');
  return data;
}
export async function getMyGrades() {
  const res = await fetch(`${API_URL}/students/my-grades`, {
    headers: authHeader(),
  });
  return await safeJson(res);
}

export async function getStudentRanking() {
  const res = await fetch(`${API_URL}/students/ranking`, {
    headers: authHeader(),
  });
  return await safeJson(res);
}
// ✅ В api.js
export async function fetchStudentGrades() {
  const res = await fetch(`${API_URL}/students/my-grades`, {
    headers: authHeader()
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ошибка загрузки оценок: ${text}`);
  }

  return await res.json(); // [{ date, grade, subject }]
}
// 🔔 Получить уведомления ученика
// 🔔 Получить уведомления ученика
export async function getStudentNotifications(studentId) {
  const res = await fetch(`${API_URL}/notifications?student_id=${studentId}`, {
    headers: authHeader(),
  });

  if (!res.ok) throw new Error('Ошибка загрузки уведомлений');
  return await res.json(); // [{ id, message, created_at }]
}



// ➕ Добавить уведомление
export async function createNotification(studentId, message) {
  const res = await fetch(`${API_URL}/notifications`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({ student_id: studentId, message }),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || 'Ошибка создания уведомления');
  return data;
}
// ✅ Обновить уведомление как прочитанное
// 📌 Пометить уведомление как прочитанное
export async function markNotificationAsRead(id) {
  const res = await fetch(`${API_URL}/notifications/${id}/read`, {
    method: 'PATCH',
    headers: authHeader(),
  });

  if (!res.ok) throw new Error('Ошибка при пометке уведомления');
  return await res.json();
}

// ❌ Удалить одно уведомление
export async function deleteNotification(id) {
  const res = await fetch(`${API_URL}/notifications/${id}`, {
    method: 'DELETE',
    headers: authHeader(),
  });

  if (!res.ok) throw new Error('Ошибка при удалении уведомления');
  return await res.json();
}

export async function getChatMessages(studentId, tutorId) {
  const res = await fetch(`${API_URL}/chat?student_id=${studentId}&tutor_id=${tutorId}`, {
    headers: authHeader(),
  });
  return await res.json();
}

export async function sendChatMessage(formData) {
  const res = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: {
      Authorization: authHeader().Authorization, // ⚠️ только токен, без Content-Type!
    },
    body: formData,
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || 'Ошибка отправки сообщения');
  return data;
}
export async function getChatListForTutor() {
  const res = await fetch(`${API_URL}/chat/chats`, {
    headers: authHeader(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ошибка загрузки чатов: ${errText}`);
  }

  return await res.json(); // [{ student_id, name, last_message_at }]
}
