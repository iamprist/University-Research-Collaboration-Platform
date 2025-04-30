import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../config/firebaseConfig';
import { collection, addDoc, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { logEvent } from '../../utils/logEvent'; // Import the logEvent function

async function fetchUserIP() {
  try {
    const response = await axios.get('https://api.ipify.org?format=json');
    return response.data.ip;
  } catch (error) {
    console.error('Failed to fetch user IP:', error);
    return 'N/A';
  }
}

function AddListing() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [researchArea, setResearchArea] = useState('');
  const [keywords, setKeywords] = useState('');
  const [methodology, setMethodology] = useState('');
  const [department, setDepartment] = useState('');
  const [collaboratorNeeds, setCollaboratorNeeds] = useState('');
  const [status, setStatus] = useState('Active');
  const [endDate, setEndDate] = useState('');
  const [publicationLink, setPublicationLink] = useState('');
  const [fundingInfo, setFundingInfo] = useState('');
  const [tags, setTags] = useState('');
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
        console.error('Failed to fetch universities:', error);
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

    try {
      const newListing = {
        title,
        summary,
        researchArea,
        keywords,
        methodology,
        institution: selectedUniversity?.value || "",
        department,
        collaboratorNeeds,
        status,
        endDate,
        publicationLink,
        fundingInfo,
        tags,
        userId,
        createdAt: serverTimestamp(),
      };

      // Add the new listing to Firestore
      const docRef = await addDoc(collection(db, "research-listings"), newListing);

      // Log the event
      await logEvent({
        userId,
        role: "researcher",
        userName: auth.currentUser?.displayName || "N/A",
        action: "Posted Listing",
        target: `research-listings/${docRef.id}`,
        details: `Posted a new listing: ${title}`,
        ip: await fetchUserIP(), // Fetch the user's IP address
      });

      navigate("/researcher-dashboard");
    } catch (err) {
      console.error("Error adding listing: ", err);
      alert("Failed to create listing. Please try again.");
    }
  };

  const styles = {
    outerContainer: {
      backgroundColor: '#132238',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    },
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
      backgroundColor: '#FFFFFF',
      borderRadius: '1rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      fontFamily: 'Inter, sans-serif',
    },
    header: {
      textAlign: 'center',
      marginBottom: '2rem',
      color: '#132238',
    },
    form: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1.5rem',
    },
    fullWidth: {
      gridColumn: '1 / -1',
    },
    label: {
      fontWeight: '500',
      marginBottom: '0.5rem',
      display: 'block',
      color: '#132238',
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '0.5rem',
      border: '1px solid #D1D5DB',
      fontSize: '1rem',
      color: '#132238',
    },
    textarea: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '0.5rem',
      border: '1px solid #D1D5DB',
      fontSize: '1rem',
      resize: 'none',
      color: '#132238',
    },
    select: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '0.5rem',
      border: '1px solid #D1D5DB',
      fontSize: '1rem',
      color: '#132238',
    },
    button: {
      backgroundColor: '#64CCC5',
      color: '#FFFFFF',
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      border: 'none',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
      gridColumn: '1 / -1',
      textAlign: 'center',
    },
    buttonHover: {
      backgroundColor: '#5AA9A3',
    },
  };

  return (
    <div style={styles.outerContainer}>
      <main style={styles.container}>
        <header style={styles.header}>
          <h2>Add New Research Listing</h2>
          <p>Fill out the form below to create a new research listing.</p>
        </header>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div>
            <label style={styles.label}>Research Title</label>
            <input
              type="text"
              style={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={styles.label}>Research Area</label>
            <input
              type="text"
              style={styles.input}
              value={researchArea}
              onChange={(e) => setResearchArea(e.target.value)}
            />
          </div>
          <div className={styles.fullWidth}>
            <label style={styles.label}>Abstract/Summary</label>
            <textarea
              rows="4"
              style={styles.textarea}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              required
            ></textarea>
          </div>
          <div>
            <label style={styles.label}>Keywords</label>
            <input
              type="text"
              style={styles.input}
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>
          <div>
            <label style={styles.label}>Methodology</label>
            <input
              type="text"
              style={styles.input}
              value={methodology}
              onChange={(e) => setMethodology(e.target.value)}
            />
          </div>
          <div>
            <label style={styles.label}>Country</label>
            <select
              style={styles.select}
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              <option value="">Select a country</option>
              {countries.map((country, idx) => (
                <option key={idx} value={country}>
                  {country}
                </option>
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
            <input
              type="text"
              style={styles.input}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>
          <div>
            <label style={styles.label}>Collaborator Needs</label>
            <input
              type="text"
              style={styles.input}
              value={collaboratorNeeds}
              onChange={(e) => setCollaboratorNeeds(e.target.value)}
            />
          </div>
          <div>
            <label style={styles.label}>Project Status</label>
            <select
              style={styles.select}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
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
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <label style={styles.label}>Links to Publications</label>
            <input
              type="url"
              style={styles.input}
              value={publicationLink}
              onChange={(e) => setPublicationLink(e.target.value)}
            />
          </div>
          <div>
            <label style={styles.label}>Funding Information</label>
            <input
              type="text"
              style={styles.input}
              value={fundingInfo}
              onChange={(e) => setFundingInfo(e.target.value)}
            />
          </div>


            
              <div style={styles.fullWidth}>
              <label style={styles.label}>Tags (up to 5)</label>
              <Select
                isMulti
                options={ [
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
                ]}
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
          <button
            type="submit"
            style={styles.button}
            onMouseOver={(e) => (e.target.style.backgroundColor = styles.buttonHover.backgroundColor)}
            onMouseOut={(e) => (e.target.style.backgroundColor = styles.button.backgroundColor)}
          >
            Create Listing
          </button>
        </form>
      </main>
    </div>
  );
}

export default AddListing;
