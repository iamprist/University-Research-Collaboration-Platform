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
  const [tags, setTags] = useState([]);
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
        tags: tags.map(tag => tag.value),
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

  const styles = {
    outerContainer: {
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',
      padding: '20px 0',
    },
    container: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      padding: '30px',
      maxWidth: '850px',
      margin: '0 auto',
    },
    header: {
      marginBottom: '30px',
      textAlign: 'center',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '600',
    },
    input: {
      width: '100%',
      padding: '10px',
      borderRadius: '4px',
      border: '1px solid #ddd',
      fontSize: '16px',
    },
    textarea: {
      width: '100%',
      padding: '10px',
      borderRadius: '4px',
      border: '1px solid #ddd',
      fontSize: '16px',
      minHeight: '120px',
    },
    select: {
      width: '100%',
      padding: '10px',
      borderRadius: '4px',
      border: '1px solid #ddd',
      fontSize: '16px',
      backgroundColor: 'white',
    },
    button: {
      backgroundColor: '#0d6efd',
      color: 'white',
      padding: '12px 20px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '600',
      marginTop: '20px',
    },
    buttonHover: {
      backgroundColor: '#0b5ed7',
    },
    fullWidth: {
      gridColumn: '1 / -1',
    },
  };

  return (
    <main style={styles.outerContainer}>
      <section style={styles.container}>
        <header style={styles.header}>
          <h1>New Research</h1>
          <p>Fill out the form below to create a new research listing.</p>
        </header>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            <div>
              <label style={styles.label}>Research Title</label>
              <input
                type="text"
                style={styles.input}
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={styles.label}>Research Area</label>
              <Select
                options={researchAreaOptions}
                value={researchAreaOptions.find(o => o.value === researchArea) || null}
                onChange={selected => setResearchArea(selected ? selected.value : '')}
                placeholder="Select research area..."
                isClearable
              />
              {researchArea === 'Other' && (
                <div style={{ marginTop: '10px' }}>
                  <label style={styles.label}>Please specify:</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={customResearchArea}
                    onChange={e => setCustomResearchArea(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
            <div style={styles.fullWidth}>
              <label style={styles.label}>Abstract/Summary</label>
              <textarea
                rows="4"
                style={styles.textarea}
                value={summary}
                onChange={e => setSummary(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={styles.label}>Keywords</label>
              <Select
                isMulti
                options={keywordOptions}
                value={keywords}
                onChange={setKeywords}
                placeholder="Select keywords..."
                isClearable
              />
              {keywords.some(k => k.value === 'Other') && (
                <div style={{ marginTop: '10px' }}>
                  <label style={styles.label}>Please specify:</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={customKeyword}
                    onChange={e => setCustomKeyword(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
            <div>
              <label style={styles.label}>Methodology</label>
              <Select
                options={methodologyOptions}
                value={methodologyOptions.find(o => o.value === methodology) || null}
                onChange={selected => setMethodology(selected ? selected.value : '')}
                placeholder="Select methodology..."
                isClearable
              />
              {methodology === 'Other' && (
                <div style={{ marginTop: '10px' }}>
                  <label style={styles.label}>Please specify:</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={customMethodology}
                    onChange={e => setCustomMethodology(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
            <div>
              <label style={styles.label}>Country</label>
              <select
                style={styles.select}
                value={selectedCountry}
                onChange={e => setSelectedCountry(e.target.value)}
              >
                <option value="">Select a country</option>
                {countries.map((country, idx) => (
                  <option key={idx} value={country}>{country}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={styles.label}>University</label>
              <Select
                options={universities}
                value={selectedUniversity}
                onChange={setSelectedUniversity}
                placeholder="Search for your university..."
                isClearable
              />
            </div>
            <div>
              <label style={styles.label}>Department</label>
              <Select
                options={departmentOptions}
                value={departmentOptions.find(o => o.value === department) || null}
                onChange={selected => setDepartment(selected ? selected.value : '')}
                placeholder="Select department..."
                isClearable
              />
              {department === 'Other' && (
                <div style={{ marginTop: '10px' }}>
                  <label style={styles.label}>Please specify:</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={customDepartment}
                    onChange={e => setCustomDepartment(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
            <div style={styles.fullWidth}>
              <label style={styles.label}>Collaborator Needs</label>
              <textarea
                rows="4"
                style={styles.textarea}
                value={collaboratorNeeds}
                onChange={e => setCollaboratorNeeds(e.target.value)}
                placeholder="Describe the collaborator needs in detail..."
                required
              />
            </div>
            <div>
              <label style={styles.label}>Project Status</label>
              <select
                style={styles.select}
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>End Date</label>
              <input
                type="date"
                style={styles.input}
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <label style={styles.label}>Links to Publications</label>
              <input
                type="url"
                style={styles.input}
                value={publicationLink}
                onChange={e => setPublicationLink(e.target.value)}
              />
            </div>
            <div>
              <label style={styles.label}>Funding Information</label>
              <div>
                <label style={{ marginRight: '15px' }}>
                  <input
                    type="radio"
                    name="funding"
                    value="Funded"
                    checked={fundingInfo === 'Funded'}
                    onChange={() => setFundingInfo('Funded')}
                    required
                  /> Funded
                </label>
                <label>
                  <input
                    type="radio"
                    name="funding"
                    value="Looking for Funding"
                    checked={fundingInfo === 'Looking for Funding'}
                    onChange={() => setFundingInfo('Looking for Funding')}
                    required
                  /> Looking for Funding
                </label>
              </div>
            </div>
            <div style={styles.fullWidth}>
              <label style={styles.label}>Tags (up to 5)</label>
              <Select
                isMulti
                options={keywordOptions}
                value={tags}
                onChange={(selectedOptions) => {
                  if (selectedOptions.length <= 5) {
                    setTags(selectedOptions);
                  } else {
                    alert('Please select up to 5 tags only.');
                  }
                }}
                placeholder="Select or type tags..."
                isClearable
              />
            </div>
            <div style={styles.fullWidth}>
              <button
                type="submit"
                style={styles.button}
                onMouseOver={(e) => (e.target.style.backgroundColor = '#0b5ed7')}
                onMouseOut={(e) => (e.target.style.backgroundColor = '#0d6efd')}
              >
                Create Listing
              </button>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}

export default AddListing;