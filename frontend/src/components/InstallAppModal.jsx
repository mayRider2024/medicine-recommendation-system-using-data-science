import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Share2, 
  Smartphone, 
  Monitor, 
  Check, 
  X, 
  ExternalLink, 
  PlusSquare, 
  MoreVertical,
  Layers,
  Copy
} from 'lucide-react';
import './InstallAppModal.css';

const PRODUCTION_URL = 'https://medicine-recommendation-system-usin-beta.vercel.app/';

export default function InstallAppModal({ isOpen, onClose, isHindi }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detect OS / Device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    const android = /android/.test(userAgent);
    setIsIOS(ios);
    setIsAndroid(android);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        onClose();
      }
    } else {
      // If native prompt not available or on mobile Safari, we guide them
      copyUrl();
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(PRODUCTION_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="install-modal-overlay" onClick={onClose}>
      <div className="install-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="install-modal-close" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div className="install-modal-header">
          <div className="install-icon-badge">
            <Download size={24} className="install-badge-icon" />
          </div>
          <h3 className="install-title">
            {isHindi ? 'होम स्क्रीन पर ऐप जोड़ें' : 'Add App to Home Screen'}
          </h3>
          <p className="install-subtitle">
            {isHindi 
              ? 'मोबाइल या कंप्यूटर पर तेज़ी से इस्तेमाल के लिए CureAI का शॉर्टकट जोड़ें।'
              : 'Add a quick shortcut of CureAI to your Mobile Home Screen or PC/Laptop.'}
          </p>
        </div>

        {/* Live URL bar with copy */}
        <div className="install-url-box">
          <div className="install-url-text" title={PRODUCTION_URL}>
            {PRODUCTION_URL}
          </div>
          <button className={`install-copy-btn ${copied ? 'copied' : ''}`} onClick={copyUrl}>
            {copied ? (
              <>
                <Check size={15} />
                <span>{isHindi ? 'कॉपी हो गया' : 'Copied'}</span>
              </>
            ) : (
              <>
                <Copy size={15} />
                <span>{isHindi ? 'कॉपी लिंक' : 'Copy'}</span>
              </>
            )}
          </button>
        </div>

        {/* Native One-Click Install Button if supported */}
        {deferredPrompt && (
          <div className="native-install-row">
            <button className="native-install-btn" onClick={handleNativeInstall}>
              <Download size={18} />
              <span>{isHindi ? 'सीधे डिवाइस में इंस्टॉल करें (1-क्लिक)' : 'Install App Directly (1-Click)'}</span>
            </button>
          </div>
        )}

        {/* Step-by-Step Device Guides */}
        <div className="install-instructions-grid">
          {/* Mobile Android / Chrome Guide */}
          <div className="instruction-card">
            <div className="instruction-card-header">
              <Smartphone size={18} className="device-icon" />
              <span>{isHindi ? 'Android (Chrome / Brave)' : 'Android (Chrome / Edge)'}</span>
            </div>
            <ol className="instruction-steps">
              <li>
                {isHindi 
                  ? 'ब्राउज़र के ऊपर दाईं ओर 3-डॉट्स (⋮) मेनू पर टैप करें।'
                  : 'Tap the 3-dots menu (⋮) in the top-right corner of Chrome.'}
              </li>
              <li>
                {isHindi 
                  ? '‘होम स्क्रीन में जोड़ें’ या ‘App Install करें’ चुनें।'
                  : 'Tap "Add to Home screen" or "Install App".'}
              </li>
              <li>
                {isHindi 
                  ? '‘Add’ पर क्लिक करें, ऐप आपके मोबाइल होम स्क्रीन पर आ जाएगा।'
                  : 'Tap "Add" to confirm. CureAI icon will appear on your screen.'}
              </li>
            </ol>
          </div>

          {/* iPhone / iOS Safari Guide */}
          <div className="instruction-card">
            <div className="instruction-card-header">
              <Share2 size={18} className="device-icon" />
              <span>{isHindi ? 'iPhone / iPad (Safari)' : 'iPhone / iPad (Safari)'}</span>
            </div>
            <ol className="instruction-steps">
              <li>
                {isHindi 
                  ? 'सफारी ब्राउज़र में नीचे स्थित ‘Share’ (शेयर) आइकन ⎋ पर टैप करें।'
                  : 'Tap the "Share" button (box with upward arrow ⎋) at the bottom.'}
              </li>
              <li>
                {isHindi 
                  ? 'नीचे स्क्रॉल करें और ‘Add to Home Screen’ ⊞ चुनें।'
                  : 'Scroll down and tap "Add to Home Screen" ⊞.'}
              </li>
              <li>
                {isHindi 
                  ? 'ऊपर दाईं ओर ‘Add’ पर टैप करें।'
                  : 'Tap "Add" at the top right to create the shortcut.'}
              </li>
            </ol>
          </div>

          {/* PC / Laptop Guide */}
          <div className="instruction-card full-span">
            <div className="instruction-card-header">
              <Monitor size={18} className="device-icon" />
              <span>{isHindi ? 'Laptop / PC (Chrome / Edge)' : 'Laptop / PC (Chrome / Edge)'}</span>
            </div>
            <ol className="instruction-steps horizontal-steps">
              <li>
                {isHindi 
                  ? 'ब्राउज़र एड्रेस बार में दाईं ओर स्थित ‘Install / Download’ आइकन ⊕ पर क्लिक करें।'
                  : 'Click the "Install" or "App available" icon (⊕ / ⤓) in the address bar.'}
              </li>
              <li>
                {isHindi 
                  ? 'या ब्राउज़र मेनू (⋮) &gt; "Cast, save and share" &gt; "Install CureAI" चुनें।'
                  : 'Or click menu (⋮) > "Save and share" > "Install CureAI" or "Create shortcut".'}
              </li>
            </ol>
          </div>
        </div>

        <div className="install-modal-footer">
          <button className="install-done-btn" onClick={onClose}>
            {isHindi ? 'समझ गया (Done)' : 'Got it, Done'}
          </button>
        </div>
      </div>
    </div>
  );
}
