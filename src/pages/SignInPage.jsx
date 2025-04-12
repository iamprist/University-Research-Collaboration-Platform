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
    <section>
      <h2>Login As:</h2>
      <button onClick={() => handleSignIn("researcher")}>Researcher</button>
      <button onClick={() => handleSignIn("reviewer")}>Reviewer</button>
      <button onClick={() => handleSignIn("admin")}>Admin</button>
    </section>
  );
}

export default SignInPage;
