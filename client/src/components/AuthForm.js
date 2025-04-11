import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register, loginStudent } from '../api/api';

function AuthForm({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState('tutor'); // 'tutor' или 'student'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
  
    try {
      let response;
  
      if (userType === 'tutor') {
        if (isLogin) {
          response = await login(email, password);
        } else {
          await register(name, email, password);
          response = await login(email, password);
        }
      } else {
        // Ученик: логинимся через loginStudent
        response = await loginStudent(name, password);
      }
  
      if (response?.token) {
        localStorage.setItem('token', response.token);
        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
        } else {
          localStorage.removeItem('user');
        }
        localStorage.setItem('userType', userType);
  
        if (typeof onAuthSuccess === 'function') {
          onAuthSuccess();
        }
  
        navigate(userType === 'tutor' ? '/dashboard' : '/student-dashboard', { replace: true });
      } else {
        console.warn('No token in response');
      }
    } catch (err) {
      console.error('Auth error:', err);
  
      // 💬 Читаем сообщение от сервера
      const message =
        err?.response?.data?.error ||  // axios-стиль (если используешь axios)
        err?.message ||                // fetch-стиль (то что ты используешь)
        'Ошибка авторизации';

      setError(message);

    } finally {
      setLoading(false);
    }
  };
  
  

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.userTypeToggle}>
          <button
            type="button"
            style={{
              ...styles.userTypeButton,
              ...(userType === 'tutor' && styles.activeUserType)
            }}
            onClick={() => {
              setUserType('tutor');
              setIsLogin(true); // всегда вход при переключении
            }}
          >
            Репетитор
          </button>
          <button
            type="button"
            style={{
              ...styles.userTypeButton,
              ...(userType === 'student' && styles.activeUserType)
            }}
            onClick={() => {
              setUserType('student');
              setIsLogin(true); // ученики только входят
            }}
          >
            Ученик
          </button>
        </div>
  
        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tabButton,
              ...(isLogin ? styles.activeTab : {})
            }}
            onClick={() => setIsLogin(true)}
          >
            Вход
          </button>
  
          {/* Кнопка "Регистрация" только для репетитора */}
          {userType === 'tutor' && (
            <button
              style={{
                ...styles.tabButton,
                ...(!isLogin ? styles.activeTab : {})
              }}
              onClick={() => setIsLogin(false)}
            >
              Регистрация
            </button>
          )}
        </div>
  
        <h2 style={styles.title}>
          {isLogin
            ? `Вход ${userType === 'tutor' ? 'репетитора' : 'ученика'}`
            : `Регистрация репетитора`}
        </h2>
  
        {error && <div style={styles.error}>{error}</div>}
  
        <form onSubmit={handleSubmit} style={styles.form}>
          {(!isLogin || userType === 'student') && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                {userType === 'tutor' ? 'Ваше имя' : 'Логин ученика'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={styles.input}
                placeholder={userType === 'tutor' ? 'Иван Иванов' : 'Логин'}
              />
            </div>
          )}
  
          {userType === 'tutor' && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
                placeholder="example@mail.com"
              />
            </div>
          )}
  
          <div style={styles.inputGroup}>
            <label style={styles.label}>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
              placeholder="••••••••"
              minLength="6"
            />
          </div>
  
          <button
            type="submit"
            disabled={loading}
            style={styles.submitButton}
          >
            {loading
              ? 'Загрузка...'
              : isLogin
              ? 'Войти'
              : 'Зарегистрироваться'}
          </button>
        </form>
      </div>
    </div>
  );
}  

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    padding: '32px',
    width: '100%',
    maxWidth: '420px',
  },
  userTypeToggle: {
    display: 'flex',
    marginBottom: '20px',
    border: '1px solid #eaeaea',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  userTypeButton: {
    flex: 1,
    padding: '10px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  activeUserType: {
    backgroundColor: '#4f46e5',
    color: 'white',
  },
  tabs: {
    display: 'flex',
    marginBottom: '24px',
    borderBottom: '1px solid #eaeaea',
  },
  tabButton: {
    flex: 1,
    padding: '12px',
    border: 'none',
    background: 'none',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    color: '#6b7280',
    transition: 'all 0.2s',
  },
  activeTab: {
    color: '#4f46e5',
    borderBottom: '2px solid #4f46e5',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '24px',
    textAlign: 'center',
  },
  error: {
    color: '#ef4444',
    backgroundColor: '#fee2e2',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    padding: '12px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '16px',
    transition: 'border 0.2s',
    '&:focus': {
      borderColor: '#4f46e5',
      outline: 'none',
    },
  },
  submitButton: {
    backgroundColor: '#4f46e5',
    color: 'white',
    padding: '14px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
    marginTop: '8px',
    '&:hover': {
      backgroundColor: '#4338ca',
    },
    '&:disabled': {
      backgroundColor: '#9ca3af',
      cursor: 'not-allowed',
    },
  },
};

export default AuthForm;