// src/pages/StudentDashboard.js
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentProfile } from '../api/api';
import './StudentDashboard.css';
import ProfileSettingsModal from '../components/ProfileSettingsModal';

function StudentDashboard({ onLogout }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); 
  useEffect(() => {
    const userType = localStorage.getItem('userType');
    if (userType !== 'student') {
      navigate('/auth');
      return;
    }

    const loadProfile = async () => {
      try {
        const profile = await getStudentProfile();
        setStudent(profile);
      } catch (err) {
        console.error('Ошибка загрузки профиля:', err);
        localStorage.clear();
        navigate('/auth');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    onLogout();
    navigate('/auth');
  };

  if (loading) return <div className="dashboard-loading">Загрузка...</div>;

  return (
    <div className="student-dashboard">
      <header className="dashboard-header">
        <h1>👨‍🎓 Личный кабинет ученика</h1>
        <div className="header-controls">
          <button className="settings-btn" onClick={() => setIsSettingsOpen(true)}>
            ⚙️ Настройки профиля
          </button>
          <button className="logout-btn" onClick={handleLogout}>Выйти</button>
        </div>
      </header>

      <div className="dashboard-content">
        <aside className="dashboard-sidebar">
          <h2>Информация</h2>
          <p><strong>Имя:</strong> {student.name}</p>
          <p><strong>Предмет:</strong> {student.subject}</p>
          <p><strong>Репетитор:</strong> {student.tutor_name || 'Не назначен'}</p>
        </aside>

        <main className="dashboard-main">
          <h2>Добро пожаловать, {student.name}!</h2>
          <p>Здесь появится ваше расписание, оценки и дневник 📘</p>
        </main>
      </div>
       {/* Профиль модал */}
       <ProfileSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={{ id: student?.id, role: 'student' }}
        initialData={student}
      />

    </div>
  );
}

export default StudentDashboard;
