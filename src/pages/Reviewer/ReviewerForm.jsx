import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth, storage } from '../../config/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import Select from 'react-select';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import './ReviewerStyles.css';
import { fetchCountries } from '../../utils/api/countries';
import { fetchUniversities } from '../../utils/api/institution';



const ReviewerForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [countries, setCountries] = useState([]); // State to hold fetched countries
  const [institutions, setInstitutions] = useState([]); // State to hold fetched institutions
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    institution: '',
    customInstitution: '',
    country: '',
    customCountry: '',
    expertiseTags: [],
    summary: '',
    hasResearchExperience: '', // 'yes' or 'no'
    researchSummary: '',
    researchLinks: '',
    yearsExperience: '',
    cvFile: null,
    publications: '',
    acceptedTerms: false,
    hasReviewedResearch: '', // 'yes' or 'no'
    reviewedProjectLink: '',
  });

  // Fetch countries on component mount
 useEffect(() => {
    const loadCountries = async () => {
      const fetchedCountries = await fetchCountries();
      // Add the 'Other' option after fetching
      const countryOptionsWithOther = [
        ...fetchedCountries,
        { value: 'Other', label: 'Other (please specify)' }
      ].sort((a, b) => a.label.localeCompare(b.label));
      setCountries(countryOptionsWithOther);
    };
    loadCountries();
  }, []);

  // Fetch institutions on component mount
  useEffect(() => {
    const loadInstitutions = async () => {
      const fetchedInstitutions = await fetchUniversities();
      setInstitutions(fetchedInstitutions);
    };
    loadInstitutions();
  }, []);


  // Process institution options using useMemo to recompute when institutions state changes
  const institutionOptions = useMemo(() => {
    return [
      ...institutions.map(i => ({ value: i, label: i })),
      {
        value: 'Other',
        label: 'Other (please specify)',
        className: 'other-option'
      }
    ].sort((a, b) => a.label.localeCompare(b.label));
  }, [institutions]);


  // Load saved form data from session storage on mount or when countries/institutions load
  useEffect(() => {
     const savedData = sessionStorage.getItem('reviewerFormData');
  if (savedData) {
    try {
      const parsedData = JSON.parse(savedData);
      const { cvFile, institution, country, expertiseTags, hasResearchExperience, researchSummary, researchLinks, hasReviewedResearch, reviewedProjectLink, ...rest } = parsedData;
      setFormData((prev) => ({
        ...prev,
        ...rest,
        institution: institution || '',
        country: country || '',
        expertiseTags: expertiseTags || [],
        hasResearchExperience: hasResearchExperience || '',
        researchSummary: researchSummary || '',
        researchLinks: researchLinks || '',
        hasReviewedResearch: hasReviewedResearch || '',
        reviewedProjectLink: reviewedProjectLink || '',

      }));


      // Restore selectedInstitution from stored value only if institutions are loaded
      if (parsedData.institution && institutions.length > 0) {
        const institutionValue = parsedData.institution;
        setSelectedInstitution({
          value: institutionValue,
          label: institutionValue === 'Other' ?
            `Other: "${parsedData.customInstitution}"` :
            institutionValue
        });
      }
      // Restore selectedCountry from stored value only if countries are loaded
      if (parsedData.country && countries.length > 0) {
        const countryValue = parsedData.country;
        setSelectedCountry({
          value: countryValue,
          label: countryValue === 'Other' ?
            `Other: "${parsedData.customCountry}"` :
            countryValue
        });
      }
     setFormData(prev => ({
        ...prev,
        ...parsedData,
        // Convert cvFile back to null (can't restore File object)
        cvFile: null
      }));

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
  }, [navigate, countries, institutions]); // Add countries and institutions to dependency array

  // Add a file input effect to preserve selection
useEffect(() => {
  if (formData.cvFile) {
    const fileInput = document.getElementById('cv');
    if (fileInput) {
      // Create new FileList (read-only, can't directly set)
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(formData.cvFile);
      fileInput.files = dataTransfer.files;
    }
  }
}, [formData.cvFile]);


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

  const cvFileName = formData.cvFile ? formData.cvFile.name : '';
   sessionStorage.setItem('reviewerFormData', JSON.stringify({
    ...formData,
    cvFile: cvFileName,  // Store filename instead of File object
    expertiseTags: formData.expertiseTags,
    institution: selectedInstitution ? selectedInstitution.value : '',
    customInstitution: selectedInstitution && selectedInstitution.value === 'Other' ? formData.customInstitution : '',
    country: selectedCountry ? selectedCountry.value : '',
    customCountry: selectedCountry && selectedCountry.value === 'Other' ? formData.customCountry : '',
    hasResearchExperience: formData.hasResearchExperience,
    researchSummary: formData.researchSummary,
    researchLinks: formData.researchLinks,
    hasReviewedResearch: formData.hasReviewedResearch,
    reviewedProjectLink: formData.reviewedProjectLink,
  }));
};

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!selectedInstitution) newErrors.institution = 'Institution is required';
    if (selectedInstitution && selectedInstitution.value === 'Other' && !formData.customInstitution.trim()) {
    newErrors.customInstitution = 'Please specify your institution';
    }
    if (!selectedCountry) newErrors.country = 'Country is required';
  if (selectedCountry && selectedCountry.value === 'Other' && !formData.customCountry.trim()) {
    newErrors.customCountry = 'Please specify your country';
  }
  if (!formData.hasReviewedResearch) {
  newErrors.hasReviewedResearch = 'Please select an option';
}
if (formData.hasReviewedResearch === 'yes' && !formData.reviewedProjectLink.trim()) {
  newErrors.reviewedProjectLink = 'Please provide a link to a project you reviewed';
}
  if (!formData.hasResearchExperience) {
  newErrors.hasResearchExperience = 'Please select an option';
}
if (formData.hasResearchExperience === 'yes') {
  if (!formData.researchSummary.trim()) newErrors.researchSummary = 'Summary is required';
  if (!formData.researchLinks.trim()) newErrors.researchLinks = 'Please provide research links';
}
    if (formData.expertiseTags.length === 0) newErrors.expertise = 'Select at least one expertise area';
    if (!formData.yearsExperience || isNaN(formData.yearsExperience) || Number(formData.yearsExperience) < 1) {
    newErrors.experience = 'Years of experience must be at least 1';
    }
    if (!formData.summary.trim()) newErrors.summary = 'Summary is required';
    if (!formData.cvFile) newErrors.cv = 'CV upload is required';
    if (!formData.acceptedTerms) newErrors.terms = 'You must accept the terms';
    return newErrors;

  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      toast.error('Please fix the highlighted errors');
      setIsSubmitting(false);
      return;
    }

    if (formData.cvFile.size > 5 * 1024 * 1024) {
      toast.error('CV must be less than 5MB');
      setIsSubmitting(false);
      return;
    }
    if (formData.cvFile.type !== 'application/pdf') {
      toast.error('Only PDF files are accepted');
      setIsSubmitting(false);
      return;
    }
    if (
  !formData.yearsExperience ||
  isNaN(formData.yearsExperience) ||
  Number(formData.yearsExperience) < 1
) {
  toast.error('Years of experience must be at least 1');
  setIsSubmitting(false);
  return;
}

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
  institution: selectedInstitution.value === 'Other'
    ? formData.customInstitution.trim()
    : selectedInstitution.label,
    country: selectedCountry.value === 'Other'
    ? formData.customCountry.trim()
    : selectedCountry.label,
  hasReviewedResearch: formData.hasReviewedResearch,
  reviewedProjectLink: formData.reviewedProjectLink,
  expertiseTags: formData.expertiseTags,
  yearsExperience: parseInt(formData.yearsExperience),
  summary: formData.summary.trim(),
  cvUrl,
  publications,
  status: 'in_progress',
  userId: user.uid,
  email: user.email,
  hasResearchExperience: formData.hasResearchExperience,
  researchSummary: formData.researchSummary,
  researchLinks: formData.researchLinks,
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
      <Select
    options={institutionOptions}
    value={selectedInstitution}
    onChange={option => {
      setSelectedInstitution(option);
      setFormData({
        ...formData,
        institution: option ? option.value : '',
        customInstitution: ''
      });
    }}
    placeholder="Select your institution..."
    className="institution-select"
    aria-invalid={!!errors.institution}
    aria-describedby={errors.institution ? "institution-error" : undefined}
  />
  {selectedInstitution && selectedInstitution.value === 'Other' && (
    <input
      type="text"
      id="custom-institution"
      value={formData.customInstitution}
      onChange={e => setFormData({ ...formData, customInstitution: e.target.value })}
      placeholder="Please specify your institution"
      aria-invalid={!!errors.customInstitution}
      aria-describedby={errors.customInstitution ? "custom-institution-error" : undefined}
      style={{ marginTop: '0.5rem' }}
    />
  )}
  {errors.institution && <span id="institution-error" className="error-message">{errors.institution}</span>}
  {errors.customInstitution && <span id="custom-institution-error" className="error-message">{errors.customInstitution}</span>}

</div>{ /* Country Field */}
<div className="form-group">
  <label htmlFor="country">Country *</label>
  <Select
    id="country"
    options={countries} // Use the state variable for options
    value={selectedCountry}
    onChange={option => {
      setSelectedCountry(option);
      setFormData({ ...formData, country: option ? option.value : '', customCountry: '' });
    }}
    placeholder="Select your country..."
    className="country-select"
    aria-invalid={!!errors.country}
    aria-describedby={errors.country ? "country-error" : undefined}
  />
  {selectedCountry && selectedCountry.value === 'Other' && (
    <input
      type="text"
      id="custom-country"
      value={formData.customCountry}
      onChange={e => setFormData({ ...formData, customCountry: e.target.value })}
      placeholder="Please specify your country"
      aria-invalid={!!errors.customCountry}
      aria-describedby={errors.customCountry ? "custom-country-error" : undefined}
      style={{ marginTop: '0.5rem' }}
    />
  )}
  {errors.country && <span id="country-error" className="error-message">{errors.country}</span>}
  {errors.customCountry && <span id="custom-country-error" className="error-message">{errors.customCountry}</span>}
</div>

        {/* Expertise Tags */}
        <div className="form-group">
          <label htmlFor="expertise">Areas of Expertise *</label>
          <Select
  id="expertise"
  isMulti
  options={expertiseOptions}
  value={expertiseOptions.filter(opt => formData.expertiseTags.includes(opt.value))}
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
  onChange={e => {
    const val = e.target.value;
    // Only allow positive integers or empty
    if (val === '' || (/^\d+$/.test(val) && Number(val) > 0)) {
      setFormData({ ...formData, yearsExperience: val });
    }
  }}
  aria-invalid={!!errors.experience}
  aria-describedby={errors.experience ? "experience-error" : undefined}
/>
  {errors.experience && <span id="experience-error" className="error-message">{errors.experience}</span>}
</div>
{/* Summary Field */}
<div className="form-group">
  <label htmlFor="summary">Summary / Abstract *</label>
  <textarea
    id="summary"
    value={formData.summary}
    onChange={e => setFormData({ ...formData, summary: e.target.value })}
    placeholder="Briefly describe your background, expertise, and interests as a reviewer."
    required
    aria-invalid={!!errors.summary}
    aria-describedby={errors.summary ? "summary-error" : undefined}
    rows={4}
  />
  {errors.summary && <span id="summary-error" className="error-message">{errors.summary}</span>}
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
        {/* Reviewed Research Experience */}
        <div className="form-group">
  <label>Have you ever reviewed research before? *</label>
  <div>
    <label>
      <input
        type="radio"
        name="hasReviewedResearch"
        value="yes"
        checked={formData.hasReviewedResearch === 'yes'}
        onChange={() => setFormData({ ...formData, hasReviewedResearch: 'yes' })}
      />{' '}
      Yes
    </label>
    <label style={{ marginLeft: '1.5rem' }}>
      <input
        type="radio"
        name="hasReviewedResearch"
        value="no"
        checked={formData.hasReviewedResearch === 'no'}
        onChange={() => setFormData({ ...formData, hasReviewedResearch: 'no', reviewedProjectLink: '' })}
      />{' '}
      No
    </label>
  </div>
  {errors.hasReviewedResearch && <span className="error-message">{errors.hasReviewedResearch}</span>}
</div>
{formData.hasReviewedResearch === 'yes' && (
  <div className="form-group">
    <label htmlFor="reviewedProjectLink">Link to a Project You Reviewed *</label>
    <input
      type="url"
      id="reviewedProjectLink"
      value={formData.reviewedProjectLink}
      onChange={e => setFormData({ ...formData, reviewedProjectLink: e.target.value })}
      placeholder="https://example.com/reviewed-project"
      required
      aria-invalid={!!errors.reviewedProjectLink}
      aria-describedby={errors.reviewedProjectLink ? "reviewed-project-link-error" : undefined}
    />
    {errors.reviewedProjectLink && <span id="reviewed-project-link-error" className="error-message">{errors.reviewedProjectLink}</span>}
  </div>
)}
        {/* Research Experience */}
        <div className="form-group">
  <label>Have you ever conducted research before? *</label>
  <div>
    <label>
      <input
        type="radio"
        name="hasResearchExperience"
        value="yes"
        checked={formData.hasResearchExperience === 'yes'}
        onChange={() => setFormData({ ...formData, hasResearchExperience: 'yes' })}
      />{' '}
      Yes
    </label>
    <label style={{ marginLeft: '1.5rem' }}>
      <input
        type="radio"
        name="hasResearchExperience"
        value="no"
        checked={formData.hasResearchExperience === 'no'}
        onChange={() => setFormData({ ...formData, hasResearchExperience: 'no', researchSummary: '', researchLinks: '' })}
      />{' '}
      No
    </label>
  </div>
  {errors.hasResearchExperience && <span className="error-message">{errors.hasResearchExperience}</span>}
</div>
{formData.hasResearchExperience === 'yes' && (
  <div className="form-group">
    <label htmlFor="researchSummary">Research Summary *</label>
    <textarea
      id="researchSummary"
      value={formData.researchSummary}
      onChange={e => setFormData({ ...formData, researchSummary: e.target.value })}
      placeholder="Briefly describe your research experience"
      required
      aria-invalid={!!errors.researchSummary}
      aria-describedby={errors.researchSummary ? "research-summary-error" : undefined}
      rows={3}
    />
    {errors.researchSummary && <span id="research-summary-error" className="error-message">{errors.researchSummary}</span>}
  </div>
)}

{formData.hasResearchExperience === 'yes' && (
  <div className="form-group">
    <label htmlFor="researchLinks">Research Links *</label>
    <textarea
      id="researchLinks"
      value={formData.researchLinks}
      onChange={e => setFormData({ ...formData, researchLinks: e.target.value })}
      placeholder="Paste links to your research (comma or newline separated)"
      required
      aria-invalid={!!errors.researchLinks}
      aria-describedby={errors.researchLinks ? "research-links-error" : undefined}
      rows={2}
    />
    {errors.researchLinks && <span id="research-links-error" className="error-message">{errors.researchLinks}</span>}
  </div>
)}        {/* Terms Checkbox */}
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
