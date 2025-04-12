import { useState, useEffect } from 'react';

function EditStudentModal({ student, onSave, onClose }) {
  const [localStudent, setLocalStudent] = useState(null);
  const [newSubject, setNewSubject] = useState('');

  useEffect(() => {
    if (student) {
      setLocalStudent({
        id: student.id,
        name: student.name || '',
        login: student.login || '',
        subjects: Array.isArray(student.subjects)
          ? student.subjects.map(s => typeof s === 'string' ? s : s.name)
          : [],
      });
    }
  }, [student]);

  if (!student || !localStudent) return null;

  const handleChange = (field, value) => {
    setLocalStudent((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddSubject = () => {
    const subject = newSubject.trim();
    if (subject && !localStudent.subjects.includes(subject)) {
      setLocalStudent((prev) => ({
        ...prev,
        subjects: [...prev.subjects, subject],
      }));
      setNewSubject('');
    }
  };

  const handleRemoveSubject = (subject) => {
    setLocalStudent((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s !== subject),
    }));
  };

  const handleSubmit = () => {
    onSave({
      id: localStudent.id,
      name: localStudent.name,
      login: localStudent.login,
      subjects: localStudent.subjects.map(s => typeof s === 'string' ? s : s.name),
    }, true);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      }}>
        <h3 style={{ marginBottom: '16px' }}>Редактировать ученика</h3>

        <label>Имя:</label>
        <input
          type="text"
          value={localStudent.name}
          onChange={(e) => handleChange('name', e.target.value)}
          style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
        />

        <label>Логин:</label>
        <input
          type="text"
          value={localStudent.login}
          onChange={(e) => handleChange('login', e.target.value)}
          style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
        />

        <label>Предметы:</label>
        <div style={{ display: 'flex', marginBottom: '10px' }}>
          <input
            type="text"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            placeholder="Добавить предмет"
            style={{ flex: 1, padding: '8px' }}
          />
          <button type="button" onClick={handleAddSubject} style={{ marginLeft: '8px' }}>➕</button>
        </div>

        <ul style={{ marginBottom: '10px', paddingLeft: '20px' }}>
          {localStudent.subjects.map((s, i) => (
            <li key={typeof s === 'string' ? s : s.id || i}>
              {typeof s === 'string' ? s : s.name}
              <button type="button" onClick={() => handleRemoveSubject(s)}>❌</button>
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#ccc',
              color: '#000',
              padding: '8px 12px',
              marginRight: '10px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            style={{
              backgroundColor: '#4caf50',
              color: 'white',
              padding: '8px 12px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditStudentModal;