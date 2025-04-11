function StudentsList({ students, onDelete, onEdit }) {
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
            alignItems: 'center'
          }}>
            <div>
              <strong>{student.name}</strong> — {student.subject} ({student.login})
            </div>

            <div>
              {onEdit && (
                <button
                  onClick={() => onEdit(student)}
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