import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

test('renders login options', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
});
