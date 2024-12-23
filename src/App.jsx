import React, { useState } from 'react';

function App() {
  const [mapsLink, setMapsLink] = useState('');
  const [responseMsg, setResponseMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mapsLink) return;

    try {
      const res = await fetch('http://localhost:3001/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: mapsLink }),
      });
      const data = await res.json();
      setResponseMsg(data.message || 'İşlem tamam');
    } catch (error) {
      console.error(error);
      setResponseMsg('Hata oluştu.');
    }
  };

  return (
    <div style={{ margin: '30px' }}>
      <h1>Google Maps Scraper</h1>
      <form onSubmit={handleSubmit}>
        <label>Google Maps Link:</label>
        <input
          type="text"
          placeholder="Paste the Google Maps link here"
          value={mapsLink}
          onChange={(e) => setMapsLink(e.target.value)}
          style={{ width: '400px', marginLeft: '10px' }}
        />
        <button type="submit" style={{ marginLeft: '10px' }}>Gönder</button>
      </form>
      {responseMsg && <p>{responseMsg}</p>}
    </div>
  );
}

export default App;
