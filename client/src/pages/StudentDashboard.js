import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentProfile, fetchStudentGrades } from '../api/api';
import ProfileSettingsModal from '../components/ProfileSettingsModal';
import NotificationBell from '../components/NotificationBell';
import { isSameDay, subDays } from 'date-fns';
import './StudentDashboard.css';


function StudentDashboard({ onLogout }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [monthActivity, setMonthActivity] = useState(0);
  const [medals, setMedals] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const userType = localStorage.getItem('userType');
    if (userType !== 'student') {
      navigate('/auth');
      return;
    }

    const loadProfile = async () => {
      try {
        const profile = await getStudentProfile();
        const grades = await fetchStudentGrades();

        profile.grades = grades;
        setStudent(profile);

        const totalXP = grades.reduce((acc, l) => {
          if (l.grade === 5) return acc + 10;
          if (l.grade === 4) return acc + 7;
          if (l.grade === 3) return acc + 4;
          return acc;
        }, 0);
        setXp(totalXP);
        setLevel(Math.floor(totalXP / 50));

        const gradeDates = grades.map(g => new Date(g.date)).sort((a, b) => a - b);
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
          const checkDate = subDays(today, i);
          if (gradeDates.some(d => isSameDay(d, checkDate))) {
            streak++;
          } else {
            break;
          }
        }
        setStreakDays(streak);

        const currentMonth = new Date().getMonth();
        const uniqueDays = new Set(
          gradeDates.filter(d => d.getMonth() === currentMonth).map(d => d.toDateString())
        );
        setMonthActivity(uniqueDays.size);

        const countByGrade = grades.reduce((acc, l) => {
          if (!acc[l.grade]) acc[l.grade] = 0;
          acc[l.grade]++;
          return acc;
        }, {});
        setMedals(countByGrade);

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

  const getAvatar = () => {
    if (level >= 10) return '🧙‍♂️';
    if (level >= 5) return '🧑‍🚀';
    if (level >= 2) return '🎓';
    return '👶';
  };

  if (loading) return <div className="dashboard-loading">Загрузка...</div>;

  return (
    <div className="student-dashboard">
      <header className="dashboard-header">
        <h1>👨‍🎓 Личный кабинет ученика</h1>
        <div className="header-controls">
          <NotificationBell studentId={student?.id} />
          <button className="settings-btn" onClick={() => setIsSettingsOpen(true)}>⚙️ Настройки профиля</button>
          <button className="logout-btn" onClick={handleLogout}>Выйти</button>
        </div>
      </header>

      <div className="dashboard-content">
        <aside className="dashboard-sidebar">
          <h2>Информация</h2>
          <p className="inline-info">
            <span className="emoji-avatar-small">{getAvatar()}</span>
            <strong style={{ fontSize: 16 }}>{student.name}</strong>
          </p>
          <p><strong>Репетитор:</strong> {student.tutor_name || 'Не назначен'}</p>

          <h3 style={{ marginTop: 24 }}>📈 Прогресс</h3>
          <div className="progress-bar-bg" title="🏆 Двигайся вперёд!">
            <div
              className="progress-bar-fill"
              style={{ width: `${(xp % 50) * 2}%` }}
            />
          </div>
          <p className="progress-caption">{xp % 50}/50 до следующего уровня</p>
          <p style={{ marginTop: 4, fontSize: 14, color: '#6b7280' }}>Уровень {level}</p>
        </aside>

        <main className="dashboard-main">
          <h2>Добро пожаловать, {student.name}!</h2>
          <p>Здесь вы найдёте оценки, графики, рейтинг и мотивацию 🏆</p>

          <div className="nav-actions">
            <button className="toggle-btn" onClick={() => navigate('/student-schedule')}>
              📘 Посмотреть расписание
            </button>
            <button className="toggle-btn" onClick={() => navigate('/student-journal')}>
              📊 Перейти в дневник
            </button>
          </div>
        </main>

        <aside className="dashboard-sidebar activity-right">
          <h3>🔥 Активность</h3>
          <p><strong>Streak:</strong> {streakDays} дней подряд</p>
          <p><strong>Месяц:</strong> {monthActivity} активных дней</p>

          <h3 style={{ marginTop: 16 }}>🏅 Ачивки</h3>
          <ul className="medal-list">
            {medals[5] && <li>🌟 Отличник: {medals[5]} × 5</li>}
            {medals[4] && <li>🎖️ Хорошист: {medals[4]} × 4</li>}
            {medals[3] && <li>📘 Троечник: {medals[3]} × 3</li>}
            {!medals[3] && !medals[4] && !medals[5] && <li>⏳ Пока нет медалей</li>}
          </ul>
        </aside>
      </div>

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
