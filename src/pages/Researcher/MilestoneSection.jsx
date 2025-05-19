import { useState, useEffect } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import jsPDF from 'jspdf';
import { v4 as uuidv4 } from 'uuid';

export default function MilestonesSection({ chatId, projectCreated, researchComplete }) {
  const [milestones, setMilestones] = useState([]);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneInput, setMilestoneInput] = useState({ title: '', description: '' });

  useEffect(() => {
    if (!chatId) return;
    const chatRef = doc(db, 'chats', chatId);
    const unsubscribe = onSnapshot(chatRef, (docSnap) => {
      if (docSnap.exists()) {
        setMilestones(docSnap.data().milestones || []);
      }
    });
    return () => unsubscribe();
  }, [chatId]);

  const projectFinished = milestones.length > 0 && milestones.every(m => m.done)
    ? Math.max(...milestones.map(m => m.doneAt ? new Date(m.doneAt).getTime() : 0))
    : null;

  const toggleMilestoneDone = async (id) => {
    const chatRef = doc(db, 'chats', chatId);
    const updated = milestones.map(m => {
      if (m.id === id) {
        if (!m.done) {
          return { ...m, done: true, doneAt: new Date().toISOString() };
        } else {
          const { doneAt, ...rest } = m;
          return { ...rest, done: false };
        }
      }
      return m;
    });
    await updateDoc(chatRef, { milestones: updated });
  };

  const handleExportMilestonesPDF = () => {
    const doc = new jsPDF();
    let y = 15;

    doc.setFontSize(18);
    doc.text('Research Milestones Report', 14, y);
    y += 10;

    doc.setFontSize(12);
    doc.text(
      `Project Created: ${
        projectCreated
          ? new Date(projectCreated).toLocaleString()
          : 'N/A'
      }`,
      14,
      y
    );
    y += 7;
    doc.text(
      `Project Finished: ${
        projectFinished
          ? new Date(projectFinished).toLocaleString()
          : milestones.length > 0
            ? 'Not yet finished'
            : 'N/A'
      }`,
      14,
      y
    );
    y += 10;

    doc.setFontSize(14);
    doc.text('Milestones:', 14, y);
    y += 7;
    doc.setFontSize(11);

    if (milestones.length === 0) {
      doc.text('No milestones.', 16, y);
      y += 7;
    } else {
      doc.setFillColor(245, 245, 245);
      doc.rect(14, y - 4, 180, 8, 'F');
      doc.text('Title', 16, y);
      doc.text('Description', 56, y);
      doc.text('Created', 106, y);
      doc.text('Status', 146, y);
      doc.text('Finished', 166, y);
      y += 6;

      milestones.forEach((m) => {
        doc.text(m.title || '', 16, y, { maxWidth: 38 });
        doc.text(m.description || '', 56, y, { maxWidth: 48 });
        doc.text(m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'N/A', 106, y);
        doc.text(m.done ? 'Done' : 'Pending', 146, y);
        doc.text(m.done && m.doneAt ? new Date(m.doneAt).toLocaleDateString() : '-', 166, y);
        y += 6;
        if (y > 270) {
          doc.addPage();
          y = 15;
        }
      });
    }

    doc.save('milestones_report.pdf');
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!milestoneInput.title) return;
    const chatRef = doc(db, 'chats', chatId);
    const newMilestone = {
      id: uuidv4(),
      title: milestoneInput.title,
      description: milestoneInput.description,
      done: false,
      createdAt: new Date().toISOString(),
    };
    await updateDoc(chatRef, {
      milestones: [...milestones, newMilestone],
    });
    setMilestoneInput({ title: '', description: '' });
    setShowMilestoneForm(false);
  };

  const handleDeleteMilestone = async (id) => {
    const chatRef = doc(db, 'chats', chatId);
    const updated = milestones.filter(m => m.id !== id);
    await updateDoc(chatRef, { milestones: updated });
  };

  const handleMarkResearchComplete = async () => {
    if (!chatId) return;
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      researchComplete: true,
      researchCompletedAt: new Date().toISOString(),
    });
  };

  const handleUnmarkResearchComplete = async () => {
    if (!chatId) return;
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      researchComplete: false,
      researchCompletedAt: null,
    });
  };

  const allMilestonesDone = milestones.length > 0 && milestones.every(m => m.done);

  return (
    <div className="funding-section">
      <h3>Research Milestones</h3>
      <div>
        <strong>Project Created:</strong>{' '}
        {projectCreated ? new Date(projectCreated).toLocaleString() : 'N/A'}
        <br />
        <strong>Project Finished:</strong>{' '}
        {researchComplete
          ? 'Marked complete by researcher'
          : milestones.length > 0
            ? 'Not yet finished'
            : 'N/A'}
      </div>
      <div style={{ marginBottom: '1rem', marginTop: '1rem' }}>
        <button onClick={() => setShowMilestoneForm(v => !v)}>
          {showMilestoneForm ? 'Cancel' : 'Add Milestone'}
        </button>
        <button onClick={handleExportMilestonesPDF} style={{ marginLeft: 8 }}>
          Export as PDF
        </button>
      </div>
      {showMilestoneForm && (
        <form onSubmit={handleAddMilestone} className="funding-form">
          <input
            type="text"
            placeholder="Milestone Title"
            value={milestoneInput.title}
            onChange={e => setMilestoneInput({ ...milestoneInput, title: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={milestoneInput.description}
            onChange={e => setMilestoneInput({ ...milestoneInput, description: e.target.value })}
          />
          <button type="submit">Add</button>
        </form>
      )}
      <ul>
        {milestones.length === 0 && (
          <li>No milestones yet.</li>
        )}
        {milestones.map(m => (
          <li key={m.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <input
              type="checkbox"
              checked={m.done}
              onChange={() => toggleMilestoneDone(m.id)}
              style={{ marginRight: 8 }}
            />
            <span
              style={{
                textDecoration: m.done ? 'line-through' : 'none',
                color: m.done ? '#38A169' : undefined
              }}
            >
              <strong>{m.title}</strong>
              {m.description && <> – {m.description}</>}
              <br />
              <small>
                Created: {m.createdAt ? new Date(m.createdAt).toLocaleString() : 'N/A'}
                {m.done && m.doneAt && (
                  <> | Finished: {new Date(m.doneAt).toLocaleString()}</>
                )}
              </small>
            </span>
            <button
              style={{
                marginLeft: 'auto',
                background: '#FF6B6B',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.2rem 0.7rem',
                cursor: 'pointer'
              }}
              onClick={() => handleDeleteMilestone(m.id)}
              title="Delete"
              type="button"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      {allMilestonesDone && (
        <div style={{
          marginTop: '1rem',
          color: '#38A169',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          🎉All milestones complete!
        </div>
      )}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        {!researchComplete && (
          <button
            onClick={handleMarkResearchComplete}
            style={{
              background: milestones.length === 0 || !allMilestonesDone ? '#ccc' : '#38A169',
              color: '#fff',
              fontWeight: 600,
              padding: '0.6rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '1rem',
              cursor: milestones.length === 0 || !allMilestonesDone ? 'not-allowed' : 'pointer',
              opacity: milestones.length === 0 || !allMilestonesDone ? 0.7 : 1
            }}
            disabled={milestones.length === 0 || !allMilestonesDone}
            title={
              milestones.length === 0
                ? 'Add at least one milestone first'
                : !allMilestonesDone
                  ? 'Mark all milestones as done to complete research'
                  : 'Mark Research as Complete'
            }
          >
            Mark Research as Complete
          </button>
        )}
        {researchComplete && (
          <div>
            <span style={{ color: '#38A169', fontWeight: 600 }}>
              Research marked as complete
            </span>
            <button
              onClick={handleUnmarkResearchComplete}
              style={{
                marginLeft: 16,
                background: '#FF6B6B',
                color: '#fff',
                fontWeight: 600,
                padding: '0.5rem 1.2rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              Unmark as Complete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}