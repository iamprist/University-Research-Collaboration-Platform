// AddListing.jsx - Form for researchers to create a new research project listing
// This component allows researchers to submit new research project listings to the platform.
// It collects research details, keywords, methodology, project details, and funding info.
// All data is saved to Firestore and a confirmation message is sent to the user.

import React, { useState } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../config/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { logEvent } from '../../utils/logEvent';
import { sendMessage, messageTypes } from '../../utils/sendMessage';
import './ResearcherDashboard.css';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

// Fetch the user's public IP address for logging purposes
// Used for audit logging when a new listing is created
async function fetchUserIP() {
  try {
    const response = await axios.get('https://api.ipify.org?format=json');
    return response.data.ip;
  } catch (error) {
    return 'N/A';
  }
}

// Research area options for the select dropdown
// Used in the research area select field
const researchAreaOptions = [
  { value: 'Animal and Veterinary Sciences', label: 'Animal and Veterinary Sciences' },
  { value: 'Anthropology', label: 'Anthropology' },
  { value: 'Biochemistry', label: 'Biochemistry, Molecular and Cell Biology' },
  { value: 'Chemistry', label: 'Chemistry' },
  { value: 'Communication', label: 'Communication, Media Studies, Library and Information Sciences' },
  { value: 'Earth Sciences', label: 'Earth Sciences' },
  { value: 'Economics', label: 'Economics, Management, Administration and Accounting' },
  { value: 'Education', label: 'Education' },
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Health Sciences', label: 'Health Sciences' },
  { value: 'Historical Studies', label: 'Historical Studies' },
  { value: 'Information Technology', label: 'Information Technology' },
  { value: 'Law', label: 'Law' },
  { value: 'Literary Studies', label: 'Literary Studies, Languages and Linguistics' },
  { value: 'Mathematical Sciences', label: 'Mathematical Sciences' },
  { value: 'Microbiology', label: 'Basic and Applied Microbiology' },
  { value: 'Performing Arts', label: 'Performing and Creative Arts, and Design' },
  { value: 'Physics', label: 'Physics' },
  { value: 'Plant Sciences', label: 'Plant Sciences' },
  { value: 'Political Studies', label: 'Political Studies and Philosophy' },
  { value: 'Psychology', label: 'Psychology' },
  { value: 'Religious Studies', label: 'Religious Studies and Theology' },
  { value: 'Sociology', label: 'Sociology and Social Work' },
  { value: 'Geography', label: 'Geography' },
  { value: 'Environmental Science', label: 'Environmental Science' },
  { value: 'Agriculture', label: 'Agriculture' },
  { value: 'Architecture', label: 'Architecture' },
  { value: 'Computer Science', label: 'Computer Science' },
  { value: 'Artificial Intelligence', label: 'Artificial Intelligence' },
  { value: 'Other', label: 'Other (please specify)' },
];

// Keyword options for the select dropdown
// Used in the keywords multi-select field
const keywordOptions = [
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
  { value: 'EDU', label: 'Education' },
  { value: 'PSY', label: 'Psychology' },
  { value: 'ENG', label: 'Engineering' },
  { value: 'ENV', label: 'Environmental Science' },
  { value: 'SOC', label: 'Sociology' },
  { value: 'POL', label: 'Political Science' },
  { value: 'ECO', label: 'Economics' },
  { value: 'PHIL', label: 'Philosophy' },
  { value: 'HIST', label: 'History' },
  { value: 'GEO', label: 'Geography' },
  { value: 'ART', label: 'Art' },
  { value: 'MATH', label: 'Mathematics' },
  { value: 'STAT', label: 'Statistics' },
  { value: 'ANTH', label: 'Anthropology' },
  { value: 'LING', label: 'Linguistics' },
  { value: 'COM', label: 'Communication' },
  { value: 'NUR', label: 'Nursing' },
  { value: 'PHAR', label: 'Pharmacy' },
  { value: 'AGRI', label: 'Agriculture' },
  { value: 'VET', label: 'Veterinary Science' },
  { value: 'ARCH', label: 'Architecture' },
  { value: 'Other', label: 'Other (please specify)' },
];

// Methodology options for the select dropdown
// Used in the methodology select field
const methodologyOptions = [
  { value: 'Quantitative', label: 'Quantitative' },
  { value: 'Qualitative', label: 'Qualitative' },
  { value: 'Mixed Methods', label: 'Mixed Methods' },
  { value: 'Experimental', label: 'Experimental' },
  { value: 'Survey', label: 'Survey' },
  { value: 'Case Study', label: 'Case Study' },
  { value: 'Longitudinal', label: 'Longitudinal' },
  { value: 'Meta-Analysis', label: 'Meta-Analysis' },
  { value: 'Systematic Review', label: 'Systematic Review' },
  { value: 'Other', label: 'Other (please specify)' },
];

function AddListing() {
  // Navigation hook for redirecting after submission
  const navigate = useNavigate();
  // State variables for all form fields and UI state
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [researchArea, setResearchArea] = useState('');
  const [customResearchArea, setCustomResearchArea] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [customKeyword, setCustomKeyword] = useState('');
  const [methodology, setMethodology] = useState('');
  const [customMethodology, setCustomMethodology] = useState('');
  const [collaboratorNeeds, setCollaboratorNeeds] = useState('');
  const [status, setStatus] = useState('Active');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [publicationLink, setPublicationLink] = useState('');
  const [fundingInfo, setFundingInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get today's date and max date for date pickers
  // Used to restrict date input fields
  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 5);
  const maxDateFormatted = maxDate.toISOString().split('T')[0];

  // Handle form submission for creating a new research listing
  // Validates input, prepares data, saves to Firestore, sends confirmation, logs event, and redirects
  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = auth.currentUser?.uid;
    if (!userId) return alert("User not logged in");

    // Validate that end date is after start date
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      alert("End date must be after start date");
      return;
    }

    setIsSubmitting(true);

    // Prepare data for saving, handling custom fields
    const keywordsToSave = keywords.map(k => k.value === 'Other' ? customKeyword : k.label).filter(Boolean);
    const methodologyToSave = methodology === 'Other' ? customMethodology : methodology;
    const researchAreaToSave = researchArea === 'Other' ? customResearchArea : researchArea;

    try {
      // Create the new listing object
      const newListing = {
        title,
        summary,
        researchArea: researchAreaToSave,
        keywords: keywordsToSave,
        methodology: methodologyToSave,
        collaboratorNeeds,
        status,
        startDate,
        endDate,
        publicationLink,
        fundingInfo,
        userId,
        createdAt: serverTimestamp(),
      };

      // Add the listing to Firestore
      const docRef = await addDoc(collection(db, "research-listings"), newListing);

      // Send a confirmation message to the researcher
      await sendMessage(userId, {
        title: 'Project Upload Successful',
        content: `Your project "${title}" has been successfully uploaded and is now live on the platform.`,
        type: messageTypes.UPLOAD_CONFIRMATION,
        relatedId: docRef.id
      });

      // Log the event for analytics/audit
      await logEvent({
        userId,
        role: "researcher",
        userName: auth.currentUser?.displayName || "N/A",
        action: "Posted Listing",
        target: `research-listings/${docRef.id}`,
        details: `Posted a new listing: ${title}`,
        ip: await fetchUserIP(),
      });

      // Redirect to dashboard after successful creation
      navigate("/researcher-dashboard");
    } catch (err) {
      console.error("Error creating listing:", err);
      alert("Failed to create listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render the form UI
  // The form is divided into Research Details and Project Details sections
  return (
    <main className="researcher-dashboard">
      <header className="researcher-header">
         {/* Back button to go to previous page */}
         {/* Uses MUI ArrowBackIosIcon for navigation */}
         <button 
              className="back-button"
              onClick={() => navigate(-1)}
              style={{ 
                color: 'var(--white)',
                marginRight: '1.5rem'
              }}
            >
            <ArrowBackIosIcon />
        </button>
        <section className="header-title">
          <h1>New Research</h1>
          <p>Fill out the form below to create a new research listing.</p>
        </section>
        <section className="header-actions">
        </section>
      </header>

      <section className="dashboard-content">
        <form onSubmit={handleSubmit} className="add-listing-form">
          {/* Research Details Section */}
          {/* Collects title, area, summary, keywords, and methodology */}
          <fieldset className="form-section">
            <legend className="section-title">Research Details</legend>
            <section className="form-row">
              <section className="form-group">
                <label className="form-label">Research Title</label>
                <input
                  type="text"
                  className="form-control"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </section>
              <section className="form-group">
                <label className="form-label">Research Area</label>
                <Select
                  options={researchAreaOptions}
                  value={researchAreaOptions.find(o => o.value === researchArea) || null}
                  onChange={selected => setResearchArea(selected ? selected.value : '')}
                  placeholder="Select research area..."
                  isClearable
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
                {/* Show custom input if 'Other' is selected */}
                {researchArea === 'Other' && (
                  <section className="form-group">
                    <label className="form-label">Please specify:</label>
                    <input
                      type="text"
                      className="form-control"
                      value={customResearchArea}
                      onChange={e => setCustomResearchArea(e.target.value)}
                      required
                    />
                  </section>
                )}
              </section>
            </section>

            <section className="form-group">
              <label className="form-label">Abstract/Summary</label>
              <textarea
                rows="4"
                className="form-control"
                value={summary}
                onChange={e => setSummary(e.target.value)}
                required
              />
            </section>

            <section className="form-row">
              <section className="form-group">
                <label className="form-label">Keywords</label>
                <Select
                  isMulti
                  options={keywordOptions}
                  value={keywords}
                  onChange={setKeywords}
                  placeholder="Select keywords..."
                  isClearable
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
                {/* Show custom input if 'Other' is selected among keywords */}
                {keywords.some(k => k.value === 'Other') && (
                  <section className="form-group">
                    <label className="form-label">Please specify:</label>
                    <input
                      type="text"
                      className="form-control"
                      value={customKeyword}
                      onChange={e => setCustomKeyword(e.target.value)}
                      required
                    />
                  </section>
                )}
              </section>
              <section className="form-group">
                <label className="form-label">Methodology</label>
                <Select
                  options={methodologyOptions}
                  value={methodologyOptions.find(o => o.value === methodology) || null}
                  onChange={selected => setMethodology(selected ? selected.value : '')}
                  placeholder="Select methodology..."
                  isClearable
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
                {/* Show custom input if 'Other' is selected */}
                {methodology === 'Other' && (
                  <section className="form-group">
                    <label className="form-label">Please specify:</label>
                    <input
                      type="text"
                      className="form-control"
                      value={customMethodology}
                      onChange={e => setCustomMethodology(e.target.value)}
                      required
                    />
                  </section>
                )}
              </section>
            </section>
          </fieldset>

          {/* Project Details Section */}
          {/* Collects collaborator needs, status, dates, publication link, and funding info */}
          <fieldset className="form-section">
            <legend className="section-title">Project Details</legend>
            <section className="form-group">
              <label className="form-label">Collaborator Needs</label>
              <textarea
                rows="8"
                className="form-control"
                value={collaboratorNeeds}
                onChange={e => setCollaboratorNeeds(e.target.value)}
                placeholder="Describe the collaborator needs in detail..."
                required
              />
            </section>

            <section className="form-row">
              <section className="form-group">
                <label className="form-label">Project Status</label>
                <select
                  className="form-control"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                </select>
              </section>
              <section className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  min={today}
                  max={maxDateFormatted}
                />
              </section>
              <section className="form-group">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  min={startDate || today}  // Ensure end date is not before start date
                  max={maxDateFormatted}
                />
              </section>
              <section className="form-group">
                <label className="form-label">Links to Publications</label>
                <input
                  type="url"
                  className="form-control"
                  value={publicationLink}
                  onChange={e => setPublicationLink(e.target.value)}
                />
              </section>
            </section>

            <section className="form-group">
              <label className="form-label">Funding Information</label>
              <section className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="funding"
                    value="Funded"
                    checked={fundingInfo === 'Funded'}
                    onChange={() => setFundingInfo('Funded')}
                    required
                  />
                  <span>Funded</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="funding"
                    value="Looking for Funding"
                    checked={fundingInfo === 'Looking for Funding'}
                    onChange={() => setFundingInfo('Looking for Funding')}
                    required
                  />
                  <span>Looking for Funding</span>
                </label>
              </section>
            </section>
          </fieldset>

          {/* Submit button */}
          {/* Disabled while submitting to prevent duplicate submissions */}
          <section className="form-actions">
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Listing'}
            </button>
          </section>
        </form>
      </section>
    </main>
  );
}

// Export the AddListing component as default
export default AddListing;