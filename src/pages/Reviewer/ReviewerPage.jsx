import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from './authContext'; // Assuming you have an auth context for user authentication

const ReviewerDashboard = () => {
  const { userId } = useAuth(); // Assuming you're using an auth context to manage user data
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await axios.get(`/api/reviewer/recommendations?userId=${userId}`);
        setRecommendations(response.data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching recommendations');
        setLoading(false);
      }
    };

    if (userId) {
      fetchRecommendations();
    }
  }, [userId]);

  return (
    <main>
      <h1>Recommended Research</h1>

      {loading && <p>Loading recommendations...</p>}
      {error && <p>{error}</p>}

      <section>
        {recommendations.length > 0 ? (
          <ul>
            {recommendations.map((research) => (
              <li key={research.id}>
                <article>
                  <h2>{research.title}</h2>
                  <p>{research.summary}</p>
                  <ul>
                    {research.tags && research.tags.map((tag, idx) => (
                      <li key={idx}>{tag}</li>
                    ))}
                  </ul>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <p>No recommendations available.</p>
        )}
      </section>
    </main>
  );
};

export default ReviewerDashboard;
