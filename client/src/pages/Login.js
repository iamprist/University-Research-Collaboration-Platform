import React from 'react';
import './Login.css';

function Login() {
  return (
    <main className="login-main">
      <section className="login-card card p-4">
        <header>
          <h1 className="text-center mb-4" style={{ color: 'var(--primary-blue)' }}>Welcome Back to Innerk</h1>
        </header>

        <form>
          <fieldset>
            <legend className="visually-hidden">Login</legend>

            <section className="mb-3">
              <label htmlFor="email" className="form-label">Email address</label>
              <input type="email" className="form-control" id="email" placeholder="Email" />
            </section>

            <section className="mb-4">
              <label htmlFor="password" className="form-label">Password</label>
              <input type="password" className="form-control" id="password" placeholder="Password" />
            </section>

            <footer>
              <button
                type="submit"
                className="btn w-100"
                style={{ backgroundColor: 'var(--primary-blue)', color: '#fff' }}
              >
                Sign In
              </button>
            </footer>
          </fieldset>
        </form>
      </section>
    </main>
  );
}

export default Login;
