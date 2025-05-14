import React, { useState } from 'react';
import ContactForm from './ContactForm';
import './FloatButton.css';

const FloatButton = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <button 
        className="float-btn"
        onClick={() => setShowForm(true)}
      >
        Chat with Us
      </button>
      
      {showForm && (
        <div className="modal-overlay">
          <ContactForm onClose={() => setShowForm(false)} />
        </div>
      )}
    </>
  );
};

export default FloatButton;