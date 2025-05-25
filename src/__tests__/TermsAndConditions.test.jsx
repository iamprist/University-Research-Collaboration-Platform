import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TermsAndConditions from '../pages/TermsAndConditions';
import { MemoryRouter } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock `useNavigate`
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('TermsAndConditions Component', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    useNavigate.mockImplementation(() => mockNavigate);
    render(
      <MemoryRouter>
        <TermsAndConditions />
      </MemoryRouter>
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(
      screen.getByText(/Terms and Conditions for Innerk Hub Research Platform/i)
    ).toBeInTheDocument();
  });


  it('displays the effective date', () => {
    expect(screen.getByText(/Last Updated: 14 May 2025/i)).toBeInTheDocument();
  });

  it('renders all main sections', () => {
    const headings = screen.getAllByRole('heading');
    expect(headings).toHaveLength(9); // 1 main title + 8 section headings

    expect(screen.getByText(/1. Acceptance of Terms/i)).toBeInTheDocument();
    expect(screen.getByText(/2. Reviewer Responsibilities/i)).toBeInTheDocument();
    expect(screen.getByText(/3. Intellectual Property/i)).toBeInTheDocument();
    expect(screen.getByText(/4. Privacy & Data Protection/i)).toBeInTheDocument();
    expect(screen.getByText(/5. Termination of Access & Reviewer Status/i)).toBeInTheDocument();
    expect(screen.getByText(/6. Liability & Disclaimer/i)).toBeInTheDocument();
    expect(screen.getByText(/7. Governing Law/i)).toBeInTheDocument();
    expect(screen.getByText(/8. Amendments & Updates/i)).toBeInTheDocument();
  });

  it('renders reviewer responsibilities list', () => {
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(4); // Updated to match your new list
    expect(screen.getByText(/Provide accurate and up-to-date information in your application/i)).toBeInTheDocument();
    expect(screen.getByText(/Maintain the confidentiality of reviewed materials/i)).toBeInTheDocument();
    expect(screen.getByText(/Promptly declare any conflicts of interest/i)).toBeInTheDocument();
    expect(screen.getByText(/Engage ethically and professionally in all research-related activities/i)).toBeInTheDocument();
  });

  it('renders Privacy Policy link correctly', () => {
    expect(screen.getByText(/Privacy Policy/i)).toHaveAttribute("href", "/privacy-policy");
  });

  it('navigates back when the back button is clicked', () => {
    const backButton = screen.getByRole('button', { name: '' }); // The button has no accessible name
    fireEvent.click(backButton.querySelector('svg'));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
