import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth, storage } from '../../config/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import Select from 'react-select';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import './ReviewerStyles.css';

const ReviewerForm = () => {
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

  // Load saved form data from session storage on mount
  useEffect(() => {
    const savedData = sessionStorage.getItem('reviewerFormData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        // Omit cvFile since it can't be serialized
        const { cvFile, ...rest } = parsedData;
        setFormData((prev) => ({ ...prev, ...rest }));
      } catch (err) {
        console.error('Failed to parse saved form data:', err);
      }
    }

    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        toast.warn('You must be logged in to submit an application');
        navigate('/signin');
      }
    });

    return unsubscribe;
  }, [navigate]);

  // Expertise options (same as before)
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

  // Save form data to sessionStorage
  const saveFormDataToSession = () => {
    // Exclude cvFile since it can't be serialized
    const { cvFile, ...saveData } = formData;
    sessionStorage.setItem('reviewerFormData', JSON.stringify(saveData));
  };

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.institution.trim()) newErrors.institution = 'Institution is required';
    if (formData.expertiseTags.length === 0) newErrors.expertise = 'Select at least one expertise area';
    if (!formData.yearsExperience || isNaN(formData.yearsExperience)) newErrors.experience = 'Valid years of experience required';
    if (!formData.cvFile) newErrors.cv = 'CV upload is required';
    if (!formData.acceptedTerms) newErrors.terms = 'You must accept the terms';
    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      toast.error('Please fix the highlighted errors');
      return;
    }

    if (formData.cvFile.size > 5 * 1024 * 1024) {
      toast.error('CV must be less than 5MB');
      return;
    }
    if (formData.cvFile.type !== 'application/pdf') {
      toast.error('Only PDF files are accepted');
      return;
    }

    setIsSubmitting(true);

    try {
      const storageRef = ref(
        storage,
        `reviewer-cvs/${user.uid}/${Date.now()}_${formData.cvFile.name}`
      );
      await uploadBytes(storageRef, formData.cvFile);
      const cvUrl = await getDownloadURL(storageRef);

      const publications = formData.publications
        .split(/[\n,]+/)
        .map((link) => link.trim())
        .filter((link) => link);

      await setDoc(doc(db, 'reviewers', user.uid), {
        name: formData.name.trim(),
        institution: formData.institution.trim(),
        expertiseTags: formData.expertiseTags,
        yearsExperience: parseInt(formData.yearsExperience),
        cvUrl,
        publications,
        status: 'in_progress',
        userId: user.uid,
        email: user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success('Application submitted successfully!');
      sessionStorage.removeItem('reviewerFormData');
      navigate('/reviewer');
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reviewer-application-container" role="region" aria-labelledby="form-heading">
      <h2 id="form-heading">Reviewer Application</h2>

      <form onSubmit={handleSubmit} noValidate>
        {/* Name Field */}
        <div className="form-group">
          <label htmlFor="name">Full Name *</label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name && <span id="name-error" className="error-message">{errors.name}</span>}
        </div>

        {/* Institution Field */}
        <div className="form-group">
          <label htmlFor="institution">Institution *</label>
          <input
            type="text"
            id="institution"
            value={formData.institution}
            onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
            aria-invalid={!!errors.institution}
            aria-describedby={errors.institution ? "institution-error" : undefined}
          />
          {errors.institution && <span id="institution-error" className="error-message">{errors.institution}</span>}
        </div>

        {/* Expertise Tags */}
        <div className="form-group">
          <label htmlFor="expertise">Areas of Expertise *</label>
          <Select
            id="expertise"
            isMulti
            options={expertiseOptions}
            onChange={(selected) =>
              setFormData({
                ...formData,
                expertiseTags: selected.map((opt) => opt.value),
              })
            }
            className="expertise-select"
            placeholder="Select your expertise areas..."
            aria-invalid={!!errors.expertise}
            aria-describedby={errors.expertise ? "expertise-error" : undefined}
          />
          {errors.expertise && <span id="expertise-error" className="error-message">{errors.expertise}</span>}
        </div>

        {/* Years of Experience */}
        <div className="form-group">
          <label htmlFor="experience">Years of Experience *</label>
          <input
            type="number"
            id="experience"
            min="1"
            value={formData.yearsExperience}
            onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
            aria-invalid={!!errors.experience}
            aria-describedby={errors.experience ? "experience-error" : undefined}
          />
          {errors.experience && <span id="experience-error" className="error-message">{errors.experience}</span>}
        </div>

        {/* CV Upload */}
        <div className="form-group">
          <label htmlFor="cv">Upload CV (PDF, max 5MB) *</label>
          <input
            type="file"
            id="cv"
            accept=".pdf"
            onChange={(e) => setFormData({ ...formData, cvFile: e.target.files[0] })}
            aria-invalid={!!errors.cv}
            aria-describedby={errors.cv ? "cv-error" : undefined}
          />
          {formData.cvFile && <p className="file-info">Selected: {formData.cvFile.name}</p>}
          {errors.cv && <span id="cv-error" className="error-message">{errors.cv}</span>}
        </div>

        {/* Publications */}
        <div className="form-group">
          <label htmlFor="publications">
            Publication Links (Optional)
            <span className="hint">Separate with commas or new lines</span>
          </label>
          <textarea
            id="publications"
            value={formData.publications}
            onChange={(e) => setFormData({ ...formData, publications: e.target.value })}
            placeholder="https://example.com/pub1, https://example.com/pub2"
          />
        </div>

        {/* Terms Checkbox */}
        <div className="form-group terms">
          <input
            type="checkbox"
            id="terms"
            checked={formData.acceptedTerms}
            onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
            aria-invalid={!!errors.terms}
            aria-describedby={errors.terms ? "terms-error" : undefined}
          />
          <label htmlFor="terms">
            I accept the{' '}
            <Link
              to="/terms"
              onClick={saveFormDataToSession}
              aria-label="View Terms and Conditions"
            >
              Terms and Conditions
            </Link>{' '}
            *
          </label>
          {errors.terms && <span id="terms-error" className="error-message">{errors.terms}</span>}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`submit-button ${isSubmitting ? 'submitting' : ''}`}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="spinner" role="status" aria-hidden="true"></span>
              Submitting...
            </>
          ) : (
            'Submit Application'
          )}
        </button>
      </form>
    </div>
  );
};

export default ReviewerForm;