// ReviewerRecommendation.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from "react-helmet";
import { TextField, Button, Paper, Typography, Box } from '@mui/material';
import useReviewerRecommendation from './useReviewerRecommendation';
const tagAliases = {
    PHYS: "Physics",
    CHEM: "Chemistry",
    BIO: "Biology",
    CS: "Computer Science",
    AI: "Artificial Intelligence",
    Other: "Other (please specify)",
  };

const ReviewerRecommendation = () => {
  const navigate = useNavigate();
  const {
    loading,
    error,
    expertiseTags,
    recommendations,
    expandedProject,
    requestStatuses,
    reviewExists,
    searchTerm,
    searchResults,
    dropdownVisible,
    showNoResults,
    handleSearch,
    handleInputFocus,
    handleInputChange,
    handleClear,
    handleExpand,
    handleRequestReview,
    handleRevokeReview,
    handleReview
  } = useReviewerRecommendation();

  if (loading) {
    return (
      <section aria-busy="true" style={{ padding: 40, textAlign: "center" }}>
        <progress />
        <p>Loading recommendations…</p>
      </section>
    );
  }

  if (error) {
    return (
      <aside
        role="alert"
        style={{
          maxWidth: 600,
          margin: "20px auto",
          color: "#842029",
          backgroundColor: "#f8d7da",
          padding: 20,
          borderRadius: 4,
        }}
      >
        {error}
      </aside>
    );
  }

  if (!expertiseTags.length) {
    return (
      <section
        aria-live="polite"
        style={{ padding: 40, textAlign: "center" }}
      >
        <p>
          You have no expertise tags set in your profile, so no recommendations can be made.
        </p>
      </section>
    );
  }

  if (!recommendations.length) {
    return (
      <section
        aria-live="polite"
        style={{ padding: 40, textAlign: "center" }}
      >
        <p>
          No research listings matched your expertise tags:{" "}
          <strong>{expertiseTags.join(", ")}</strong>.
        </p>
      </section>
    );
  }

  return (
    <>
      <Helmet>
        <link
          href="https://fonts.googleapis.com/css2?family=Open+Sans :wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </Helmet>
      <main
        style={{
          backgroundColor: "#fff",
          color: "#000",
          fontFamily: '"Open Sans", sans-serif',
          padding: 20,
        }}
      >
        {/* --- Search Bar Section --- */}
        <section className="container" style={{ backgroundColor: 'white', color: 'black' }}>
          <Box sx={{ maxWidth: 800, mx: 'auto', mb: 4 }}>
            <Paper
              component="form"
              onSubmit={e => { e.preventDefault(); handleSearch(); }}
              sx={{
                p: 1,
                display: 'flex',
                gap: 1,
                bgcolor: 'background.paper',
                position: 'relative'
              }}
            >
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search research by title or researcher name..."
                value={searchTerm}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '1.2rem',
                    borderColor: '#000'
                  }
                }}
              />
              <Button
                type="button"
                variant="contained"
                onClick={handleClear}
                sx={{
                  bgcolor: '#F59E0B',
                  color: '#fff',
                  borderRadius: '1.5rem',
                  minWidth: '100px',
                  px: 3,
                  '&:hover': { bgcolor: '#FBBF24' }
                }}
              >
                Clear
              </Button>
              <Button
                type="button"
                variant="contained"
                onClick={handleSearch}
                sx={{
                  bgcolor: '#10B981',
                  color: '#fff',
                  borderRadius: '1.5rem',
                  minWidth: '100px',
                  px: 3,
                  '&:hover': { bgcolor: '#059669' }
                }}
              >
                Search
              </Button>
              {/* Search Dropdown */}
              {dropdownVisible && (
                <Paper sx={{
                  position: 'absolute',
                  top: '110%',
                  left: 0,
                  right: 0,
                  zIndex: 999,
                  bgcolor: 'background.paper',
                  boxShadow: 3,
                  maxHeight: 300,
                  overflowY: 'auto'
                }}>
                  {searchResults.length === 0 ? (
                    <Typography sx={{ p: 2 }}>
                      {showNoResults ? "No research listings found." : "Start typing to search"}
                    </Typography>
                  ) : (
                    searchResults.map(item => (
                      <Box
                        key={item.id}
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                        onClick={() => navigate(`/listing/${item.id}`)}
                      >
                        <Typography variant="subtitle1">{item.title}</Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          By: {item.researcherName}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {item.summary}
                        </Typography>
                      </Box>
                    ))
                  )}
                </Paper>
              )}
            </Paper>
          </Box>
        </section>

        {/* --- Expertise Tags Section --- */}
        <section
          aria-label="Your expertise tags"
          style={{ textAlign: "center", marginBottom: 30 }}
        >
          <p style={{ fontSize: 16, marginBottom: 20 }}>
            <strong>Your expertise tags:</strong>
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {expertiseTags.map((tag) => (
              <li
                key={tag}
                style={{
                  display: "inline-block",
                  backgroundColor: "#e0e0e0",
                  padding: "5px 10px",
                  borderRadius: 15,
                  margin: 5,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#000",
                }}
              >
                {tagAliases[tag.toUpperCase()] || tag}
              </li>
            ))}
          </ul>
        </section>

        {/* --- Project Recommendations Section --- */}
        <section aria-label="Project recommendations">
          {recommendations.map((project) => {
            const status = requestStatuses[project.id];
            const reviewed = reviewExists[project.id];
            return (
              <article
                key={project.id}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: 8,
                  padding: 20,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                  backgroundColor: "#fff",
                  marginBottom: 30,
                }}
              >
                <header>
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 15 }}>
                    {project.title}
                  </h3>
                  <p style={{ marginBottom: 15 }}>
                    <mark
                      style={{
                        backgroundColor: "#3498db",
                        color: "#fff",
                        padding: "3px 10px",
                        borderRadius: 4,
                        fontSize: 14,
                      }}
                    >
                      {project.researchArea}
                    </mark>
                  </p>
                </header>
                <p style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 15 }}>
                  {project.summary.length > 150
                    ? `${project.summary.substring(0, 150)}…`
                    : project.summary}
                </p>
                <dl style={{ marginBottom: 15 }}>
                  <dt><strong style={{ color: "#7f8c8d" }}>Researcher:</strong></dt>
                  <dd style={{ marginLeft: 0 }}>{project.postedByName}</dd>
                  <dt><strong style={{ color: "#7f8c8d" }}>Institution:</strong></dt>
                  <dd style={{ marginLeft: 0 }}>{project.institution}</dd>
                </dl>
                {status == null && (
                  <button
                    onClick={() => handleRequestReview(project)}
                    style={{
                      marginRight: 10,
                      padding: "8px 15px",
                      backgroundColor: "#27ae60",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Request Review
                  </button>
                )}
                {status === "pending" && (
                  <button
                    onClick={() => handleRevokeReview(project.id)}
                    style={{
                      marginRight: 10,
                      padding: "8px 15px",
                      backgroundColor: "#c0392b",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Revoke Request
                  </button>
                )}
                {status === "accepted" && (
                  <button
                    onClick={() => handleReview(project)}
                    style={{
                      marginRight: 10,
                      padding: "8px 15px",
                      backgroundColor: "#2980b9",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    {reviewed ? "Update Review" : "Start Review"}
                  </button>
                )}
                {status === "declined" && (
                  <aside
                    style={{
                      color: "red",
                      fontWeight: 600,
                      marginRight: 10,
                    }}
                  >
                    Declined
                  </aside>
                )}
                <button
                  onClick={() => handleExpand(project.id)}
                  style={{
                    padding: "8px 15px",
                    backgroundColor: "#3498db",
                    color: "#fff",
                    bordspaner: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {expandedProject === project.id ? "Show Less" : "View Details"}
                </button>
                {expandedProject === project.id && (
                  <section
                    aria-label="Project details"
                    style={{
                      marginTop: 20,
                      paddingTop: 15,
                      borderTop: "1px solid #ccc",
                    }}
                  >
                    <dl>
                      <dt><strong>Methodology:</strong></dt>
                      <dd>{project.methodology}</dd>
                      <dt><strong>Collaboration Needs:</strong></dt>
                      <dd>{project.collaborationNeeds}</dd>
                      <dt><strong>Estimated Completion:</strong></dt>
                      <dd>{project.estimatedCompletion}</dd>
                    </dl>
                    <p>
                      <a
                        href={project.publicationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Related Publication
                      </a>
                    </p>
                  </section>
                )}
              </article>
            );
          })}
        </section>
      </main>
    </>
  );
};

export default ReviewerRecommendation;