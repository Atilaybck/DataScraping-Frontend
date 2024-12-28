import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [mapsLink, setMapsLink] = useState('');
  const [responseMsg, setResponseMsg] = useState('');
  const [customers, setCustomers] = useState([]);
  const [displayedCustomers, setDisplayedCustomers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Düzenleme ile ilgili state
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [editBusinessName, setEditBusinessName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editIsContacted, setEditIsContacted] = useState('');
  
  // Yeni eklenen state'ler
  const [editIsNewUser, setEditIsNewUser] = useState('');
  const [editReplied, setEditReplied] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editNote, setEditNote] = useState('');

  // Türkçe karakterleri normalize eden fonksiyon
  const normalizeText = (text) => {
    const charMap = {
      ç: 'c', Ç: 'C',
      ğ: 'g', Ğ: 'G',
      ı: 'i', İ: 'I',
      ö: 'o', Ö: 'O',
      ş: 's', Ş: 'S',
      ü: 'u', Ü: 'U',
    };
    return text
      .split('')
      .map((char) => charMap[char] || char)
      .join('');
  };

  // Şehir listesi
  const cities = [
    'Balıkesir',
    'Bursa',
    'Ankara',
    'Istanbul',
    'Izmir',
    'Kayseri',
    'Antalya',
    'Adana',
    'Konya',
    'Mersin',
  ];
  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch('http://localhost:3001/businesses');
        const data = await res.json();
        // Henüz iletişime geçilmemiş müşteriler
        const uncontactedCustomers = data.filter((c) => !c.isContacted);
        setCustomers(data);
        setDisplayedCustomers(uncontactedCustomers.slice(0, 5));
      } catch (err) {
        console.error('Müşteri verileri alınamadı:', err);
      }
    };
    fetchCustomers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mapsLink) return;
    if (!selectedCity) {
      alert('Lütfen bir şehir seçiniz.');
      return;
    }
    setResponseMsg('');
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:3001/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: mapsLink, city: selectedCity }),
      });
      const data = await res.json();
      setResponseMsg(data.message || 'İşlem tamam');
      setMapsLink('');
      setSelectedCity('');
    } catch (error) {
      console.error(error);
      setResponseMsg('Hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckboxClick = async (customerId) => {
    const confirmed = window.confirm('Bu müşteri ile iletişime geçtin mi?');
    if (confirmed) {
      try {
        const res = await fetch(`http://localhost:3001/businesses/${customerId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isContacted: true }),
        });
        if (res.ok) {
          setDisplayedCustomers((prev) => {
            const updated = prev.filter((c) => c._id !== customerId);
            const remaining = customers.filter(
              (c) => !c.isContacted && !updated.includes(c)
            );
            if (remaining.length > 0) {
              return [...updated, remaining[0]];
            }
            return updated;
          });
          setCustomers((prev) =>
            prev.map((c) =>
              c._id === customerId ? { ...c, isContacted: true } : c
            )
          );
          alert('Müşteri iletişime geçti olarak işaretlendi.');
        } else {
          alert('Müşteri durumu güncellenirken bir hata oluştu.');
        }
      } catch (err) {
        console.error(err);
        alert('Bir hata oluştu.');
      }
    }
  };

  const contactedCount = customers.filter((c) => c.isContacted).length;
  const uncontactedCount = customers.filter((c) => !c.isContacted).length;

  // Arama fonksiyonu
  const filteredSearchResults = customers.filter((c) => {
    const searchLower = normalizeText(searchTerm.toLowerCase());
    return (
      normalizeText(c.businessName.toLowerCase()).includes(searchLower) ||
      normalizeText(c.phone.toLowerCase()).includes(searchLower) ||
      normalizeText(c.address.toLowerCase()).includes(searchLower)
    );
  });

  // Düzenlemeyi başlatma
  const startEditing = (customer) => {
    setEditingCustomerId(customer._id);
    setEditBusinessName(customer.businessName);
    setEditPhone(customer.phone);
    setEditAddress(customer.address);
    setEditIsContacted(customer.isContacted.toString());

    // Yeni eklenen alanlar
    setEditIsNewUser(customer.isNewUser?.toString() || 'false');
    setEditReplied(customer.replied?.toString() || 'false');
    setEditPriority(customer.priority?.toString() || 'false');
    setEditNote(customer.note || '');
  };

  // Düzenlemeyi iptal etme
  const cancelEditing = () => {
    setEditingCustomerId(null);
    setEditBusinessName('');
    setEditPhone('');
    setEditAddress('');
    setEditIsContacted('');

    // Yeni eklenen alanları da sıfırla
    setEditIsNewUser('');
    setEditReplied('');
    setEditPriority('');
    setEditNote('');
  };

  // Müşteri güncelleme
  const handleUpdateCustomer = async (id) => {
    try {
      const res = await fetch(`http://localhost:3001/businesses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: editBusinessName,
          phone: editPhone,
          address: editAddress,
          isContacted: editIsContacted === 'true',

          // Yeni eklenen alanlar
          isNewUser: editIsNewUser === 'true',
          replied: editReplied === 'true',
          priority: editPriority === 'true',
          note: editNote,
        }),
      });
      if (res.ok) {
        const updatedCustomer = await res.json();
        setCustomers((prev) =>
          prev.map((c) => (c._id === id ? updatedCustomer : c))
        );
        setEditingCustomerId(null);
        setEditBusinessName('');
        setEditPhone('');
        setEditAddress('');
        setEditIsContacted('');
        setEditIsNewUser('');
        setEditReplied('');
        setEditPriority('');
        setEditNote('');
        alert('Müşteri güncellendi.');
      } else {
        alert('Güncelleme hatası.');
      }
    } catch (err) {
      console.error(err);
      alert('Bir hata oluştu.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '30px' }}>
      {/* Sol kısım (Şehir Seçimi) */}
      <div
        style={{
          flex: 1,
          border: '1px solid #ccc',
          padding: '20px',
          borderRadius: '10px',
          marginRight: '20px',
          width: '250px',
        }}
      >
        <h2>Şehir Seçimi</h2>
        {cities.map((city) => (
          <div key={city} style={{ marginBottom: '10px' }}>
            <label>
              <input
                type="radio"
                name="city"
                value={city}
                checked={selectedCity === city}
                onChange={() => setSelectedCity(city)}
              />
              {city}
            </label>
          </div>
        ))}
      </div>

      {/* Orta kısım (Google Maps Link ve Arama Input) */}
      <div style={{ flex: 2, marginRight: '20px' }}>
        <h1>Müşteri Edinme</h1>
        <form onSubmit={handleSubmit}>
          <label>Google maps linkini yapıştırın:</label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Paste the Google Maps link here"
              value={mapsLink}
              onChange={(e) => setMapsLink(e.target.value)}
              style={{ width: '400px', marginRight: '10px' }}
              disabled={isSubmitting}
            />
            <button
              type="submit"
              style={{ backgroundColor: '#efd7f9', padding: '10px 20px' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
            </button>
          </div>
        </form>
        {responseMsg && (
          <p style={{ color: responseMsg.includes('zaten') ? 'red' : 'green' }}>
            {responseMsg}
          </p>
        )}

        {/* Arama Alanı */}
        <div style={{ marginTop: '20px' }}>
          <label>Müşteri İsmi Ara:</label>
          <input
            type="text"
            placeholder="Müşteri ismi, telefon ya da adres ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '400px', display: 'block', marginTop: '10px' }}
          />
          {/* Arama Sonuçları */}
          {searchTerm && (
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '10px' }}>
              {filteredSearchResults.map((customer) => (
                <li
                  key={customer._id}
                  style={{
                    marginBottom: '10px',
                    borderBottom: '1px solid #ddd',
                    paddingBottom: '5px',
                  }}
                >
                  {editingCustomerId === customer._id ? (
                    <div>
                      <label>İşletme Adı:</label>
                      <input
                        type="text"
                        value={editBusinessName}
                        onChange={(e) => setEditBusinessName(e.target.value)}
                      />
                      <br />
                      <label>Telefon:</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                      />
                      <br />
                      <label>Adres:</label>
                      <input
                        type="text"
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                      />
                      <br />
                      <label>isContacted:</label>
                      <select
                        value={editIsContacted}
                        onChange={(e) => setEditIsContacted(e.target.value)}
                      >
                        <option value="false">False</option>
                        <option value="true">True</option>
                      </select>
                      <br />

                      {/* Yeni alanlar: isNewUser, replied, priority, note */}
                      <label>isNewUser:</label>
                      <select
                        value={editIsNewUser}
                        onChange={(e) => setEditIsNewUser(e.target.value)}
                      >
                        <option value="false">False</option>
                        <option value="true">True</option>
                      </select>
                      <br />

                      <label>replied:</label>
                      <select
                        value={editReplied}
                        onChange={(e) => setEditReplied(e.target.value)}
                      >
                        <option value="false">False</option>
                        <option value="true">True</option>
                      </select>
                      <br />

                      <label>priority:</label>
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value)}
                      >
                        <option value="false">False</option>
                        <option value="true">True</option>
                      </select>
                      <br />

                      <label>Not:</label>
                      <textarea
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                      />
                      <br />

                      <button onClick={() => handleUpdateCustomer(customer._id)}>
                        Güncelle
                      </button>
                      <button onClick={cancelEditing}>İptal</button>
                    </div>
                  ) : (
                    <div>
                      <strong>{customer.businessName}</strong> <br />
                      Telefon: {customer.phone} <br />
                      Adres: {customer.address} <br />
                      isContacted: {customer.isContacted ? 'True' : 'False'} <br />
                      {/* Yeni alanların görüntülenmesi */}
                      isNewUser: {customer.isNewUser ? 'True' : 'False'} <br />
                      replied: {customer.replied ? 'True' : 'False'} <br />
                      priority: {customer.priority ? 'True' : 'False'} <br />
                      note: {customer.note || ''} <br />
                      
                      <button onClick={() => startEditing(customer)}>Düzenle</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Sağ kısım (Müşteri Listesi) */}
      <div
        style={{
          flex: 1,
          border: '1px solid #ccc',
          padding: '20px',
          borderRadius: '10px',
          width: '400px',
        }}
      >
        <h2>Müşterilerim</h2>
        <p>Toplam müşteri: {customers.length}</p>
        <p>İletişime geçtiklerim: {contactedCount}</p>
        <p>İletişime geçmediklerim: {uncontactedCount}</p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {displayedCustomers.map((customer) => (
            <li
              key={customer._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
                borderBottom: '1px solid #ddd',
                paddingBottom: '5px',
              }}
            >
              <input
                type="checkbox"
                style={{ marginRight: '10px' }}
                onClick={() => handleCheckboxClick(customer._id)}
              />
              <span>
                <strong>{customer.businessName}</strong>
              </span>
              <span>Telefon: {customer.phone}</span>
              <span>Adres: {customer.address}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
