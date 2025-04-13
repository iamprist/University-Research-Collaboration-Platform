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
    <main className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <section
        className="card shadow p-4"
        style={{ maxWidth: "400px", width: "100%" }}
      >
        <header className="mb-4 text-center">
          <h1 className="h4">Login As:</h1>
        </header>
        <nav aria-label="Role selection" className="d-grid gap-3">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleSignIn("researcher")}
          >
            Researcher
          </button>
          <button
            type="button"
            className="btn btn-success"
            onClick={() => handleSignIn("reviewer")}
          >
            Reviewer
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => handleSignIn("admin")}
          >
            Admin
          </button>
        </nav>
      </section>
    </main>
  );
}

export default SignInPage;
