import React from 'react';

const ContactForm = ({ onClose }) => (
  <form>
    <p>Contact form goes here.</p>
    <button type="button" onClick={onClose}>Close</button>
  </form>
);

export default ContactForm;
