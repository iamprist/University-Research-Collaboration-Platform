import { useState, useEffect } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db,auth } from '../../config/firebaseConfig';
import jsPDF from 'jspdf';

export default function FundingSection({ chatId }) {
  const [funding, setFunding] = useState([]);
  const [expenditures, setExpenditures] = useState([]);
  const [showFundingForm, setShowFundingForm] = useState(false);
  const [showExpenditureForm, setShowExpenditureForm] = useState(false);
  const [fundingInput, setFundingInput] = useState({ amount: '', source: '', date: '' });
  const [expenditureInput, setExpenditureInput] = useState({ amount: '', description: '', date: '' });
  const [totalNeededInput, setTotalNeededInput] = useState('');
  const [totalNeeded, setTotalNeeded] = useState(null);

  useEffect(() => {
    if (!chatId) return;
    const chatRef = doc(db, 'chats', chatId);
    const unsubscribe = onSnapshot(chatRef, (docSnap) => {
      if (docSnap.exists()) {
        setFunding(docSnap.data().funding || []);
        setExpenditures(docSnap.data().expenditures || []);
        setTotalNeeded(docSnap.data().totalNeeded || null);
      }
    });
    return () => unsubscribe();
  }, [chatId]);

  const totalFunding = funding.reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalSpent = expenditures.reduce((sum, e) => sum + (e.amount || 0), 0);
  const balance = totalFunding - totalSpent;

  const handleAddFunding = async (e) => {
    e.preventDefault();
    if (!fundingInput.amount || !fundingInput.source) return;
    const chatRef = doc(db, 'chats', chatId);
    const newFunding = {
      amount: parseFloat(fundingInput.amount),
      source: fundingInput.source,
      date: fundingInput.date || new Date().toISOString(),
      addedBy: auth.currentUser?.uid,
    };
    await updateDoc(chatRef, {
      funding: [...funding, newFunding],
    });
    setFundingInput({ amount: '', source: '', date: '' });
    setShowFundingForm(false);
  };

  const handleAddExpenditure = async (e) => {
    e.preventDefault();
    if (!expenditureInput.amount || !expenditureInput.description) return;
    const chatRef = doc(db, 'chats', chatId);
    const newExpenditure = {
      amount: parseFloat(expenditureInput.amount),
      description: expenditureInput.description,
      date: expenditureInput.date || new Date().toISOString(),
      addedBy: auth.currentUser?.uid,
    };
    await updateDoc(chatRef, {
      expenditures: [...expenditures, newExpenditure],
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

    if (totalNeeded !== null && !isNaN(totalNeeded)) {
      doc.text(`Total Needed: R${totalNeeded.toFixed(2)}`, 14, y);
      y += 7;
      doc.text(
        `Still Needed: R${Math.max(0, totalNeeded - totalFunding).toFixed(2)}`,
        14,
        y
      );
      y += 10;
    } else {
      y += 3;
    }

    doc.setFontSize(14);
    doc.text('Funding Sources:', 14, y);
    y += 7;
    doc.setFontSize(11);

    if (funding.length === 0) {
      doc.text('No funding sources.', 16, y);
      y += 7;
    } else {
      doc.setFillColor(245, 245, 245);
      doc.rect(14, y - 4, 180, 8, 'F');
      doc.text('Amount (R)', 16, y);
      doc.text('Source', 56, y);
      doc.text('Date', 146, y);
      y += 6;

      funding.forEach(f => {
        doc.text(`R${f.amount?.toFixed(2) || '0.00'}`, 16, y);
        doc.text(f.source || '', 56, y);
        doc.text(f.date ? new Date(f.date).toLocaleDateString() : 'N/A', 146, y);
        y += 6;
        if (y > 270) {
          doc.addPage();
          y = 15;
        }
      });
      y += 4;
    }

    doc.setFontSize(14);
    doc.text('Expenditures:', 14, y);
    y += 7;
    doc.setFontSize(11);

    if (expenditures.length === 0) {
      doc.text('No expenditures.', 16, y);
      y += 7;
    } else {
      doc.setFillColor(245, 245, 245);
      doc.rect(14, y - 4, 180, 8, 'F');
      doc.text('Amount (R)', 16, y);
      doc.text('Description', 56, y);
      doc.text('Date', 146, y);
      y += 6;

      expenditures.forEach(e => {
        doc.text(`R${e.amount?.toFixed(2) || '0.00'}`, 16, y);
        doc.text(e.description || '', 56, y);
        doc.text(e.date ? new Date(e.date).toLocaleDateString() : 'N/A', 146, y);
        y += 6;
        if (y > 270) {
          doc.addPage();
          y = 15;
        }
      });
    }

    doc.save('funding_report.pdf');
  };

  const handleSaveTotalNeeded = async (e) => {
    e.preventDefault();
    if (!chatId) return;
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, { totalNeeded: parseFloat(totalNeededInput) });
    setTotalNeeded(parseFloat(totalNeededInput));
    setTotalNeededInput('');
  };

  return (
    <div className="funding-section">
      <h3>Research Funding Management</h3>
      <div>
        <strong>Total Funding:</strong> R{totalFunding.toFixed(2)}<br />
        <strong>Total Spent:</strong> R{totalSpent.toFixed(2)}<br />
        <strong>Balance:</strong> R{balance.toFixed(2)}
      </div>
      <div style={{ margin: '1rem 0' }}>
        <button onClick={() => setShowFundingForm(v => !v)}>
          {showFundingForm ? 'Cancel' : 'Add Funding'}
        </button>
        <button onClick={() => setShowExpenditureForm(v => !v)} style={{ marginLeft: 8 }}>
          {showExpenditureForm ? 'Cancel' : 'Add Expenditure'}
        </button>
        <button onClick={handleExportFundingPDF} style={{ marginLeft: 8 }}>
          Export as PDF
        </button>
      </div>
      {showFundingForm && (
        <form onSubmit={handleAddFunding} className="funding-form">
          <input
            type="number"
            step="0.01"
            placeholder="Amount"
            value={fundingInput.amount}
            onChange={e => setFundingInput({ ...fundingInput, amount: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Source"
            value={fundingInput.source}
            onChange={e => setFundingInput({ ...fundingInput, source: e.target.value })}
            required
          />
          <input
            type="date"
            value={fundingInput.date}
            onChange={e => setFundingInput({ ...fundingInput, date: e.target.value })}
          />
          <button type="submit">Add Funding</button>
        </form>
      )}
      {showExpenditureForm && (
        <form onSubmit={handleAddExpenditure} className="expenditure-form">
          <input
            type="number"
            step="0.01"
            placeholder="Amount"
            value={expenditureInput.amount}
            onChange={e => setExpenditureInput({ ...expenditureInput, amount: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Description"
            value={expenditureInput.description}
            onChange={e => setExpenditureInput({ ...expenditureInput, description: e.target.value })}
            required
          />
          <input
            type="date"
            value={expenditureInput.date}
            onChange={e => setExpenditureInput({ ...expenditureInput, date: e.target.value })}
          />
          <button type="submit">Add Expenditure</button>
        </form>
      )}

      <div style={{
        marginBottom: '1rem',
        background: '#f7fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '0.5rem',
        padding: '1rem',
        maxWidth: 420
      }}>
        <form onSubmit={handleSaveTotalNeeded} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontWeight: 600, minWidth: 170 }}>
            Total Funding Needed (R)
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="e.g. 5000"
            value={totalNeededInput}
            onChange={e => setTotalNeededInput(e.target.value)}
            style={{
              maxWidth: 120,
              padding: '0.4rem 0.7rem',
              border: '1px solid #cbd5e1',
              borderRadius: '0.3rem'
            }}
          />
          <button
            type="submit"
            disabled={!totalNeededInput}
            style={{
              background: '#3182ce',
              color: '#fff',
              border: 'none',
              borderRadius: '0.3rem',
              padding: '0.4rem 1.1rem',
              fontWeight: 600,
              cursor: totalNeededInput ? 'pointer' : 'not-allowed'
            }}
          >
            Save
          </button>
        </form>
        {totalNeeded !== null && (
          <div style={{ marginTop: 10, display: 'flex', gap: 24 }}>
            <span style={{ fontWeight: 500 }}>
              Total Needed: <span style={{ color: '#3182ce', fontWeight: 700 }}>R{totalNeeded.toFixed(2)}</span>
            </span>
            <span style={{ fontWeight: 500 }}>
              Still Needed: <span style={{ color: '#e53e3e', fontWeight: 700 }}>
                R{Math.max(0, totalNeeded - totalFunding).toFixed(2)}
              </span>
            </span>
          </div>
        )}
      </div>

      <h4>Funding Sources</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Amount (R)</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Source</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {funding.length === 0 ? (
            <tr>
              <td colSpan="3" style={{ textAlign: 'center', padding: '8px' }}>No funding sources.</td>
            </tr>
          ) : (
            funding.map((f, idx) => (
              <tr key={idx}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>R{f.amount.toFixed(2)}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{f.source}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{f.date ? new Date(f.date).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h4>Expenditures</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Amount (R)</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Description</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {expenditures.length === 0 ? (
            <tr>
              <td colSpan="3" style={{ textAlign: 'center', padding: '8px' }}>No expenditures.</td>
            </tr>
          ) : (
            expenditures.map((e, idx) => (
              <tr key={idx}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>R{e.amount.toFixed(2)}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{e.description}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{e.date ? new Date(e.date).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}