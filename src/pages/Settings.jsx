import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { FiPlus, FiEdit2, FiTrash2, FiStar, FiSave, FiImage, FiX } from 'react-icons/fi';

const Settings = () => {
  const [handlers, setHandlers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name:'', phone:'', email:'', isDefault:false });
  const [formConfig, setFormConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const logoRef = useRef();

  // Band Signatures state
  const [sigName, setSigName] = useState('');
  const [sigRole, setSigRole] = useState('');
  const [showSigPad, setShowSigPad] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [addingSig, setAddingSig] = useState(false);
  const sigCanvasRef = useRef();

  useEffect(() => { fetchHandlers(); fetchFormConfig(); }, []);

  const fetchHandlers = async () => { try { const {data}=await api.get('/handlers'); setHandlers(data); } catch(e){} };
  const fetchFormConfig = async () => { try { const {data}=await api.get('/forms/config'); setFormConfig(data); } catch(e){} };

  const submitHandler = async (e) => {
    e.preventDefault();
    if(editId) await api.put(`/handlers/${editId}`, form);
    else await api.post('/handlers', form);
    setShowModal(false); setEditId(null); setForm({name:'',phone:'',email:'',isDefault:false}); fetchHandlers();
  };

  const editH = (h) => { setEditId(h._id); setForm({name:h.name,phone:h.phone,email:h.email,isDefault:h.isDefault}); setShowModal(true); };
  const delH = async (id) => { if(!confirm('להסיר?')) return; await api.delete(`/handlers/${id}`); fetchHandlers(); };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFormConfig(f=>({...f, logoUrl:reader.result}));
    reader.readAsDataURL(file);
  };

  const saveFormConfig = async () => {
    setSaving(true);
    try {
      await api.put('/forms/config', formConfig);
      setSaved(true);
      setTimeout(()=>setSaved(false), 2000);
    } catch(e){ alert('שגיאה'); }
    finally { setSaving(false); }
  };

  // ── Signature pad handlers ──
  const startSigDraw = (e) => {
    const canvas = sigCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.beginPath(); ctx.moveTo(x, y); setIsDrawing(true);
  };
  const drawSig = (e) => {
    if (!isDrawing) return; e.preventDefault();
    const canvas = sigCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = '#1a1a2e';
    ctx.lineTo(x, y); ctx.stroke();
  };
  const stopSigDraw = () => setIsDrawing(false);
  const clearSigPad = () => { const c = sigCanvasRef.current; c.getContext('2d').clearRect(0,0,c.width,c.height); };

  const saveBandSig = async () => {
    if (!sigName.trim()) { alert('נא להזין שם'); return; }
    const canvas = sigCanvasRef.current;
    const blank = document.createElement('canvas');
    blank.width = canvas.width; blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) { alert('נא לחתום'); return; }
    setAddingSig(true);
    try {
      const { data } = await api.post('/forms/config/band-signatures', {
        name: sigName, role: sigRole, signatureUrl: canvas.toDataURL()
      });
      setFormConfig(f => ({ ...f, bandSignatures: data }));
      setSigName(''); setSigRole(''); setShowSigPad(false); clearSigPad();
    } catch(e) { alert('שגיאה בשמירה'); }
    finally { setAddingSig(false); }
  };

  const deleteBandSig = async (sigId) => {
    if (!confirm('למחוק חתימה זו?')) return;
    const { data } = await api.delete(`/forms/config/band-signatures/${sigId}`);
    setFormConfig(f => ({ ...f, bandSignatures: data }));
  };

  return (
    <div>
      <div className="page-header"><h1 className="page-title">הגדרות</h1></div>

      {/* Logo & Branding */}
      {formConfig && (
        <div className="card" style={{marginBottom:24}}>
          <div className="card-header">
            <h3 className="card-title">לוגו ומיתוג</h3>
            <button className="btn btn-primary btn-sm" onClick={saveFormConfig} disabled={saving}>
              <FiSave/> {saved?'נשמר ✓':saving?'שומר...':'שמור'}
            </button>
          </div>
          <div className="grid-2" style={{alignItems:'start'}}>
            {/* Logo Upload */}
            <div>
              <label className="form-label">לוגו הלהקה (מוצג בחוזה ובטופס)</label>
              <div style={{position:'relative',cursor:'pointer'}} onClick={()=>logoRef.current?.click()}>
                {formConfig.logoUrl ? (
                  <div style={{position:'relative',height:140,background:'rgba(255,255,255,0.03)',borderRadius:10,overflow:'hidden',border:'2px solid var(--accent-gold)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <img src={formConfig.logoUrl} alt="logo" style={{maxHeight:120,maxWidth:'100%',objectFit:'contain'}}/>
                    <button type="button"
                      style={{position:'absolute',top:8,left:8,background:'rgba(0,0,0,0.7)',border:'none',color:'#fff',borderRadius:'50%',width:28,height:28,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}
                      onClick={e=>{e.stopPropagation();setFormConfig(f=>({...f,logoUrl:''}));}}>
                      <FiX/>
                    </button>
                  </div>
                ):(
                  <div style={{height:140,border:'2px dashed var(--border)',borderRadius:10,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,color:'var(--text-muted)',transition:'all 0.2s'}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent-gold)';e.currentTarget.style.background='var(--accent-gold-dim)'}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='transparent'}}>
                    <FiImage style={{fontSize:32}}/>
                    <span style={{fontSize:'0.85rem'}}>לחץ להעלאת לוגו</span>
                    <span style={{fontSize:'0.75rem',opacity:0.6}}>PNG / JPG / SVG</span>
                  </div>
                )}
              </div>
              <input ref={logoRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleLogoChange}/>
              <p style={{color:'var(--text-muted)',fontSize:'0.8rem',marginTop:8}}>הלוגו יופיע בחוזה הדיגיטלי ובטופס הפנייה</p>
            </div>
            
            {/* Form Settings */}
            <div>
              <div className="form-group"><label className="form-label">כותרת הטופס</label><input className="form-input" value={formConfig.title||''} onChange={e=>setFormConfig(f=>({...f,title:e.target.value}))}/></div>
              <div className="form-group"><label className="form-label">כותרת משנה</label><input className="form-input" value={formConfig.subtitle||''} onChange={e=>setFormConfig(f=>({...f,subtitle:e.target.value}))}/></div>
              <div className="form-group"><label className="form-label">הודעת תודה</label><input className="form-input" value={formConfig.thankYouMessage||''} onChange={e=>setFormConfig(f=>({...f,thankYouMessage:e.target.value}))}/></div>
            </div>
          </div>
          
          <div style={{marginTop:16,padding:'12px 16px',background:'var(--bg-secondary)',borderRadius:8}}>
            <p style={{color:'var(--text-secondary)',fontSize:'0.85rem',marginBottom:8}}>קישור לטופס:</p>
            <a href="/form" target="_blank" style={{color:'var(--accent-cyan)',fontSize:'0.9rem',fontWeight:600}}>{window.location.origin}/form</a>
          </div>
          
          <div className="form-row" style={{marginTop:16}}>
            <div className="form-group"><label className="form-label">צבע רקע</label><input className="form-input" type="color" value={formConfig.backgroundColor||'#0a0a0a'} onChange={e=>setFormConfig(f=>({...f,backgroundColor:e.target.value}))}/></div>
            <div className="form-group"><label className="form-label">צבע אקסנט</label><input className="form-input" type="color" value={formConfig.accentColor||'#EAB21B'} onChange={e=>setFormConfig(f=>({...f,accentColor:e.target.value}))}/></div>
          </div>
        </div>
      )}

      {/* ── BAND SIGNATURES ── */}
      {formConfig && (
        <div className="card" style={{marginBottom:24}}>
          <div className="card-header">
            <h3 className="card-title">✍️ חתימות נציגי הלהקה</h3>
            <button className="btn btn-primary btn-sm" onClick={()=>setShowSigPad(true)}>
              <FiPlus/> הוסף חתימה
            </button>
          </div>
          <p style={{color:'var(--text-muted)',fontSize:'0.85rem',marginBottom:16}}>
            החתימות שמוגדרות כאן יופיעו בחוזה בסקשיין "נציגי הלהקה". בכל חוזה תוכל לבחור אילו חתימות לצרף.
          </p>

          {/* Existing signatures grid */}
          {(formConfig.bandSignatures || []).length === 0 ? (
            <div style={{textAlign:'center',padding:'32px 16px',border:'2px dashed var(--border)',borderRadius:10,color:'var(--text-muted)'}}>
              <div style={{fontSize:'2.5rem',marginBottom:8}}>✍️</div>
              <p>אין עדיין חתימות. לחץ על "הוסף חתימה" כדי להוסיף את הראשונה.</p>
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:16}}>
              {(formConfig.bandSignatures || []).map(sig => (
                <div key={sig._id} style={{background:'var(--bg-secondary)',borderRadius:10,padding:16,border:'1px solid var(--border)',position:'relative'}}>
                  <button onClick={()=>deleteBandSig(sig._id)}
                    style={{position:'absolute',top:8,left:8,background:'rgba(192,57,43,0.15)',border:'none',color:'#e74c3c',borderRadius:'50%',width:26,height:26,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.8rem'}}>
                    <FiTrash2/>
                  </button>
                  <div style={{textAlign:'center',marginBottom:8}}>
                    <img src={sig.signatureUrl} alt={sig.name}
                      style={{width:'100%',height:70,objectFit:'contain',background:'#fff',borderRadius:6,border:'1px solid var(--border)',padding:4}}/>
                  </div>
                  <div style={{fontWeight:700,color:'var(--text-primary)',fontSize:'0.9rem',textAlign:'center'}}>{sig.name}</div>
                  {sig.role && <div style={{color:'var(--text-muted)',fontSize:'0.78rem',textAlign:'center',marginTop:2}}>{sig.role}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Handlers */}
      <div className="card" style={{marginBottom:24}}>
        <div className="card-header">
          <h3 className="card-title">אנשי מכירות / מטפלים</h3>
          <button className="btn btn-primary btn-sm" onClick={()=>{setEditId(null);setForm({name:'',phone:'',email:'',isDefault:false});setShowModal(true);}}><FiPlus/> הוסף</button>
        </div>
        {handlers.length===0?<p style={{color:'var(--text-muted)'}}>אין מטפלים</p>:(
          <div className="table-container">
            <table>
              <thead><tr><th>שם</th><th>טלפון</th><th>אימייל</th><th>ברירת מחדל</th><th>פעולות</th></tr></thead>
              <tbody>
                {handlers.map(h=>(
                  <tr key={h._id}>
                    <td style={{fontWeight:700}}>{h.name}</td>
                    <td dir="ltr">{h.phone}</td>
                    <td>{h.email}</td>
                    <td>{h.isDefault?<FiStar style={{color:'var(--accent-gold)'}}/>:'-'}</td>
                    <td><div style={{display:'flex',gap:4}}>
                      <button className="btn-icon" onClick={()=>editH(h)}><FiEdit2/></button>
                      <button className="btn-icon" style={{color:'var(--error)'}} onClick={()=>delH(h._id)}><FiTrash2/></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Handler Modal */}
      {showModal&&(
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal" style={{maxWidth:400}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">{editId?'ערוך':'מטפל חדש'}</h2><button className="modal-close" onClick={()=>setShowModal(false)}>✕</button></div>
            <form onSubmit={submitHandler}>
              <div className="form-group"><label className="form-label">שם *</label><input className="form-input" required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
              <div className="form-group"><label className="form-label">טלפון</label><input className="form-input" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/></div>
              <div className="form-group"><label className="form-label">אימייל</label><input className="form-input" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></div>
              <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                <input type="checkbox" checked={form.isDefault} onChange={e=>setForm(f=>({...f,isDefault:e.target.checked}))} style={{accentColor:'var(--accent-gold)'}}/>
                <span>ברירת מחדל</span>
              </label>
              <div className="modal-footer"><button type="submit" className="btn btn-primary">{editId?'שמור':'צור'}</button><button type="button" className="btn btn-secondary" onClick={()=>setShowModal(false)}>ביטול</button></div>
            </form>
          </div>
        </div>
      )}

      {/* ── Signature Pad Modal ── */}
      {showSigPad && (
        <div className="modal-overlay" style={{zIndex:1100}} onClick={()=>setShowSigPad(false)}>
          <div className="modal" style={{maxWidth:460}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">✍️ הוספת חתימה חדשה</h2>
              <button className="modal-close" onClick={()=>setShowSigPad(false)}>✕</button>
            </div>
            <div style={{padding:'0 0 16px'}}>
              <div className="form-row" style={{marginBottom:12}}>
                <div className="form-group">
                  <label className="form-label">שם *</label>
                  <input className="form-input" value={sigName} onChange={e=>setSigName(e.target.value)} placeholder="שם שם חתן"/>
                </div>
                <div className="form-group">
                  <label className="form-label">תפקיד</label>
                  <input className="form-input" value={sigRole} onChange={e=>setSigRole(e.target.value)} placeholder="מנהל, מוסיקאי..."/>
                </div>
              </div>
              <p style={{color:'var(--text-muted)',fontSize:'0.82rem',marginBottom:10,textAlign:'center'}}>חתמו בתוך המסגרת</p>
              <canvas ref={sigCanvasRef} width={400} height={120}
                style={{border:'2px solid var(--border)',borderRadius:10,background:'#fff',cursor:'crosshair',touchAction:'none',display:'block',width:'100%'}}
                onMouseDown={startSigDraw} onMouseMove={drawSig} onMouseUp={stopSigDraw} onMouseLeave={stopSigDraw}
                onTouchStart={startSigDraw} onTouchMove={drawSig} onTouchEnd={stopSigDraw}/>
              <div style={{textAlign:'center',marginTop:8}}>
                <button onClick={clearSigPad} className="btn btn-secondary btn-sm">נקה</button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={saveBandSig} disabled={addingSig}>
                {addingSig ? 'שומר...' : '✓ שמור חתימה'}
              </button>
              <button className="btn btn-secondary" onClick={()=>setShowSigPad(false)}>ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

