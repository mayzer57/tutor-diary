import React from 'react';

function StudentsList({ students }) {
  if (!students || students.length === 0) {
    return <p>Нет учеников</p>;
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <h2>📋 Список учеников</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {students.map((student) => (
          <li key={student.id} style={{
            marginBottom: '10px',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: '#f9f9f9'
          }}>
            <strong>Имя:</strong> {student.name}<br />
            <strong>Предмет:</strong> {student.subject}<br />
            <strong>Логин:</strong> {student.login}<br />
            <strong>Пароль:</strong> {student.password}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StudentsList;
