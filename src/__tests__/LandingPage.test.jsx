import React from 'react';
import { render, screen } from '@testing-library/react';
import LandingPage from '../pages/LandingPage';
import { MemoryRouter } from 'react-router-dom';

// Mock components for isolated testing
jest.mock('../components/Home', () => () => <div>Home Component</div>);
jest.mock('../components/About', () => () => <div>About Section</div>);
jest.mock('../components/Footer', () => () => (
  <footer>
    <p>©2025 Innerk Hub</p>
    <nav>
      <a href="/privacy-policy">Privacy Policy</a>
      <a href="/terms-of-service">Terms of Service</a>
    </nav>
  </footer>
));

describe('LandingPage', () => {
  test('renders Home component', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Home Component/i)).toBeInTheDocument();
  });

  test('renders About section', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/About Section/i)).toBeInTheDocument();
  });

  test('renders Footer with copyright text', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/©2025 Innerk Hub/i)).toBeInTheDocument();
  });

  test('renders footer links', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Privacy Policy/i)).toBeInTheDocument();
    expect(screen.getByText(/Terms of Service/i)).toBeInTheDocument();
  });
});