import React, { useMemo, useState } from 'react';
import {
  Search, Plus, BookOpen, Laptop, Calculator, Backpack, Dumbbell,
  Armchair, Heart, ArrowRight, Leaf, ShieldCheck, MessageCircle,
  X, MapPin, SlidersHorizontal, Recycle, Menu, CheckCircle2
} from 'lucide-react';

const initialItems = [
  { id: 1, title: 'Engineering Mathematics Textbook', category: 'Books', price: 280, condition: 'Good', type: 'Sale', location: 'Campus pickup', seller: 'Rahul K.', emoji: '📚', color: 'mint', description: 'A well-maintained textbook with a few highlighted pages. Useful for first-year engineering mathematics.' },
  { id: 2, title: 'Casio Scientific Calculator', category: 'Calculators', price: 450, condition: 'Very good', type: 'Sale', location: 'Near library', seller: 'Ananya S.', emoji: '🧮', color: 'lavender', description: 'Fully working scientific calculator. Includes protective cover.' },
  { id: 3, title: 'Laptop Stand', category: 'Electronics', price: 300, condition: 'Good', type: 'Sale', location: 'Campus pickup', seller: 'Kiran M.', emoji: '💻', color: 'peach', description: 'Lightweight adjustable laptop stand. Easy to carry between classes.' },
  { id: 4, title: 'Everyday College Backpack', category: 'Bags', price: 250, condition: 'Good', type: 'Sale', location: 'Hostel block', seller: 'Megha R.', emoji: '🎒', color: 'blue', description: 'Clean backpack with multiple compartments and a padded laptop sleeve.' },
  { id: 5, title: 'Arduino Starter Kit', category: 'Electronics', price: 600, condition: 'Very good', type: 'Rent', location: 'Campus pickup', seller: 'Sahil P.', emoji: '🔌', color: 'yellow', description: 'Starter kit for electronics projects. Short-term rental for lab or project work.' },
  { id: 6, title: 'Desk Lamp', category: 'Hostel Items', price: 150, condition: 'Good', type: 'Rent', location: 'Hostel block', seller: 'Priya N.', emoji: '💡', color: 'mint', description: 'Compact desk lamp for a study table. Available for weekly rental.' },
  { id: 7, title: 'Graph Notebook Set', category: 'Stationery', price: 90, condition: 'New', type: 'Sale', location: 'Academic block', seller: 'Nikhil V.', emoji: '📓', color: 'peach', description: 'Two unused graph notebooks. Selling together.' },
  { id: 8, title: 'Badminton Racket', category: 'Sports', price: 200, condition: 'Good', type: 'Rent', location: 'Sports complex', seller: 'Isha T.', emoji: '🏸', color: 'lavender', description: 'Good for casual games and practice. Available for short-term rental.' }
];

const categories = [
  { name: 'All items', icon: Recycle },
  { name: 'Books', icon: BookOpen },
  { name: 'Calculators', icon: Calculator },
  { name: 'Electronics', icon: Laptop },
  { name: 'Bags', icon: Backpack },
  { name: 'Stationery', icon: BookOpen },
  { name: 'Hostel Items', icon: Armchair },
  { name: 'Sports', icon: Dumbbell }
];

function App() {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All items');
  const [mode, setMode] = useState('All');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showContact, setShowContact] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [saved, setSaved] = useState([]);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ title: '', category: 'Books', price: '', condition: 'Good', type: 'Sale', location: '', description: '' });

  const filtered = useMemo(() => items.filter(item => {
    const matchesQuery = `${item.title} ${item.category} ${item.description}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === 'All items' || item.category === category;
    const matchesMode = mode === 'All' || item.type === mode;
    return matchesQuery && matchesCategory && matchesMode;
  }), [items, query, category, mode]);

  function submitListing(e) {
    e.preventDefault();
    const newItem = {
      ...form,
      id: Date.now(),
      price: Number(form.price),
      seller: 'You',
      emoji: ({ Books: '📚', Calculators: '🧮', Electronics: '💻', Bags: '🎒', Stationery: '📓', 'Hostel Items': '🪴', Sports: '🏸' })[form.category] || '📦',
      color: 'mint',
      location: form.location || 'Campus pickup',
      description: form.description || 'Contact me for more details.'
    };
    setItems(current => [newItem, ...current]);
    setShowForm(false);
    setCategory('All items');
    setMode('All');
    setQuery('');
    setForm({ title: '', category: 'Books', price: '', condition: 'Good', type: 'Sale', location: '', description: '' });
    setNotice('Your item has been added to the demo listings.');
    setTimeout(() => setNotice(''), 3500);
  }

  function toggleSaved(id) {
    setSaved(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="nav-wrap">
          <button className="brand" onClick={() => { setCategory('All items'); setMode('All'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label="CampusLoop home">
            <span className="brand-mark"><Recycle size={23} strokeWidth={2.5} /></span>
            <span className="brand-text">Campus<span>Loop</span><small>EXTEND. REUSE. SUSTAIN.</small></span>
          </button>
          <nav className={mobileMenu ? 'nav-links open' : 'nav-links'}>
            <button className="nav-link active" onClick={() => { setCategory('All items'); setMode('All'); setMobileMenu(false); }}>Explore</button>
            <button className="nav-link" onClick={() => { setMode('Rent'); setCategory('All items'); setMobileMenu(false); document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' }); }}>Rent items</button>
            <button className="nav-link" onClick={() => { setShowForm(true); setMobileMenu(false); }}>How to sell</button>
          </nav>
          <div className="nav-actions">
            <button className="sell-button" onClick={() => setShowForm(true)}><Plus size={17} /> List an item</button>
            <button className="menu-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle menu"><Menu /></button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><Leaf size={15} /> THE STUDENT REUSE MARKETPLACE</div>
            <h1>Good finds.<br /><span>Second lives.</span></h1>
            <p className="hero-description">Buy, sell, and rent essentials with your campus community. Save money, pass things on, and make reuse the new normal.</p>
            <div className="hero-buttons">
              <button className="primary-button" onClick={() => document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' })}>Explore items <ArrowRight size={17} /></button>
              <button className="text-button" onClick={() => setShowForm(true)}>Have something to list? <span>Start here</span></button>
            </div>
            <div className="hero-proof">
              <div className="avatar-stack"><span>R</span><span>A</span><span>K</span><span>+</span></div>
              <div><strong>Made for campus life</strong><small>Affordable finds, closer to you</small></div>
            </div>
          </div>
          <div className="hero-art">
            <div className="hero-orbit orbit-one"></div><div className="hero-orbit orbit-two"></div>
            <div className="hero-sticker sticker-top"><Recycle size={16} /> Keep it in the loop</div>
            <div className="hero-product product-book"><span>📚</span><b>Good books<br />go places.</b></div>
            <div className="hero-product product-calc"><span>🧮</span><b>Ready for<br />another semester.</b></div>
            <div className="hero-product product-bag"><span>🎒</span><b>Pack light.<br />Waste less.</b></div>
            <div className="hero-center"><div className="center-leaf"><Leaf size={39} /></div><span>REUSE MORE</span><small>WASTE LESS</small></div>
            <div className="hero-sticker sticker-bottom"><span className="pulse"></span> Your campus. Your loop.</div>
          </div>
        </section>

        <section className="benefits">
          <div className="benefit"><span className="benefit-icon"><ShieldCheck size={21} /></span><div><b>Campus-minded</b><small>Relevant listings from students</small></div></div>
          <div className="benefit"><span className="benefit-icon"><Heart size={21} /></span><div><b>Budget-friendly</b><small>Find useful things for less</small></div></div>
          <div className="benefit"><span className="benefit-icon"><Recycle size={21} /></span><div><b>Reuse with purpose</b><small>Give items another life</small></div></div>
        </section>

        <section className="marketplace section-wrap" id="marketplace">
          <div className="section-heading">
            <div><div className="eyebrow">THE CAMPUS MARKETPLACE</div><h2>Find your next <span>good thing.</span></h2><p>Browse useful items shared by your campus community.</p></div>
            <button className="outline-button desktop-list" onClick={() => setShowForm(true)}><Plus size={17} /> List an item</button>
          </div>
          <div className="search-row">
            <div className="search-box"><Search size={20} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search books, calculators, bags..." aria-label="Search listings" />{query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={17} /></button>}</div>
            <div className="filter-tabs" aria-label="Listing type filters">
              {['All', 'Sale', 'Rent'].map(m => <button key={m} className={mode === m ? 'filter-tab selected' : 'filter-tab'} onClick={() => setMode(m)}>{m === 'All' ? 'All items' : m === 'Sale' ? 'For sale' : 'For rent'}</button>)}
            </div>
          </div>
          <div className="category-row">
            {categories.map(({ name, icon: Icon }) => <button key={name} className={category === name ? 'category-chip chosen' : 'category-chip'} onClick={() => setCategory(name)}><Icon size={16} />{name}</button>)}
          </div>
          <div className="listing-meta"><span><b>{filtered.length}</b> items to discover</span><span className="sort-label"><SlidersHorizontal size={15} /> Campus listings</span></div>
          {filtered.length ? <div className="product-grid">
            {filtered.map(item => <article className="product-card" key={item.id}>
              <button className={`save-button ${saved.includes(item.id) ? 'saved' : ''}`} onClick={() => toggleSaved(item.id)} aria-label="Save item"><Heart size={17} fill={saved.includes(item.id) ? 'currentColor' : 'none'} /></button>
              <button className={`product-image ${item.color}`} onClick={() => setSelected(item)} aria-label={`View ${item.title}`}><span className="item-emoji">{item.emoji}</span><span className={`type-badge ${item.type === 'Rent' ? 'rent-badge' : ''}`}>{item.type === 'Rent' ? 'For rent' : 'For sale'}</span></button>
              <div className="product-info">
                <div className="product-category">{item.category} <span>·</span> {item.condition}</div>
                <button className="product-title" onClick={() => setSelected(item)}>{item.title}</button>
                <div className="product-bottom"><strong>₹{item.price}</strong><button className="view-button" onClick={() => setSelected(item)}>View item <ArrowRight size={14} /></button></div>
                <div className="product-location"><MapPin size={13} /> {item.location}</div>
              </div>
            </article>)}
          </div> : <div className="empty-state"><span>🔎</span><h3>No items found</h3><p>Try another search or choose a different category.</p><button className="outline-button" onClick={() => { setQuery(''); setCategory('All items'); setMode('All'); }}>Clear filters</button></div>}
        </section>

        <section className="sell-cta">
          <div className="cta-icon"><Recycle size={30} /></div>
          <div><div className="eyebrow">PASS IT ON</div><h2>Not using it? <span>Loop it.</span></h2><p>Help another student find what they need—and give your stuff a second life.</p></div>
          <button className="primary-button" onClick={() => setShowForm(true)}>List your item <ArrowRight size={17} /></button>
          <div className="cta-decoration">↗</div>
        </section>
      </main>

      <footer className="footer"><div className="footer-brand"><span className="brand-mark"><Recycle size={20} /></span><b>CampusLoop</b></div><span>Extend. Reuse. Sustain.</span><span>Student-to-student reuse, made simpler.</span></footer>

      {notice && <div className="toast"><CheckCircle2 size={18} />{notice}</div>}

      {showForm && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
        <div className="modal">
          <div className="modal-head"><div><div className="eyebrow">GIVE IT A SECOND LIFE</div><h2>List an item</h2><p>Add the details so another student can find it.</p></div><button className="icon-button" onClick={() => setShowForm(false)} aria-label="Close"><X /></button></div>
          <form onSubmit={submitListing} className="listing-form">
            <label>Item name<input required maxLength="70" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. First-year physics textbook" /></label>
            <div className="form-grid">
              <label>Category<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{categories.slice(1).map(c => <option key={c.name}>{c.name}</option>)}</select></label>
              <label>Price (₹)<input required type="number" min="1" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="250" /></label>
            </div>
            <div className="form-grid">
              <label>Listing type<select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option>Sale</option><option>Rent</option></select></label>
              <label>Condition<select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}><option>New</option><option>Very good</option><option>Good</option><option>Fair</option></select></label>
            </div>
            <label>Pickup location<input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Academic block" /></label>
            <label>Description<textarea rows="3" maxLength="300" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Share the item's condition and any useful details." /></label>
            <div className="form-note"><ShieldCheck size={16} /> Demo only: listings stay in this browser session.</div>
            <button className="primary-button full-button" type="submit">Publish listing <ArrowRight size={17} /></button>
          </form>
        </div>
      </div>}

      {selected && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setSelected(null); }}>
        <div className="modal detail-modal">
          <button className="icon-button detail-close" onClick={() => setSelected(null)} aria-label="Close"><X /></button>
          <div className={`detail-image ${selected.color}`}><span>{selected.emoji}</span><span className={`type-badge ${selected.type === 'Rent' ? 'rent-badge' : ''}`}>{selected.type === 'Rent' ? 'For rent' : 'For sale'}</span></div>
          <div className="detail-content"><div className="product-category">{selected.category} · {selected.condition}</div><h2>{selected.title}</h2><div className="detail-price">₹{selected.price}{selected.type === 'Rent' && <small> / rental price</small>}</div><p>{selected.description}</p><div className="seller-card"><div className="seller-avatar">{selected.seller.charAt(0)}</div><div><b>{selected.seller}</b><small><MapPin size={12} /> {selected.location}</small></div><span className="demo-verified"><ShieldCheck size={14} /> Demo profile</span></div><button className="primary-button full-button" onClick={() => { setShowContact(selected); setSelected(null); }}><MessageCircle size={17} /> Contact seller</button><p className="demo-note">Prototype preview: seller details and messages are not connected to a real account.</p></div>
        </div>
      </div>}

      {showContact && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowContact(null); }}>
        <div className="modal contact-modal"><button className="icon-button detail-close" onClick={() => setShowContact(null)} aria-label="Close"><X /></button><div className="contact-icon"><MessageCircle size={28} /></div><div className="eyebrow">CONNECT WITH THE SELLER</div><h2>Interested in this item?</h2><p className="contact-item-name">{showContact.title} · ₹{showContact.price}</p><label>Your message<textarea id="seller-message" rows="4" defaultValue={`Hi ${showContact.seller}, I'm interested in your ${showContact.title}. Is it still available?`} /></label><div className="form-note">This is a demo interaction. No message will be sent.</div><button className="primary-button full-button" onClick={() => { setShowContact(null); setNotice('Demo message prepared. Messaging will be added in a future version.'); setTimeout(() => setNotice(''), 3500); }}>Preview message <ArrowRight size={17} /></button></div>
      </div>}
    </div>
  );
}

export default App;
