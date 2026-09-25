import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import cureLogo from '../components/logo/CureAI logo.png';
import './Auth.css';

function Signup() {
  const { t } = useTranslation();
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

  const handleArrayChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleArraySubmit = (e) => {
    const { name, value } = e.target;
    const arr = value.split(',').map(s => s.trim()).filter(Boolean);
    setForm(prev => ({ ...prev, [name]: arr.join(', ') }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = { ...form };
      // Convert string fields to proper types
      if (data.allergies) data.allergies = data.allergies.split(',').map(s => s.trim()).filter(Boolean);
      else data.allergies = [];
      if (data.chronic_conditions) data.chronic_conditions = data.chronic_conditions.split(',').map(s => s.trim()).filter(Boolean);
      else data.chronic_conditions = [];
      if (data.current_medications) data.current_medications = data.current_medications.split(',').map(s => s.trim()).filter(Boolean);
      else data.current_medications = [];

      await signup(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
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
          <p>{t('create_account')}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label>{t('full_name')} *</label>
              <input type="text" name="full_name" value={form.full_name} onChange={handleChange} required placeholder="John Doe" />
            </div>
            <div className="form-group">
              <label>{t('email')} *</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="john@example.com" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('phone')} *</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} required placeholder="9876543210" maxLength={10} />
            </div>
            <div className="form-group">
              <label>{t('password')} *</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required placeholder="••••••••" minLength={6} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('date_of_birth')} *</label>
              <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>{t('gender')} *</label>
              <select name="gender" value={form.gender} onChange={handleChange} required>
                <option value="">{t('select_gender')}</option>
                <option value="male">{t('male')}</option>
                <option value="female">{t('female')}</option>
                <option value="other">{t('other')}</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>{t('blood_group')}</label>
            <select name="blood_group" value={form.blood_group} onChange={handleChange}>
              <option value="">{t('select_blood_group')}</option>
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

          <div className="form-group">
            <label>{t('address')}</label>
            <textarea name="address" value={form.address} onChange={handleChange} placeholder="Street address" rows={2} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('city')}</label>
              <input type="text" name="city" value={form.city} onChange={handleChange} placeholder="City" />
            </div>
            <div className="form-group">
              <label>{t('state')}</label>
              <input type="text" name="state" value={form.state} onChange={handleChange} placeholder="State" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('pincode')}</label>
              <input type="text" name="pincode" value={form.pincode} onChange={handleChange} placeholder="560001" maxLength={6} />
            </div>
          </div>

          <h3 className="form-section-title">{t('emergency_contact')}</h3>
          <div className="form-row">
            <div className="form-group">
              <label>{t('emergency_contact_name')}</label>
              <input type="text" name="emergency_contact_name" value={form.emergency_contact_name} onChange={handleChange} placeholder="Emergency contact name" />
            </div>
            <div className="form-group">
              <label>{t('emergency_contact_phone')}</label>
              <input type="tel" name="emergency_contact_phone" value={form.emergency_contact_phone} onChange={handleChange} placeholder="9876543210" />
            </div>
          </div>

          <h3 className="form-section-title">{t('medical_history_short')}</h3>
          <div className="form-group">
            <label>{t('allergies')}</label>
            <input type="text" name="allergies" value={form.allergies} onChange={handleArrayChange} onBlur={handleArraySubmit} placeholder="Penicillin, Dust" />
            <small>{t('comma_separated')}</small>
          </div>
          <div className="form-group">
            <label>{t('chronic_conditions')}</label>
            <input type="text" name="chronic_conditions" value={form.chronic_conditions} onChange={handleArrayChange} onBlur={handleArraySubmit} placeholder="Diabetes, Hypertension" />
            <small>{t('comma_separated')}</small>
          </div>
          <div className="form-group">
            <label>{t('current_medications')}</label>
            <input type="text" name="current_medications" value={form.current_medications} onChange={handleArrayChange} onBlur={handleArraySubmit} placeholder="Paracetamol, Cetirizine" />
            <small>{t('comma_separated')}</small>
          </div>

          <button type="submit" disabled={loading} className="auth-submit">
            {loading ? t('submitting') : t('signup')}
          </button>

          <p className="auth-switch">
            {t('already_have_account')} <Link to="/login">{t('login')}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Signup;
