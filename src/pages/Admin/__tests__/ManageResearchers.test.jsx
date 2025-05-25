import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ManageResearchers from "../ManageResearchers";

// Mock Firebase Firestore methods
jest.mock("../../../config/firebaseConfig", () => ({
  db: {},
}));
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  updateDoc: jest.fn(() => Promise.resolve()),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  deleteDoc: jest.fn(() => Promise.resolve()),
}));

describe("ManageResearchers", () => {
  it("renders headings for both researcher sections", () => {
    render(<ManageResearchers />);
    expect(screen.getByText(/Manage Researchers/i)).toBeInTheDocument();
    expect(screen.getByText(/Revoked Researchers/i)).toBeInTheDocument();
  });

  it("shows 'No researcher accounts found.' if no researchers", async () => {
    render(<ManageResearchers />);
    expect(await screen.findByText(/No researcher accounts found/i)).toBeInTheDocument();
  });

  it("shows 'No revoked researcher accounts found.' if no revoked researchers", async () => {
    render(<ManageResearchers />);
    expect(await screen.findByText(/No revoked researcher accounts found/i)).toBeInTheDocument();
  });

  it("shows revoke modal when 'Revoke' is clicked", async () => {
    // Mock getDocs to return one researcher
    const { getDocs } = require("firebase/firestore");
    getDocs.mockResolvedValueOnce({
      docs: [
        {
          id: "1",
          data: () => ({ name: "Alice", email: "alice@test.com", role: "researcher" }),
        },
      ],
    }).mockResolvedValueOnce({ docs: [] }); // For revoked researchers
    render(<ManageResearchers />);
    await waitFor(() => screen.getByText("Alice"));
    fireEvent.click(screen.getByRole("button", { name: /Revoke/i }));
    expect(screen.getByText(/Revoke Researcher/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reason for revoking/i)).toBeInTheDocument();
  });

  it("shows delete button for revoked researchers", async () => {
    // Mock getDocs to return one revoked researcher
    const { getDocs } = require("firebase/firestore");
    getDocs.mockResolvedValueOnce({ docs: [] }) // For researchers
      .mockResolvedValueOnce({
        docs: [
          {
            id: "2",
            data: () => ({
              name: "Bob",
              email: "bob@test.com",
              role: "revokedResearcher",
              revokeReason: "Violation",
            }),
          },
        ],
      });
    render(<ManageResearchers />);
    await waitFor(() => screen.getByText("Bob"));
    expect(screen.getByRole("button", { name: /Delete/i })).toBeInTheDocument();
    expect(screen.getByText(/Revoke Reason:/i)).toBeInTheDocument();
  });
});