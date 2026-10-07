import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import cureLogo from '../components/logo/CureAI logo.png';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  Activity, 
  AlertCircle, 
  Sparkles,
  Zap
} from 'lucide-react';
import './Auth.css';

function Login() {
  const { t, i18n } = useTranslation();
  const language = i18n.language?.startsWith('hi') ? 'hi' : 'en';
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
      setError(err.response?.data?.detail || 'Authentication failed. Please check your credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-mesh-glow-1" />
      <div className="auth-mesh-glow-2" />

      <div className="auth-container login-mode">
        {/* Left Sidebar Branding */}
        <div className="auth-sidebar">
          <div className="auth-sidebar-brand">
            <div className="auth-sidebar-logo-row" onClick={() => navigate('/')}>
              <img src={cureLogo} alt="CureAI logo" className="auth-sidebar-logo" />
              <span className="auth-sidebar-title">CureAI</span>
            </div>
            <div className="auth-sidebar-badge">
              <ShieldCheck size={14} />
              <span>Clinical Portal Access</span>
            </div>
          </div>

          <div className="auth-sidebar-content">
            <h3>Intelligent Healthcare at Your Fingertips</h3>
            <p>Access your personalized medical records, real-time AI diagnosis logs, and certified prescriptions.</p>

            <div className="auth-trust-list">
              <div className="auth-trust-item">
                <CheckCircle2 size={16} className="trust-check" />
                <span>130+ Dimension Symptom Vectoring</span>
              </div>
              <div className="auth-trust-item">
                <CheckCircle2 size={16} className="trust-check" />
                <span>Instant Bilingual Voice Analysis</span>
              </div>
              <div className="auth-trust-item">
                <CheckCircle2 size={16} className="trust-check" />
                <span>Encrypted Patient Data Privacy</span>
              </div>
            </div>
          </div>

          <div className="auth-sidebar-footer">
            <Activity size={14} />
            <span>AI Diagnostic Engine v2.4 Operational</span>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="auth-main-card">
          <div className="auth-top-nav">
            <Link to="/" className="back-home-link">
              <ArrowLeft size={16} />
              <span>Back to Home</span>
            </Link>
            <div className="auth-lang-capsule">
              <button 
                className={`auth-lang-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => i18n.changeLanguage('en')}
              >
                EN
              </button>
              <button 
                className={`auth-lang-btn ${language === 'hi' ? 'active' : ''}`}
                onClick={() => i18n.changeLanguage('hi')}
              >
                हिंदी
              </button>
            </div>
          </div>

          <div className="auth-header-block">
            <h2>{t('welcome_back') || 'Welcome Back'}</h2>
            <p>Sign in to access your clinical dashboard & diagnostic history.</p>
          </div>

          {error && (
            <div className="auth-error-alert" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form-body">
            <div className="auth-field-group">
              <label>{t('email') || 'Email Address'}</label>
              <div className="auth-input-wrapper">
                <Mail size={18} className="auth-field-icon" />
                <input 
                  type="email" 
                  name="email" 
                  value={form.email} 
                  onChange={handleChange} 
                  required 
                  placeholder="patient@example.com" 
                />
              </div>
            </div>

            <div className="auth-field-group">
              <label>{t('password') || 'Password'}</label>
              <div className="auth-input-wrapper">
                <Lock size={18} className="auth-field-icon" />
                <input 
                  type="password" 
                  name="password" 
                  value={form.password} 
                  onChange={handleChange} 
                  required 
                  placeholder="••••••••" 
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="auth-submit-btn">
              {loading ? (
                <span>{t('logging_in') || 'Authenticating...'}</span>
              ) : (
                <>
                  <span>{t('login') || 'Sign In to Dashboard'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <p className="auth-footer-prompt">
              {t('no_account') || "Don't have an account?"} 
              <Link to="/signup">{t('signup') || 'Sign Up'}</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
