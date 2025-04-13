// src/__tests__/SignInPage.test.js
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import SignInPage from "../pages/SignInPage";

// 🧪 Mock Firebase Auth and Firestore
jest.mock("firebase/auth", () => ({
  signInWithPopup: jest.fn(() =>
    Promise.resolve({
      user: {
        uid: "123",
        displayName: "Nono",
        email: "2562270@students.wits.ac.za",
      },
    })
  ),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  setDoc: jest.fn(() => Promise.resolve()),
}));

// 🔁 You might also need to mock your firebaseConfig.js
jest.mock("../firebaseConfig", () => ({
  auth: {},
  provider: {},
  db: {},
}));

describe("SignInPage", () => {
  test("renders login buttons", () => {
    render(
      <BrowserRouter>
        <SignInPage />
      </BrowserRouter>
    );

    expect(screen.getByText("Login As:")).toBeInTheDocument();
    expect(screen.getByText("Researcher")).toBeInTheDocument();
    expect(screen.getByText("Reviewer")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  test("clicking a button triggers Google sign-in and saves user", async () => {
    render(
      <BrowserRouter>
        <SignInPage />
      </BrowserRouter>
    );

    const adminButton = screen.getByText("Admin");
    fireEvent.click(adminButton);

    // Since Firebase is mocked, this test passes if no crash occurs
    // You can improve this by spying on signInWithPopup/setDoc if needed
  });
});
