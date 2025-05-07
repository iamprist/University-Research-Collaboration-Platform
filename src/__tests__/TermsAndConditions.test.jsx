// TermsAndConditions.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TermsAndConditions from '../pages/TermsAndConditions';
import { useNavigate } from 'react-router-dom';

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

describe('TermsAndConditions Component', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    useNavigate.mockImplementation(() => mockNavigate);
    render(<TermsAndConditions />);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(
      screen.getByText(/Terms and Conditions for InnerKhub Research Platform/i)
    ).toBeInTheDocument();
  });

  it('has a working back button', () => {
    const backButton = screen.getByText(/Back to Application/i);
    fireEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('displays the effective date', () => {
    expect(screen.getByText(/Last Updated: \[Insert Date\]/i)).toBeInTheDocument();
  });

  it('renders all main sections', () => {
    const headings = screen.getAllByRole('heading');
    expect(headings).toHaveLength(8); // 1 main title + 7 section headings
    
    expect(screen.getByText(/1. Acceptance of Terms/i)).toBeInTheDocument();
    expect(screen.getByText(/2. Reviewer Responsibilities/i)).toBeInTheDocument();
    expect(screen.getByText(/3. Intellectual Property/i)).toBeInTheDocument();
    expect(screen.getByText(/4. Privacy/i)).toBeInTheDocument();
    expect(screen.getByText(/5. Termination/i)).toBeInTheDocument();
    expect(screen.getByText(/6. Disclaimer/i)).toBeInTheDocument();
    expect(screen.getByText(/7. Governing Law/i)).toBeInTheDocument();
  });

  it('displays reviewer responsibilities list', () => {
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);
    expect(screen.getByText(/Provide accurate and current information/i)).toBeInTheDocument();
    expect(screen.getByText(/Maintain confidentiality of reviewed materials/i)).toBeInTheDocument();
    expect(screen.getByText(/Declare conflicts of interest promptly/i)).toBeInTheDocument();
  });
});