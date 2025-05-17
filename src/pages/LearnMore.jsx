import React from 'react';
import './TermsAndConditions.css'; 
import { useNavigate } from "react-router-dom";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { Link } from "react-router-dom";



const LearnMore = () => {
  const navigate = useNavigate();

  return (
    <section className="terms-container">
      <section className="terms-content">
        <button className="back-button">
                <ArrowBackIosIcon onClick={() => navigate(-1)} className="back-icon" />
        </button>
        <h1>Why Innerk Hub?</h1>
        <p>
          Research should be <strong>connected</strong>, <strong>open</strong>, and <strong>impactful</strong>. Innerk Hub is more than a platform, it's a catalyst for academic innovation. Whether you're a seasoned researcher or just starting your journey, we help you make meaningful connections that move ideas forward.
        </p>

        <h2>What You Can Do on Innerk Hub:</h2>
        <p><strong>Build Your Research Profile:</strong> Showcase your expertise, publications, and research interests.</p>
        <p><strong>Find Meaningful Collaborations:</strong> Connect with like-minded researchers locally and globally.</p>
        <p><strong>Manage Projects Seamlessly:</strong> Keep track of tasks, milestones, and research outputs in one place.</p>
        <p><strong>Discover Funding Opportunities:</strong> Gain visibility and connect with funding bodies who support your work.</p>
        <p><strong>Contribute to Real-World Impact:</strong> Work on projects that solve urgent challenges in your field and beyond.</p>

        <h2>Who It's For:</h2>
        <p>
          Innerk Hub is designed for individual researchers, academic institutions, project coordinators, and funding organizations who believe that collaboration is the future of research.
        </p>

        <h2>Start Innovating Today</h2>
        <p>
          Join a growing network of passionate researchers and discover how Innerk Hub can empower your academic journey.
        </p>
      </section>
    </section>
  );
};

export default LearnMore;
