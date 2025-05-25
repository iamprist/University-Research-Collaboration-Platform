import { useState, useEffect } from 'react';
import { fundingService } from './fundingService';
import jsPDF from 'jspdf';
import './FundingSection.css'; 
export default function FundingSection({ chatId }) {
  const [fundingData, setFundingData] = useState({
    funding: [],
    expenditures: [],
    totalNeeded: null
  });
  const [showFundingForm, setShowFundingForm] = useState(false);
  const [showExpenditureForm, setShowExpenditureForm] = useState(false);
  const [fundingInput, setFundingInput] = useState({ amount: '', source: '', date: '' });
  const [expenditureInput, setExpenditureInput] = useState({ amount: '', description: '', date: '' });
  const [totalNeededInput, setTotalNeededInput] = useState('');

  useEffect(() => {
    if (!chatId) return;
    const unsubscribe = fundingService.subscribeToFunding(chatId, setFundingData);
    return () => unsubscribe();
  }, [chatId]);

  const { funding, expenditures, totalNeeded } = fundingData;
  const totalFunding = funding.reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalSpent = expenditures.reduce((sum, e) => sum + (e.amount || 0), 0);
  const balance = totalFunding - totalSpent;

  const handleAddFunding = async (e) => {
    e.preventDefault();
    if (!fundingInput.amount || !fundingInput.source) return;
    await fundingService.addFunding(chatId, {
      amount: parseFloat(fundingInput.amount),
      source: fundingInput.source,
      date: fundingInput.date || new Date().toISOString()
    });
    setFundingInput({ amount: '', source: '', date: '' });
    setShowFundingForm(false);
  };

  const handleAddExpenditure = async (e) => {
    e.preventDefault();
    if (!expenditureInput.amount || !expenditureInput.description) return;
    await fundingService.addExpenditure(chatId, {
      amount: parseFloat(expenditureInput.amount),
      description: expenditureInput.description,
      date: expenditureInput.date || new Date().toISOString()
    });
    setExpenditureInput({ amount: '', description: '', date: '' });
    setShowExpenditureForm(false);
  };

  const handleExportFundingPDF = () => {
    const doc = new jsPDF();
    let y = 15;

    doc.setFontSize(18);
    doc.text('Research Funding Report', 14, y);
    y += 10;

    doc.setFontSize(12);
    doc.text(`Total Funding: R${totalFunding.toFixed(2)}`, 14, y);
    y += 7;
    doc.text(`Total Spent: R${totalSpent.toFixed(2)}`, 14, y);
    y += 7;
    doc.text(`Balance: R${balance.toFixed(2)}`, 14, y);
    y += 7;

    if (totalNeeded !== null) {
      doc.text(`Total Needed: R${totalNeeded.toFixed(2)}`, 14, y);
      y += 7;
      doc.text(`Still Needed: R${Math.max(0, totalNeeded - totalFunding).toFixed(2)}`, 14, y);
      y += 10;
    } else {
      y += 3;
    }

    
    doc.save('funding_report.pdf');
  };

  const handleSaveTotalNeeded = async (e) => {
    e.preventDefault();
    if (!totalNeededInput) return;
    await fundingService.updateTotalNeeded(chatId, totalNeededInput);
    setTotalNeededInput('');
  };

  return (
    <article className="funding-container">
      <header>
        <h2>Research Funding Management</h2>
      </header>

      <section aria-labelledby="funding-summary-heading">
        <h3 id="funding-summary-heading" className="visually-hidden">Funding Summary</h3>
        <dl className="funding-summary">
          <dt>Total Funding:</dt>
          <dd>R{totalFunding.toFixed(2)}</dd>
          
          <dt>Total Spent:</dt>
          <dd>R{totalSpent.toFixed(2)}</dd>
          
          <dt>Balance:</dt>
          <dd>R{balance.toFixed(2)}</dd>
        </dl>
      </section>

      <nav aria-label="Funding actions">
        <ul className="action-buttons">
          <li>
            <button 
              onClick={() => setShowFundingForm(v => !v)}
              aria-expanded={showFundingForm}
            >
              {showFundingForm ? 'Cancel' : 'Add Funding'}
            </button>
          </li>
          <li>
            <button 
              onClick={() => setShowExpenditureForm(v => !v)}
              aria-expanded={showExpenditureForm}
            >
              {showExpenditureForm ? 'Cancel' : 'Add Expenditure'}
            </button>
          </li>
          <li>
            <button onClick={handleExportFundingPDF}>
              Export as PDF
            </button>
          </li>
        </ul>
      </nav>

      {showFundingForm && (
        <form onSubmit={handleAddFunding} aria-labelledby="add-funding-heading">
          <fieldset>
            <legend id="add-funding-heading">Add New Funding</legend>
            
            <label htmlFor="funding-amount">
              Amount
              <input
                id="funding-amount"
                type="number"
                step="0.01"
                required
                value={fundingInput.amount}
                onChange={(e) => setFundingInput({...fundingInput, amount: e.target.value})}
              />
            </label>

            <label htmlFor="funding-source">
              Source
              <input
                id="funding-source"
                type="text"
                required
                value={fundingInput.source}
                onChange={(e) => setFundingInput({...fundingInput, source: e.target.value})}
              />
            </label>

            <label htmlFor="funding-date">
              Date
              <input
                id="funding-date"
                type="date"
                value={fundingInput.date}
                onChange={(e) => setFundingInput({...fundingInput, date: e.target.value})}
              />
            </label>

            <button type="submit">Add Funding</button>
          </fieldset>
        </form>
      )}

      {showExpenditureForm && (
        <form onSubmit={handleAddExpenditure} aria-labelledby="add-expenditure-heading">
          <fieldset>
            <legend id="add-expenditure-heading">Add New Expenditure</legend>
            
            <label htmlFor="expenditure-amount">
              Amount
              <input
                id="expenditure-amount"
                type="number"
                step="0.01"
                required
                value={expenditureInput.amount}
                onChange={(e) => setExpenditureInput({...expenditureInput, amount: e.target.value})}
              />
            </label>

            <label htmlFor="expenditure-description">
              Description
              <input
                id="expenditure-description"
                type="text"
                required
                value={expenditureInput.description}
                onChange={(e) => setExpenditureInput({...expenditureInput, description: e.target.value})}
              />
            </label>

            <label htmlFor="expenditure-date">
              Date
              <input
                id="expenditure-date"
                type="date"
                value={expenditureInput.date}
                onChange={(e) => setExpenditureInput({...expenditureInput, date: e.target.value})}
              />
            </label>

            <button type="submit">Add Expenditure</button>
          </fieldset>
        </form>
      )}

      <section aria-labelledby="funding-requirements-heading">
        <h3 id="funding-requirements-heading">Funding Requirements</h3>
        
        <form onSubmit={handleSaveTotalNeeded}>
          <label>
            Total Needed (R)
            <input
              type="number"
              step="0.01"
              value={totalNeededInput}
              onChange={(e) => setTotalNeededInput(e.target.value)}
            />
          </label>
          <button type="submit" disabled={!totalNeededInput}>
            Save
          </button>
        </form>

        {totalNeeded !== null && (
          <dl>
            <dt>Total Needed:</dt>
            <dd>R{totalNeeded.toFixed(2)}</dd>
            
            <dt>Remaining:</dt>
            <dd>R{Math.max(0, totalNeeded - totalFunding).toFixed(2)}</dd>
          </dl>
        )}
      </section>

      <section aria-labelledby="funding-records-heading">
        <h3 id="funding-records-heading">Funding Records</h3>
        
        <article aria-labelledby="funding-sources-heading">
          <h4 id="funding-sources-heading">Funding Sources</h4>
          {funding.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th scope="col">Amount</th>
                  <th scope="col">Source</th>
                  <th scope="col">Date</th>
                </tr>
              </thead>
              <tbody>
                {funding.map((record, index) => (
                  <tr key={index}>
                    <td>R{record.amount.toFixed(2)}</td>
                    <td>{record.source}</td>
                    <td>{record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No funding records available</p>
          )}
        </article>

        <article aria-labelledby="expenditures-heading">
          <h4 id="expenditures-heading">Expenditures</h4>
          {expenditures.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th scope="col">Amount</th>
                  <th scope="col">Description</th>
                  <th scope="col">Date</th>
                </tr>
              </thead>
              <tbody>
                {expenditures.map((record, index) => (
                  <tr key={index}>
                    <td>R{record.amount.toFixed(2)}</td>
                    <td>{record.description}</td>
                    <td>{record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No expenditure records available</p>
          )}
        </article>
      </section>
    </article>
  );
}