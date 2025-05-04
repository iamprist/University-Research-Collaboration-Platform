import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock child components before importing AdminPage
jest.mock('../pages/Admin/Sidebar', () => ({ activeTab, setActiveTab }) => (
  <div data-testid="sidebar">
    <button onClick={() => setActiveTab('dashboard')}>Dashboard</button>
    <button onClick={() => setActiveTab('logs')}>Logs</button>
    <button onClick={() => setActiveTab('researchers')}>Researchers</button>
    <button onClick={() => setActiveTab('admins')}>Admins</button>
    <button onClick={() => setActiveTab('reviewers')}>Reviewers</button>
  </div>
));

jest.mock('../pages/Admin/Dashboard', () => () => <div>Dashboard</div>);
jest.mock('../pages/Admin/ViewLogs', () => () => <div>Logs</div>);
jest.mock('../pages/Admin/ManageResearchers', () => () => <div>Researchers</div>);
jest.mock('../pages/Admin/ManageAdmins', () => () => <div>Admins</div>);
jest.mock('../pages/Admin/ManageReviewers', () => () => <div>Reviewers</div>);

import AdminPage from '../pages/Admin/AdminPage';

describe('AdminPage', () => {
  test('renders default dashboard', () => {
    render(<AdminPage />);
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
  });

  test('switches between tabs via sidebar buttons', () => {
    render(<AdminPage />);

    // initial dashboard
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();

    // click Logs tab
    userEvent.click(screen.getByText('Logs'));
    expect(screen.getByRole('heading', { name: /logs/i })).toBeInTheDocument();

    // click Researchers tab
    userEvent.click(screen.getByText('Researchers'));
    expect(screen.getByRole('heading', { name: /researchers/i })).toBeInTheDocument();
  });

  test('has correct layout structure', () => {
    const { container } = render(<AdminPage />);
    expect(container.firstChild).toHaveStyle('display: flex');
    const main = container.querySelector('main');
    expect(main).toHaveStyle('flex: 1');
  });
});
