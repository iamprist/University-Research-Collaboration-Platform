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

  return (
    <div className="dashboard-container">
      {/* Chat Panel */}
      <div className="chat-panel">
        <div className="panel-header">
          <h2 className="panel-title">Project Chat</h2>
        </div>
        <div className="panel-content">
          <ChatRoom 
            chatId={chatId} 
            compactView={true}
            onProjectCreated={setProjectCreated}
            onResearchComplete={setResearchComplete}
          />
        </div>
      </div>
      
      {/* Right Panel */}
      <div className="right-panel">
        {/* Milestones Panel */}
        <div className="milestones-panel">
          <div className="panel-header">
            <h2 className="panel-title">Project Milestones</h2>
          </div>
          <div className="panel-content">
            <MilestonesSection 
              chatId={chatId}
              projectCreated={projectCreated}
              researchComplete={researchComplete}
            />
          </div>
        </div>
        
        {/* Funding Panel */}
        <div className="funding-panel">
          <div className="panel-header">
            <h2 className="panel-title">Budget & Funding</h2>
          </div>
          <div className="panel-content">
            <FundingSection chatId={chatId} />
          </div>
        </div>
      </div>
    </div>
  );
}
