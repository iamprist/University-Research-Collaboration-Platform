import { db, auth } from "../firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

function ResearcherPage() {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { title, description, requirements } = e.target.elements;

    await addDoc(collection(db, "projects"), {
      title: title.value,
      description: description.value,
      requirements: requirements.value,
      ownerID: auth.currentUser.uid,
      createdAt: serverTimestamp()
    });

    alert("Project Created!");
    e.target.reset();
  };
  

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create Project</h2>
      <input name="title" placeholder="Project Title" required />
      <textarea name="description" placeholder="Description" required />
      <input name="requirements" placeholder="Requirements" required />
      <button type="submit">Submit</button>
    </form>
  );
}

export default ResearcherPage;
