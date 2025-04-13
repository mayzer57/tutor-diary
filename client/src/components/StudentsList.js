function StudentsList({ students, onDelete, onEdit, onSelect }) {
  if (!students || students.length === 0) {
    return <p style={{ marginTop: '20px' }}>Нет учеников</p>;
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <h3>Список учеников</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {students.map((student) => (
          <li key={student.id} style={{
            marginBottom: '10px',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div
              style={{
                flex: '1 1 auto',
                cursor: onSelect ? 'pointer' : 'default',
                color: onSelect ? '#3b82f6' : 'inherit'
              }}
              onClick={() => onSelect?.(student.name)}
              title="Открыть журнал"
            >
              <strong>{student.name}</strong> — {student.login}
              <br />
              <span style={{ fontSize: '14px', color: '#666' }}>
                {student.subjects?.length > 0
                  ? student.subjects.map((s, i) =>
                      typeof s === 'string' ? s : s.name
                    ).join(', ')
                  : 'без предметов'}
              </span>
            </div>

            <div style={{ marginLeft: '10px' }}>
              {onEdit && (
                <button
                  onClick={() => onEdit({
                    ...student,
                    subjects: student.subjects.map(s => typeof s === 'string' ? { name: s } : s)
                  })}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#ff9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginRight: '8px',
                  }}
                >
                  ✏️ Редактировать
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => {
                    if (window.confirm(`Удалить ученика "${student.name}"?`)) {
                      onDelete(student.id);
                    }
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  🗑 Удалить
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StudentsList;