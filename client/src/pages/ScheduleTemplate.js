import { useEffect, useState } from 'react';
import { getStudents, getTemplates, addTemplate, deleteTemplate } from '../api/api';
import { useNavigate } from 'react-router-dom';
import './Schedule.css';

const WEEKDAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

function ScheduleTemplate() {
  const [students, setStudents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [templatesData, setTemplatesData] = useState(() => {
    const init = {};
    for (let i = 0; i < 7; i++) {
      init[i] = { student_id: '', subject_id: '', time: '', price: '' };
    }
    return init;
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

  const handleTemplateChange = (weekday, field, value) => {
    setTemplatesData(prev => ({
      ...prev,
      [weekday]: {
        ...prev[weekday],
        [field]: value
      }
    }));
  };

  const handleInlineSubmit = async (e, weekday) => {
    e.preventDefault();
    const data = templatesData[weekday];
    try {
      await addTemplate({ ...data, weekday });
      setTemplatesData(prev => ({
        ...prev,
        [weekday]: { student_id: '', subject_id: '', time: '', price: '' }
      }));
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
                  ⏰ {t.time} — 👤 {t.student_name} 📘 {t.subject_name} 💰 {t.price || '—'}
                </div>
                <button className="template-day__delete" onClick={() => handleDelete(t.id)}>❌</button>
              </div>
            ))}

            <form onSubmit={(e) => handleInlineSubmit(e, index)} className="template-day__form">
              <select
                value={templatesData[index].student_id}
                onChange={(e) => handleTemplateChange(index, 'student_id', e.target.value)}
                required
              >
                <option value="">👤 Ученик</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <select
                value={templatesData[index].subject_id}
                onChange={(e) => handleTemplateChange(index, 'subject_id', e.target.value)}
                required
              >
                <option value="">📘 Предмет</option>
                {(students.find(s => String(s.id) === String(templatesData[index].student_id))?.subjects || []).map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {typeof sub === 'string' ? sub : sub.name}
                  </option>
                ))}
              </select>

              <input
                type="time"
                value={templatesData[index].time}
                onChange={(e) => handleTemplateChange(index, 'time', e.target.value)}
                required
              />

              <input
                type="number"
                placeholder="Цена ₽"
                value={templatesData[index].price}
                onChange={(e) => handleTemplateChange(index, 'price', e.target.value)}
                style={{ width: '80px' }}
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