import { useState } from 'react';

function StudentForm({ onAddStudent }) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !subject.trim() || !login.trim() || !password.trim()) return;
    onAddStudent({ 
      name, 
      subject, 
      login,
      password,
      tutor_id: 1 // Здесь должен быть ID текущего репетитора
    });
    setName('');
    setSubject('');
    setLogin('');
    setPassword('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ margin: '20px 0' }}>
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Имя ученика"
          style={{ padding: '8px', width: '100%' }}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Предмет"
          style={{ padding: '8px', width: '100%' }}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
  <input
    type="text"
    value={login}
    onChange={(e) => setLogin(e.target.value)}
    placeholder="Логин ученика"
    style={{ 
      padding: '8px', 
      width: '100%',
      border: '1px solid #e5e7eb',
      borderRadius: '4px'
    }}
  />
</div>
<div style={{ marginBottom: '10px' }}>
  <input
    type="password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    placeholder="Пароль ученика"
    style={{ 
      padding: '8px', 
      width: '100%',
      border: '1px solid #e5e7eb',
      borderRadius: '4px'
    }}
    minLength="6"
  />
</div>

      <button 
        type="submit"
        style={{
          padding: '8px 16px',
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Добавить
      </button>
    </form>
  );
}

export default StudentForm;