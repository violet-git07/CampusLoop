
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
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
const [chatDraft, setChatDraft] = useState('');
const [chatLoading, setChatLoading] = useState(false);
const [sendingChat, setSendingChat] = useState(false);
const [showInbox, setShowInbox] = useState(false);
const [inboxThreads, setInboxThreads] = useState([]);
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
    console.log('Checking existing session...');

    const { data, error } = await supabase.auth.getSession();

    console.log('Initial session check:', {
      hasSession: !!data?.session,
      error: error?.message ?? null,
    });

    if (alive && !error) {
      setSession(data.session);
    }
  }

  loadSession();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, nextSession) => {
    console.log('Auth event:', event);
    console.log('Session user:', nextSession?.user?.id ?? null);

    if (alive) {
      setSession(nextSession);
    }
  });

  return () => {
    alive = false;
    subscription.unsubscribe();
  };
}, []);

  
async function loadConversation(listing) {
  const userId = session?.user?.id;
  const sellerId = listing?.chatPartnerId || listing?.user_id;


  if (!userId || !listing?.id || !sellerId || userId === sellerId) {
    setChatMessages([]);
    return;
  }

  setChatLoading(true);

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('listing_id', listing.id)
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${sellerId}),and(sender_id.eq.${sellerId},receiver_id.eq.${userId})`
    )
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to load conversation:', error.message);
    setNotice('Could not load messages: ' + error.message);
    setChatLoading(false);
    return;
  }

  const loadedMessages = data || [];
  setChatMessages(loadedMessages);

  const unreadIds = loadedMessages
    .filter(message => message.receiver_id === userId && !message.read_at)
    .map(message => message.id);

  if (unreadIds.length > 0) {
    const { error: readError } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', unreadIds);

    if (readError) {
      console.error('Failed to mark messages as read:', readError.message);
    }
  }

  setChatLoading(false);
}


async function loadInbox() {
  const userId = session?.user?.id;
  if (!userId) return;

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    setNotice('Could not load inbox: ' + error.message);
    return;
  }

  const grouped = new Map();

  for (const message of data || []) {
    const otherUserId =
      message.sender_id === userId
        ? message.receiver_id
        : message.sender_id;

    const key = `${message.listing_id}:${otherUserId}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        listingId: message.listing_id,
        otherUserId,
        lastMessage: message,
        unreadCount: 0,
      });
    }

    if (
      message.receiver_id === userId &&
      !message.read_at
    ) {
      grouped.get(key).unreadCount += 1;
    }
  }

  const threads = [...grouped.values()];
  const listingIds = [...new Set(threads.map(t => t.listingId))];

  let listingMap = new Map();

  if (listingIds.length > 0) {
    const { data: listings, error: listingError } = await supabase
      .from('listings')
      .select('id, title, price, user_id, category, condition, listing_type, location, description, image_url, status')
      .in('id', listingIds);

    if (listingError) {
      setNotice('Could not load listing details: ' + listingError.message);
      return;
    }

    listingMap = new Map((listings || []).map(item => [item.id, item]));
  }

  setInboxThreads(
    threads.map(thread => ({
      ...thread,
      listing: listingMap.get(thread.listingId) || {
        id: thread.listingId,
        title: 'Listing unavailable',
        user_id: null,
      },
    }))
  );
}

async function sendChatMessage(e) {
  e.preventDefault();

  const body = chatDraft.trim();
  const listing = showContact;
  const senderId = session?.user?.id;
  const receiverId = listing?.chatPartnerId || listing?.user_id;

  if (!body || !senderId || !listing?.id || !receiverId) {
    setNotice('Missing message or listing information.');
    return;
  }

  if (senderId === receiverId) {
    setNotice('You cannot message yourself.');
    return;
  }

  if (sendingChat) return;

  setSendingChat(true);

  try {
    const { error } = await supabase
      .from('messages')
      .insert({
        listing_id: listing.id,
        sender_id: senderId,
        receiver_id: receiverId,
        body,
      });

    if (error) throw error;

    setChatDraft('');
    setNotice('Message sent successfully.');

    // Reload the conversation without blocking the Send button.
    loadConversation(listing).catch(error => {
      console.error('Conversation reload failed:', error);
    });
  } catch (error) {
    console.error('Failed to send message:', error);
    setNotice('Could not send message: ' + error.message);
  } finally {
    setSendingChat(false);
  }
}


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
      type: item.listing_type === 'rent' ? 'Rent' : 'Sale',
      seller: item.user_id === session?.user?.id ? 'You' : 'Campus student',
      emoji: categoryEmoji[item.category] || '📦',
      color: 'mint',
    })));
  }

  useEffect(() => {
    loadListings();
  }, [session?.user?.id]);
  
useEffect(() => {
  let cancelled = false;

  async function loadSavedFavourites() {
    if (!session?.user) {
      setSaved([]);
      return;
    }

    const { data, error } = await supabase
      .from('favourites')
      .select('listing_id')
      .eq('user_id', session.user.id);

    if (cancelled) return;

    if (error) {
      console.error('Failed to load favourites:', error.message);
      setNotice('Could not load favourites: ' + error.message);
      return;
    }

    setSaved((data || []).map(item => item.listing_id));
  }

  loadSavedFavourites();

  return () => {
    cancelled = true;
  };
}, [session?.user?.id]);
  
useEffect(() => {
  if (!notice) return;

  const timer = setTimeout(() => {
    setNotice('');
  }, 4000);

  return () => clearTimeout(timer);
}, [notice]);
useEffect(() => {
  if (!showContact || !session?.user?.id) {
    setChatMessages([]);
    setChatDraft('');
    return;
  }

  setChatDraft('');
  loadConversation(showContact);
}, [showContact?.id, showContact?.chatPartnerId, session?.user?.id]);


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
    console.log('LOGIN/SIGNUP BUTTON SUBMITTED');
    setBusy(true);
    setNotice('');

    try {
      console.log('Auth mode:', authMode);
      if (authMode === 'signup') {
        console.log('Sending login request to Supabase...');
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        });
        console.log('Supabase login response received:', {
  hasSession: !!data?.session,
  error: error?.message ?? null,
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
      console.error('Authentication failed:', error);
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
  
let imageUrl = editingId
  ? items.find(item => item.id === editingId)?.image_url || null
  : null;

if (imageFile) {
  const filePath = `${session.user.id}/${crypto.randomUUID()}-${imageFile.name}`;

  const { data: uploadedFile, error: uploadError } = await supabase.storage
    .from('listing-images')
    .upload(filePath, imageFile, {
      contentType: imageFile.type,
      upsert: false,
    });

  if (uploadError) {
    setBusy(false);
    setNotice('Image upload failed: ' + uploadError.message);
    return;
  }

  const { data: publicUrl } = supabase.storage
    .from('listing-images')
    .getPublicUrl(uploadedFile.path);

  imageUrl = publicUrl.publicUrl;
}


  const listingData = {
    user_id: session.user.id,
    title: form.title.trim(),
    description: form.description.trim() || 'Contact me for more details.',
    price: Number(form.price),
    category: form.category,
    listing_type: form.type.toLowerCase(),
    condition: form.condition,
    location: form.location.trim() || 'Campus pickup',
    image_url: imageUrl,
    status: 'active',
  };

  let error;

  if (editingId) {
    const result = await supabase
      .from('listings')
      .update({
        title: listingData.title,
        description: listingData.description,
        price: listingData.price,
        category: listingData.category,
        listing_type: listingData.listing_type,
        condition: listingData.condition,
        location: listingData.location,
        image_url: imageUrl,
      })
      .eq('id', editingId)
      .eq('user_id', session.user.id)
      .select('id')
      .maybeSingle();

    error = result.error;

    if (!error && !result.data) {
      error = new Error('Listing not found or you are not allowed to edit it.');
    }
  } else {
    const result = await supabase
      .from('listings')
      .insert(listingData);

    error = result.error;
  }

  setBusy(false);

  if (error) {
    setNotice('Could not save listing: ' + error.message);
    return;
  }

  const wasEditing = Boolean(editingId);

  setEditingId(null);
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
  setImageFile(null);

  setNotice(wasEditing ? 'Listing updated successfully.' : 'Listing published successfully.');
  await loadListings();
}
  function startEditing(item) {
  setEditingId(item.id);
  setForm({
    title: item.title || '',
    category: item.category || 'Books',
    price: String(item.price ?? ''),
    condition: item.condition || 'Good',
    type: item.type || (item.listing_type === 'rent' ? 'Rent' : 'Sale'),
    location: item.location || '',
    description: item.description || '',
  });
  setShowForm(true);
  setNotice('');
}

async function deleteListing(item) {
  if (!session?.user || item.user_id !== session.user.id) {
    setNotice('You can only delete your own listings.');
    return;
  }

  if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) {
    return;
  }

  setBusy(true);

  const { data, error } = await supabase
    .from('listings')
    .delete()
    .eq('id', item.id)
    .eq('user_id', session.user.id)
    .select('id')
    .maybeSingle();

  setBusy(false);

  if (error) {
    setNotice('Could not delete listing: ' + error.message);
    return;
  }

  if (!data) {
    setNotice('Listing was not found or you cannot delete it.');
    return;
  }

  if (editingId === item.id) {
    setEditingId(null);
    setShowForm(false);
  }

  setNotice('Listing deleted successfully.');
  await loadListings();
}

async function toggleSaved(id) {
  if (!session?.user) {
    setNotice('Log in to save favourites.');
    setShowAuth(true);
    return;
  }

  const alreadySaved = saved.includes(id);

  setSaved(current =>
    alreadySaved
      ? current.filter(itemId => itemId !== id)
      : [...current, id]
  );

  const result = alreadySaved
    ? await supabase
        .from('favourites')
        .delete()
        .eq('user_id', session.user.id)
        .eq('listing_id', id)
    : await supabase
        .from('favourites')
        .insert({
          user_id: session.user.id,
          listing_id: id,
        });

  if (result.error) {
    setSaved(current =>
      alreadySaved
        ? [...current, id]
        : current.filter(itemId => itemId !== id)
    );
    setNotice('Could not update favourite: ' + result.error.message);
    return;
  }

  setNotice(alreadySaved ? 'Favourite removed.' : 'Added to favourites.');
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
    <button
      className="sell-button"
      onClick={() => {
        setShowContact(null);
        setShowInbox(true);
        loadInbox();
      }}
    >
      <MessageCircle size={16} /> Inbox
    </button>
    <button className="sell-button" onClick={handleLogout}>
      Log out
    </button>
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
  <div className="notice notice-toast" role="status">
    <span>{notice}</span>
    <button
      type="button"
      onClick={() => setNotice('')}
      aria-label="Dismiss notice"
    >
      <X size={16} />
    </button>
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
          <div className="hero-art">
  <div className="hero-orbit orbit-one" />
  <div className="hero-orbit orbit-two" />

  <div className="hero-center">
    <Leaf size={38} className="center-leaf" />
    <span>REUSE MORE</span>
    <small>WASTE LESS</small>
  </div>

  <div className="hero-product product-book">
    <span>📚</span>
    <b>Good books<br />go places.</b>
  </div>

  <div className="hero-product product-calc">
    <span>🧮</span>
    <b>Ready for<br />another semester.</b>
  </div>

  <div className="hero-product product-bag">
    <span>🎒</span>
    <b>Pack light.<br />Waste less.</b>
  </div>

  <div className="hero-sticker sticker-top">
    <Recycle size={17} /> Keep it in the loop
  </div>

  <div className="hero-sticker sticker-bottom">
    <span className="pulse" /> Your campus. Your loop.
  </div>
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
  {item.image_url ? (
    <img
      src={item.image_url}
      alt={item.title}
      style={{ width: '100%', height: '170px', objectFit: 'cover' }}
    />
  ) : (
    <span>{item.emoji}</span>
  )}

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
                  {session?.user?.id === item.user_id && (
  <div className="listing-owner-actions">
    <button
      type="button"
      onClick={() => startEditing(item)}
      disabled={busy}
    >
      Edit
    </button>
    <button
      type="button"
      onClick={() => deleteListing(item)}
      disabled={busy}
    >
      Delete
    </button>
  </div>
)}


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
              
              <div className="form-group">
              <label htmlFor="listing-image">Item photo</label>
              <input
                id="listing-image"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
              </div>

              <button className="primary-button full-button" type="submit" disabled={busy}>
                {busy ? (editingId ? 'Saving...' : 'Publishing...')
    : (editingId ? 'Save Changes' : 'Publish listing')} <ArrowRight size={17} />
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
            ```jsx
<div className={`detail-image ${selected.color || 'mint'}`}>
  {selected.image_url ? (
    <img
      src={selected.image_url}
      alt={selected.title}
      style={{
        width: '100%',
        height: '100%',
        maxHeight: '300px',
        objectFit: 'contain',
        borderRadius: '12px',
      }}
    />
  ) : (
    <span>{selected.emoji}</span>
  )}

  <span className={`type-badge ${selected.type === 'Rent' ? 'rent-badge' : ''}`}>
    {selected.type === 'Rent' ? 'For rent' : 'For sale'}
  </span>
</div>
```
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
             <div className="chat-messages" aria-live="polite">
  {chatLoading ? (
    <p>Loading messages...</p>
  ) : chatMessages.length === 0 ? (
    <p>No messages yet. Start the conversation.</p>
  ) : (
    chatMessages.map(message => (
      <div
        key={message.id}
        className={
          message.sender_id === session?.user?.id
            ? 'chat-bubble sent'
            : 'chat-bubble received'
        }
      >
        <p>{message.body}</p>
        <small>
          {new Date(message.created_at).toLocaleString()}
        </small>
      </div>
    ))
  )}
</div>

<form className="chat-form" onSubmit={sendChatMessage}>
  <input
    value={chatDraft}
    onChange={e => setChatDraft(e.target.value)}
    onKeyDown={e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        e.currentTarget.form?.requestSubmit();
      }
    }}
    placeholder="Write a message..."
    maxLength={2000}
    required
    disabled={sendingChat || chatLoading}
  />

  <button
    className="primary-button"
    type="submit"
    disabled={sendingChat || chatLoading || !chatDraft.trim()}
  >
    {sendingChat ? 'Sending...' : 'Send'}
  </button>
</form>
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
            <div className="chat-messages" aria-live="polite">
  {chatLoading ? (
    <p>Loading messages...</p>
  ) : chatMessages.length === 0 ? (
    <p>No messages yet. Start the conversation.</p>
  ) : (
    chatMessages.map(message => (
      <div
        key={message.id}
        className={
          message.sender_id === session?.user?.id
            ? 'chat-bubble sent'
            : 'chat-bubble received'
        }
      >
        <p>{message.body}</p>
        <small>{new Date(message.created_at).toLocaleString()}</small>
      </div>
    ))
  )}
</div>

<form className="chat-form" onSubmit={sendChatMessage}>
  <input
    value={chatDraft}
    onChange={e => setChatDraft(e.target.value)}
    placeholder="Write a message..."
    maxLength={2000}
    required
    disabled={sendingChat || chatLoading}
  />
  <button
    className="primary-button"
    type="submit"
    disabled={sendingChat || chatLoading || !chatDraft.trim()}
  >
    {sendingChat ? 'Sending...' : 'Send'}
  </button>
</form>
            <button className="primary-button full-button" onClick={() => setShowContact(null)}>Close</button>
          </div>
        </div>
      )}
      
{showInbox && (
  <div
    className="modal-backdrop"
    onMouseDown={e => {
      if (e.target === e.currentTarget) setShowInbox(false);
    }}
  >
    <div className="modal contact-modal inbox-modal">
      <button
        className="icon-button detail-close"
        onClick={() => setShowInbox(false)}
        aria-label="Close inbox"
      >
        <X />
      </button>

      <div className="eyebrow">CAMPUSLOOP MESSAGES</div>
      <h2>Your Inbox</h2>

      {inboxThreads.length === 0 ? (
        <p>No conversations yet.</p>
      ) : (
        <div className="inbox-threads">
          {inboxThreads.map(thread => (
            <button
              type="button"
              className="inbox-thread"
              key={`${thread.listingId}:${thread.otherUserId}`}
              onClick={() => {
                setShowInbox(false);
                setShowContact({
                  ...thread.listing,
                  chatPartnerId: thread.otherUserId,
                });
              }}
            >
              <strong>{thread.listing.title}</strong>
              <span>
                {thread.lastMessage.body}
              </span>
              <small>
                {new Date(
                  thread.lastMessage.created_at
                ).toLocaleString()}
                {thread.unreadCount > 0
                  ? ` · ${thread.unreadCount} unread`
                  : ''}
              </small>
            </button>
          ))}
        </div>
      )}
    </div>
  </div>
)}
<section className="contact-section" id="contact">
  <div className="contact-content">
    <p className="contact-label">GET IN TOUCH</p>

    <h2>We'd Love to Hear From You</h2>

    <p className="contact-description">
      Have a question, suggestion, or feedback?
      We're here to help make CampusLoop better
      for every student.
    </p>

    <div className="contact-email">
      <span className="contact-icon">✉</span>

      <div>
        <h3>Email Us</h3>
        <a href="mailto:campusloop0@gmail.com">
          campusloop0@gmail.com
        </a>
      </div>
    </div>

    <a
      className="contact-button"
      href="mailto:campusloop0@gmail.com?subject=CampusLoop%20Enquiry"
    >
      Contact Us
    </a>

    <p className="contact-tagline">
      CampusLoop — Extend. Reuse. Sustain.
    </p>
  </div>
</section>

 
    </div>

  );
}

export default App;
