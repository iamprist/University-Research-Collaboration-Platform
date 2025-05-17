import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AboutBackground from "../assets/about-background.png";
import AboutBackgroundImage from "../assets/about-background-image.png";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";

const About = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showBackButton, setShowBackButton] = useState(false);

  useEffect(() => {
    // Check if user arrived via Navbar
    setShowBackButton(location.state?.fromNavbar === true);
  }, [location.state]);

  return (
    <section className="about-section-container">
      {showBackButton && (
        <button onClick={() => navigate(-1)} className="back-button fade-in">
          &larr; Back
        </button>
      )}

      <figure className="about-background-image-container">
        <img src={AboutBackground} alt="Research Network Background" />
      </figure>
      <figure className="about-section-image-container">
        <img src={AboutBackgroundImage} alt="Collaboration in Action" />
      </figure>
      <article className="about-section-text-container">
        <header className="section-header">
          <p className="primary-subheading">About Innerk Hub</p>
          <h1 className="primary-heading">
            Collaborative Research is the Foundation of Innovation.
          </h1>
        </header>
        <p className="primary-text">
          Innerk Hub is designed to bridge the gap between researchers, institutions, 
          and funding bodies creating an ecosystem where innovation thrives.
        </p>
        <nav className="about-buttons-container">
          <Link to="/learn-more" className="secondary-button">
              Learn More <FiArrowRight />
          </Link>
        </nav>
      </article>
    </section>
  );
};

export default About;
