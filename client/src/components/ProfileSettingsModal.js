import { useState, useEffect } from 'react';
import './ProfileSettingsModal.css';
import { updateUserProfile, changePassword } from '../api/api';

function ProfileSettingsModal({ isOpen, onClose, user, initialData, setUser }) {
  const [formData, setFormData] = useState({
    name: '',
    login: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        login: initialData.login || initialData.email || '',
        password: '',
        confirmPassword: ''
      });
    }
  }, [initialData]);

  // 💡 ВАЛИДАЦИЯ EMAIL
  const validateEmail = (email) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  };

  // 💡 ИЗМЕНЕНИЕ ПОЛЕЙ
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 💡 ЗАКРЫТИЕ
  const handleClose = () => {
    setError(null);
    setSuccess(null);
    setFormData(prev => ({
      ...prev,
      password: '',
      confirmPassword: ''
    }));
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
  
    try {
      // Валидации
      if (user.role === 'tutor' && !validateEmail(formData.login)) {
        throw new Error('Введите корректный email');
      }
  
      if (formData.password) {
        if (formData.password.length < 6) {
          throw new Error('Пароль должен быть не менее 6 символов');
        }
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Пароли не совпадают');
        }
  
        await changePassword({
          userId: user.id,
          userType: user.role,
          currentPassword: '',
          newPassword: formData.password
        });
      }
  
      // 🔁 Обновление профиля (всегда)
      await updateUserProfile(user.id, {
        name: formData.name,
        login: user.role === 'student' ? formData.login : undefined,
        email: user.role === 'tutor' ? formData.login : undefined
      });
  
      const updatedUser = {
        ...(() => {
          const _val = localStorage.getItem('user');
          return _val ? JSON.parse(_val) : null;
        })()
        ,
        name: formData.name,
        login: formData.login || formData.email
      };
  
      if (updatedUser) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        localStorage.removeItem('user');
      }
      
      if (setUser) setUser(updatedUser);
  
      // ✅ Сброс пароля
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
  
      setSuccess('Профиль успешно обновлен!');
    } catch (err) {
      setError(err.message || 'Ошибка при обновлении профиля');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Редактирование профиля</h2>
        <form onSubmit={handleSubmit}>
          <label>Имя:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <label>{user.role === 'tutor' ? 'Email:' : 'Логин:'}</label>
          <input
            type="text"
            name="login"
            value={formData.login}
            onChange={handleChange}
            required
          />

          <label>Новый пароль:</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Новый пароль"
              minLength={6}
            />
            <span
              className="eye-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '🙈' : '👁️'}
            </span>
          </div>

          <label>Подтвердите пароль:</label>
          <div className="password-wrapper">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Повторите пароль"
              minLength={6}
            />
            <span
              className="eye-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? '🙈' : '👁️'}
            </span>
          </div>


          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <div className="modal-buttons">
            <button type="submit">Сохранить</button>
            <button type="button" onClick={handleClose}>Закрыть</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfileSettingsModal;
