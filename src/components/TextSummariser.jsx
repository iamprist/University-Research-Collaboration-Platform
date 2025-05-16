// src/components/TextSummariser.jsx
import React, { useState } from 'react';

export default function TextSummariser() {
  const [inputText, setInputText] = useState('');
  const [summary, setSummary]   = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSummarise = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);

    // ─── Logging for debugging ────────────────────────────────────────────────
    console.log('Using HF token:', process.env.REACT_APP_HF_TOKEN);
    console.log(
      'Auth header:',
      `Bearer ${process.env.REACT_APP_HF_TOKEN}`
    );
  

    try {
      const response = await fetch(
        'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_HF_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: inputText }),
        }
      );
      const data = await response.json();
      const text =
        Array.isArray(data) && data[0]?.summary_text
          ? data[0].summary_text
          : '⚠️ Could not generate summary';
      setSummary(text);
    } catch (error) {
      console.error(error);
      setSummary('⚠️ Error generating summary');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mt-4 p-3" style={{ backgroundColor: '#2B3E50', borderRadius: '8px' }}>
      <h3 className="text-white mb-3">Document Summariser</h3>
      <textarea
        className="form-control mb-2"
        rows={4}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Paste text to summarise..."
        style={{ backgroundColor: '#1A2E40', color: 'white' }}
      />
      <button
        className="btn btn-primary"
        onClick={handleSummarise}
        disabled={isLoading}
        style={{ backgroundColor: '#10B981', border: 'none' }}
      >
        {isLoading ? 'Summarising...' : 'Generate Summary'}
      </button>
      {summary && (
        <article className="mt-3 p-3" style={{ backgroundColor: '#1A2E40', color: '#D1FAE5' }}>
          <p>{summary}</p>
        </article>
      )}
    </section>
  );
}
