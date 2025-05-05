import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LandingPage from '../pages/LandingPage';
import { MemoryRouter, useNavigate } from 'react-router-dom';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

test('renders footer resources', () => {
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  );
  expect(screen.getByText(/Resources/i)).toBeInTheDocument();
  expect(screen.getByText(/Privacy Policy/i)).toBeInTheDocument();
  expect(screen.getByText(/Terms of Service/i)).toBeInTheDocument();
  expect(screen.getByText(/Contact/i)).toBeInTheDocument();
  expect(screen.getByText(/Support/i)).toBeInTheDocument();
  expect(screen.getByText(/Partnerships/i)).toBeInTheDocument();
});

test('renders main content', () => {
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  );
  expect(screen.getByText(/Collaborate\. Innovate\. Publish\./i)).toBeInTheDocument();
  expect(screen.getByText(/Start Your Journey/i)).toBeInTheDocument();
  expect(screen.getByText(/Join a global network of researchers and institutions/i)).toBeInTheDocument();
});

test('renders copyright text', () => {
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  );
  expect(screen.getByText(/©2025 Innerk Hub/i)).toBeInTheDocument();
});

test('changes button style on hover', () => {
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  );

  const button = screen.getByText(/Start Your Journey/i);

  // Simulate mouse over
  fireEvent.mouseOver(button);
  expect(button).toHaveStyle('background-color: #B1EDE8');
  expect(button).toHaveStyle('transform: translateY(-2px)');

  // Simulate mouse out
  fireEvent.mouseOut(button);
  expect(button).toHaveStyle('background-color: #64CCC5');
  expect(button).toHaveStyle('transform: translateY(0)'); // or whatever the default is
});

describe('LandingPage', () => {
  it('navigates to /signin when the button is clicked', () => {
    const mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    const button = screen.getByText(/Start Your Journey/i);
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/signin');
  });
});
