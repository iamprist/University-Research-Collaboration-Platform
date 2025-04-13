import { auth, provider, db } from "../firebaseConfig";
import { signInWithPopup } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function SignInPage() {
  const navigate = useNavigate();

  const handleSignIn = async (role) => {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    await setDoc(doc(db, "users", user.uid), {
      name: user.displayName,
      email: user.email,
      role
    });

    navigate(`/${role}`);
  };

  return (
    <>
      <header className="p-3 bg-white border-bottom">
        <nav
          className="container-fluid d-flex justify-content-between align-items-center"
          aria-label="Main navigation"
        >
          <h1 className="h4 m-0">innerk hub</h1>
          <menu
            className="d-flex align-items-center gap-3 m-0"
            style={{ listStyle: "none" }}
          >
            <li>
              <a href="#" className="text-dark text-decoration-none">
                Login
              </a>
            </li>
            <li>
              <a href="#" className="text-dark text-decoration-none">
                Sign Up
              </a>
            </li>
            <li>
              <span
                className="menu-icon"
                style={{ fontSize: "1.5rem", cursor: "pointer" }}
              >
                &#9776;
              </span>
            </li>
          </menu>
        </nav>
      </header>

    
      <main
        className="flex-grow-1 d-flex justify-content-center align-items-center"
        style={{
          minHeight: "calc(100vh - 160px)",
          backgroundColor: "#f0f0f0", // light grey color
        }}
      >
        <section
          className="bg-white p-5 rounded-4 shadow-sm text-center"
          style={{ width: "100%", maxWidth: "400px" }}
        >
          <header>
            <h2 className="mb-4 fw-bold">
              innerk hub<br />Sign in
            </h2>
          </header>
          <nav aria-label="Role selection" className="d-grid gap-3">
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => handleSignIn("researcher")}
            >
              Sign in as Researcher
            </button>
            <button
              type="button"
              className="btn btn-outline-success"
              onClick={() => handleSignIn("reviewer")}
            >
              Sign in as Reviewer
            </button>
            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={() => handleSignIn("admin")}
            >
              Sign in as Admin
            </button>
          </nav>
        </section>
      </main>


      <footer className="mt-auto py-4 text-center bg-white border-top">
        <section className="container">
          <nav
            className="d-flex justify-content-center flex-wrap mb-2"
            aria-label="Footer links"
          >
            <a href="#" className="text-dark text-decoration-none mx-2">
              Privacy Policy
            </a>
            <a href="#" className="text-dark text-decoration-none mx-2">
              Terms of Service
            </a>
            <a href="#" className="text-dark text-decoration-none mx-2">
              Contact Us
            </a>
          </nav>
          <small className="text-muted">&copy; 2025 Innerk Hub</small>
        </section>
      </footer>
    </>
  );
}

export default SignInPage;
