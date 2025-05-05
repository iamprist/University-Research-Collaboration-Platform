import { render, screen, fireEvent } from '@testing-library/react';
import EditProfile from './EditProfile';
import { db, auth } from '../../config/firebaseConfig';
import { waitFor} from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';

jest.mock('firebase/firestore');
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}));
jest.mock('../../config/firebaseConfig', () => ({
  auth: { currentUser: { uid: 'user1' } },
  db: {}
}));

describe('EditProfile', () => {
  beforeEach(() => {
    getDoc.mockImplementation(() => Promise.resolve({
      exists: () => true,
      data: () => ({
        title: 'Dr',
        name: 'Test User',
        email: 'test@example.com',
        researchArea: 'Test Area',
        biography: 'Test Bio'
      })
    }));
  });

  it('renders edit profile form', async () => {
    render(<EditProfile />);
    await waitFor(() => {
      expect(screen.getByText('Edit Your Profile')).toBeInTheDocument();
    });
  });

  it('submits the form', async () => {
    render(<EditProfile />);
    const submitButton = screen.getByText('Save Changes');
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(setDoc).toHaveBeenCalled();
    });
  });
});