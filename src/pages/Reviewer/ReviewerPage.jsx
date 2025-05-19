import React, { useEffect, useState } from 'react'
import {
  doc,
  getDoc,
  deleteDoc,
  addDoc,
  collection,
  serverTimestamp
} from 'firebase/firestore'
import { db, auth } from '../../config/firebaseConfig'
import { useAuth } from './authContext'
import { useNavigate } from 'react-router-dom'
import ReviewerRecommendations from '../../components/ReviewerRecommendations'
import axios from 'axios'

export default function ReviewerPage() {
  const [status, setStatus] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)
  const { currentUser } = useAuth()
  const [ipAddress, setIpAddress] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  // fetch client IP
  useEffect(() => {
    axios
      .get('https://api.ipify.org?format=json')
      .then(res => setIpAddress(res.data.ip))
      .catch(err => console.error('Error fetching IP:', err))
  }, [])

  // save auth token
  useEffect(() => {
    if (currentUser) {
      currentUser
        .getIdToken()
        .then(token => localStorage.setItem('authToken', token))
    }
  }, [currentUser])

  // fetch reviewer record
  useEffect(() => {
    let mounted = true
    const fetchStatus = async () => {
      const token = localStorage.getItem('authToken')
      if (!token) return navigate('/signin')
      if (!currentUser?.uid) return
      try {
        const snap = await getDoc(doc(db, 'reviewers', currentUser.uid))
        if (!mounted) return
        if (snap.exists()) {
          const data = snap.data()
          setStatus(data.status || 'in_progress')
          setReason(data.rejectionReason || '')
        } else {
          setStatus('not_found')
        }
      } catch (e) {
        console.error('Error fetching reviewer status:', e)
      } finally {
        mounted && setLoading(false)
      }
    }
    fetchStatus()
    return () => {
      mounted = false
    }
  }, [currentUser, navigate])

  // log on tab close
  useEffect(() => {
    const onClose = async () => {
      const user = auth.currentUser
      if (user) {
        await addDoc(collection(db, 'logs'), {
          userId: user.uid,
          role: 'Reviewer',
          userName: user.displayName || 'N/A',
          action: 'Logout',
          details: 'Tab closed',
          timestamp: serverTimestamp()
        })
      }
    }
    window.addEventListener('beforeunload', onClose)
    return () => window.removeEventListener('beforeunload', onClose)
  }, [])

  const toggleSidebar = () => setSidebarOpen(o => !o)

  const handleRevoke = async () => {
    if (!currentUser?.uid) return
    try {
      await deleteDoc(doc(db, 'reviewers', currentUser.uid))
      setStatus('not_found')
    } catch (e) {
      console.error('Error revoking:', e)
    }
  }

  const handleLogout = async () => {
    const user = auth.currentUser
    if (!user) return
    await addDoc(collection(db, 'logs'), {
      userId: user.uid,
      role: 'Reviewer',
      userName: user.displayName || 'N/A',
      action: 'Logout',
      details: 'User clicked logout',
      ip: ipAddress,
      target: 'Reviewer Dashboard',
      timestamp: serverTimestamp()
    })
    await auth.signOut()
    navigate('/signin')
  }

  const statusStyles = {
    approved: {
      backgroundColor: '#D1FAE5',
      borderLeft: '4px solid #10B981',
      color: '#065F46'
    },
    in_progress: {
      backgroundColor: '#FEF3C7',
      borderLeft: '4px solid #F59E0B',
      color: '#92400E'
    },
    rejected: {
      backgroundColor: '#FECACA',
      borderLeft: '4px solid #EF4444',
      color: '#991B1B'
    }
  }

  const renderBadge = () => {
    if (status === 'approved')
      return (
        <section
          style={statusStyles.approved}
          className="p-2 rounded"
        >
          Approved Reviewer
        </section>
      )
    if (status === 'in_progress')
      return (
        <section
          style={statusStyles.in_progress}
          className="p-2 rounded"
        >
          Application Under Review
        </section>
      )
    if (status === 'rejected')
      return (
        <section
          style={statusStyles.rejected}
          className="p-2 rounded"
        >
          Application Rejected
        </section>
      )
    return (
      <section className="p-2 rounded text-muted">
        {currentUser?.displayName || 'Reviewer'} – you are not a
        reviewer. Apply below.
      </section>
    )
  }

  return (
    <main
      style={{
        backgroundColor: '#FFFFFF',
        color: '#000000',
        minHeight: '100vh',
        paddingTop: '70px' /* offset for the fixed navbar */
      }}
    >
      <header
        className="navbar navbar-light bg-light fixed-top px-4 py-3"
        style={{ borderBottom: '1px solid #000' }}
      >
        <h1 className="navbar-brand fw-bold fs-4">Innerk Hub</h1>
        <button
          className="btn btn-outline-light p-0"
          onClick={toggleSidebar}
          aria-label="Toggle profile sidebar"
          style={{
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            overflow: 'hidden'
          }}
        >
          <img
            src={currentUser?.photoURL || 'https://via.placeholder.com/40?text=👤'}
            alt="Profile"
            className="rounded-circle"
            style={{
              width: '40px',
              height: '40px',
              objectFit: 'cover',
              display: 'block'
            }}
          />
        </button>
      </header>

      <aside
        className={`position-fixed top-0 end-0 h-100 bg-light shadow p-4 d-flex flex-column ${
          sidebarOpen ? 'd-block' : 'd-none'
        }`}
        style={{ width: '280px', zIndex: 1050 }}
      >
        <button
          className="btn-close align-self-end"
          onClick={toggleSidebar}
          aria-label="Close sidebar"
        />

        <section className="text-center mb-4">
          <img
            src={currentUser?.photoURL || 'https://via.placeholder.com/70?text=👤'}
            alt="Profile"
            className="rounded-circle mb-2"
            style={{
              width: '70px',
              height: '70px',
              objectFit: 'cover',
              border: '2px solid #ccc'
            }}
          />
          <h2 className="h6 mb-0 mt-2">
            {currentUser?.displayName || 'N/A'}
          </h2>
          <address className="text-muted">
            {currentUser?.email || 'N/A'}
          </address>
        </section>

        <section className="mb-4">
          {renderBadge()}
          {status === 'rejected' && reason && (
            <small className="text-danger d-block mt-1">
              Reason: {reason}
            </small>
          )}
        </section>

        <hr />

        <nav aria-label="Sidebar links" className="mb-4">
          <ul className="list-unstyled">
            <li>
              <a href="/about" className="text-decoration-none text-dark">
                About Us
              </a>
            </li>
            <li>
              <a href="/terms" className="text-decoration-none text-dark">
                Terms &amp; Conditions
              </a>
            </li>
          </ul>
        </nav>

        <section className="mt-auto">
          {status === 'approved' && (
            <button
              onClick={handleRevoke}
              className="btn btn-warning w-100 mb-2"
            >
              Stop Being a Reviewer
            </button>
          )}
          {status !== 'approved' && status !== 'not_found' && (
            <button
              onClick={handleRevoke}
              className="btn btn-warning w-100 mb-2"
            >
              {status === 'rejected'
                ? 'Remove Rejected Application'
                : 'Revoke Application'}
            </button>
          )}
          <button
            onClick={handleLogout}
            className="btn btn-danger w-100"
          >
            Logout
          </button>
        </section>
      </aside>

      <section
        className="container"
        style={{ backgroundColor: 'white', color: 'black' }}
      >
        {loading ? (
          <section className="text-center text-muted mt-4">
            <p>Retrieving your reviewer status…</p>
            <div className="spinner-border text-dark" role="status" />
          </section>
        ) : (
          <>
            <header className="text-center my-4">
              <h2>Reviewer Dashboard</h2>
              <p>👋 Hi {currentUser?.displayName || 'Reviewer'}</p>
              <p>
                Welcome back! Ready to read, review, and recommend
                cutting-edge research?
              </p>
            </header>

            {status === 'approved' && (
              <ReviewerRecommendations />
            )}

            {status === 'not_found' && (
              <section className="text-center mt-4 text-muted">
                <p>No reviewer profile found.</p>
                <button
                  className="btn btn-success"
                  onClick={() => navigate('/reviewer-form')}
                >
                  Apply Now
                </button>
              </section>
            )}

            {status === 'in_progress' && (
              <section className="text-center text-warning mt-4">
                <p>Your application is currently being reviewed.</p>
              </section>
            )}

            {status === 'rejected' && (
              <section className="text-center text-danger mt-4">
                <p>Your application was rejected.</p>
                <small>
                  Reason: {reason || 'No reason provided.'}
                </small>
              </section>
            )}
          </>
        )}
      </section>
    </main>
  )
}
