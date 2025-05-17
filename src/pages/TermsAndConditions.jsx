// TermsAndConditions.jsx

import { useNavigate } from 'react-router-dom';
import './TermsAndConditions.css';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { Link } from 'react-router-dom';


const TermsAndConditions = () => {
  const navigate = useNavigate();

  return (
    <section className="terms-container">
      <button className="back-button">
            <ArrowBackIosIcon onClick={() => navigate(-1)} className="back-icon" />
      </button>
      
      
      <h1>Terms and Conditions for Innerk Hub Research Platform</h1>
      <p className="effective-date">Last Updated: 14 May 2025</p>

      <section className="terms-content">
        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using Innerk Hub, you agree to abide by these Terms and Conditions. If you do not agree, you may not use the platform.</p>
        </section>

        <section>
          <h2>2. Reviewer Responsibilities</h2>
          <ul>
            <li>Provide accurate and up-to-date information in your application.</li>
            <li>Maintain the confidentiality of reviewed materials.</li>
            <li>Promptly declare any conflicts of interest.</li>
            <li>Engage ethically and professionally in all research-related activities.</li>
          </ul>
        </section>

        <section>
          <h2>3. Intellectual Property</h2>
          <p>You retain ownership of any original work or content you submit.</p>
          <p>By submitting content, you grant Innerk Hub a <strong>non-exclusive, royalty-free license</strong> to use, display, and distribute it for research and platform-related purposes.</p>
        </section>

        <section>
          <h2>4. Privacy & Data Protection</h2>
          <p>Your personal data will be processed in accordance with our <Link to="/privacy-policy">Privacy Policy</Link>.</p>
          <p>We comply with relevant data protection laws, including <strong>POPIA (Protection of Personal Information Act)</strong> in South Africa.</p>
        </section>

        <section>
          <h2>5. Termination of Access & Reviewer Status</h2>
          <p>Innerk Hub reserves the right to suspend or terminate reviewer access if violations of these Terms occur.</p>
          <p>Grounds for termination include but are not limited to misrepresentation, misconduct, or breach of confidentiality.</p>
        </section>

        <section>
          <h2>6. Liability & Disclaimer</h2>
          <p>Innerk Hub provides services <strong>“as is”</strong>, without warranties regarding accuracy, reliability, or suitability for a particular purpose.</p>
          <p>We are <strong>not liable</strong> for any loss, damages, or disputes resulting from platform use.</p>
        </section>

        <section>
          <h2>7. Governing Law</h2>
          <p>These Terms and Conditions are governed by the laws of <strong>South Africa</strong> and relevant international agreements, where applicable.</p>
        </section>

        <section>
          <h2>8. Amendments & Updates</h2>
          <p>Innerk Hub may update these Terms periodically, and users will be notified of significant changes before they take effect.</p>
        </section>
      </section>
    </section>
  );
};

export default TermsAndConditions;