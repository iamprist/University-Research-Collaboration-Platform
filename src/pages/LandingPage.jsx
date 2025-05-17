//LandingPage.jsx
import "../pages/LandingPage.css";
import Home from "../components/Home";
import About from "../components/About";
import Footer from "../components/Footer";
import React from "react";


function LandingPage() {
  return (
    <main className="App">
      <Home />
      <About />
      <Footer />
    </main>

  );
}

export default LandingPage;
