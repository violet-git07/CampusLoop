
import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, Plus, BookOpen, Laptop, Calculator, Backpack, Dumbbell,
  Armchair, Heart, ArrowRight, Leaf, ShieldCheck, MessageCircle,
  X, MapPin, Recycle, Menu
} from 'lucide-react';
import { supabase } from './supabase.js';

const categories = [
  { name: 'All items', icon: Recycle },
  { name: 'Books', icon: BookOpen },
  { name: 'Calculators', icon: Calculator },
  { name: 'Electronics', icon: Laptop },
  { name: 'Bags', icon: Backpack },
  { name: 'Stationery', icon: BookOpen },
  { name: 'Hostel Items', icon: Armchair },
  { name: 'Sports', icon: Dumbbell },
];

const categoryEmoji = {
  Books: '📚',
  Calculators: '🧮',
  Electronics: '💻',
  Bags: '🎒',
  Stationery: '📓',
  'Hostel Items': '🪴',
  Sports: '🏸',
};

function App() {
  const [items, setItems] = useState([]);
  const [session, setSession] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All items');
  const [mode, setMode] = useState('All');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showContact, setShowContact] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [saved, setSaved] = useState([]);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'Books',
    price: '',
    condition: 'Good',
    type: 'Sale',
    location: '',
    description: '',
  });

  useEffect(() => {
    let alive = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();
      if (alive && !error) setSession(data.session);
    }

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
      }
    );

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  async function loadListings() {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load listings:', error.message);
      setNotice('Could not load listings: ' + error.message);
      return;
    }

    setItems((data || []).map(item => ({
      ...item,
      type: item.listing_type,
      seller: item.user_id === session?.user?.id ? 'You' : 'Campus student',
      emoji: categoryEmoji[item.category] || '📦',
      color: 'mint',
    })));
  }

  useEffect(() => {
    loadListings();
  }, [session?.user?.id]);

  const filtered = useMemo(() => items.filter(item => {
    const matchesQuery =
      `${item.title} ${item.category} ${item.description || ''}`
        .toLowerCase()
        .includes(query.toLowerCase());

    const matchesCategory =
      category === 'All items' || item.category === category;

    const matchesMode = mode === 'All' || item.type === mode;

    return matchesQuery && matchesCategory && matchesMode;
  }), [items, query, category, mode]);

  async function handleAuth(e) {
    e.preventDefault();
    setBusy(true);
    setNotice('');

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        });

        if (error) throw error;

        if (data.session) {
          setShowAuth(false);
          setAuthPassword('');
          setNotice('Account created and logged in.');
        } else {
          setNotice('Signup successful. Check your email to confirm your account, then log in.');
          setAuthMode('login');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });

        if (error) throw error;

        setShowAuth(false);
        setAuthPassword('');
        setNotice('Logged in successfully.');
      }
    } catch (error) {
      setNotice(error.message || 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setNotice(error.message);
      return;
    }
    setNotice('Logged out.');
    setShowForm(false);
  }

  async function submitListing(e) {
    e.preventDefault();

    if (!session?.user) {
      setNotice('Please log in before creating a listing.');
      setShowForm(false);
      setShowAuth(true);
      return;
    }

    setBusy(true);

    const { error } = await supabase.from('listings').insert({
      user_id: session.user.id,
      title: form.title.trim(),
      description: form.description.trim() || 'Contact me for more details.',
      price: Number(form.price),
      category: form.category,
      listing_type: form.type,
      condition: form.condition,
      location: form.location.trim() || 'Campus pickup',
      status: 'active',
    });

    setBusy(false);

    if (error) {
      setNotice('Could not create listing: ' + error.message);
      return;
    }

    setShowForm(false);
    setForm({
      title: '',
      category: 'Books',
      price: '',
      condition: 'Good',
      type: 'Sale',
      location: '',
      description: '',
    });

    setNotice('Listing published successfully.');
    await loadListings();
  }

  async function toggleSaved(id) {
    if (!session?.user) {
      setNotice('Log in to save favourites.');
      setShowAuth(true);
      return;
    }

    const isSaved = saved.includes(id);

    if (isSaved) {
      setSaved(current => current.filter(itemId => itemId !== id));
      return;
    }

    setSaved(current => [...current, id]);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="nav-wrap">
          <button
            className="brand"
            onClick={() => {
              setCategory('All items');
              setMode('All');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            aria-label="CampusLoop home"
          >
            <span className="brand-mark"><Recycle size={23} strokeWidth={2.5} /></span>
            <span className="brand-text">
              Campus<span>Loop</span>
              <small>EXTEND. REUSE. SUSTAIN.</small>
            </span>
          </button>

          <nav className={mobileMenu ? 'nav-links open' : 'nav-links'}>
            <button className="nav-link active" onClick={() => {
              setCategory('All items');
              setMode('All');
              setMobileMenu(false);
            }}>Explore</button>
            <button className="nav-link" onClick={() => {
              setMode('Rent');
              setCategory('All items');
              setMobileMenu(false);
              document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
            }}>Rent items</button>
            <button className="nav-link" onClick={() => {
              setShowForm(true);
              setMobileMenu(false);
            }}>How to sell</button>
          </nav>

          <div className="nav-actions">
            {session ? (
              <>
                <span className="nav-link">{session.user.email}</span>
                <button className="sell-button" onClick={handleLogout}>Log out</button>
              </>
            ) : (
              <button className="sell-button" onClick={() => setShowAuth(true)}>Log in / Sign up</button>
            )}
            <button className="sell-button" onClick={() => {
              if (session) setShowForm(true);
              else setShowAuth(true);
            }}><Plus size={17} /> List an item</button>
            <button className="menu-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle menu"><Menu /></button>
          </div>
        </div>
      </header>

      {notice && (
        <div className="notice" role="status">
          {notice}
          <button onClick={() => setNotice('')} aria-label="Dismiss notice"><X size={16} /></button>
        </div>
      )}

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><Leaf size={15} /> THE STUDENT REUSE MARKETPLACE</div>
            <h1>Good finds.<br /><span>Second lives.</span></h1>
            <p>Buy, sell, and rent useful items from fellow students on campus.</p>
            <button className="primary-button" onClick={() =>
              document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' })
            }>Explore items <ArrowRight size={17} /></button>
          </div>
        </section>

        <section id="marketplace" className="marketplace-section">
          <div className="section-heading">
            <div>
              <div className="eyebrow">CAMPUS MARKETPLACE</div>
              <h2>Find your next useful thing</h2>
            </div>
            <button className="sell-button" onClick={() => {
              if (session) setShowForm(true);
              else setShowAuth(true);
            }}><Plus size={17} /> List an item</button>
          </div>

          <div className="search-bar">
            <Search size={18} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search books, electronics, and more..." />
          </div>

          <div className="category-list">
            {categories.map(c => (
              <button key={c.name} className={category === c.name ? 'category-chip active' : 'category-chip'} onClick={() => setCategory(c.name)}>
                <c.icon size={16} /> {c.name}
              </button>
            ))}
          </div>

          <div className="filter-row">
            <span>{filtered.length} items</span>
            <div>
              {['All', 'Sale', 'Rent'].map(m => (
                <button key={m} className={mode === m ? 'filter-chip active' : 'filter-chip'} onClick={() => setMode(m)}>{m}</button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <Recycle size={32} />
              <h3>No listings yet</h3>
              <p>Try another search or be the first to publish an item.</p>
            </div>
          ) : (
            <div className="listing-grid">
              {filtered.map(item => (
                <article className="listing-card" key={item.id}>
                  <button className="listing-open" onClick={() => setSelected(item)} aria-label={`View ${item.title}`}>
                    <div className={`listing-image ${item.color || 'mint'}`}>
                      <span>{item.emoji}</span>
                      <span className={`type-badge ${item.type === 'Rent' ? 'rent-badge' : ''}`}>
                        {item.type === 'Rent' ? 'For rent' : 'For sale'}
                      </span>
                    </div>
                    <div className="listing-info">
                      <div className="product-category">{item.category} · {item.condition}</div>
                      <h3>{item.title}</h3>
                      <p className="listing-location"><MapPin size={13} /> {item.location || 'Campus pickup'}</p>
                      <div className="listing-bottom">
                        <strong>₹{item.price}{item.type === 'Rent' && <small> / rental</small>}</strong>
                        <span>{item.seller}</span>
                      </div>
                    </div>
                  </button>
                  <button className="save-button" onClick={() => toggleSaved(item.id)} aria-label="Save listing">
                    <Heart size={18} fill={saved.includes(item.id) ? 'currentColor' : 'none'} />
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {showAuth && (
        <div className="modal-backdrop" onMouseDown={e => {
          if (e.target === e.currentTarget) setShowAuth(false);
        }}>
          <div className="modal auth-modal">
            <button className="icon-button detail-close" onClick={() => setShowAuth(false)} aria-label="Close"><X /></button>
            <div className="eyebrow">CAMPUSLOOP ACCOUNT</div>
            <h2>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
            <p>{authMode === 'login' ? 'Log in to publish and manage listings.' : 'Use your email to join the marketplace.'}</p>
            <form onSubmit={handleAuth} className="listing-form">
              <label>Email
                <input type="email" required value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
              </label>
              <label>Password
                <input type="password" required minLength={6} value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="At least 6 characters" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} />
              </label>
              <button className="primary-button full-button" type="submit" disabled={busy}>
                {busy ? 'Please wait...' : authMode === 'login' ? 'Log in' : 'Sign up'}
                <ArrowRight size={17} />
              </button>
            </form>
            <p>
              {authMode === 'login' ? "Don't have an account?" : 'Already registered?'}{' '}
              <button className="text-button" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>
                {authMode === 'login' ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-backdrop" onMouseDown={e => {
          if (e.target === e.currentTarget) setShowForm(false);
        }}>
          <div className="modal listing-modal">
            <div className="modal-head">
              <div>
                <div className="eyebrow">GIVE IT A SECOND LIFE</div>
                <h2>List an item</h2>
                <p>Add the details so another student can find it.</p>
              </div>
              <button className="icon-button" onClick={() => setShowForm(false)} aria-label="Close"><X /></button>
            </div>
            <form onSubmit={submitListing} className="listing-form">
              <label>Item name
                <input required maxLength={70} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. First-year physics textbook" />
              </label>
              <div className="form-grid">
                <label>Category
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {categories.slice(1).map(c => <option key={c.name}>{c.name}</option>)}
                  </select>
                </label>
                <label>Price (₹)
                  <input required type="number" min="1" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="250" />
                </label>
              </div>
              <div className="form-grid">
                <label>Listing type
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option>Sale</option><option>Rent</option>
                  </select>
                </label>
                <label>Condition
                  <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}>
                    <option>New</option><option>Very good</option><option>Good</option><option>Fair</option>
                  </select>
                </label>
              </div>
              <label>Pickup location
                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Academic block" />
              </label>
              <label>Description
                <textarea rows="3" maxLength="300" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Share the item's condition and any useful details." />
              </label>
              <div className="form-note"><ShieldCheck size={16} /> Your listing will be stored in the CampusLoop database.</div>
              <button className="primary-button full-button" type="submit" disabled={busy}>
                {busy ? 'Publishing...' : 'Publish listing'} <ArrowRight size={17} />
              </button>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <div className="modal-backdrop" onMouseDown={e => {
          if (e.target === e.currentTarget) setSelected(null);
        }}>
          <div className="modal detail-modal">
            <button className="icon-button detail-close" onClick={() => setSelected(null)} aria-label="Close"><X /></button>
            <div className={`detail-image ${selected.color || 'mint'}`}>
              <span>{selected.emoji}</span>
              <span className={`type-badge ${selected.type === 'Rent' ? 'rent-badge' : ''}`}>
                {selected.type === 'Rent' ? 'For rent' : 'For sale'}
              </span>
            </div>
            <div className="detail-content">
              <div className="product-category">{selected.category} · {selected.condition}</div>
              <h2>{selected.title}</h2>
              <div className="detail-price">₹{selected.price}{selected.type === 'Rent' && <small> / rental price</small>}</div>
              <p>{selected.description}</p>
              <div className="seller-card">
                <div className="seller-avatar">{(selected.seller || 'C').charAt(0)}</div>
                <div><b>{selected.seller || 'Campus student'}</b><small><MapPin size={12} /> {selected.location || 'Campus pickup'}</small></div>
                <span className="demo-verified"><ShieldCheck size={14} /> CampusLoop</span>
              </div>
              <button className="primary-button full-button" onClick={() => {
                if (!session) {
                  setSelected(null);
                  setShowAuth(true);
                } else {
                  setShowContact(selected);
                  setSelected(null);
                }
              }}><MessageCircle size={17} /> Contact seller</button>
              <p className="demo-note">Messaging is not connected yet.</p>
            </div>
          </div>
        </div>
      )}

      {showContact && (
        <div className="modal-backdrop" onMouseDown={e => {
          if (e.target === e.currentTarget) setShowContact(null);
        }}>
          <div className="modal contact-modal">
            <button className="icon-button detail-close" onClick={() => setShowContact(null)} aria-label="Close"><X /></button>
            <div className="contact-icon"><MessageCircle size={28} /></div>
            <div className="eyebrow">CONNECT WITH THE SELLER</div>
            <h2>Interested in this item?</h2>
            <p className="contact-item-name">{showContact.title} · ₹{showContact.price}</p>
            <p>In-app messaging will be added in a later task.</p>
            <button className="primary-button full-button" onClick={() => setShowContact(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
