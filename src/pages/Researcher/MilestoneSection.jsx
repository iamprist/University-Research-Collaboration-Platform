import { useState, useEffect } from 'react';
import { milestoneService } from './milestoneService';
import jsPDF from 'jspdf';
import './MilestoneSection.css';

export default function MilestonesSection({ chatId, projectCreated, researchComplete, isReviewer }) {
  const [milestoneData, setMilestoneData] = useState({
    milestones: [],
    researchComplete: false,
    researchCompletedAt: null
  });
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneInput, setMilestoneInput] = useState({ title: '', description: '' });

  useEffect(() => {
    if (!chatId) return;
    const unsubscribe = milestoneService.subscribeToMilestones(chatId, setMilestoneData);
    return () => unsubscribe();
  }, [chatId]);

  const { milestones, researchComplete: researchCompleteFromData } = milestoneData;
  const allMilestonesDone = milestones.length > 0 && milestones.every(m => m.done);
  const projectFinished = allMilestonesDone 
    ? Math.max(...milestones.map(m => m.doneAt ? new Date(m.doneAt).getTime() : 0))
    : null;

  const toggleMilestoneDone = async (id) => {
    if (isReviewer) return;
    await milestoneService.toggleMilestone(chatId, id, milestones);
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
    if (!milestoneInput.title || isReviewer) return;
    await milestoneService.addMilestone(chatId, {
      title: milestoneInput.title,
      description: milestoneInput.description
    });
    setMilestoneInput({ title: '', description: '' });
    setShowMilestoneForm(false);
  };

  const handleDeleteMilestone = async (id) => {
    if (isReviewer) return;
    await milestoneService.deleteMilestone(chatId, id, milestones);
  };

  const handleMarkResearchComplete = async () => {
    if (isReviewer) return;
    await milestoneService.markResearchComplete(chatId);
  };

  const handleUnmarkResearchComplete = async () => {
    if (isReviewer) return;
    await milestoneService.unmarkResearchComplete(chatId);
  };

  return (
    <section className="milestones-container">
      <h3>Research Milestones {isReviewer && <span className="view-only-badge">(View Only)</span>}</h3>
      
      <dl className="project-timeline">
        <dt className="timeline-label">Project Created:</dt>
        <dd className="timeline-value">
          {projectCreated ? new Date(projectCreated).toLocaleString() : 'N/A'}
        </dd>
        <dt className="timeline-label">Project Finished:</dt>
        <dd className="timeline-value">
          {researchComplete || researchCompleteFromData
            ? 'Marked complete by researcher' 
            : milestones.length > 0 
              ? 'Not yet finished' 
              : 'N/A'}
        </dd>
      </dl>

      {!isReviewer && (
        <menu className="milestone-actions">
          <li>
            <button 
              className={`toggle-button ${showMilestoneForm ? 'cancel' : ''}`}
              onClick={() => setShowMilestoneForm(v => !v)}
            >
              {showMilestoneForm ? 'Cancel' : 'Add Milestone'}
            </button>
          </li>
          <li>
            <button 
              className="export-button"
              onClick={handleExportMilestonesPDF}
            >
              Export as PDF
            </button>
          </li>
        </menu>
      )}

      {showMilestoneForm && !isReviewer && (
        <form onSubmit={handleAddMilestone} className="milestone-form">
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
          <button type="submit" className="submit-button">
            Add Milestone
          </button>
        </form>
      )}

      {milestones.length === 0 ? (
        <p className="no-milestones">No milestones yet.</p>
      ) : (
        <ul className="milestones-list">
          {milestones.map(m => (
            <li key={m.id} className={`milestone-item ${m.done ? 'completed' : ''}`}>
              <input
                type="checkbox"
                checked={m.done}
                onChange={() => toggleMilestoneDone(m.id)}
                id={`milestone-${m.id}`}
                disabled={isReviewer}
              />
              <label htmlFor={`milestone-${m.id}`}>
                <article className="milestone-details">
                  <h4 className="milestone-title">{m.title}</h4>
                  {m.description && (
                    <p className="milestone-description">{m.description}</p>
                  )}
                  <footer className="milestone-meta">
                    <time>Created: {m.createdAt ? new Date(m.createdAt).toLocaleString() : 'N/A'}</time>
                    {m.done && m.doneAt && (
                      <time>Completed: {new Date(m.doneAt).toLocaleString()}</time>
                    )}
                  </footer>
                </article>
              </label>
              {!isReviewer && (
                <button
                  className="delete-button"
                  onClick={() => handleDeleteMilestone(m.id)}
                  title="Delete milestone"
                  aria-label="Delete milestone"
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {allMilestonesDone && !researchComplete && !isReviewer && (
        <aside className="all-complete-banner">
          🎉 All milestones complete!
        </aside>
      )}

      {!isReviewer && (
        <footer className="research-completion">
          {!researchComplete ? (
            <button
              onClick={handleMarkResearchComplete}
              disabled={!allMilestonesDone}
              className={`complete-button ${!allMilestonesDone ? 'disabled' : ''}`}
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
          ) : (
            <p className="completion-status">
              <span className="completed-text">Research marked as complete</span>
              <button
                onClick={handleUnmarkResearchComplete}
                className="unmark-button"
              >
                Unmark as Complete
              </button>
            </p>
          )}
        </footer>
      )}
    </section>
  );
}