import { useState, useEffect } from 'react';

function EditStudentModal({ student, onSave, onClose }) {
  const [localStudent, setLocalStudent] = useState(null);

  useEffect(() => {
    setLocalStudent(student);
  }, [student]);

  // ⚠ Проверка после хука — безопасна для React
  if (!student || !localStudent) return null;

  const handleChange = (field, value) => {
    setLocalStudent((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSave(localStudent, true);
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

        <label>Предмет:</label>
        <input
          type="text"
          value={localStudent.subject}
          onChange={(e) => handleChange('subject', e.target.value)}
          style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
        />

        <label>Логин:</label>
        <input
          type="text"
          value={localStudent.login}
          onChange={(e) => handleChange('login', e.target.value)}
          style={{ width: '100%', padding: '8px', marginBottom: '16px' }}
        />

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