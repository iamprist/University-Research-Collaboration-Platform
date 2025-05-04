import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import TermsAndConditions from '../pages/TermsAndConditions';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('TermsAndConditions Component', () => {
  it('should render the title', () => {
    render(
      <MemoryRouter>
        <TermsAndConditions />
      </MemoryRouter>
    );

    const title = screen.getByText(/Terms and Conditions for InnerKhub Research Platform/i);
    expect(title).toBeInTheDocument();
  });

  it('should render the last updated date', () => {
    render(
      <MemoryRouter>
        <TermsAndConditions />
      </MemoryRouter>
    );

    const date = screen.getByText(/Last Updated: \[Insert Date\]/i);
    expect(date).toBeInTheDocument();
  });

  it('should have a "Back to Application" button', () => {
    render(
      <MemoryRouter>
        <TermsAndConditions />
      </MemoryRouter>
    );

    const backButton = screen.getByText(/Back to Application/i);
    expect(backButton).toBeInTheDocument();
  });

  it('should navigate back when "Back to Application" button is clicked', () => {
    const mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate); // Mock useNavigate to return our mock function

    render(
      <MemoryRouter>
        <TermsAndConditions />
      </MemoryRouter>
    );

    const backButton = screen.getByText(/Back to Application/i);
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1); // This should match the navigate behavior
  });
});
