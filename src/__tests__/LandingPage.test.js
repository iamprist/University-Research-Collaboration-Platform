import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LandingPage from '../pages/LandingPage';
import { MemoryRouter, useNavigate } from 'react-router-dom';



// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('LandingPage', () => {
  it('should navigate to /signin when the button is clicked', () => {
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
