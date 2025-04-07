import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudents, addStudent } from '../api/api';
import StudentForm from '../components/StudentForm';
import StudentsList from '../components/StudentsList';

function Dashboard({ onLogout }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [showStudents, setShowStudents] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStudents();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Не удалось загрузить список учеников');
      console.error('Ошибка загрузки:', err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (student) => {
    try {
      await addStudent({
        ...student,
        tutor_id: JSON.parse(localStorage.getItem('user')).id
      });
      await loadStudents();
    } catch (err) {
      setError('Не удалось добавить ученика');
      console.error('Ошибка добавления:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (onLogout) onLogout();
    navigate('/auth');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: '#2c3e50', margin: 0 }}>
          📘 Панель репетитора {user && `- ${user.name}`}
        </h1>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Выйти
        </button>
      </div>

      {error && (
        <div style={{ 
          color: 'red', 
          margin: '10px 0', 
          padding: '10px', 
          background: '#ffecec',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      <StudentForm onAddStudent={handleAddStudent} />

      <button 
        onClick={() => setShowStudents(!showStudents)}
        style={{
          margin: '20px 0',
          padding: '8px 16px',
          background: '#4f46e5',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        {showStudents ? 'Скрыть список учеников' : 'Показать список учеников'}
      </button>

      {showStudents && <StudentsList students={students} />}
    </div>
  );
}

export default Dashboard;