// src/pages/Dashboard.js
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudents, addStudent } from '../api/api';
import StudentForm from '../components/StudentForm';
import StudentsList from '../components/StudentsList';
import ProfileSettingsModal from '../components/ProfileSettingsModal';
import './Dashboard.css'; // добавь css сюда

function Dashboard({ onLogout }) {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [showStudents, setShowStudents] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setError(null);
      const data = await getStudents();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Не удалось загрузить список учеников');
      console.error('Ошибка загрузки:', err);
      setStudents([]);
    }
  };
  

  const handleAddStudent = async (student) => {
    try {
      await addStudent({
        ...student,
        tutor_id: user?.id
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
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>📘 Панель репетитора {user && `- ${user.name}`}</h1>
        <div className="header-controls">
          <button className="settings-btn" onClick={() => setIsSettingsOpen(true)}>⚙️ Настройки профиля</button>
          <button className="logout-btn" onClick={handleLogout}>Выйти</button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <StudentForm onAddStudent={handleAddStudent} />

      <ProfileSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={{ id: user?.id, role: 'tutor' }}
        initialData={user}
        setUser={setUser} // 👈 передаём сюда
      />


      <button className="toggle-btn" onClick={() => setShowStudents(!showStudents)}>
        {showStudents ? 'Скрыть список учеников' : 'Показать список учеников'}
      </button>

      {showStudents && <StudentsList students={students} />}
    </div>
  );
}

export default Dashboard;
