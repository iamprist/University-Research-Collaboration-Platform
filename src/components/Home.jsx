// Home Component for Inerk Hub
import React from "react";
import { Link } from "react-router-dom";
import BannerBackground from "../assets/home-banner-background.png";
import BannerImage from "../assets/home-banner-image.png";
import Navbar from "../components/Navbar";
import { FiArrowRight } from "react-icons/fi";

const Home = () => {
  return (
    <section className="home-container">
      <Navbar />
      <section className="home-banner-container">
        <figure className="home-bannerImage-container">
          <img src={BannerBackground} alt="Research Collaboration Background" />
        </figure>
        <article className="home-text-section">
          <header>
            <h1 className="primary-heading">
              Empowering Researchers to Connect, Collaborate, and Innovate.
            </h1>
          </header>
          <p className="primary-text">
            A dedicated platform for academic networking, project management, and funding transparency.
          </p>
          <nav>
            <Link to="/signin" className="secondary-button">
              Explore Research Projects <FiArrowRight />
            </Link>

          </nav>
        </article>
        <figure className="home-image-section">
          <img src={BannerImage} alt="Researcher Collaboration Visual" />
        </figure>
      </section>
    </section>
  );
};

export default Home;
