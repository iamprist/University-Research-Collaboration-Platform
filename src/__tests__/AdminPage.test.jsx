//AdminPage.test.jsx
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

  
    test('switches to researchers tab', () => {
      render(<AdminPage />);
      userEvent.click(screen.getByText('Researchers'));
      // This should trigger lines 54-58 and 67-71 for researchers
      expect(screen.getByRole('heading', { name: /manage researchers/i })).toBeInTheDocument();
    });
  
    test('switches to admins tab', () => {
      render(<AdminPage />);
      userEvent.click(screen.getByText('Admins'));
      // This should trigger the admins branch in both title and subtitle,
      // and also execute line 79: <ManageAdmins />
      expect(screen.getByRole('heading', { name: /manage admins/i })).toBeInTheDocument();
    });
  
    test('switches to reviewers tab', () => {
      render(<AdminPage />);
      // Simulate clicking the "Reviewers" button that triggers activeTab to become "reviewers"
      userEvent.click(screen.getByText('Reviewers'));
      // Now it should display "Manage Reviewers" in the heading
      expect(screen.getByRole('heading', { name: /manage reviewers/i })).toBeInTheDocument();
    });
    
    
  test('has correct layout structure', () => {
    const { container } = render(<AdminPage />);
    expect(container.firstChild).toHaveStyle('display: flex');
    const main = container.querySelector('main');
    expect(main).toHaveStyle('flex: 1');
  });
});
function ForcedReviewersPage() {
  return <AdminPage initialTab="reviewers" />; // Force reviewers view
}
test('ensures reviewers branch executes', () => {
  render(<ForcedReviewersPage />); // Force rendering in "reviewers" state

  console.log(screen.debug()); // Confirm "Manage Reviewers" appears

  expect(screen.queryByText(/Manage Reviewers/i)).toBeTruthy();
  expect(screen.queryByText(/Manage reviewer accounts and permissions./i)).toBeTruthy();
});