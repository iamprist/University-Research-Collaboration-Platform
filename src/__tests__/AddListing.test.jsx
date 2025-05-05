import { render, screen, fireEvent } from '@testing-library/react';
import AddListing from './AddListing';
import { waitFor } from 'react-router-dom';
import { db, auth } from '../../config/firebaseConfig';
import { collection, addDoc, doc, getDoc, setDoc } from 'firebase/firestore';

jest.mock('firebase/firestore');
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}));
jest.mock('../../config/firebaseConfig', () => ({
  auth: { currentUser: { uid: 'user1' } },
  db: {}
}));

describe('AddListing', () => {
  it('renders add listing form', () => {
    render(<AddListing />);
    expect(screen.getByText('Add New Research Listing')).toBeInTheDocument();
  });

  it('submits the form', async () => {
    render(<AddListing />);
    const titleInput = screen.getByLabelText('Research Title');
    const submitButton = screen.getByText('Create Listing');
    
    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(addDoc).toHaveBeenCalled();
    });
  });
});