import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../config/firebaseConfig';
import { collection, addDoc, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { logEvent } from '../../utils/logEvent';

async function fetchUserIP() {
  try {
    const response = await axios.get('https://api.ipify.org?format=json');
    return response.data.ip;
  } catch (error) {
    return 'N/A';
  }
}

// Research area options (30+)
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

// Keywords (32+)
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

// Methodology
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

// Departments (20+)
const departmentOptions = [
  { value: 'Physics', label: 'Physics' },
  { value: 'Chemistry', label: 'Chemistry' },
  { value: 'Biology', label: 'Biology' },
  { value: 'Computer Science', label: 'Computer Science' },
  { value: 'Mathematics', label: 'Mathematics' },
  { value: 'Statistics', label: 'Statistics' },
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Medicine', label: 'Medicine' },
  { value: 'Nursing', label: 'Nursing' },
  { value: 'Pharmacy', label: 'Pharmacy' },
  { value: 'Law', label: 'Law' },
  { value: 'Business', label: 'Business' },
  { value: 'Economics', label: 'Economics' },
  { value: 'Political Science', label: 'Political Science' },
  { value: 'Psychology', label: 'Psychology' },
  { value: 'Sociology', label: 'Sociology' },
  { value: 'Anthropology', label: 'Anthropology' },
  { value: 'Education', label: 'Education' },
  { value: 'Environmental Science', label: 'Environmental Science' },
  { value: 'History', label: 'History' },
  { value: 'Other', label: 'Other (please specify)' },
];

function AddListing() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [researchArea, setResearchArea] = useState('');
  const [customResearchArea, setCustomResearchArea] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [customKeyword, setCustomKeyword] = useState('');
  const [methodology, setMethodology] = useState('');
  const [customMethodology, setCustomMethodology] = useState('');
  const [department, setDepartment] = useState('');
  const [customDepartment, setCustomDepartment] = useState('');
  const [collaboratorNeeds, setCollaboratorNeeds] = useState('');
  const [status, setStatus] = useState('Active');
  const [endDate, setEndDate] = useState('');
  const [publicationLink, setPublicationLink] = useState('');
  const [fundingInfo, setFundingInfo] = useState('');
  const [universities, setUniversities] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState('');
  const countries = ['South Africa', 'United States', 'United Kingdom', 'Canada', 'Kenya', 'Nigeria'];

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const docRef = doc(db, 'universityCache', selectedCountry);
        const cachedDoc = await getDoc(docRef);

        if (cachedDoc.exists()) {
          setUniversities(cachedDoc.data().universities);
        } else {
          const response = await axios.get('http://universities.hipolabs.com/search?name=middle');
          const filtered = response.data
            .filter((uni) => uni.country === selectedCountry)
            .map((uni) => ({ label: uni.name, value: uni.name }))
            .sort((a, b) => a.label.localeCompare(b.label));

          setUniversities(filtered);
          await setDoc(docRef, { universities: filtered });
        }
      } catch (error) {
        // handle error
      }
    };

    if (selectedCountry) {
      fetchUniversities();
    }
  }, [selectedCountry]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = auth.currentUser?.uid;
    if (!userId) return alert("User not logged in");

    const keywordsToSave = keywords.map(k => k.value === 'Other' ? customKeyword : k.label).filter(Boolean);
    const methodologyToSave = methodology === 'Other' ? customMethodology : methodology;
    const departmentToSave = department === 'Other' ? customDepartment : department;
    const researchAreaToSave = researchArea === 'Other' ? customResearchArea : researchArea;

    try {
      const newListing = {
        title,
        summary,
        researchArea: researchAreaToSave,
        keywords: keywordsToSave,
        methodology: methodologyToSave,
        institution: selectedUniversity?.value || "",
        department: departmentToSave,
        collaboratorNeeds,
        status,
        endDate,
        publicationLink,
        fundingInfo,
        userId,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "research-listings"), newListing);

      await logEvent({
        userId,
        role: "researcher",
        userName: auth.currentUser?.displayName || "N/A",
        action: "Posted Listing",
        target: `research-listings/${docRef.id}`,
        details: `Posted a new listing: ${title}`,
        ip: await fetchUserIP(),
      });

      navigate("/researcher-dashboard");
    } catch (err) {
      alert("Failed to create listing. Please try again.");
    }
  };

  return (
    <main className="bg-dark min-vh-100 d-flex align-items-center justify-content-center py-4">
      <section className="container bg-white rounded shadow-lg p-4" style={{maxWidth: 850}}>
          <header className="researcher-header">
      <section className="header-title">
        <h1>New Research</h1>
        <p>Fill out the form below to create a new research listing.</p>
      </section>
      <nav className="header-nav">
        <a href="/researcher-dashboard" className="header-link">Dashboard</a>
        <a href="/researcher-profile" className="header-link">Profile</a>
        <a href="/researcher/add-listing" className="header-link">Add Listing</a>
      </nav>
    </header>
        <form onSubmit={handleSubmit} className="row g-4">
          <fieldset className="col-12 border-0">
            <legend className="fw-bold fs-5 mb-3">Research Details</legend>
            <section className="row g-3">
              <section className="col-md-6">
                <label className="form-label fw-semibold">Research Title</label>
                <input
                  type="text"
                  className="form-control"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </section>
              <section className="col-md-6">
                <label className="form-label fw-semibold">Research Area</label>
                <Select
                  options={researchAreaOptions}
                  value={researchAreaOptions.find(o => o.value === researchArea) || null}
                  onChange={selected => setResearchArea(selected ? selected.value : '')}
                  placeholder="Select research area..."
                  isClearable
                />
                {researchArea === 'Other' && (
                  <section className="mt-2">
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
              <section className="col-12">
                <label className="form-label fw-semibold">Abstract/Summary</label>
                <textarea
                  rows="4"
                  className="form-control"
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  required
                />
              </section>
              <section className="col-md-6">
                <label className="form-label fw-semibold">Keywords</label>
                <Select
                  isMulti
                  options={keywordOptions}
                  value={keywords}
                  onChange={setKeywords}
                  placeholder="Select keywords..."
                  isClearable
                />
                {keywords.some(k => k.value === 'Other') && (
                  <section className="mt-2">
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
              <section className="col-md-6">
                <label className="form-label fw-semibold">Methodology</label>
                <Select
                  options={methodologyOptions}
                  value={methodologyOptions.find(o => o.value === methodology) || null}
                  onChange={selected => setMethodology(selected ? selected.value : '')}
                  placeholder="Select methodology..."
                  isClearable
                />
                {methodology === 'Other' && (
                  <section className="mt-2">
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
          <fieldset className="col-12 border-0">
            <legend className="fw-bold fs-5 mb-3">Institution Information</legend>
            <section className="row g-3">
              <section className="col-md-4">
                <label className="form-label fw-semibold">Country</label>
                <select
                  className="form-select"
                  value={selectedCountry}
                  onChange={e => setSelectedCountry(e.target.value)}
                >
                  <option value="">Select a country</option>
                  {countries.map((country, idx) => (
                    <option key={idx} value={country}>{country}</option>
                  ))}
                </select>
              </section>
              <section className="col-md-4">
                <label className="form-label fw-semibold">University</label>
                <Select
                  options={universities}
                  value={selectedUniversity}
                  onChange={setSelectedUniversity}
                  placeholder="Search for your university..."
                  isClearable
                />
              </section>
              <section className="col-md-4">
                <label className="form-label fw-semibold">Department</label>
                <Select
                  options={departmentOptions}
                  value={departmentOptions.find(o => o.value === department) || null}
                  onChange={selected => setDepartment(selected ? selected.value : '')}
                  placeholder="Select department..."
                  isClearable
                />
                {department === 'Other' && (
                  <section className="mt-2">
                    <label className="form-label">Please specify:</label>
                    <input
                      type="text"
                      className="form-control"
                      value={customDepartment}
                      onChange={e => setCustomDepartment(e.target.value)}
                      required
                    />
                  </section>
                )}
              </section>
            </section>
          </fieldset>
          <fieldset className="col-12 border-0">
            <legend className="fw-bold fs-5 mb-3">Project Details</legend>
            <section className="row g-3">
              <section className="col-12">
                <label className="form-label fw-semibold">Collaborator Needs</label>
                <textarea
                  rows="8"
                  className="form-control"
                  style={{ minHeight: '140px' }}
                  value={collaboratorNeeds}
                  onChange={e => setCollaboratorNeeds(e.target.value)}
                  placeholder="Describe the collaborator needs in detail..."
                  required
                />
              </section>
              <section className="col-md-4">
                <label className="form-label fw-semibold">Project Status</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                </select>
              </section>
              <section className="col-md-4">
                <label className="form-label fw-semibold">End Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </section>
              <section className="col-md-4">
                <label className="form-label fw-semibold">Links to Publications</label>
                <input
                  type="url"
                  className="form-control"
                  value={publicationLink}
                  onChange={e => setPublicationLink(e.target.value)}
                />
              </section>
              <section className="col-12 mt-2">
                <label className="form-label fw-semibold d-block">Funding Information</label>
                <section className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="funding"
                    value="Funded"
                    checked={fundingInfo === 'Funded'}
                    onChange={() => setFundingInfo('Funded')}
                    required
                  />
                  <label className="form-check-label">Funded</label>
                </section>
                <section className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="funding"
                    value="Looking for Funding"
                    checked={fundingInfo === 'Looking for Funding'}
                    onChange={() => setFundingInfo('Looking for Funding')}
                    required
                  />
                  <label className="form-check-label">Looking for Funding</label>
                </section>
              </section>
            </section>
          </fieldset>
          <section className="col-12 d-flex justify-content-center">
            <button type="submit" className="btn btn-primary px-4 py-2 fw-bold">
              Create Listing
            </button>
          </section>
        </form>
      </section>
    </main>
  );
}

export default AddListing;