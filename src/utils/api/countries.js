export const fetchCountries = async () => {
  try {
    const res = await fetch('https://restcountries.com/v3.1/all');
    if (!res.ok) throw new Error('Failed to fetch countries');
    const data = await res.json();
    return data
      .map(c => ({
        value: c.name.common,
        label: c.name.common,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch (err) {
    return [{ value: 'Other', label: 'Other (please specify)' }];
  }
};