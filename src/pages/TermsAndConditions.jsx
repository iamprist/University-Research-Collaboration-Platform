// TermsAndConditions.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TermsAndConditions.css';

const TermsAndConditions = () => {
  const navigate = useNavigate();

  return (
    <section className="terms-container">
      <button onClick={() => navigate(-1)} className="back-button">
        &larr; Back to Application
      </button>
      
      <h1>Terms and Conditions for InnerKhub Research Platform</h1>
      <p className="effective-date">Last Updated: [Insert Date]</p>

      <section className="terms-content">
        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>By using InnerKhub, you agree to be bound by these Terms and Conditions...</p>
        </section>

        <section>
          <h2>2. Reviewer Responsibilities</h2>
          <ul>
            <li>Provide accurate and current information in your application</li>
            <li>Maintain confidentiality of reviewed materials</li>
            <li>Declare conflicts of interest promptly</li>
          </ul>
        </section>

        <section>
          <h2>3. Intellectual Property</h2>
          <p>You retain rights to your submitted work but grant InnerKhub...</p>
        </section>

        <section>
          <h2>4. Privacy</h2>
          <p>Your data will be handled according to our Privacy Policy...</p>
        </section>

        <section>
          <h2>5. Termination</h2>
          <p>We reserve the right to terminate reviewer status for violations...</p>
        </section>

        <section>
          <h2>6. Disclaimer</h2>
          <p>InnerKhub provides the platform "as is" without warranties...</p>
        </section>

        <section>
          <h2>7. Governing Law</h2>
          <p>These terms are governed by the laws of [Your Jurisdiction]...</p>
        </section>
      </section>
    </section>
  );
};

export default TermsAndConditions;