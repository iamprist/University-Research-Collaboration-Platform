import { useState, useEffect } from 'react';
import { db, auth } from '../config/firebaseConfig';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayRemove, 
  arrayUnion,
  collection,
  getDocs
} from 'firebase/firestore';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './FriendsSystem.css';

const FriendsSystem = () => {
  const [friends, setFriends] = useState([]);
  const [pendingReceived, setPendingReceived] = useState([]);
  const [pendingSent, setPendingSent] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [receivedRequestsData, setReceivedRequestsData] = useState([]);
  const [sendingRequest, setSendingRequest] = useState(null); // Track which request is being sent

  // Fetch user's friend data and pending requests
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setFriends(data.friends || []);
        setPendingReceived(data.pendingReceivedRequests || []);
        setPendingSent(data.pendingSentRequests || []);
      }
    };

    fetchUserData();
  }, []);

  // Fetch details of users who sent friend requests
  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (pendingReceived.length === 0) return;
      
      const requestersData = await Promise.all(
        pendingReceived.map(async (userId) => {
          const userDoc = await getDoc(doc(db, 'users', userId));
          return userDoc.exists() ? { id: userId, ...userDoc.data() } : null;
        })
      );
      
      setReceivedRequestsData(requestersData.filter(Boolean));
    };

    fetchRequestDetails();
  }, [pendingReceived]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const results = usersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => 
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          user.id !== auth.currentUser.uid
        );
      
      setSearchResults(results);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (userId) => {
    try {
      setSendingRequest(userId); // Set the user ID we're sending to
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      await updateDoc(doc(db, 'users', currentUser.uid), {
        pendingSentRequests: arrayUnion(userId)
      });

      await updateDoc(doc(db, 'users', userId), {
        pendingReceivedRequests: arrayUnion(currentUser.uid)
      });

      setPendingSent(prev => [...prev, userId]);
      toast.success('Friend request sent!');
    } catch (error) {
      toast.error('Failed to send request');
    } finally {
      setSendingRequest(null); // Reset sending state
    }
  };

  const respondToRequest = async (userId, accept) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      if (accept) {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          friends: arrayUnion(userId),
          pendingReceivedRequests: arrayRemove(userId)
        });
        await updateDoc(doc(db, 'users', userId), {
          friends: arrayUnion(currentUser.uid),
          pendingSentRequests: arrayRemove(currentUser.uid)
        });
        
        setFriends(prev => [...prev, userId]);
        toast.success(`${receivedRequestsData.find(u => u.id === userId)?.name || 'User'} is now your friend!`);
      } else {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          pendingReceivedRequests: arrayRemove(userId)
        });
        await updateDoc(doc(db, 'users', userId), {
          pendingSentRequests: arrayRemove(currentUser.uid)
        });
        
        toast.info(`Declined request from ${receivedRequestsData.find(u => u.id === userId)?.name || 'user'}`);
      }

      setPendingReceived(prev => prev.filter(id => id !== userId));
      setReceivedRequestsData(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      toast.error('Failed to process request');
    }
  };

  return (
    <div className="friends-system">
      <h2>Friends System</h2>
      
      {/* Search Section */}
      <div className="search-section">
        <input
          type="text"
          placeholder="Search for researchers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Received Friend Requests */}
      {receivedRequestsData.length > 0 && (
        <div className="requests-section">
          <h3>Friend Requests ({receivedRequestsData.length})</h3>
          <div className="requests-list">
            {receivedRequestsData.map(user => (
              <div key={user.id} className="request-card">
                <div className="user-info">
                  <span className="user-name">{user.name}</span>
                  {user.researchArea && (
                    <span className="research-area">{user.researchArea}</span>
                  )}
                </div>
                <div className="request-actions">
                  <button 
                    className="accept-btn"
                    onClick={() => respondToRequest(user.id, true)}
                  >
                    Accept
                  </button>
                  <button 
                    className="decline-btn"
                    onClick={() => respondToRequest(user.id, false)}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="search-results">
          <h3>Search Results</h3>
          {searchResults.map(user => {
            const isPending = pendingSent.includes(user.id);
            const isSending = sendingRequest === user.id;
            
            return (
              <div key={user.id} className="user-card">
                <div className="user-info">
                  <span className="user-name">{user.name}</span>
                  {user.researchArea && (
                    <span className="research-area">{user.researchArea}</span>
                  )}
                </div>
                {isPending ? (
                  <span className="request-sent-label">Request Sent</span>
                ) : (
                  <button 
                    className="add-friend-btn"
                    onClick={() => sendFriendRequest(user.id)}
                    disabled={isSending}
                  >
                    {isSending ? 'Sending...' : 'Add Friend'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Friends List */}
      {friends.length > 0 && (
        <div className="friends-list">
          <h3>Your Friends ({friends.length})</h3>
          {friends.map(friendId => (
            <FriendCard key={friendId} userId={friendId} />
          ))}
        </div>
      )}
    </div>
  );
};

const FriendCard = ({ userId }) => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) setUserData(userDoc.data());
    };
    fetchUser();
  }, [userId]);

  if (!userData) return <div className="user-card loading">Loading...</div>;

  return (
    <div className="user-card friend">
      <div className="user-info">
        <span className="user-name">{userData.name}</span>
        {userData.researchArea && (
          <span className="research-area">{userData.researchArea}</span>
        )}
      </div>
      <span className="friend-status">Friends</span>
    </div>
  );
};

export default FriendsSystem;