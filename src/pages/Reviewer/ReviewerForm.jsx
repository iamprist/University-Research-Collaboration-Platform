import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db, auth, storage } from '../../config/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import Select from 'react-select';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './ReviewerStyles.css';

export default function ReviewerForm() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    institution: '',
    expertiseTags: [],
    yearsExperience: '',
    cvFile: null,
    publications: '',
    acceptedTerms: false,
  });

  const [institutionSelect, setInstitutionSelect] = useState('');
  
  const institutionList = [
    'University of Cape Town',
    'University of the Witwatersrand',
    'Stellenbosch University',
    'University of Pretoria',
    'University of KwaZulu-Natal',
    'University of Johannesburg',
    'University of the Western Cape',
    'North-West University',
    'University of South Africa (UNISA)',
    'Harvard University',
    'University of Oxford',
    'Massachusetts Institute of Technology',
    'University of Toronto',
    'Australian National University',
  ];

  useEffect(() => {
    const saved = sessionStorage.getItem('reviewerFormData');
    if (saved) {
      try {
        const { cvFile, ...rest } = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...rest }));
        if (rest.institution && institutionList.includes(rest.institution)) {
          setInstitutionSelect(rest.institution);
        } else if (rest.institution) {
          setInstitutionSelect('Other');
        }
      } catch (err) {
        console.error('Failed to load saved data:', err);
      }
    }
    const unsub = auth.onAuthStateChanged(current => {
      setUser(current);
      if (!current) {
        toast.warn('Please sign in first');
        navigate('/signin');
      }
    });
    return unsub;
  }, [navigate]);

  const expertiseOptions = [
    { value: 'PHYS', label: 'Physics' },
    { value: 'CHEM', label: 'Chemistry' },
    { value: 'BIO', label: 'Biology' },
    { value: 'CS', label: 'Computer Science' },
    { value: 'AI', label: 'Artificial Intelligence' },
    { value: 'MED', label: 'Medicine' },
    { value: 'LAW', label: 'Law' },
    { value: 'BUS', label: 'Business Administration' },
    { value: 'FIN', label: 'Finance' },
    { value: 'MKT', label: 'Marketing' },
    { value: 'HRM', label: 'Human Resources' },
  ];

  const saveFormDataToSession = () => {
    const { cvFile, ...saveData } = formData;
    sessionStorage.setItem('reviewerFormData', JSON.stringify(saveData));
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (!formData.institution.trim()) errs.institution = 'Institution is required';
    if (formData.expertiseTags.length === 0) errs.expertise = 'Select at least one expertise';
    if (!formData.yearsExperience || isNaN(formData.yearsExperience)) errs.experience = 'Valid years required';
    if (!formData.cvFile) errs.cv = 'Upload your CV';
    if (!formData.acceptedTerms) errs.terms = 'You must accept terms';
    return errs;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length) {
      setErrors(errs);
      toast.error('Please fix errors');
      return;
    }
    if (formData.cvFile.size > 5 * 1024 * 1024) {
      toast.error('CV must be under 5MB');
      return;
    }
    if (formData.cvFile.type !== 'application/pdf') {
      toast.error('Only PDF allowed');
      return;
    }

    setIsSubmitting(true);
    try {
      const storageRef = ref(storage, `reviewer-cvs/${user.uid}/${Date.now()}_${formData.cvFile.name}`);
      await uploadBytes(storageRef, formData.cvFile);
      const cvUrl = await getDownloadURL(storageRef);
      const pubs = formData.publications.split(/[\n,]+/).map(l => l.trim()).filter(l => l);
      await setDoc(doc(db, 'reviewers', user.uid), {
        name: formData.name.trim(),
        institution: formData.institution.trim(),
        expertiseTags: formData.expertiseTags,
        yearsExperience: parseInt(formData.yearsExperience, 10),
        cvUrl,
        publications: pubs,
        status: 'in_progress',
        userId: user.uid,
        email: user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success('Application submitted!');
      sessionStorage.removeItem('reviewerFormData');
      navigate('/reviewer');
    } catch (err) {
      console.error('Submission error:', err);
      toast.error(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="reviewer-application-container" role="region" aria-labelledby="form-heading">
      <h2 id="form-heading">Reviewer Application</h2>
      <form onSubmit={handleSubmit} noValidate>
        {/* Grid for primary fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <fieldset className="form-group">
            <legend>Full Name *</legend>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && <p id="name-error" className="error-message">{errors.name}</p>}
          </fieldset>

          <fieldset className="form-group">
            <legend>Institution *</legend>
            <select
              id="institution-select"
              value={institutionSelect}
              onChange={e => {
                const val = e.target.value;
                setInstitutionSelect(val);
                setFormData({ ...formData, institution: val === 'Other' ? '' : val });
              }}
              aria-invalid={!!errors.institution}
              aria-describedby={errors.institution ? 'institution-error' : undefined}
            >
              <option value="">Select your university</option>
              {institutionList.map(inst => <option key={inst} value={inst}>{inst}</option>)}
              <option value="Other">Other</option>
            </select>
            {institutionSelect === 'Other' && (
              <input
                type="text"
                id="institution"
                placeholder="Enter your institution"
                value={formData.institution}
                onChange={e => setFormData({ ...formData, institution: e.target.value })}
                aria-invalid={!!errors.institution}
                aria-describedby={errors.institution ? 'institution-error' : undefined}
              />
            )}
            {errors.institution && <p id="institution-error" className="error-message">{errors.institution}</p>}
          </fieldset>

          <fieldset className="form-group">
            <legend>Areas of Expertise *</legend>
            <Select
              id="expertise"
              isMulti
              options={expertiseOptions}
              onChange={sel => setFormData({ ...formData, expertiseTags: sel.map(o => o.value) })}
              placeholder="Select your expertise..."
              aria-invalid={!!errors.expertise}
              aria-describedby={errors.expertise ? 'expertise-error' : undefined}
            />
            {errors.expertise && <p id="expertise-error" className="error-message">{errors.expertise}</p>}
          </fieldset>

          <fieldset className="form-group">
            <legend>Years of Experience *</legend>
            <input
              type="number"
              id="experience"
              min="1"
              value={formData.yearsExperience}
              onChange={e => setFormData({ ...formData, yearsExperience: e.target.value })}
              aria-invalid={!!errors.experience}
              aria-describedby={errors.experience ? 'experience-error' : undefined}
            />
            {errors.experience && <p id="experience-error" className="error-message">{errors.experience}</p>}
          </fieldset>
        </div>

        {/* Remaining fields full width */}
        <fieldset className="form-group">
          <legend>Upload CV (PDF, max 5MB) *</legend>
          <input
            type="file"
            id="cv"
            accept=".pdf"
            onChange={e => setFormData({ ...formData, cvFile: e.target.files[0] })}
            aria-invalid={!!errors.cv}
            aria-describedby={errors.cv ? 'cv-error' : undefined}
          />
          {formData.cvFile && <output className="file-info">Selected: {formData.cvFile.name}</output>}
          {errors.cv && <p id="cv-error" className="error-message">{errors.cv}</p>}
        </fieldset>

        <fieldset className="form-group">
          <legend>Publication Links (optional)</legend>
          <textarea
            id="publications"
            value={formData.publications}
            onChange={e => setFormData({ ...formData, publications: e.target.value })}
            placeholder="https://example.com/pub1, https://example.com/pub2"
          />
          <small className="hint">Separate with commas or new lines</small>
        </fieldset>

        <fieldset className="form-group terms">
          <legend>
            <input
              type="checkbox"
              id="terms"
              checked={formData.acceptedTerms}
              onChange={e => setFormData({ ...formData, acceptedTerms: e.target.checked })}
              aria-invalid={!!errors.terms}
              aria-describedby={errors.terms ? 'terms-error' : undefined}
            />
            I accept the {' '}
            <Link to="/terms" onClick={saveFormDataToSession} aria-label="View Terms and Conditions">
              Terms and Conditions</Link> *
          </legend>
          {errors.terms && <p id="terms-error" className="error-message">{errors.terms}</p>}
        </fieldset>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`submit-button ${isSubmitting ? 'submitting' : ''}`}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <> <i className="spinner" role="status" aria-hidden="true"></i> Submitting... </>
          ) : 'Submit Application'}
        </button>
      </form>
    </main>
  );
}