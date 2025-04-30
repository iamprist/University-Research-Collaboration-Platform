import { render, fireEvent, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom"; // Import MemoryRouter for testing routing
import SignInPage from "../pages/SignInPage"; // Adjust path based on your project structure
import { signInWithPopup } from "firebase/auth";

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
  })),
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
}));

jest.mock("firebase/storage", () => ({
  getStorage: jest.fn(),
}));

jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(),
}));

describe('SignInPage', () => {
  it('shows popup when unauthorized admin tries to sign in', async () => {
    // Mock an unauthorized admin user
    signInWithPopup.mockResolvedValueOnce({
      user: {
        email: 'unauthorized@example.com',
        getIdToken: jest.fn(() => Promise.resolve('mockToken')),
      },
    });
    console.log("Mocked Response:", {
      email: 'unauthorized@example.com',
      getIdToken: 'mockToken',
    });

    // Render the SignInPage inside a MemoryRouter
    render(
      <MemoryRouter>
        <SignInPage />
      </MemoryRouter>
    );

    // Simulate admin login button click
    const adminButton = screen.getByText('Sign in as Admin');
    fireEvent.click(adminButton);

    // Verify the popup renders with the correct message
    const popupHeading = await screen.findByText('Access Denied');
    const popupMessage = await screen.findByText(
      'You are not authorized to access the admin dashboard.'
    );

    expect(popupHeading).toBeInTheDocument();
    expect(popupMessage).toBeInTheDocument();
  });
});