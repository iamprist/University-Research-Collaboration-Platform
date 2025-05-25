import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ManageReviewers from "../ManageReviewers";

// Mock Firebase Firestore methods
jest.mock("../../../config/firebaseConfig", () => ({
  db: {},
}));
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}));

describe("ManageReviewers", () => {
  it("renders headings for all reviewer sections", () => {
    render(<ManageReviewers />);
    expect(screen.getByRole('heading', { name: /Reviewer Applications/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Current Reviewers/i })).toBeInTheDocument();
    expect(screen.getByText(/Revoked or Rejected Reviewers/i)).toBeInTheDocument();
  });

  it("shows 'No pending applications.' if no pending reviewers", async () => {
    render(<ManageReviewers />);
    expect(await screen.findByText(/No pending applications/i)).toBeInTheDocument();
  });

  it("shows 'No current reviewers.' if no current reviewers", async () => {
    render(<ManageReviewers />);
    expect(await screen.findByText(/No current reviewers/i)).toBeInTheDocument();
  });

  it("shows 'No revoked reviewers found.' if no revoked reviewers", async () => {
    render(<ManageReviewers />);
    expect(await screen.findByText(/No revoked reviewers found/i)).toBeInTheDocument();
  });

  it("shows approve and reject buttons for a pending reviewer", async () => {
    // Mock getDocs to return one pending reviewer
    const { getDocs } = require("firebase/firestore");
    getDocs
      .mockResolvedValueOnce({
        docs: [
          {
            id: "1",
            data: () => ({
              name: "Jane Doe",
              email: "jane@example.com",
              status: "in_progress",
            }),
          },
        ],
      })
      .mockResolvedValue({ docs: [] }); // For other queries
    render(<ManageReviewers />);
    await waitFor(() => screen.getByText("Jane Doe"));
    expect(screen.getByRole("button", { name: /Approve/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reject/i })).toBeInTheDocument();
  });

  it("shows revoke button for a current reviewer", async () => {
    // Mock getDocs to return one current reviewer
    const { getDocs } = require("firebase/firestore");
    getDocs
      .mockResolvedValueOnce({ docs: [] }) // pending
      .mockResolvedValueOnce({
        docs: [
          {
            id: "2",
            data: () => ({
              name: "John Smith",
              email: "john@example.com",
              status: "approved",
            }),
          },
        ],
      })
      .mockResolvedValue({ docs: [] }); // revoked
    render(<ManageReviewers />);
    await waitFor(() => screen.getByText("John Smith"));
    expect(screen.getByRole("button", { name: /Revoke/i })).toBeInTheDocument();
  });

  it("shows delete button for a revoked reviewer", async () => {
    // Mock getDocs to return one revoked reviewer
    const { getDocs } = require("firebase/firestore");
    getDocs
      .mockResolvedValueOnce({ docs: [] }) // pending
      .mockResolvedValueOnce({ docs: [] }) // current
      .mockResolvedValueOnce({
        docs: [
          {
            id: "3",
            data: () => ({
              name: "Revoked Reviewer",
              email: "revoked@example.com",
              status: "revoked",
              reason: "Policy violation",
            }),
          },
        ],
      })
      .mockResolvedValueOnce({ docs: [] }); // rejected
    render(<ManageReviewers />);
    await waitFor(() => screen.getByText("Revoked Reviewer"));
    expect(screen.getByRole("button", { name: /Delete/i })).toBeInTheDocument();
    expect(screen.getByText(/Policy violation/i)).toBeInTheDocument();
  });
});