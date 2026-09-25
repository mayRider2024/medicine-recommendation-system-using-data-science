import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import cureLogo from '../components/logo/CureAI logo.png';
import './Auth.css';

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <img src={cureLogo} alt="CureAI logo" className="auth-logo" />
          <h1>CureAI</h1>
          <p>Medicine Recommendation System</p>
          <p>{t('welcome_back')}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>{t('email')}</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="john@example.com" />
          </div>
          <div className="form-group">
            <label>{t('password')}</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} required placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="auth-submit">
            {loading ? t('logging_in') : t('login')}
          </button>
          <p className="auth-switch">
            {t('no_account')} <Link to="/signup">{t('signup')}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
