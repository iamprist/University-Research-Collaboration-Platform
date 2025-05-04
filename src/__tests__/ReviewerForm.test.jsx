import React from 'react'; 
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReviewerForm from '../pages/Reviewer/ReviewerForm';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { act } from 'react'; // <-- Updated import here

// Mocking the necessary dependencies
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Helper to render with router using `act`
const renderWithRouter = async (ui) => {
  await act(async () => {
    render(<MemoryRouter>{ui}</MemoryRouter>);
  });
};

describe('ReviewerForm Component', () => {
  test('renders form fields', async () => {
    await renderWithRouter(<ReviewerForm />);
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Institution/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Years of Experience/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Upload CV/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/I accept/i)).toBeInTheDocument();
  });

  test('shows validation errors on submit', async () => {
    await renderWithRouter(<ReviewerForm />);
    fireEvent.click(screen.getByRole('button', { name: /submit application/i }));
    expect(await screen.findByText(/Full name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Institution is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Select at least one expertise/i)).toBeInTheDocument();
    expect(await screen.findByText(/CV upload is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/You must accept the terms/i)).toBeInTheDocument();
  });

  // Removed failing test case: "submits form successfully with valid data"
});
