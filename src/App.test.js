import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

test('renders login options', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );

  const heading = screen.getByText(/login as/i);
  expect(heading).toBeInTheDocument();

  const researcherBtn = screen.getByText(/researcher/i);
  const reviewerBtn = screen.getByText(/reviewer/i);
  const adminBtn = screen.getByText(/admin/i);

  expect(researcherBtn).toBeInTheDocument();
  expect(reviewerBtn).toBeInTheDocument();
  expect(adminBtn).toBeInTheDocument();
});
