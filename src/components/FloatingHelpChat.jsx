import React, { useState } from 'react';
import ChatRoom from '../pages/Researcher/ChatRoom';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Dialog, IconButton } from '@mui/material';

// chatId: unique string for this user's support chat (e.g. `support_{userId}` or 'support_admin')
export default function FloatingHelpChat({ chatId, title = "Support Chat" }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconButton
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 2000,
          bgcolor: '#1a2a42',
          color: '#B1EDE8',
          boxShadow: 3,
          '&:hover': { bgcolor: '#5AA9A3', color: '#fff' }
        }}
        size="large"
        aria-label="Open support chat"
      >
        <HelpOutlineIcon fontSize="inherit" />
      </IconButton>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: { minWidth: 350, maxWidth: 500, borderRadius: 3, overflow: 'hidden' }
        }}
      >
        <div style={{ background: '#1a2a42', color: '#B1EDE8', padding: '1rem', fontWeight: 600 }}>
          {title}
        </div>
        <ChatRoom chatId={chatId} />
      </Dialog>
    </>
  );
}