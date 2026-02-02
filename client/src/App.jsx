import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { FaPlus, FaCalendarAlt, FaTrash, FaSearch, FaSync, FaEdit, FaTimes } from 'react-icons/fa';
import { Toaster, toast } from 'react-hot-toast';

// Chart.js
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

function App() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [rates, setRates] = useState(null);
  const [ratesLoading, setRatesLoading] = useState(true);

  // Starea pentru formular
  const [form, setForm] = useState({
    name: '',
    price: '',
    currency: 'RON',
    billingCycle: 'monthly',
    startDate: '',
    category: 'Entertainment'
  });

  const [editingId, setEditingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [sortType, setSortType] = useState('date-asc');

  const CATEGORY_COLORS = {
    'Entertainment': '#ef4444',
    'Utilities': '#f59e0b',
    'Software': '#3b82f6',
    'Gym': '#10b981',
    'Other': '#94a3b8'
  };

  // fetch data
  useEffect(() => {
    fetchSubs();
    fetchRates();
  }, []);

  const fetchSubs = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/subscriptions');
      setSubscriptions(res.data);
    } catch (err) {
      toast.error("Nu am putut încărca abonamentele.");
    }
  };

  const fetchRates = async () => {
    try {
      const res = await axios.get('https://api.exchangerate-api.com/v4/latest/RON');
      setRates(res.data.rates);
      setRatesLoading(false);
    } catch (err) {
      setRates({ RON: 1, EUR: 0.20, USD: 0.22, GBP: 0.17 }); 
      setRatesLoading(false);
      toast('Curs valutar offline', { icon: '⚠️' });
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!form.name || !form.price || !form.startDate) return toast.error("Completează tot!");

    try {
      if (editingId) {
        const res = await axios.put(`http://localhost:5000/api/subscriptions/${editingId}`, form);
        
        setSubscriptions(subscriptions.map(sub => sub._id === editingId ? res.data : sub));
        toast.success("Abonament actualizat!");
        setEditingId(null); 
      } else {
        const res = await axios.post('http://localhost:5000/api/subscriptions', form);
        setSubscriptions([...subscriptions, res.data]);
        toast.success("Abonament adăugat!");
      }

      setForm({ name: '', price: '', currency: 'RON', billingCycle: 'monthly', startDate: '', category: 'Entertainment' });
    } catch (err) {
      toast.error("Eroare la salvare.");
    }
  };

  const handleEditClick = (sub) => {
    setEditingId(sub._id);
    const formattedDate = new Date(sub.startDate).toISOString().split('T')[0];
    
    setForm({
      name: sub.name,
      price: sub.price,
      currency: sub.currency,
      billingCycle: sub.billingCycle,
      startDate: formattedDate,
      category: sub.category
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ name: '', price: '', currency: 'RON', billingCycle: 'monthly', startDate: '', category: 'Entertainment' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Sigur ștergi?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/subscriptions/${id}`);
      setSubscriptions(subscriptions.filter(sub => sub._id !== id));
      toast.success("Șters!", { icon: '🗑️' });
    } catch (err) {
      toast.error("Eroare la ștergere.");
    }
  };


  const convertToRON = (price, currency, cycle) => {
    if (!rates) return 0;
    let amount = parseFloat(price);
    if (cycle === 'yearly') amount = amount / 12;
    const rate = rates[currency] || 1; 
    return amount / rate;
  };

  const calculateTotal = () => {
    if (ratesLoading) return "...";
    let totalRON = 0;
    subscriptions.forEach(sub => {
      totalRON += convertToRON(sub.price, sub.currency, sub.billingCycle);
    });
    return totalRON.toFixed(2);
  };

  const getChartData = () => {
    const categories = { 'Entertainment': 0, 'Utilities': 0, 'Software': 0, 'Gym': 0, 'Other': 0 };
    subscriptions.forEach(sub => {
      const ronAmount = convertToRON(sub.price, sub.currency, sub.billingCycle);
      const catName = categories[sub.category] !== undefined ? sub.category : 'Other';
      categories[catName] += ronAmount;
    });
    return {
      labels: Object.keys(categories),
      datasets: [{
          data: Object.values(categories),
          backgroundColor: Object.keys(categories).map(cat => CATEGORY_COLORS[cat]),
          borderWidth: 0,
        }],
    };
  };

  const getProcessedSubs = () => {
    let result = [...subscriptions];
    if (searchTerm !== '') {
      result = result.filter(sub => sub.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (filterCategory !== 'All') {
      result = result.filter(sub => sub.category === filterCategory);
    }
    result.sort((a, b) => {
      const priceA = convertToRON(a.price, a.currency, a.billingCycle);
      const priceB = convertToRON(b.price, b.currency, b.billingCycle);
      switch (sortType) {
        case 'price-desc': return priceB - priceA;
        case 'price-asc': return priceA - priceB;
        case 'date-asc': return new Date(a.nextPaymentDate) - new Date(b.nextPaymentDate);
        case 'date-desc': return new Date(b.nextPaymentDate) - new Date(a.nextPaymentDate);
        default: return 0;
      }
    });
    return result;
  };

  const displayedSubs = getProcessedSubs();

  return (
    <div className="container">
      <Toaster position="top-center" />

      <h1>Subscription Tracker </h1>
      <div className="total-card">
        <h2>Cheltuieli Lunare Estimate</h2>
        <div className="total-amount">
          {calculateTotal()} <span style={{fontSize: '1rem'}}>RON</span>
        </div>
        <div style={{fontSize: '0.8rem', opacity: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'}}>
           {ratesLoading ? <FaSync className="spin" /> : '🟢'} 
           {ratesLoading ? ' Se încarcă cursul...' : ' Curs Valutar Live'}
        </div>
        {subscriptions.length > 0 && !ratesLoading && (
          <div style={{maxWidth: '280px', margin: '20px auto 0 auto'}}>
            <Doughnut data={getChartData()} options={{ plugins: { legend: { display: false } }, cutout: '70%' }} />
          </div>
        )}
      </div>

      <div style={{display: 'flex', gap: '10px', marginBottom: '20px', background: '#1e293b', padding: '15px', borderRadius: '12px', flexWrap: 'wrap', alignItems: 'flex-end'}}>
        <div style={{flex: 1, minWidth: '200px'}}>
           <label style={{display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '5px'}}>Caută:</label>
           <div style={{position: 'relative'}}>
             <FaSearch style={{position: 'absolute', left: '10px', top: '10px', color: '#94a3b8'}} />
             <input type="text" placeholder="ex: Netflix..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{width: '100%', padding: '8px 8px 8px 35px', background: '#0f172a', border: '1px solid #334155', color: 'white', boxSizing: 'border-box'}} />
           </div>
        </div>
        <div style={{flex: 1, minWidth: '140px'}}>
          <label style={{display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '5px'}}>Categorie:</label>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155'}}>
            <option value="All">Toate</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Utilities">Utilities</option>
            <option value="Software">Software</option>
            <option value="Gym">Gym</option>
            <option value="Other">Altele</option>
          </select>
        </div>
        <div style={{flex: 1, minWidth: '140px'}}>
          <label style={{display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '5px'}}>Ordonare:</label>
          <select value={sortType} onChange={(e) => setSortType(e.target.value)} style={{width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155'}}>
            <option value="date-asc">Scadență (Urgent)</option>
            <option value="date-desc">Scadență (Îndepărtat)</option>
            <option value="price-desc">Preț (Scump - Ieftin)</option>
            <option value="price-asc">Preț (Ieftin - Scump)</option>
          </select>
        </div>
      </div>

      <form className="add-form" onSubmit={handleSubmit} style={{border: editingId ? '2px solid #3b82f6' : 'none'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
           <h2>{editingId ? '✏️ Editează Abonament' : 'Adaugă Abonament'}</h2>
           {editingId && (
             <button type="button" onClick={handleCancelEdit} style={{background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem'}}>
               <FaTimes /> Anulează
             </button>
           )}
        </div>
        
        <input type="text" placeholder="Nume (ex: Netflix)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        <div style={{display: 'flex', gap: '10px'}}>
          <input type="number" placeholder="Preț" style={{flex: 1}} value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
          <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}>
            <option value="RON">RON</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
        <div style={{display: 'flex', gap: '10px'}}>
            <select style={{flex: 1}} value={form.billingCycle} onChange={e => setForm({...form, billingCycle: e.target.value})}>
                <option value="monthly">Lunar</option>
                <option value="yearly">Anual</option>
            </select>
            <input type="date" style={{flex: 1}} value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
        </div>
        <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
          <option value="Entertainment">Entertainment</option>
          <option value="Utilities">Utilities</option>
          <option value="Software">Software</option>
          <option value="Gym">Gym</option>
          <option value="Other">Altele</option>
        </select>
        
        <button type="submit" className="btn-add" style={{backgroundColor: editingId ? '#3b82f6' : ''}}>
          {editingId ? <><FaEdit style={{marginRight: '5px'}}/> Salvează Modificarea</> : <><FaPlus style={{marginRight: '5px'}}/> Adaugă</>}
        </button>
      </form>

      <div className="sub-list">
        {displayedSubs.length === 0 ? (
          <p style={{textAlign: 'center', opacity: 0.5}}>Nu am găsit niciun abonament.</p>
        ) : (
          displayedSubs.map((sub) => (
            <div key={sub._id} className="sub-card" style={{opacity: editingId && editingId !== sub._id ? 0.5 : 1}}>
              <div className="sub-info">
                <h3>
                  {sub.name} 
                  <span style={{fontSize: '0.7rem', marginLeft:'10px', background: CATEGORY_COLORS[sub.category] || '#ccc', padding: '2px 8px', borderRadius: '10px', color: 'white', verticalAlign: 'middle'}}>
                    {sub.category}
                  </span>
                </h3>
                <p><FaCalendarAlt style={{marginRight: '5px'}}/> Scadență: {format(new Date(sub.nextPaymentDate), 'dd MMM yyyy')}</p>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <div className="sub-price">{sub.price} {sub.currency}</div>

                <button onClick={() => handleEditClick(sub)} style={{background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '1.2rem'}} title="Editează">
                  <FaEdit />
                </button>

                <button onClick={() => handleDelete(sub._id)} style={{background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem'}} title="Șterge">
                  <FaTrash />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;