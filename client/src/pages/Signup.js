import React, { useState } from 'react';
import './Signup.css';

function Signup() {
  const [isReviewer, setIsReviewer] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleCheckboxChange = () => {
    setIsReviewer(!isReviewer);
  };

  const handleFileChange = (e) => {
    setFileName(e.target.files[0]?.name || '');
  };

  return (
    <main className="signup-main">
      <section className="signup-card card p-4">
        <header>
          <h1 className="text-center mb-4" style={{ color: 'var(--primary-blue)' }}>Sign Up for Innerk</h1>
        </header>

        <form>
          <fieldset>
            <legend className="visually-hidden">User Info</legend>

            <section className="row mb-3">
              <article className="col">
                <label htmlFor="firstName" className="form-label">First Name</label>
                <input type="text" className="form-control" id="firstName" placeholder="First Name" />
              </article>
              <article className="col">
                <label htmlFor="lastName" className="form-label">Last Name</label>
                <input type="text" className="form-control" id="lastName" placeholder="Last Name" />
              </article>
            </section>

            <section className="mb-3">
              <label htmlFor="email" className="form-label">Email address</label>
              <input type="email" className="form-control" id="email" placeholder="Email" />
            </section>

            <section className="mb-3">
              <label htmlFor="password" className="form-label">Password</label>
              <input type="password" className="form-control" id="password" placeholder="Password" />
            </section>

            <section className="form-check mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="reviewerCheck"
                checked={isReviewer}
                onChange={handleCheckboxChange}
              />
              <label className="form-check-label" htmlFor="reviewerCheck">
                Apply to be a Reviewer
              </label>
            </section>

            {isReviewer && (
              <section className="mb-3">
                <label className="form-label" htmlFor="qualifications">Upload Qualifications (PDF)</label>
                <input
                  type="file"
                  accept=".pdf"
                  className="form-control"
                  id="qualifications"
                  onChange={handleFileChange}
                />
                {fileName && (
                  <small className="text-muted mt-1">Selected: {fileName}</small>
                )}
              </section>
            )}

            <footer>
              <button type="submit" className="btn w-100" style={{ backgroundColor: 'var(--primary-blue)', color: '#fff' }}>
                Sign Up
              </button>
            </footer>
          </fieldset>
        </form>
      </section>
    </main>
  );
}

export default Signup;
