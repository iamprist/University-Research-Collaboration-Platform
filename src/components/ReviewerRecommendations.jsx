// ReviewerRecommendations.jsx
import React, { useEffect, useState } from 'react';
import { auth, db } from '../config/firebaseConfig';
import { collection, getDocs} from 'firebase/firestore';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ReviewerRecommendations = () => {
  const [recommendedResearch, setRecommendedResearch] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return toast.warn('User not authenticated');

        // Get expertiseTags from reviewerApplications
        const applicationDoc = await db.collection('reviewApplications').doc(user.uid).get();
        if (!applicationDoc.exists) throw new Error('Application not found');

        const { expertiseTags } = applicationDoc.data();

        // Fetch research listings
        const researchSnapshot = await getDocs(collection(db, 'research'));
        const allResearch = researchSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Match research listings with expertiseTags
        const matched = allResearch.filter(research =>
          research.tags?.some(tag => expertiseTags.includes(tag))
        );

        setRecommendedResearch(matched);
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
        toast.error('Error fetching recommendations.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) return <p>Loading recommendations...</p>;

  return (
    <div className="recommended-research p-4">
      <h3 className="text-xl font-semibold mb-4">Recommended Research</h3>
      {recommendedResearch.length === 0 ? (
        <p className="text-gray-600">No recommendations available at this time.</p>
      ) : (
        <ul className="space-y-3">
          {recommendedResearch.map(research => (
            <li key={research.id} className="bg-white p-4 shadow rounded-lg">
              <h4 className="font-bold text-lg">{research.title}</h4>
              <p className="text-sm text-gray-700">Tags: {research.tags.join(', ')}</p>
              <p className="text-sm text-gray-600">{research.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReviewerRecommendations;
