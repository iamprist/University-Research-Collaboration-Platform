import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db, auth, storage } from '../../config/firebaseConfig';
import { doc, getDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import { useAuth } from './authContext';
import { logEvent } from '../../utils/logEvent';
import ReviewerRecommendations from '../../components/ReviewerRecommendations';
import ReviewerNavbar from '../../components/ReviewerNavbar';
import Select from 'react-select';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './ReviewerStyles.css';

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

const statusStyles = {
  inProgress: { backgroundColor: '#ffc1071a', color: '#ffc107' },
  rejected: { backgroundColor: '#dc35451a', color: '#dc3545' },
};

const ReviewerPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [status, setStatus] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Auth & tracking
  useEffect(() => {
    const saveToken = async () => {
      if (currentUser) {
        const token = await currentUser.getIdToken();
        localStorage.setItem('authToken', token);
        await logEvent({
          userId: currentUser.uid,
          role: "Reviewer",
          userName: currentUser.displayName || "N/A",
          action: "Login",
          details: "User logged in",
        });
      }
    };
    if (currentUser) saveToken();
  }, [currentUser]);

  // Form restoration + fetch reviewer status
  useEffect(() => {
    const savedData = sessionStorage.getItem('reviewerFormData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData((prev) => ({ ...prev, ...parsedData }));
      } catch (err) {
        console.error('Failed to parse saved form data:', err);
      }
    }

    const fetchReviewerStatus = async () => {
      if (!currentUser) {
        navigate('/signin');
        return;
      }
      try {
        const docRef = doc(db, "reviewers", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStatus(data.status || 'in_progress');
          setReason(data.rejectionReason || '');
        } else {
          setStatus('not_found');
        }
      } catch (error) {
        console.error("Error fetching reviewer status:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) fetchReviewerStatus();
  }, [currentUser, navigate]);

  const validateForm = () => {
    const newErrors = {};
    const { name, institution, expertiseTags, yearsExperience, cvFile, acceptedTerms } = formData;
    if (!name.trim()) newErrors.name = 'Full name is required';
    if (!institution.trim()) newErrors.institution = 'Institution is required';
    if (!expertiseTags.length) newErrors.expertiseTags = 'Select at least one expertise area';
    if (!yearsExperience || isNaN(yearsExperience) || parseInt(yearsExperience) <= 0) {
      newErrors.yearsExperience = 'Valid years of experience required';
    }
    if (!cvFile) newErrors.cvFile = 'CV upload is required';
    if (!acceptedTerms) newErrors.acceptedTerms = 'You must accept the terms';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length) {
      setErrors(formErrors);
      toast.error('Please fix the highlighted errors');
      return;
    }

    if (formData.cvFile.size > 5 * 1024 * 1024 || formData.cvFile.type !== 'application/pdf') {
      toast.error('CV must be a PDF under 5MB');
      return;
    }

    setIsSubmitting(true);
    try {
      const storageRef = ref(storage, `reviewer-cvs/${currentUser.uid}/${Date.now()}_${formData.cvFile.name}`);
      await uploadBytes(storageRef, formData.cvFile);
      const cvUrl = await getDownloadURL(storageRef);

      const publications = formData.publications.split(/[\n,]+/)
        .map(link => link.trim()).filter(Boolean);

      await setDoc(doc(db, 'reviewers', currentUser.uid), {
        name: formData.name,
        institution: formData.institution,
        expertiseTags: formData.expertiseTags,
        yearsExperience: parseInt(formData.yearsExperience),
        cvUrl,
        publications,
        status: 'in_progress',
        userId: currentUser.uid,
        email: currentUser.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      sessionStorage.removeItem('reviewerFormData');
      toast.success('Application submitted!');
      navigate('/reviewer');
    } catch (err) {
      console.error('Submission failed:', err);
      toast.error('Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    try {
      await deleteDoc(doc(db, 'reviewers', currentUser.uid));
      setStatus('not_found');
    } catch (err) {
      console.error('Error revoking application:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('authToken');
      navigate('/signin');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      <ReviewerNavbar onRevoke={handleRevoke} />
      <main className="min-vh-100 p-4" style={{ backgroundColor: '#1A2E40' }}>
        <header className="text-white mb-4">
          <h1>Reviewer Dashboard</h1>
          <p>Hi {currentUser?.displayName || 'Reviewer'}</p>
        </header>

        {loading ? (
          <p className="text-white">Loading status...</p>
        ) : status === 'approved' ? (
          <ReviewerRecommendations userId={currentUser.uid} />
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow-sm">
            <h2>Apply to be a Reviewer</h2>
            <div className="form-group">
              <label>Full Name</label>
              <input className="form-control" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              {errors.name && <div className="text-danger">{errors.name}</div>}
            </div>
            <div className="form-group">
              <label>Institution</label>
              <input className="form-control" value={formData.institution} onChange={(e) => setFormData({ ...formData, institution: e.target.value })} />
              {errors.institution && <div className="text-danger">{errors.institution}</div>}
            </div>
            <div className="form-group">
              <label>Expertise Areas</label>
              <Select options={expertiseOptions} isMulti onChange={(selected) => setFormData({ ...formData, expertiseTags: selected.map(opt => opt.value) })} />
              {errors.expertiseTags && <div className="text-danger">{errors.expertiseTags}</div>}
            </div>
            <div className="form-group">
              <label>Years of Experience</label>
              <input type="number" className="form-control" value={formData.yearsExperience} onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })} />
              {errors.yearsExperience && <div className="text-danger">{errors.yearsExperience}</div>}
            </div>
            <div className="form-group">
              <label>Upload CV (PDF)</label>
              <input type="file" accept="application/pdf" onChange={(e) => setFormData({ ...formData, cvFile: e.target.files[0] })} />
              {errors.cvFile && <div className="text-danger">{errors.cvFile}</div>}
            </div>
            <div className="form-group">
              <label>Publications (comma or newline separated)</label>
              <textarea className="form-control" value={formData.publications} onChange={(e) => setFormData({ ...formData, publications: e.target.value })} />
            </div>
            <div className="form-check mt-2">
              <input type="checkbox" className="form-check-input" checked={formData.acceptedTerms} onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })} />
              <label className="form-check-label">I accept the terms and conditions</label>
              {errors.acceptedTerms && <div className="text-danger">{errors.acceptedTerms}</div>}
            </div>
            <button className="btn btn-primary mt-3" disabled={isSubmitting}>Submit Application</button>
          </form>
        )}
      </main>
    </>
  );
};

export default ReviewerPage;
