// CollaborationRequestsPanel.jsx - Shows and manages incoming collaboration requests for the current researcher
import { useState, useEffect } from 'react';
import { db, auth } from '../config/firebaseConfig';
import { collection, query, where, onSnapshot, updateDoc, doc, addDoc, arrayUnion , getDoc} from 'firebase/firestore';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CollaborationRequestsPanel = () => {
  // State for pending requests and loading status
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Listen for pending collaboration requests for the current user
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'collaboration-requests'),
      where('researcherId', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRequests(requestsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle accepting or rejecting a request
  const handleResponse = async (requestId, response) => {
    try {
      const requestRef = doc(db, 'collaboration-requests', requestId);
      const requestDoc = await getDoc(requestRef);
      const requestData = requestDoc.data();

      await updateDoc(requestRef, { 
        status: response,
        respondedAt: new Date()
      });

      if (response === 'accepted') {
        // Create collaboration document
        await addDoc(collection(db, 'collaborations'), {
          listingId: requestData.listingId,
          researcherId: requestData.researcherId,
          collaboratorId: requestData.requesterId,
          joinedAt: new Date(),
          status: 'active'
        });

        // Add collaborator to the listing
        await updateDoc(doc(db, 'research-listings', requestData.listingId), {
          collaborators: arrayUnion(requestData.requesterId)
        });

        toast.success(`Collaboration with ${requestData.requesterName} accepted!`);
      } else {
        toast.info(`Request from ${requestData.requesterName} rejected`);
      }

      // Remove the request from local state
      setRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error handling request:', error);
      toast.error('Failed to process request');
    }
  };

  // Inline styles for the panel and buttons
  const styles = {
    panel: {
      backgroundColor: '#FFFFFF',
      borderRadius: '0.5rem',
      padding: '1rem',
      margin: '1rem 0',
      color: '#000000'
    },
    requestItem: {
      borderBottom: '1px solid rgb(0, 0, 0)',
      padding: '1rem 0',
      marginBottom: '1rem'
    },
    buttonGroup: {
      display: 'flex',
      gap: '0.5rem',
      marginTop: '0.5rem'
    },
    acceptButton: {
      backgroundColor: '#64CCC5',
      color: '#132238',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '0.25rem',
      cursor: 'pointer'
    },
    rejectButton: {
      backgroundColor: '#FF6B6B',
      color: 'white',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '0.25rem',
      cursor: 'pointer'
    }
  };

  if (loading) return <p>Loading requests...</p>;

  // Render the panel with pending requests and action buttons
  return (
    <section style={styles.panel}>
      <h3>Collaboration Requests</h3>
      {requests.length === 0 ? (
        <p>No pending requests</p>
      ) : (
        requests.map(request => (
          <section key={request.id} style={styles.requestItem}>
            <p>
              <strong>{request.requesterName}</strong> wants to collaborate on your project.
            </p>
            {request.message && <p>Message: "{request.message}"</p>}
            <section style={styles.buttonGroup}>
              <button 
                style={styles.acceptButton}
                onClick={() => handleResponse(request.id, 'accepted')}
              >
                Accept
              </button>
              <button
                style={styles.rejectButton}
                onClick={() => handleResponse(request.id, 'rejected')}
              >
                Reject
              </button>
            </section>
          </section>
        ))
      )}
    </section>
  );
};

export default CollaborationRequestsPanel;