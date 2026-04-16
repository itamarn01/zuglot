import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { FiArrowRight, FiPlus, FiSend, FiCalendar, FiEdit2, FiTrash2, FiBell, FiFileText, FiDownload, FiExternalLink } from 'react-icons/fi';

const RELS = ['חתן','כלה','אבא חתן','אבא כלה','אמא חתן','אמא כלה','מפיק','חבר','אח/אחות','אחר'];
const ETYPES = ['חתונה','בר מצווה','בת מצווה','אירוע','אחר'];

const LeadDetail = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const [lead, setLead] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [handlers, setHandlers] = useState([]);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newUpdate, setNewUpdate] = useState('');
  const [uType, setUType] = useState('note');
  const [editing, setEditing] = useState(false);
  const [ef, setEf] = useState({});
  const [showRem, setShowRem] = useState(false);
  const [rf, setRf] = useState({ message:'', dueDate:'', type:'notification', handlerId:'' });
  const [showPdf, setShowPdf] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'updates' | 'contract'

  useEffect(() => { fetchAll(); }, [id]);

  const fetchAll = async () => {
    try {
      const [l,u,r,h] = await Promise.all([
        api.get(`/leads/${id}`), api.get(`/updates/lead/${id}`),
        api.get(`/reminders?leadId=${id}`), api.get('/handlers')
      ]);
      setLead(l.data); setEf(l.data); setUpdates(u.data); setReminders(r.data); setHandlers(h.data);
      // Load contract if exists
      if (l.data.contractId) {
        try {
          const { data } = await api.get(`/contracts/${l.data.contractId}`);
          setContract(data);
        } catch(e) { /* no contract */ }
      }
    } catch(e){ console.error(e); } finally { setLoading(false); }
  };

  const postUpdate = async () => {
    if(!newUpdate.trim()) return;
    await api.post('/updates', { leadId:id, content:newUpdate, type:uType });
    setNewUpdate('');
    const {data} = await api.get(`/updates/lead/${id}`);
    setUpdates(data);
  };

  const saveLead = async () => {
    const {data} = await api.put(`/leads/${id}`, ef);
    setLead(data); setEditing(false);
  };

  const addContact = () => setEf(f=>({...f, contacts:[...(f.contacts||[]),{fullName:'',phone:'',email:'',relationship:'אחר'}]}));
  const updContact = (i,k,v) => setEf(f=>{const c=[...f.contacts];c[i]={...c[i],[k]:v};return{...f,contacts:c};});
  const rmContact = (i) => { if(ef.contacts.length>1) setEf(f=>({...f,contacts:f.contacts.filter((_,j)=>j!==i)})); };

  const createRem = async (e) => {
    e.preventDefault();
    await api.post('/reminders', {...rf, leadId:id});
    setShowRem(false); setRf({message:'',dueDate:'',type:'notification',handlerId:''});
    const {data} = await api.get(`/reminders?leadId=${id}`); setReminders(data);
  };

  const syncCal = async () => {
    try { await api.post(`/calendar/sync/${id}`); alert('סונכרן!'); } catch(e){ alert('שגיאה'); }
  };

  const downloadPdf = () => {
    if (!contract?.pdfUrl) return;
    const link = document.createElement('a');
    link.href = contract.pdfUrl;
    link.download = `contract-${lead?.title || 'kolot'}.pdf`;
    link.click();
  };

  if(loading) return (
    <div>
      <div className="page-header">
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <div style={{width:36,height:36,borderRadius:6,background:'var(--bg-secondary)',animation:'skeleton-pulse 1.5s ease-in-out infinite'}}/>
          <div style={{height:28,background:'var(--bg-secondary)',borderRadius:4,width:200,animation:'skeleton-pulse 1.5s ease-in-out infinite'}}/>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          {[1,2,3,4].map(i=><div key={i} style={{height:14,background:'var(--bg-secondary)',borderRadius:4,marginBottom:16,width:`${60+i*10}%`,animation:'skeleton-pulse 1.5s ease-in-out infinite'}}/>)}
        </div>
        <div className="card">
          {[1,2,3].map(i=><div key={i} style={{height:60,background:'var(--bg-secondary)',borderRadius:8,marginBottom:12,animation:'skeleton-pulse 1.5s ease-in-out infinite'}}/>)}
        </div>
      </div>
    </div>
  );

  if(!lead) return <div className="empty-state"><h3>ליד לא נמצא</h3></div>;

  return (
    <div>
      <div className="page-header">
        <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
          <button className="btn-icon" onClick={()=>nav(-1)}><FiArrowRight/></button>
          <h1 className="page-title">{lead.title}</h1>
          <span className={`badge badge-${lead.status}`}>{lead.status==='tracking'?'מעקב':lead.status==='won'?'WIN':'LOST'}</span>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button className="btn btn-secondary btn-sm" onClick={syncCal}><FiCalendar/> יומן</button>
          <button className="btn btn-secondary btn-sm" onClick={()=>setShowRem(true)}><FiBell/> תזכורת</button>
          <button className="btn btn-primary btn-sm" onClick={()=>setEditing(!editing)}><FiEdit2/> {editing?'ביטול':'ערוך'}</button>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="tabs" style={{marginBottom:16}}>
        <button className={`tab ${activeTab==='details'?'active':''}`} onClick={()=>setActiveTab('details')}>פרטים</button>
        <button className={`tab ${activeTab==='updates'?'active':''}`} onClick={()=>setActiveTab('updates')}>עדכונים</button>
        {contract && <button className={`tab ${activeTab==='contract'?'active':''}`} onClick={()=>setActiveTab('contract')}>📄 חוזה{contract.status==='signed'?' ✓':''}</button>}
      </div>

      <div className="grid-2">
        {/* Left column - visible on desktop always, toggled on mobile */}
        <div style={{display: activeTab==='details'||window.innerWidth>768 ? 'block' : 'none'}} className="lead-detail-col">
          <div className="card">
            <h3 className="card-title" style={{marginBottom:16}}>פרטי אירוע</h3>
            {editing ? (
              <div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">כותרת</label><input className="form-input" value={ef.title||''} onChange={e=>setEf(f=>({...f,title:e.target.value}))}/></div>
                  <div className="form-group"><label className="form-label">סוג</label><select className="form-select" value={ef.eventType||''} onChange={e=>setEf(f=>({...f,eventType:e.target.value}))}>{ETYPES.map(t=><option key={t}>{t}</option>)}</select></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">תאריך</label><input className="form-input" type="date" value={ef.eventDate?ef.eventDate.split('T')[0]:''} onChange={e=>setEf(f=>({...f,eventDate:e.target.value}))}/></div>
                  <div className="form-group"><label className="form-label">לוקיישן</label><input className="form-input" value={ef.location||''} onChange={e=>setEf(f=>({...f,location:e.target.value}))}/></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">בטיפול</label><select className="form-select" value={ef.handler?._id||ef.handler||''} onChange={e=>setEf(f=>({...f,handler:e.target.value}))}><option value="">בחר</option>{handlers.map(h=><option key={h._id} value={h._id}>{h.name}</option>)}</select></div>
                  <div className="form-group"><label className="form-label">מחיר</label><input className="form-input" type="number" value={ef.proposedPrice||''} onChange={e=>setEf(f=>({...f,proposedPrice:e.target.value}))}/></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">איך שמעו</label><input className="form-input" value={ef.howHeardAboutUs||''} onChange={e=>setEf(f=>({...f,howHeardAboutUs:e.target.value}))}/></div>
                  <div className="form-group"><label className="form-label">מי המליץ</label><input className="form-input" value={ef.referredBy||''} onChange={e=>setEf(f=>({...f,referredBy:e.target.value}))}/></div>
                </div>
                <div className="form-group"><label className="form-label">פרטים</label><textarea className="form-textarea" value={ef.eventDetails||''} onChange={e=>setEf(f=>({...f,eventDetails:e.target.value}))}/></div>
                <h4 style={{color:'var(--accent-cyan)',margin:'16px 0 8px'}}>אנשי קשר</h4>
                {ef.contacts?.map((c,i)=>(
                  <div key={i} style={{background:'var(--bg-secondary)',padding:12,borderRadius:8,marginBottom:8,border:'1px solid var(--border)'}}>
                    <div className="form-row"><input className="form-input" placeholder="שם" value={c.fullName} onChange={e=>updContact(i,'fullName',e.target.value)}/><select className="form-select" value={c.relationship} onChange={e=>updContact(i,'relationship',e.target.value)}>{RELS.map(r=><option key={r}>{r}</option>)}</select></div>
                    <div className="form-row" style={{marginTop:8}}><input className="form-input" placeholder="טלפון" value={c.phone} onChange={e=>updContact(i,'phone',e.target.value)}/><input className="form-input" placeholder="אימייל" value={c.email} onChange={e=>updContact(i,'email',e.target.value)}/></div>
                    {ef.contacts.length>1&&<button type="button" className="btn btn-danger btn-sm" style={{marginTop:8}} onClick={()=>rmContact(i)}>הסר</button>}
                  </div>
                ))}
                <button className="btn btn-secondary btn-sm" onClick={addContact}><FiPlus/> הוסף</button>
                <div style={{marginTop:16,display:'flex',gap:8}}><button className="btn btn-primary" onClick={saveLead}>שמור</button><button className="btn btn-secondary" onClick={()=>{setEditing(false);setEf(lead);}}>ביטול</button></div>
              </div>
            ) : (
              <div>
                <div className="grid-2" style={{gap:'12px 24px'}}>
                  {[['סוג',lead.eventType],['תאריך',lead.eventDate?new Date(lead.eventDate).toLocaleDateString('he-IL'):'-'],['לוקיישן',lead.location||'-'],['בטיפול',lead.handler?.name||'-'],['מחיר',lead.proposedPrice?`₪${lead.proposedPrice.toLocaleString()}`:'-'],['מקור',lead.source==='form'?'טופס':'ידני'],['איך שמעו',lead.howHeardAboutUs||'-'],['מי המליץ',lead.referredBy||'-']].map(([l,v]) => (
                    <div key={l}><span className="text-muted" style={{fontSize:'0.8rem'}}>{l}</span><div>{v}</div></div>
                  ))}
                </div>
                {lead.eventDetails&&<div style={{marginTop:16}}><span className="text-muted" style={{fontSize:'0.8rem'}}>פרטים</span><div>{lead.eventDetails}</div></div>}
                <h4 style={{color:'var(--accent-cyan)',margin:'20px 0 8px'}}>אנשי קשר ({lead.contacts?.length||0})</h4>
                {lead.contacts?.map((c,i)=>(
                  <div key={i} style={{background:'var(--bg-secondary)',padding:12,borderRadius:8,marginBottom:8,border:'1px solid var(--border)'}}>
                    <div style={{fontWeight:700}}>{c.fullName} <span className="chip" style={{marginRight:8}}>{c.relationship}</span></div>
                    <div style={{display:'flex',gap:16,marginTop:6,fontSize:'0.9rem',color:'var(--text-secondary)'}}>
                      {c.phone&&<span dir="ltr">📱 {c.phone}</span>}{c.email&&<span>📧 {c.email}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column - updates + contract */}
        <div style={{display: activeTab==='updates'||activeTab==='contract'||window.innerWidth>768 ? 'block' : 'none'}} className="lead-detail-col">
          {/* Contract PDF section */}
          {contract && (activeTab==='contract'||window.innerWidth>768) && (
            <div className="card" style={{marginBottom:16}}>
              <div className="card-header">
                <h3 className="card-title">
                  <FiFileText style={{marginLeft:6,verticalAlign:'middle'}}/>
                  חוזה
                  {contract.status==='signed'&&<span className="badge badge-won" style={{marginRight:8}}>חתום ✓</span>}
                </h3>
                <div style={{display:'flex',gap:8}}>
                  {contract.pdfUrl && (
                    <>
                      <button className="btn btn-secondary btn-sm" onClick={()=>setShowPdf(v=>!v)}>
                        {showPdf ? 'סגור' : '👁 הצג PDF'}
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={downloadPdf}>
                        <FiDownload/> הורד
                      </button>
                    </>
                  )}
                  <a href={`/contract/${contract.linkToken}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                    <FiExternalLink/> פתח
                  </a>
                </div>
              </div>

              {contract.status==='signed' && (
                <div style={{padding:'10px 14px',background:'var(--success-dim)',borderRadius:8,fontSize:'0.85rem',color:'var(--success)',marginBottom:8}}>
                  ✅ נחתם ע"י <strong>{contract.signerName}</strong>
                  {contract.signedAt && ` • ${new Date(contract.signedAt).toLocaleDateString('he-IL')}`}
                </div>
              )}

              {/* PDF Embedded Viewer */}
              {showPdf && contract.pdfUrl && (
                <div style={{marginTop:12,border:'1px solid var(--border)',borderRadius:8,overflow:'hidden',background:'#f5f5f5'}}>
                  {contract.pdfUrl.startsWith('data:application/pdf') ? (
                    <iframe
                      src={contract.pdfUrl}
                      title="חוזה PDF"
                      style={{width:'100%',height:600,border:'none'}}
                    />
                  ) : (
                    <iframe
                      src={`data:application/pdf;base64,${contract.pdfUrl}`}
                      title="חוזה PDF"
                      style={{width:'100%',height:600,border:'none'}}
                    />
                  )}
                </div>
              )}

              {!contract.pdfUrl && contract.status==='signed' && (
                <p style={{color:'var(--text-muted)',fontSize:'0.85rem',marginTop:8}}>
                  PDF לא זמין לחוזה זה (נחתם לפני עדכון המערכת)
                </p>
              )}

              <div style={{marginTop:12,fontSize:'0.82rem',color:'var(--text-muted)',display:'flex',gap:16,flexWrap:'wrap'}}>
                <span>סטטוס: <strong style={{color:'var(--text-primary)'}}>{contract.status}</strong></span>
                {contract.totalPrice>0&&<span>מחיר: <strong style={{color:'var(--accent-gold)'}}>₪{contract.totalPrice.toLocaleString()}</strong></span>}
              </div>
            </div>
          )}

          {/* Updates */}
          {(activeTab==='updates'||window.innerWidth>768) && (
            <div className="card" style={{marginBottom:16}}>
              <h3 className="card-title" style={{marginBottom:16}}>עדכונים / Timeline</h3>
              <div style={{display:'flex',gap:8,marginBottom:16}}>
                <select className="form-select" style={{width:'auto',minWidth:100}} value={uType} onChange={e=>setUType(e.target.value)}>
                  <option value="note">📝 הערה</option><option value="call">📞 שיחה</option><option value="meeting">🤝 פגישה</option><option value="email">📧 מייל</option>
                </select>
                <input className="form-input" placeholder="כתוב עדכון..." value={newUpdate} onChange={e=>setNewUpdate(e.target.value)} onKeyDown={e=>e.key==='Enter'&&postUpdate()}/>
                <button className="btn btn-primary btn-sm" onClick={postUpdate}><FiSend/></button>
              </div>
              <div style={{maxHeight:400,overflowY:'auto'}}>
                {updates.length===0?<p style={{color:'var(--text-muted)',textAlign:'center',padding:20}}>אין עדכונים</p>:
                updates.map(u=>(
                  <div key={u._id} style={{padding:12,borderRight:`3px solid ${u.type==='status_change'?'var(--accent-gold)':u.type==='system'?'var(--accent-cyan)':'var(--border-light)'}`,marginBottom:8,background:'var(--bg-secondary)',borderRadius:'0 8px 8px 0'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{fontWeight:700,fontSize:'0.85rem'}}>{u.userName||'מערכת'}</span>
                      <span style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>{new Date(u.createdAt).toLocaleDateString('he-IL')} {new Date(u.createdAt).toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'})}</span>
                    </div>
                    <div style={{fontSize:'0.9rem'}}>{u.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header"><h3 className="card-title">תזכורות</h3><button className="btn btn-secondary btn-sm" onClick={()=>setShowRem(true)}><FiPlus/></button></div>
            {reminders.length===0?<p style={{color:'var(--text-muted)',fontSize:'0.9rem'}}>אין תזכורות</p>:
            reminders.map(r=>(
              <div key={r._id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:10,background:'var(--bg-secondary)',borderRadius:8,marginBottom:8,border:`1px solid ${r.status==='completed'?'var(--success)':'var(--border)'}`,opacity:r.status==='completed'?0.6:1}}>
                <div><div style={{fontWeight:600,fontSize:'0.9rem'}}>{r.message}</div><div style={{fontSize:'0.8rem',color:'var(--text-muted)',marginTop:4}}>{new Date(r.dueDate).toLocaleDateString('he-IL')} • {r.type==='email'?'📧':r.type==='whatsapp'?'💬':'🔔'} {r.handlerId?.name||''}</div></div>
                <div style={{display:'flex',gap:4}}>
                  {r.status!=='completed'&&<button className="btn-icon" style={{color:'var(--success)'}} onClick={async()=>{await api.patch(`/reminders/${r._id}/complete`);fetchAll();}}>✓</button>}
                  <button className="btn-icon" style={{color:'var(--error)'}} onClick={async()=>{await api.delete(`/reminders/${r._id}`);fetchAll();}}><FiTrash2/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showRem&&(
        <div className="modal-overlay" onClick={()=>setShowRem(false)}>
          <div className="modal" style={{maxWidth:400}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">תזכורת חדשה</h2><button className="modal-close" onClick={()=>setShowRem(false)}>✕</button></div>
            <form onSubmit={createRem}>
              <div className="form-group"><label className="form-label">הודעה *</label><input className="form-input" required value={rf.message} onChange={e=>setRf(f=>({...f,message:e.target.value}))}/></div>
              <div className="form-group"><label className="form-label">תאריך *</label><input className="form-input" type="datetime-local" required value={rf.dueDate} onChange={e=>setRf(f=>({...f,dueDate:e.target.value}))}/></div>
              <div className="form-group"><label className="form-label">סוג</label><select className="form-select" value={rf.type} onChange={e=>setRf(f=>({...f,type:e.target.value}))}><option value="notification">🔔 נוטיפיקציה</option><option value="email">📧 מייל</option><option value="whatsapp">💬 וואטסאפ</option></select></div>
              <div className="form-group"><label className="form-label">מטפל</label><select className="form-select" value={rf.handlerId} onChange={e=>setRf(f=>({...f,handlerId:e.target.value}))}><option value="">בחר</option>{handlers.map(h=><option key={h._id} value={h._id}>{h.name}</option>)}</select></div>
              <div className="modal-footer"><button type="submit" className="btn btn-primary">צור</button><button type="button" className="btn btn-secondary" onClick={()=>setShowRem(false)}>ביטול</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadDetail;
