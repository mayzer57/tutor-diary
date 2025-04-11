import { useState } from 'react';

function AddStudentModal({ onAdd, onClose }) {
  const [student, setStudent] = useState({
    name: '',
    subject: '',
    login: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field, value) => {
    setStudent((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(student);
    onClose();
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
        <h3 style={{ marginBottom: '16px' }}>Добавить ученика</h3>

        <form onSubmit={handleSubmit}>
          <label>Имя:</label>
          <input
            type="text"
            value={student.name}
            onChange={(e) => handleChange('name', e.target.value)}
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            required
          />

          <label>Предмет:</label>
          <input
            type="text"
            value={student.subject}
            onChange={(e) => handleChange('subject', e.target.value)}
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            required
          />

          <label>Логин:</label>
          <input
            type="text"
            value={student.login}
            onChange={(e) => handleChange('login', e.target.value)}
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            required
          />

          <label>Пароль:</label>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={student.password}
              onChange={(e) => handleChange('password', e.target.value)}
              style={{ flex: 1, padding: '8px' }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                marginLeft: '8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
              }}
              title={showPassword ? 'Скрыть' : 'Показать'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
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
              type="submit"
              style={{
                backgroundColor: '#4caf50',
                color: 'white',
                padding: '8px 12px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Добавить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddStudentModal;