import { useState, useEffect } from 'react';
import { db, auth } from '../config/firebaseConfig';
import {
  collection,
  query,
  where,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { toast } from 'react-toastify';
import './FriendsSystem.css';


const FriendsSystem = () => {
  const [friends, setFriends] = useState([]);
  const [pendingReceived, setPendingReceived] = useState([]);
  const [pendingSent, setPendingSent] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(null);

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'friends'),
      where('users', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const received = [];
      const sent = [];
      const accepted = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const otherUserId = data.users.find((u) => u !== currentUser.uid);

        if (data.status === 'accepted') {
          accepted.push(otherUserId);
        } else if (data.status === 'pending') {
          if (data.sender === currentUser.uid) {
            sent.push(otherUserId);
          } else {
            received.push({ docId: docSnap.id, userId: otherUserId });
          }
        }
      });

      setFriends(accepted);
      setPendingSent(sent);
      setPendingReceived(received);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const results = usersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user =>
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          user.id !== currentUser?.uid &&
          !friends.includes(user.id) &&
          !pendingSent.includes(user.id)
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
      setSendingRequest(userId);

      await addDoc(collection(db, 'friends'), {
        users: [currentUser.uid, userId],
        status: 'pending',
        sender: currentUser.uid,
        createdAt: serverTimestamp()
      });

      toast.success('Friend request sent!');
    } catch (error) {
      toast.error('Failed to send request');
    } finally {
      setSendingRequest(null);
    }
  };

  const respondToRequest = async (docId, userId, accept) => {
    try {
      if (accept) {
        await updateDoc(doc(db, 'friends', docId), {
          status: 'accepted'
        });
        toast.success('Friend request accepted!');
      } else {
        await updateDoc(doc(db, 'friends', docId), {
          status: 'declined'
        });
        toast.info('Request declined');
      }
    } catch (error) {
      toast.error('Failed to respond to request');
    }
  };

  return (
    <div className="friends-system">
      <h2>Friends</h2>

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
      <div className="requests-section">
        <h3>Friend Requests</h3>
        {pendingReceived.length > 0 ? (
          <div className="requests-list">
            {pendingReceived.map(({ docId, userId }) => (
              <FriendCard
                key={userId}
                userId={userId}
                requestDocId={docId}
                onRespond={respondToRequest}
              />
            ))}
          </div>
        ) : (
          <p className="no-requests">No pending friend requests</p>
        )}
      </div>

      <div className="friends-list">
        <h3>Your Friends ({friends.length})</h3>
        {friends.length > 0 ? (
          friends.map(friendId => (
            <FriendCard key={friendId} userId={friendId} />
          ))
        ) : (
          <p className="no-friends">You haven't added any friends yet</p>
        )}
      </div>
    </div>
  );
};

const FriendCard = ({ userId, requestDocId, onRespond }) => {
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
    <div className="user-card">
      <div className="user-info">
        <span className="user-name">{userData.name}</span>
        {userData.researchArea && (
          <span className="research-area">{userData.researchArea}</span>
        )}
      </div>
      {onRespond ? (
        <div className="request-actions">
          <button className="accept-btn" onClick={() => onRespond(requestDocId, userId, true)}>
            Accept
          </button>
          <button className="decline-btn" onClick={() => onRespond(requestDocId, userId, false)}>
            Decline
          </button>
        </div>
      ) : (
        <span className="friend-status">Friends</span>
      )}
    </div>
  );
};

export default FriendsSystem;
