import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import cureLogo from '../components/logo/CureAI logo.png';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Calendar, 
  Droplet, 
  MapPin, 
  ShieldAlert, 
  Heart, 
  Pill, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import './Auth.css';

function Signup() {
  const { t, i18n } = useTranslation();
  const language = i18n.language?.startsWith('hi') ? 'hi' : 'en';
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    blood_group: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    allergies: '',
    chronic_conditions: '',
    current_medications: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = { ...form };
      // Convert comma-separated string fields to proper arrays
      if (data.allergies) {
        data.allergies = data.allergies.split(',').map(s => s.trim()).filter(Boolean);
      } else {
        data.allergies = [];
      }
      if (data.chronic_conditions) {
        data.chronic_conditions = data.chronic_conditions.split(',').map(s => s.trim()).filter(Boolean);
      } else {
        data.chronic_conditions = [];
      }
      if (data.current_medications) {
        data.current_medications = data.current_medications.split(',').map(s => s.trim()).filter(Boolean);
      } else {
        data.current_medications = [];
      }

      await signup(data);
      // Seamlessly navigate to Dashboard after signup
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please review your details and try again.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-mesh-glow-1" />
      <div className="auth-mesh-glow-2" />

      <div className="auth-container">
        {/* Left Sidebar Branding */}
        <div className="auth-sidebar">
          <div className="auth-sidebar-brand">
            <div className="auth-sidebar-logo-row" onClick={() => navigate('/')}>
              <img src={cureLogo} alt="CureAI logo" className="auth-sidebar-logo" />
              <span className="auth-sidebar-title">CureAI</span>
            </div>
            <div className="auth-sidebar-badge">
              <Heart size={14} />
              <span>Patient Profile Registration</span>
            </div>
          </div>

          <div className="auth-sidebar-content">
            <h3>Start Your Personalized Health Journey</h3>
            <p>Setting up your profile allows our AI engine to cross-reference allergies, medications, and age for maximum diagnostic precision.</p>

            <div className="auth-trust-list">
              <div className="auth-trust-item">
                <CheckCircle2 size={16} className="trust-check" />
                <span>Instant Clinical Dashboard Onboarding</span>
              </div>
              <div className="auth-trust-item">
                <CheckCircle2 size={16} className="trust-check" />
                <span>Allergy & Drug Interaction Shield</span>
              </div>
              <div className="auth-trust-item">
                <CheckCircle2 size={16} className="trust-check" />
                <span>Bilingual Voice & Text Diagnostics</span>
              </div>
            </div>
          </div>

          <div className="auth-sidebar-footer">
            <span>🔒 HIPAA-Ready Clinical Data Security</span>
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
            <h2>{t('create_account') || 'Create Your Account'}</h2>
            <p>Fill in your basic and clinical details to unlock the dashboard.</p>
          </div>

          {error && (
            <div className="auth-error-alert" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form-body">
            {/* Section 1: Account Credentials */}
            <div className="form-section-divider">Account Credentials</div>

            <div className="auth-row-2">
              <div className="auth-field-group">
                <label>{t('full_name') || 'Full Name'} *</label>
                <div className="auth-input-wrapper">
                  <User size={18} className="auth-field-icon" />
                  <input 
                    type="text" 
                    name="full_name" 
                    value={form.full_name} 
                    onChange={handleChange} 
                    required 
                    placeholder="e.g. John Doe" 
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <label>{t('email') || 'Email Address'} *</label>
                <div className="auth-input-wrapper">
                  <Mail size={18} className="auth-field-icon" />
                  <input 
                    type="email" 
                    name="email" 
                    value={form.email} 
                    onChange={handleChange} 
                    required 
                    placeholder="john@example.com" 
                  />
                </div>
              </div>
            </div>

            <div className="auth-row-2">
              <div className="auth-field-group">
                <label>{t('phone') || 'Phone Number'} *</label>
                <div className="auth-input-wrapper">
                  <Phone size={18} className="auth-field-icon" />
                  <input 
                    type="tel" 
                    name="phone" 
                    value={form.phone} 
                    onChange={handleChange} 
                    required 
                    placeholder="9876543210" 
                    maxLength={10} 
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <label>{t('password') || 'Password'} *</label>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-field-icon" />
                  <input 
                    type="password" 
                    name="password" 
                    value={form.password} 
                    onChange={handleChange} 
                    required 
                    placeholder="••••••••" 
                    minLength={6} 
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Vitals & Demographics */}
            <div className="form-section-divider">Demographics & Vitals</div>

            <div className="auth-row-2">
              <div className="auth-field-group">
                <label>{t('date_of_birth') || 'Date of Birth'} *</label>
                <div className="auth-input-wrapper">
                  <Calendar size={18} className="auth-field-icon" />
                  <input 
                    type="date" 
                    name="date_of_birth" 
                    value={form.date_of_birth} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <label>{t('gender') || 'Gender'} *</label>
                <select name="gender" value={form.gender} onChange={handleChange} required>
                  <option value="">{t('select_gender') || 'Select Gender'}</option>
                  <option value="male">{t('male') || 'Male'}</option>
                  <option value="female">{t('female') || 'Female'}</option>
                  <option value="other">{t('other') || 'Other'}</option>
                </select>
              </div>
            </div>

            <div className="auth-row-2">
              <div className="auth-field-group">
                <label>{t('blood_group') || 'Blood Group'}</label>
                <div className="auth-input-wrapper">
                  <Droplet size={18} className="auth-field-icon" />
                  <select name="blood_group" value={form.blood_group} onChange={handleChange}>
                    <option value="">{t('select_blood_group') || 'Select Blood Group'}</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="auth-field-group">
                <label>{t('pincode') || 'Postal Code'}</label>
                <div className="auth-input-wrapper">
                  <MapPin size={18} className="auth-field-icon" />
                  <input 
                    type="text" 
                    name="pincode" 
                    value={form.pincode} 
                    onChange={handleChange} 
                    placeholder="560001" 
                    maxLength={6} 
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Emergency Contact */}
            <div className="form-section-divider">{t('emergency_contact') || 'Emergency Contact'}</div>

            <div className="auth-row-2">
              <div className="auth-field-group">
                <label>{t('emergency_contact_name') || 'Contact Person'}</label>
                <input 
                  type="text" 
                  name="emergency_contact_name" 
                  value={form.emergency_contact_name} 
                  onChange={handleChange} 
                  placeholder="Emergency contact name" 
                />
              </div>

              <div className="auth-field-group">
                <label>{t('emergency_contact_phone') || 'Contact Phone'}</label>
                <input 
                  type="tel" 
                  name="emergency_contact_phone" 
                  value={form.emergency_contact_phone} 
                  onChange={handleChange} 
                  placeholder="9876543210" 
                />
              </div>
            </div>

            {/* Section 4: Clinical History */}
            <div className="form-section-divider">{t('medical_history_short') || 'Clinical History'}</div>

            <div className="auth-field-group">
              <label>{t('allergies') || 'Known Drug / Food Allergies'}</label>
              <input 
                type="text" 
                name="allergies" 
                value={form.allergies} 
                onChange={handleChange} 
                placeholder="e.g. Penicillin, Peanuts, Sulfa drugs" 
              />
              <span className="field-help-text">Separate multiple entries with commas</span>
            </div>

            <div className="auth-field-group">
              <label>{t('chronic_conditions') || 'Chronic Conditions'}</label>
              <input 
                type="text" 
                name="chronic_conditions" 
                value={form.chronic_conditions} 
                onChange={handleChange} 
                placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma" 
              />
              <span className="field-help-text">Separate multiple entries with commas</span>
            </div>

            <div className="auth-field-group">
              <label>{t('current_medications') || 'Current Active Medications'}</label>
              <input 
                type="text" 
                name="current_medications" 
                value={form.current_medications} 
                onChange={handleChange} 
                placeholder="e.g. Metformin, Lisinopril, Cetirizine" 
              />
              <span className="field-help-text">Separate multiple entries with commas</span>
            </div>

            <button type="submit" disabled={loading} className="auth-submit-btn">
              {loading ? (
                <span>{t('submitting') || 'Creating Profile & Onboarding...'}</span>
              ) : (
                <>
                  <span>Complete Registration & Go to Dashboard</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <p className="auth-footer-prompt">
              {t('already_have_account') || 'Already have an account?'} 
              <Link to="/login">{t('login') || 'Sign In'}</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;
