import { render, screen, waitFor } from "@testing-library/react";
import Dashboard from "../../../pages/Admin/Dashboard"; // Adjust path if needed
import "@testing-library/jest-dom";

// Optional: mock Firebase functions if needed
jest.mock("../../../firebase", () => ({
  db: {
    collection: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({
        docs: [
          { id: "1", data: () => ({ email: "test@example.com", name: "Test User", institution: "Test University" }) },
          { id: "2", data: () => ({ email: "another@example.com", name: "Another User", institution: "Another University" }) }
        ]
      }))
    }))
  }
}));

describe("Dashboard Component", () => {
  test("renders dashboard and waits for reviewer applications to load", async () => {
    render(<Dashboard />);

    // Wait until "Reviewer Applications" appears
    await waitFor(() => {
      expect(screen.getByText("Reviewer Applications")).toBeInTheDocument();
    });

    // Additional optional checks:
    // await waitFor(() => {
    //   expect(screen.getByText(/Total Users/i)).toBeInTheDocument();
    // });
  });
});
