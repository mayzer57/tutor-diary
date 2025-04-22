import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudents, addStudent, deleteStudent, updateStudent } from '../api/api';

import StudentsList from '../components/StudentsList';
import ProfileSettingsModal from '../components/ProfileSettingsModal';
import EditStudentModal from '../components/EditStudentModal';
import AddStudentModal from '../components/AddStudentModal';
import './Dashboard.css';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
function Dashboard({ onLogout }) {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [toast, setToast] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStudents, setShowStudents] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const navigate = useNavigate();
  const [unread] = useUnreadMessages(); // ✅ правильно

  const [user, setUser] = useState(() => {
    const data = localStorage.getItem('user');
    try {
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
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
      const res = await addStudent({
        ...student,
        tutor_id: user?.id
      });
      await loadStudents();
      return res;
    } catch (err) {
      setError('Не удалось добавить ученика');
      console.error('Ошибка добавления:', err);
    }
  };

  const handleDeleteStudent = async (id) => {
    try {
      const res = await deleteStudent(id);
      await loadStudents();
      setToast(res.message || 'Ученик удалён');
      setTimeout(() => setToast(''), 3000);
      return res;
    } catch (err) {
      console.error('Ошибка при удалении:', err);
      setError('Не удалось удалить ученика');
      throw err;
    }
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
  };

  const handleUpdateStudent = async (updatedStudent) => {
    try {
      const res = await updateStudent(updatedStudent);
      await loadStudents();
      setEditingStudent(null);
      setToast(res.message || 'Ученик обновлён');
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      console.error('Ошибка обновления:', err);
      setError('Не удалось обновить ученика');
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

      <header className="dashboard-header">
        <h1>📘 Панель репетитора {user && `- ${user.name}`}</h1>
        <div className="header-controls">
  <button className="settings-btn" onClick={() => setIsSettingsOpen(true)}>⚙️ Настройки профиля</button>


<button className="settings-btn" onClick={() => navigate('/chat')}>
  📘 Чат
  {unread > 0 && <span className="chat-badge">{unread}</span>}
</button>
  <button className="logout-btn" onClick={handleLogout}>Выйти</button>
</div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="dashboard-grid">
  <button className="dashboard-btn" onClick={() => setShowAddModal(true)}>
    ➕ Добавить ученика
  </button>
  <button className="dashboard-btn" onClick={() => navigate('/schedule')}>
    📅 Расписание
  </button>
  <button className="dashboard-btn" onClick={() => navigate('/journal')}>
    📘 Журнал
  </button>
  <button className="dashboard-btn" onClick={() => navigate('/finance')}>
    💰 Финансы
  </button>
</div>


      {showAddModal && (
        <AddStudentModal
          onAdd={handleAddStudent}
          onClose={() => setShowAddModal(false)}
        />
      )}

      

      <EditStudentModal
        student={editingStudent}
        onSave={(student, save) => save && handleUpdateStudent(student)}
        onClose={() => setEditingStudent(null)}
      />

      <ProfileSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={{ id: user?.id, role: 'tutor' }}
        initialData={user}
        setUser={setUser}
      />

      <button className="dashboard-btn" onClick={() => setShowStudents(!showStudents)}>
        {showStudents ? 'Скрыть список учеников' : 'Показать список учеников'}
      </button>

      {showStudents && (
        <StudentsList
        students={students}
        onDelete={handleDeleteStudent}
        onEdit={handleEditStudent}
        onSelect={(studentName) => navigate(`/journal?student=${encodeURIComponent(studentName)}`)}
      />
      )}
    </div>
  );
}

export default Dashboard;