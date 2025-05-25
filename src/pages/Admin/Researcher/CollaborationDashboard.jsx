import { useState } from 'react';
import { useParams } from 'react-router-dom';
import ChatRoom from './ChatRoom';
import MilestonesSection from './MilestoneSection';
import FundingSection from './FundingSection';
import './CollaborationDashboard.css';

export default function CollaborationDashboard() {
  const { chatId } = useParams();
  const [researchComplete, setResearchComplete] = useState(false);
  const [projectCreated, setProjectCreated] = useState(null);
  const [activeTab, setActiveTab] = useState('milestones');

  return (
    <main className="dashboard-container" aria-labelledby="dashboard-heading">
      {/* Left Panel - Chat (50%) */}
      <section 
        className="chat-container"
        aria-label="Chat room"
      >
        <ChatRoom
          chatId={chatId}
          onProjectCreated={setProjectCreated}
          onResearchComplete={setResearchComplete}
        />
      </section>

      {/* Right Panel - Collaboration Tools (50%) */}
      <section 
        className="collaboration-panel"
        aria-label="Project collaboration tools"
      >
        <header className="panel-header">
          <h2 id="dashboard-heading">inTracking</h2>
        </header>

        <nav className="tabs" role="tablist" aria-label="Collaboration tabs">
          <button
            role="tab"
            aria-selected={activeTab === 'milestones'}
            aria-controls="milestones-tab"
            onClick={() => setActiveTab('milestones')}
            id="milestones-tab-button"
            className={activeTab === 'milestones' ? 'active' : ''}
          >
            Milestones
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'funding'}
            aria-controls="funding-tab"
            onClick={() => setActiveTab('funding')}
            id="funding-tab-button"
            className={activeTab === 'funding' ? 'active' : ''}
          >
            Funding
          </button>
        </nav>

        <article
          id="milestones-tab"
          className="tab-content"
          role="tabpanel"
          aria-labelledby="milestones-tab-button"
          hidden={activeTab !== 'milestones'}
        >
          <MilestonesSection
            chatId={chatId}
            projectCreated={projectCreated}
            researchComplete={researchComplete}
          />
        </article>

        <article
          id="funding-tab"
          className="tab-content"
          role="tabpanel"
          aria-labelledby="funding-tab-button"
          hidden={activeTab !== 'funding'}
        >
          <FundingSection chatId={chatId} />
        </article>
      </section>
    </main>
  );
}