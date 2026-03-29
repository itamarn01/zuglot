import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { FiPlus, FiSearch, FiEye, FiTrash2, FiArrowUp, FiArrowDown } from 'react-icons/fi';

const EVENT_TYPES = ['חתונה', 'בר מצווה', 'בת מצווה', 'אירוע', 'אחר'];
const RELATIONSHIPS = ['חתן', 'כלה', 'אבא חתן', 'אבא כלה', 'אמא חתן', 'אמא כלה', 'מפיק', 'חבר', 'אח/אחות', 'אחר'];
const PAGE_SIZE = 80;

// Skeleton Row Component
const SkeletonRow = () => (
  <tr>
    {[1,2,3,4,5,6,7,8].map(i=>(
      <td key={i}>
        <div style={{height:14,background:'var(--bg-secondary)',borderRadius:4,animation:'skeleton-pulse 1.5s ease-in-out infinite',width:i===1?'80%':i===4?'60%':'70%'}}/>
      </td>
    ))}
  </tr>
);

const Leads = ({ filter }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt'); // 'createdAt' | 'eventDate'
  const [sortDir, setSortDir] = useState('desc');
  const [showModal, setShowModal] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [lostReason, setLostReason] = useState('');
  const [handlers, setHandlers] = useState([]);
  const [form, setForm] = useState({
    title: '', eventType: 'חתונה', contacts: [{ fullName: '', phone: '', email: '', relationship: 'אחר' }],
    eventDate: '', location: '', eventDetails: '', howHeardAboutUs: '', referredBy: '', handler: '', proposedPrice: '',
  });
  const navigate = useNavigate();
  const observerRef = useRef();
  const bottomRef = useRef();

  useEffect(() => {
    setLeads([]); setPage(1); setHasMore(false);
    fetchLeads(1, true);
    fetchHandlers();
  }, [filter, search, sortBy, sortDir]);

  const fetchLeads = async (pageNum = 1, reset = false) => {
    try {
      if(pageNum===1) setLoading(true); else setLoadingMore(true);
      const params = { page: pageNum, limit: PAGE_SIZE, sort: sortBy, dir: sortDir };
      if(filter) params.status = filter;
      if(search) params.search = search;
      const { data } = await api.get('/leads', { params });
      const items = Array.isArray(data) ? data : data.leads || data;
      const total = data.total || items.length;
      setTotalCount(total);
      if(reset || pageNum===1) setLeads(items);
      else setLeads(prev => [...prev, ...items]);
      setHasMore(items.length === PAGE_SIZE);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false); setLoadingMore(false);
    }
  };

  // Infinite scroll observer
  useEffect(() => {
    if(!bottomRef.current) return;
    observerRef.current = new IntersectionObserver(entries => {
      if(entries[0].isIntersecting && hasMore && !loadingMore) {
        const next = page + 1;
        setPage(next);
        fetchLeads(next);
      }
    }, {threshold:0.1});
    observerRef.current.observe(bottomRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loadingMore, page, filter, search, sortBy, sortDir]);

  const fetchHandlers = async () => {
    try { const { data } = await api.get('/handlers'); setHandlers(data); } 
    catch(err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if(payload.proposedPrice) payload.proposedPrice = Number(payload.proposedPrice);
      await api.post('/leads', payload);
      setShowModal(false);
      setForm({ title:'', eventType:'חתונה', contacts:[{fullName:'',phone:'',email:'',relationship:'אחר'}], eventDate:'', location:'', eventDetails:'', howHeardAboutUs:'', referredBy:'', handler:'', proposedPrice:'' });
      fetchLeads(1, true);
    } catch(err) { alert(err.response?.data?.message || 'שגיאה'); }
  };

  const handleStatusChange = async (lead, newStatus) => {
    if(newStatus === 'lost') { setSelectedLead(lead); setShowLostModal(true); return; }
    try { await api.patch(`/leads/${lead._id}/status`, { status: newStatus }); fetchLeads(1, true); }
    catch(err) { alert(err.response?.data?.message || 'שגיאה'); }
  };

  const submitLost = async () => {
    if(!lostReason.trim()) { alert('נדרשת סיבה'); return; }
    try {
      await api.patch(`/leads/${selectedLead._id}/status`, { status:'lost', lostReason });
      setShowLostModal(false); setLostReason(''); setSelectedLead(null);
      fetchLeads(1, true);
    } catch(err) { alert(err.response?.data?.message || 'שגיאה'); }
  };

  const deleteLead = async (id) => {
    if(!confirm('למחוק את הליד?')) return;
    try { await api.delete(`/leads/${id}`); fetchLeads(1, true); }
    catch(err) { alert('שגיאה במחיקה'); }
  };

  const addContact = () => setForm(f => ({...f, contacts:[...f.contacts,{fullName:'',phone:'',email:'',relationship:'אחר'}]}));
  const updateContact = (idx, field, value) => setForm(f => { const contacts=[...f.contacts]; contacts[idx]={...contacts[idx],[field]:value}; return {...f,contacts}; });
  const removeContact = (idx) => { if(form.contacts.length===1) return; setForm(f=>({...f,contacts:f.contacts.filter((_,i)=>i!==idx)})); };

  const titles = { tracking:'מעקב זוגות', won:'WIN - זכינו! 🎉', lost:'LOST' };

  const toggleSort = (field) => {
    if(sortBy===field) setSortDir(d=>d==='desc'?'asc':'desc');
    else { setSortBy(field); setSortDir('desc'); }
  };

  const SortIcon = ({field}) => {
    if(sortBy!==field) return <span style={{opacity:0.3,fontSize:10}}>↕</span>;
    return sortDir==='desc' ? <FiArrowDown style={{fontSize:12,color:'var(--accent-gold)'}}/> : <FiArrowUp style={{fontSize:12,color:'var(--accent-gold)'}}/>;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{titles[filter] || 'לידים'}</h1>
        <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
          {/* Sort buttons for won/lost */}
          {(filter==='won'||filter==='lost')&&(
            <div style={{display:'flex',gap:6}}>
              <button className={`btn btn-sm ${sortBy==='createdAt'?'btn-primary':'btn-secondary'}`} onClick={()=>toggleSort('createdAt')}>
                תאריך יצירה <SortIcon field="createdAt"/>
              </button>
              <button className={`btn btn-sm ${sortBy==='eventDate'?'btn-primary':'btn-secondary'}`} onClick={()=>toggleSort('eventDate')}>
                תאריך אירוע <SortIcon field="eventDate"/>
              </button>
            </div>
          )}
          <div className="search-bar">
            <FiSearch className="search-icon"/>
            <input placeholder="חיפוש..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          {filter==='tracking'&&(
            <button className="btn btn-primary" onClick={()=>setShowModal(true)}>
              <FiPlus/> ליד חדש
            </button>
          )}
        </div>
      </div>

      {totalCount>0&&<div style={{color:'var(--text-muted)',fontSize:'0.85rem',marginBottom:12}}>סה"כ: {totalCount} תוצאות</div>}

      {loading ? (
        <div className="table-container">
          <table>
            <thead><tr><th>כותרת</th><th>סוג</th><th>איש קשר</th><th>טלפון</th><th>תאריך</th><th>בטיפול</th><th>מחיר</th><th>פעולות</th></tr></thead>
            <tbody>{[1,2,3,4,5,6,7,8].map(i=><SkeletonRow key={i}/>)}</tbody>
          </table>
        </div>
      ) : leads.length===0 ? (
        <div className="empty-state">
          <div className="icon">📋</div>
          <h3>אין לידים {filter==='won'?'שנסגרו':filter==='lost'?'שאבדו':'במעקב'}</h3>
          <p>התחילו להוסיף לידים חדשים</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>כותרת</th>
                  <th>סוג אירוע</th>
                  <th>איש קשר</th>
                  <th>טלפון</th>
                  <th style={{cursor:'pointer',userSelect:'none'}} onClick={()=>toggleSort('eventDate')}>
                    <span style={{display:'flex',alignItems:'center',gap:4}}>תאריך<SortIcon field="eventDate"/></span>
                  </th>
                  <th>בטיפול</th>
                  <th>מחיר</th>
                  <th>סטטוס</th>
                  {filter==='lost'&&<th>סיבה</th>}
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead=>(
                  <tr key={lead._id}>
                    <td style={{fontWeight:700,cursor:'pointer',color:'var(--accent-gold)'}} onClick={()=>navigate(`/leads/${lead._id}`)}>
                      {lead.title}
                    </td>
                    <td>{lead.eventType}</td>
                    <td>{lead.contacts?.[0]?.fullName||'-'}</td>
                    <td dir="ltr">{lead.contacts?.[0]?.phone||'-'}</td>
                    <td>{lead.eventDate?new Date(lead.eventDate).toLocaleDateString('he-IL'):'-'}</td>
                    <td>{lead.handler?.name||'-'}</td>
                    <td>{lead.proposedPrice?`₪${lead.proposedPrice.toLocaleString()}`:'-'}</td>
                    <td><span className={`badge badge-${lead.status}`}>{lead.status==='tracking'?'מעקב':lead.status==='won'?'WIN':'LOST'}</span></td>
                    {filter==='lost'&&<td style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>{lead.lostReason||'-'}</td>}
                    <td>
                      <div style={{display:'flex',gap:4}}>
                        <button className="btn-icon" title="צפה" onClick={()=>navigate(`/leads/${lead._id}`)}><FiEye/></button>
                        {lead.status!=='won'&&<button className="btn-icon" style={{color:'var(--success)'}} title="WIN" onClick={()=>handleStatusChange(lead,'won')}>✓</button>}
                        {lead.status!=='lost'&&<button className="btn-icon" style={{color:'var(--error)'}} title="LOST" onClick={()=>handleStatusChange(lead,'lost')}>✗</button>}
                        {lead.status!=='tracking'&&<button className="btn-icon" style={{color:'var(--accent-cyan)'}} title="חזור למעקב" onClick={()=>handleStatusChange(lead,'tracking')}>↩</button>}
                        <button className="btn-icon" style={{color:'var(--error)'}} title="מחק" onClick={()=>deleteLead(lead._id)}><FiTrash2/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Infinite scroll trigger */}
          <div ref={bottomRef} style={{height:20,marginTop:8}}/>
          {loadingMore&&(
            <div style={{textAlign:'center',padding:16}}>
              <div className="spinner" style={{margin:'0 auto',width:28,height:28}}/>
            </div>
          )}
          {!hasMore&&leads.length>0&&<div style={{textAlign:'center',padding:12,color:'var(--text-muted)',fontSize:'0.85rem'}}>הוצגו כל התוצאות ({leads.length})</div>}
        </>
      )}

      {/* New Lead Modal */}
      {showModal&&(
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal" style={{maxWidth:700}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">ליד חדש</h2>
              <button className="modal-close" onClick={()=>setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">כותרת *</label>
                  <input className="form-input" required value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="לדוגמא: קובי ורחל"/>
                </div>
                <div className="form-group">
                  <label className="form-label">סוג אירוע *</label>
                  <select className="form-select" value={form.eventType} onChange={e=>setForm(f=>({...f,eventType:e.target.value}))}>
                    {EVENT_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <h3 style={{fontSize:'1rem',color:'var(--accent-cyan)',margin:'16px 0 12px'}}>אנשי קשר</h3>
              {form.contacts.map((contact,idx)=>(
                <div key={idx} style={{background:'var(--bg-secondary)',padding:16,borderRadius:8,marginBottom:12,border:'1px solid var(--border)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                    <span style={{fontSize:'0.85rem',color:'var(--text-muted)'}}>איש קשר {idx+1}</span>
                    {form.contacts.length>1&&<button type="button" className="btn btn-danger btn-sm" onClick={()=>removeContact(idx)}>הסר</button>}
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">שם מלא</label><input className="form-input" value={contact.fullName} onChange={e=>updateContact(idx,'fullName',e.target.value)}/></div>
                    <div className="form-group"><label className="form-label">קרבה</label>
                      <select className="form-select" value={contact.relationship} onChange={e=>updateContact(idx,'relationship',e.target.value)}>
                        {RELATIONSHIPS.map(r=><option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">טלפון</label><input className="form-input" value={contact.phone} onChange={e=>updateContact(idx,'phone',e.target.value)}/></div>
                    <div className="form-group"><label className="form-label">אימייל</label><input className="form-input" type="email" value={contact.email} onChange={e=>updateContact(idx,'email',e.target.value)}/></div>
                  </div>
                </div>
              ))}
              <button type="button" className="btn btn-secondary btn-sm" style={{marginBottom:16}} onClick={addContact}>
                <FiPlus/> הוסף איש קשר
              </button>

              <div className="form-row">
                <div className="form-group"><label className="form-label">תאריך אירוע</label><input className="form-input" type="date" value={form.eventDate} onChange={e=>setForm(f=>({...f,eventDate:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">לוקיישן</label><input className="form-input" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))}/></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">איך שמעו עלינו</label><input className="form-input" value={form.howHeardAboutUs} onChange={e=>setForm(f=>({...f,howHeardAboutUs:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">מי המליץ</label><input className="form-input" value={form.referredBy} onChange={e=>setForm(f=>({...f,referredBy:e.target.value}))}/></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">בטיפול</label>
                  <select className="form-select" value={form.handler} onChange={e=>setForm(f=>({...f,handler:e.target.value}))}>
                    <option value="">בחר מטפל</option>
                    {handlers.map(h=><option key={h._id} value={h._id}>{h.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">מחיר שהוצע</label><input className="form-input" type="number" value={form.proposedPrice} onChange={e=>setForm(f=>({...f,proposedPrice:e.target.value}))}/></div>
              </div>
              <div className="form-group"><label className="form-label">פרטים נוספים</label><textarea className="form-textarea" value={form.eventDetails} onChange={e=>setForm(f=>({...f,eventDetails:e.target.value}))}/></div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">צור ליד</button>
                <button type="button" className="btn btn-secondary" onClick={()=>setShowModal(false)}>ביטול</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lost Reason Modal */}
      {showLostModal&&(
        <div className="modal-overlay" onClick={()=>setShowLostModal(false)}>
          <div className="modal" style={{maxWidth:400}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">העבר ל-LOST</h2>
              <button className="modal-close" onClick={()=>setShowLostModal(false)}>✕</button>
            </div>
            <p style={{marginBottom:16,color:'var(--text-secondary)'}}>{selectedLead?.title} - למה לא?</p>
            <div className="form-group"><label className="form-label">סיבה *</label>
              <select className="form-select" value={lostReason} onChange={e=>setLostReason(e.target.value)}>
                <option value="">בחר סיבה</option>
                <option value="יקר">יקר</option>
                <option value="תאריך תפוס">תאריך תפוס</option>
                <option value="לא הסגנון">לא הסגנון</option>
                <option value="בחרו להקה אחרת">בחרו להקה אחרת</option>
                <option value="ביטלו אירוע">ביטלו אירוע</option>
                <option value="אחר">אחר</option>
              </select>
            </div>
            {lostReason==='אחר'&&<div className="form-group"><input className="form-input" placeholder="פרט סיבה..." onChange={e=>setLostReason(e.target.value)}/></div>}
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={submitLost}>העבר ל-LOST</button>
              <button className="btn btn-secondary" onClick={()=>setShowLostModal(false)}>ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
