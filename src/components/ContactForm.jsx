import React from 'react';

const ContactForm = ({ onClose }) => (
  <form>
    <p>Please contact us at InnerkHub@gmail.com</p>
    <button type="button" onClick={onClose}>Close</button>
  </form>
);

export default ContactForm;
