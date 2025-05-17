import { useNavigate } from "react-router-dom";
import './TermsAndConditions.css';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <section className="terms-container">
      <button className="back-button">
                <ArrowBackIosIcon onClick={() => navigate(-1)} className="back-icon" />
        </button>

      <h1>Privacy Policy for Inerk Hub</h1>
      <p className="effective-date">Last Updated: 14 May 2025 </p>

      <article className="terms-content">
        <section>
          <h2>1. Introduction</h2>
          <p>
            Welcome to **Inerk Hub**, a platform designed to facilitate academic 
            collaboration and research networking. We are committed to protecting 
            your privacy and ensuring transparency about how we collect, store, 
            and use your data.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          <ul>
            <li>Personal Information: Name, email address, institution, and research interests.</li>
            <li>Usage Data: Interaction history, page visits, and engagement metrics.</li>
            <li>Communication Data: Messages exchanged within collaboration tools or chat features.</li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <p>Your data is used to:</p>
          <ul>
            <li>Improve research collaboration by suggesting relevant experts and projects.</li>
            <li>Enhance user experience through personalization and accessibility features.</li>
            <li>Maintain security and prevent unauthorized access.</li>
          </ul>
        </section>

        <section>
          <h2>4. Data Sharing & Security</h2>
          <p>
            - We **do not sell** personal information to third parties.  
            - Data may be shared with **trusted academic institutions** for research collaboration purposes.  
            - Industry-standard **encryption and security measures** are applied to protect user data.
          </p>
        </section>

        <section>
          <h2>5. Cookies & Tracking Technologies</h2>
          <p>
            Inerk Hub may use **cookies** and analytics tools to improve functionality. 
            You can manage cookie preferences in your browser settings.
          </p>
        </section>

        <section>
          <h2>6. User Rights & Controls</h2>
          <p>
            You have the right to:
            <ul>
              <li>Access and update your personal information in your profile settings.</li>
              <li>Request deletion of your account and associated data at any time.</li>
              <li>Opt-out of specific communications such as newsletters or notifications.</li>
            </ul>
          </p>
        </section>

        <section>
          <h2>7. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. Users will be 
            notified of major changes through announcements on the platform.
          </p>
        </section>

        <section>
          <h2>8. Contact Us</h2>
          <p>
            For any privacy-related inquiries, reach out to us at 
            support@inerkhub.ac.za.
          </p>
        </section>
      </article>
    </section>
  );
};

export default PrivacyPolicy;
