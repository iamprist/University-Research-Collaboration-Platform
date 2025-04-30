import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth, storage } from '../../config/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import Select from 'react-select';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './ReviewerStyles.css';

const ReviewerForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    institution: '',
    expertiseTags: [],
    yearsExperience: '',
    cvFile: null,
    publications: '',
    acceptedTerms: false,
  });

  // Check auth state on mount
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        toast.warn('You must be logged in to submit an application');
        navigate('/signin');
      }
    });
    return unsubscribe;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Authentication required. Please log in.');
      return;
    }

    setIsSubmitting(true); // Set submitting state to true

    try {
      console.log('Validating form data...');
      // Validate form
      if (!formData.name.trim()) throw new Error('Full name is required');
      if (!formData.institution.trim()) throw new Error('Institution is required');
      if (formData.expertiseTags.length === 0) throw new Error('Select at least one expertise area');
      if (!formData.yearsExperience || isNaN(formData.yearsExperience)) throw new Error('Valid years of experience required');
      if (!formData.cvFile) throw new Error('CV upload is required');
      if (!formData.acceptedTerms) throw new Error('You must accept the terms');

      // Validate CV file
      if (formData.cvFile.size > 5 * 1024 * 1024) throw new Error('CV must be <5MB');
      if (formData.cvFile.type !== 'application/pdf') throw new Error('Only PDF files accepted');

      console.log('Uploading CV to Firebase Storage...');
      // Upload CV to Storage
      const storageRef = ref(
        storage,
        `reviewer-cvs/${user.uid}/${Date.now()}_${formData.cvFile.name}`
      );
      await uploadBytes(storageRef, formData.cvFile);
      const cvUrl = await getDownloadURL(storageRef);

      console.log('Processing publications...');
      // Process publications
      const publications = formData.publications
        .split(/[\n,]+/)
        .map((link) => link.trim())
        .filter((link) => link);

      console.log('Saving application to Firestore...');
      // Save to Firestore
      await setDoc(doc(db, 'reviewers', user.uid), {
        name: formData.name.trim(),
        institution: formData.institution.trim(),
        expertiseTags: formData.expertiseTags,
        yearsExperience: parseInt(formData.yearsExperience),
        cvUrl,
        publications,
        status: 'in_progress', // Set status to "Application in Progress"
        userId: user.uid,
        email: user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('Application submitted successfully!');
      toast.success('Application submitted successfully!');
      navigate('/reviewer'); // Redirect to ReviewerPage
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error.message || 'Submission failed. Please try again.');
    } finally {
      console.log('Resetting submitting state...');
      setIsSubmitting(false); // Ensure the button resets
    }
  };

  return (
    <div className="reviewer-application-container">
      <h2>Reviewer Application</h2>

      <form onSubmit={handleSubmit}>
        {/* Name Field */}
        <div className="form-group">
          <label>Full Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        {/* Institution Field */}
        <div className="form-group">
          <label>Institution *</label>
          <input
            type="text"
            value={formData.institution}
            onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
            required
          />
        </div>

        {/* Expertise Tags */}
        <div className="form-group">
          <label>Areas of Expertise *</label>
          <Select
            isMulti
            options={expertiseOptions}
            onChange={(selected) =>
              setFormData({
                ...formData,
                expertiseTags: selected,
              })
            }
            
            className="expertise-select"
            placeholder="Select your expertise areas..."
            required
          />
        </div>

        {/* Years of Experience */}
        <div className="form-group">
          <label>Years of Experience *</label>
          <input
            type="number"
            min="1"
            value={formData.yearsExperience}
            onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
            required
          />
        </div>

        {/* CV Upload */}
        <div className="form-group">
          <label>Upload CV (PDF, max 5MB) *</label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFormData({ ...formData, cvFile: e.target.files[0] })}
            required
          />
          {formData.cvFile && (
            <p className="file-info">Selected: {formData.cvFile.name}</p>
          )}
        </div>

        {/* Publications */}
        <div className="form-group">
          <label>
            Publication Links (Optional)
            <span className="hint">Separate with commas or new lines</span>
          </label>
          <textarea
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
            required
          />
          <label htmlFor="terms">
            I accept the <a href="/terms">Terms and Conditions</a> *
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={isSubmitting ? 'submitting' : ''}
        >
          {isSubmitting ? (
            <>
              <span className="spinner"></span>
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
