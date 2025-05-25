export const fetchUniversities = async (inputValue) => {
  if (!inputValue || inputValue.length < 2) return [];
  try {
    const res = await fetch(
      `http://universities.hipolabs.com/search?name=${encodeURIComponent(inputValue)}`
    );
    if (!res.ok) throw new Error('Failed to fetch universities');
    const data = await res.json();
    const seen = new Set();
    
    const apiResults = data
      .map(u => u.name)
      .filter(name => {
        const lowerName = name.toLowerCase();
        return !seen.has(lowerName) && seen.add(lowerName);
      })
      .map(name => ({ value: name, label: name }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const manualEntries = [];
    const lowerInput = inputValue.toLowerCase();
    if (lowerInput.includes('witwatersrand') || lowerInput.includes('wits')) {
      manualEntries.push({
        value: 'University of the Witwatersrand',
        label: 'University of the Witwatersrand (manual entry)'
      });
    }

    return [
      ...manualEntries,
      ...apiResults,
      { 
        value: inputValue, 
        label: `Other: "${inputValue}"`,
        className: 'other-option' 
      }
    ];
  } catch (err) {
    return [{ value: inputValue, label: `Other: "${inputValue}"` }];
  }
};