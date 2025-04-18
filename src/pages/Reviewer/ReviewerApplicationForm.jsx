import React, { useState } from 'react';
import axios from 'axios';

const ReviewerApplicationForm = () => {
  const [name, setName] = useState('');
  const [background, setBackground] = useState('');
  const [institution, setInstitution] = useState('');
  const [expertiseTags, setExpertiseTags] = useState([]);
  const [yearsExperience, setYearsExperience] = useState('');
  const [cv, setCv] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');

  const availableTags = ['AI', 'Machine Learning', 'Data Science', 'Web Development', 'Cloud Computing'];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!termsAccepted) {
      setError('You must accept the Terms of Service.');
      return;
    }

    try {
      const formData = {
        name,
        background,
        institution,
        expertiseTags,
        yearsExperience,
        cv,
      };

      await axios.post('/api/reviewer/apply', formData);
      // Redirect to dashboard after successful submission
      window.location.href = '/dashboard';
    } catch (err) {
      setError('Failed to submit the application.');
    }
  };

  const handleTagChange = (e) => {
    const value = Array.from(e.target.selectedOptions, option => option.value);
    setExpertiseTags(value);
  };

  return (
    <section>
      <h2>Reviewer Application Form</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="background">Background</label>
          <textarea
            id="background"
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="institution">Institution</label>
          <input
            type="text"
            id="institution"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="expertiseTags">Expertise Tags</label>
          <select
            id="expertiseTags"
            multiple
            value={expertiseTags}
            onChange={handleTagChange}
            required
          >
            {availableTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="yearsExperience">Years of Experience</label>
          <input
            type="number"
            id="yearsExperience"
            value={yearsExperience}
            onChange={(e) => setYearsExperience(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="cv">CV (optional)</label>
          <input
            type="file"
            id="cv"
            onChange={(e) => setCv(e.target.files[0])}
            accept="application/pdf"
          />
        </div>
        <div>
          <label htmlFor="terms">
            <input
              type="checkbox"
              id="terms"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              required
            />
            I accept the Terms of Service
          </label>
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Submit</button>
      </form>
    </section>
  );
};

export default ReviewerApplicationForm;
