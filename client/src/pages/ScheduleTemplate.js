import { useEffect, useState } from 'react';
import { getStudents, getTemplates, addTemplate, deleteTemplate } from '../api/api';
import { useNavigate } from 'react-router-dom';
import './Schedule.css';

const WEEKDAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

function ScheduleTemplate() {
  const [students, setStudents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({
    student_id: '',
    time: ''
  });

  const navigate = useNavigate();

  const loadAll = async () => {
    try {
      const [s, t] = await Promise.all([getStudents(), getTemplates()]);
      setStudents(s);
      setTemplates(t);
    } catch (err) {
      console.error('Ошибка загрузки данных:', err.message);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleInlineSubmit = async (e, weekday) => {
    e.preventDefault();
    try {
      await addTemplate({ ...form, weekday });
      setForm({ student_id: '', time: '' });
      await loadAll();
    } catch (err) {
      alert('Ошибка добавления шаблона');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить этот шаблон?')) return;
    try {
      await deleteTemplate(id);
      await loadAll();
    } catch (err) {
      alert('Ошибка удаления');
    }
  };

  return (
    <div className="schedule-container">
      <div className="header-row">
        <h2>📐 Шаблон расписания</h2>
        <button onClick={() => navigate('/schedule')} className="back-button">← Назад</button>
      </div>

      {WEEKDAYS.map((day, index) => {
        const templatesForDay = templates.filter(t => t.weekday === index);
        return (
          <div key={index} className="template-day">
            <div className="template-day__title">{day}</div>

            {templatesForDay.map(t => (
              <div key={t.id} className="template-day__entry">
                <div className="template-day__info">
                  ⏰ {t.time} — 👤 {t.student_name}
                </div>
                <button className="template-day__delete" onClick={() => handleDelete(t.id)}>❌</button>
              </div>
            ))}

            <form onSubmit={(e) => handleInlineSubmit(e, index)} className="template-day__form">
              <select
                name="student_id"
                value={form.student_id}
                onChange={handleChange}
                required
              >
                <option value="">👤 Ученик</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <input
                type="time"
                name="time"
                value={form.time}
                onChange={handleChange}
                required
              />

              <button type="submit">➕</button>
            </form>
          </div>
        );
      })}
    </div>
  );
}

export default ScheduleTemplate;
