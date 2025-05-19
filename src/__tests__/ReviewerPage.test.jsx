// ReviewerPage.test.jsx
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ReviewerPage from './ReviewerPage'

// --- MOCKS ---

// Mock firebaseConfig exports
jest.mock('../../config/firebaseConfig', () => ({
  db: {}, 
  auth: { currentUser: { uid: 'user1', displayName: 'John Doe', email: 'john@example.com', photoURL: 'photo.png' } }
}))

// Mock all firestore functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => false })),  // simulates no document => not_found
  deleteDoc: jest.fn(),
  addDoc: jest.fn(),
  collection: jest.fn(),
  serverTimestamp: jest.fn()
}))

// Mock authContext
jest.mock('./authContext', () => ({
  useAuth: () => ({
    currentUser: {
      uid: 'user1',
      displayName: 'John Doe',
      email: 'john@example.com',
      photoURL: 'photo.png',
      getIdToken: jest.fn(() => Promise.resolve('fake-token'))
    }
  })
}))

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}))

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: { ip: '127.0.0.1' } }))
}))


jest.mock('../../components/ReviewerRecommendations', () => () => <div>Recommendations</div>)

describe('ReviewerPage', () => {
  it('shows loading indicator initially', () => {
    render(<ReviewerPage />)
    expect(screen.getByText(/Retrieving your reviewer status…/i)).toBeInTheDocument()
  })

  it('renders "No reviewer profile found" when no doc exists', async () => {
    render(<ReviewerPage />)
    // waitFor the component to finish loading
    await waitFor(() => {
      expect(screen.getByText(/No reviewer profile found\./i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /Apply Now/i })).toBeInTheDocument()
  })
})
