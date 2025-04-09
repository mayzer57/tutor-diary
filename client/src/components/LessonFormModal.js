import { useState, useEffect } from 'react';
import { getStudents, addLesson, updateLesson, deleteLesson } from '../api/api';
import './LessonFormModal.css';
import { format } from 'date-fns';

function LessonFormModal({ isOpen, onClose, initialData = null, selectedDate }) {
  const [students, setStudents] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    student_id: '',
    date: '',
    time: '',
    homework: '',
    homework_file: '',
    grade: '',
  });

  // 🔄 Загрузка учеников
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const data = await getStudents();
        setStudents(data);
      } catch (err) {
        console.error('Ошибка загрузки учеников:', err.message);
      }
    };
    if (isOpen) loadStudents();
  }, [isOpen]);

  // 🎯 Заполнение формы при открытии модалки
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setForm({
        student_id: initialData.student_id || '',
        date: initialData.date || '',
        time: initialData.time || '',
        homework: initialData.homework || '',
        homework_file: initialData.homework_file || '',
        grade: initialData.grade ?? '',
      });
    } else {
      setForm({
        student_id: '',
        date: format(new Date(selectedDate), 'yyyy-MM-dd') || '',
        time: '',
        homework: '',
        homework_file: '',
        grade: '',
      });
    }
  }, [initialData, selectedDate, isOpen]);

  const handleChange = (e) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      ...form,
      grade: form.grade === '' ? null : Number(form.grade),
    };

    try {
      if (initialData?.id) {
        await updateLesson(initialData.id, payload);
      } else {
        await addLesson(payload);
      }

      await new Promise((r) => setTimeout(r, 100)); // 🔄 Небольшая задержка
      onClose(true);
    } catch (err) {
      console.error('Ошибка при сохранении урока:', err.message);
      if (err.message.includes('существует')) {
        alert('❗ Такой урок уже существует');
      } else {
        alert(err.message || 'Ошибка при сохранении урока');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Удалить урок?')) {
      try {
        await deleteLesson(initialData.id);
        onClose(true);
      } catch (err) {
        console.error('Ошибка при удалении урока:', err.message);
        alert('Ошибка удаления урока');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{initialData?.id ? 'Редактировать урок' : 'Добавить урок'}</h3>
        <form onSubmit={handleSubmit}>
          <label>Ученик:</label>
          <select
            name="student_id"
            value={students.some(s => s.id === Number(form.student_id)) ? form.student_id : ''}
            onChange={handleChange}
            required
          >
            <option value="">Выберите ученика</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <label>Время:</label>
          <input
            type="time"
            name="time"
            value={form.time}
            onChange={handleChange}
            required
          />

          <label>Домашнее задание:</label>
          <input
            type="text"
            name="homework"
            value={form.homework}
            onChange={handleChange}
          />

          <input
            type="text"
            name="homework_file"
            placeholder="Ссылка на файл"
            value={form.homework_file || ''}
            onChange={handleChange}
          />

          <label>Оценка:</label>
          <input
            type="number"
            name="grade"
            value={form.grade}
            onChange={handleChange}
            min={1}
            max={5}
          />

          <div className="modal-buttons">
            <button type="submit" disabled={isSaving}>
              {isSaving ? 'Сохраняю...' : '💾 Сохранить'}
            </button>
            <button type="button" onClick={() => onClose(false)}>Отмена</button>
            {initialData?.id && (
              <button type="button" className="delete-btn" onClick={handleDelete}>
                ❌ Удалить
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default LessonFormModal;
