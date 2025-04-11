import { useState } from 'react';

function StudentForm({ onAddStudent }) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [toast, setToast] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !subject.trim() || !login.trim() || !password.trim()) return;

    try {
      const res = await onAddStudent({
        name,
        subject,
        login,
        password
      });

      if (res?.message) {
        setToast(res.message);
        setTimeout(() => setToast(''), 3000); // ⏱ Убрать сообщение через 3 секунды
      }

      setName('');
      setSubject('');
      setLogin('');
      setPassword('');
    } catch {
      setToast('Произошла ошибка при добавлении');
      setTimeout(() => setToast(''), 3000);
    }
  };

  return (
    <>
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#4caf50',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
        }}>
          {toast}
        </div>
      )}
      
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
    </>
  );
}

export default StudentForm;