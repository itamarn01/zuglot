import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { FiPlus, FiLink, FiEye, FiSend, FiFileText, FiEdit2, FiTrash2, FiSearch, FiX } from 'react-icons/fi';

const ContractSkeleton = () => (
  <tr>
    {[1,2,3,4,5,6].map(i=>(
      <td key={i}><div style={{height:16,background:'var(--bg-secondary)',borderRadius:4,animation:'skeleton-pulse 1.5s ease-in-out infinite'}}/></td>
    ))}
  </tr>
);

const emptyForm = {
  leadId:'', packageId:'', packageName:'', ordererName:'', ordererIdNumber:'', ordererAddress:'', ordererPhone:'',
  groomName:'', brideName:'', eventDate:'', eventLocation:'', performanceDuration: 4.5,
  products:[], basePrice:0, discount:0, totalPrice:'', advancePayment:'', specialNotes:'', contractTerms:''
};

const Contracts = () => {
  const [contracts, setContracts] = useState([]);
  const [leads, setLeads] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [params] = useSearchParams();
  const [form, setForm] = useState(emptyForm);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadDropdownOpen, setLeadDropdownOpen] = useState(false);
  const leadSearchRef = useRef();
  const [copiedId, setCopiedId] = useState(null);
  const [availableSignatures, setAvailableSignatures] = useState([]);
  const [selectedSigIds, setSelectedSigIds] = useState([]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [c,l,pk,cfg] = await Promise.all([api.get('/contracts'), api.get('/leads'), api.get('/packages'), api.get('/forms/config')]);
      setContracts(c.data); setLeads(l.data); setPackages(pk.data);
      const sigs = cfg.data?.bandSignatures || [];
      setAvailableSignatures(sigs);
      setSelectedSigIds(sigs.map(s=>s._id)); // default: all selected
      const lid = params.get('leadId');
      if(lid) { prefillFromLead(lid, l.data); setShowModal(true); }
    } catch(e){} finally { setLoading(false); }
  };

  const prefillFromLead = (lid, leadsData) => {
    const lead = (leadsData||leads).find(l=>l._id===lid);
    if(!lead) return;
    const groom = lead.contacts?.find(c=>c.relationship==='חתן');
    const bride = lead.contacts?.find(c=>c.relationship==='כלה');
    const orderer = lead.contacts?.[0];
    setLeadSearch(lead.title || '');
    setForm(f=>({...f, leadId:lid, groomName:groom?.fullName||'', brideName:bride?.fullName||'',
      ordererName:orderer?.fullName||'', ordererPhone:orderer?.phone||'',
      eventDate:lead.eventDate?lead.eventDate.split('T')[0]:'', eventLocation:lead.location||'',
      totalPrice:lead.proposedPrice||''}));
  };

  const selectPackage = (pkgId) => {
    const pkg = packages.find(p=>p._id===pkgId);
    if(!pkg) return;
    const base = pkg.basePrice || pkg.totalPrice || 0;
    setForm(f=>{
      const disc = f.discount || 0;
      return {
        ...f,
        packageId:pkgId, packageName:pkg.name,
        products: pkg.products.map(pp=>({
          product:pp.product?._id, name:pp.product?.name||'', price:pp.customPrice||0,
          imageUrl:pp.product?.imageUrl||'', isOptional:pp.isOptional||false, isSelected:!pp.isOptional
        })),
        basePrice: base,
        totalPrice: base - disc,
      };
    });
  };

  const calcFinalPrice = (base, discount) => Math.max(0, (Number(base)||0) - (Number(discount)||0));

  const handleDiscountChange = (val) => {
    const disc = Number(val)||0;
    const base = Number(form.basePrice)||Number(form.totalPrice)||0;
    setForm(f=>({...f, discount:disc, totalPrice: calcFinalPrice(base, disc)}));
  };

  const submit = async (e) => {
    e.preventDefault();
    const chosenSigs = availableSignatures.filter(s => selectedSigIds.includes(s._id));
    const payload = {
      ...form,
      basePrice: Number(form.basePrice)||0,
      discount: Number(form.discount)||0,
      totalPrice: Number(form.totalPrice)||0,
      advancePayment: Number(form.advancePayment)||0,
      bandSignatures: chosenSigs.map(s => ({ name: s.name, role: s.role, signatureUrl: s.signatureUrl }))
    };
    if(editId) await api.put(`/contracts/${editId}`, payload);
    else await api.post('/contracts', payload);
    closeModal(); fetchAll();
  };

  const closeModal = () => {
    setShowModal(false); setEditId(null);
    setForm(emptyForm); setLeadSearch('');
  };

  const startEdit = (c) => {
    if(c.status !== 'draft') return alert('ניתן לערוך רק חוזים בסטטוס טיוטה');
    setEditId(c._id);
    const lead = leads.find(l=>l._id===c.leadId?._id||c.leadId);
    setLeadSearch(lead?.title||c.leadId?.title||'');
    setForm({
      leadId:c.leadId?._id||c.leadId||'',
      packageId:c.packageId?._id||c.packageId||'',
      packageName:c.packageName||'',
      ordererName:c.ordererName||'', ordererIdNumber:c.ordererIdNumber||'',
      ordererAddress:c.ordererAddress||'', ordererPhone:c.ordererPhone||'',
      groomName:c.groomName||'', brideName:c.brideName||'',
      eventDate:c.eventDate?c.eventDate.split('T')[0]:'',
      eventLocation:c.eventLocation||'',
      performanceDuration:c.performanceDuration||4.5,
      products:c.products||[], basePrice:c.basePrice||c.totalPrice||0,
      discount:c.discount||0, totalPrice:c.totalPrice||0,
      advancePayment:c.advancePayment||0,
      specialNotes:c.specialNotes||'', contractTerms:c.contractTerms||''
    });
    setShowModal(true);
    // pre-select existing band signatures
    if (c.bandSignatures && c.bandSignatures.length > 0) {
      const matchedIds = availableSignatures
        .filter(s => c.bandSignatures.some(cs => cs.name === s.name))
        .map(s => s._id);
      setSelectedSigIds(matchedIds.length ? matchedIds : availableSignatures.map(s => s._id));
    } else {
      setSelectedSigIds(availableSignatures.map(s => s._id));
    }
  };

  const deleteContract = async (id) => {
    if(!confirm('למחוק חוזה זה?')) return;
    await api.delete(`/contracts/${id}`);
    fetchAll();
  };

  const copyLink = (token, id) => {
    navigator.clipboard.writeText(`${window.location.origin}/contract/${token}`);
    setCopiedId(id);
    setTimeout(()=>setCopiedId(null), 2000);
  };

  const sendContract = async (id) => {
    await api.patch(`/contracts/${id}/send`); fetchAll();
  };

  const filteredLeads = leads.filter(l=>
    l.title?.toLowerCase().includes(leadSearch.toLowerCase()) ||
    l.contacts?.[0]?.fullName?.toLowerCase().includes(leadSearch.toLowerCase()) ||
    l.contacts?.[0]?.phone?.includes(leadSearch)
  );

  const includedProds = form.products.filter(p=>!p.isOptional);
  const optionalProds = form.products.filter(p=>p.isOptional);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">חוזים</h1>
        <button className="btn btn-primary" onClick={()=>{closeModal();setShowModal(true);}}>
          <FiPlus/> חוזה חדש
        </button>
      </div>

      {loading ? (
        <div className="table-container">
          <table><thead><tr><th>ליד</th><th>חבילה</th><th>סכום</th><th>סטטוס</th><th>נוצר</th><th>פעולות</th></tr></thead>
          <tbody>{[1,2,3,4].map(i=><ContractSkeleton key={i}/>)}</tbody></table>
        </div>
      ) : contracts.length===0 ? (
        <div className="empty-state"><div className="icon"><FiFileText/></div><h3>אין חוזים</h3></div>
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>ליד</th><th>חבילה</th><th>בסיס</th><th>הנחה</th><th>סופי</th><th>סטטוס</th><th>נוצר</th><th>פעולות</th></tr></thead>
            <tbody>
              {contracts.map(c=>(
                <tr key={c._id}>
                  <td style={{fontWeight:700}}>{c.leadId?.title||'-'}</td>
                  <td>{c.packageName||'-'}</td>
                  <td>{c.basePrice>0?`₪${c.basePrice?.toLocaleString()}`:'-'}</td>
                  <td>{c.discount>0?<span style={{color:'var(--error)'}}>-₪{c.discount?.toLocaleString()}</span>:'-'}</td>
                  <td style={{fontWeight:700,color:'var(--accent-gold)'}}>₪{c.totalPrice?.toLocaleString()}</td>
                  <td><span className={`badge badge-${c.status}`}>{{draft:'טיוטה',sent:'נשלח',viewed:'נצפה',signed:'חתום'}[c.status]}</span></td>
                  <td>{new Date(c.createdAt).toLocaleDateString('he-IL')}</td>
                  <td>
                    <div style={{display:'flex',gap:4}}>
                      <button className="btn-icon" title={copiedId===c._id?"הועתק!":"העתק קישור"} 
                        style={{color:copiedId===c._id?'var(--success)':undefined}}
                        onClick={()=>copyLink(c.linkToken, c._id)}><FiLink/></button>
                      <button className="btn-icon" title="צפה" onClick={()=>window.open(`/contract/${c.linkToken}`,'_blank')}><FiEye/></button>
                      {c.status==='draft'&&<>
                        <button className="btn-icon" style={{color:'var(--accent-cyan)'}} title="שלח" onClick={()=>sendContract(c._id)}><FiSend/></button>
                        <button className="btn-icon" style={{color:'var(--accent-gold)'}} title="ערוך" onClick={()=>startEdit(c)}><FiEdit2/></button>
                        <button className="btn-icon" style={{color:'var(--error)'}} title="מחק" onClick={()=>deleteContract(c._id)}><FiTrash2/></button>
                      </>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal&&(
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{maxWidth:700}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editId?'ערוך חוזה':'חוזה חדש'}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={submit}>
              <div className="form-row">
                {/* Lead Search */}
                <div className="form-group" style={{position:'relative'}}>
                  <label className="form-label">ליד *</label>
                  <div style={{position:'relative'}}>
                    <FiSearch style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)',pointerEvents:'none'}}/>
                    <input className="form-input" style={{paddingRight:36}}
                      placeholder="חיפוש ליד לפי שם, איש קשר..."
                      value={leadSearch}
                      onChange={e=>{setLeadSearch(e.target.value);setLeadDropdownOpen(true);}}
                      onFocus={()=>setLeadDropdownOpen(true)}
                      ref={leadSearchRef}
                    />
                    {leadSearch&&<button type="button" style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer'}} onClick={()=>{setLeadSearch('');setForm(f=>({...f,leadId:''}));}}><FiX/></button>}
                  </div>
                  {leadDropdownOpen&&leadSearch&&(
                    <div style={{position:'absolute',top:'100%',right:0,left:0,zIndex:100,background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,boxShadow:'var(--shadow-lg)',maxHeight:220,overflowY:'auto'}}>
                      {filteredLeads.length===0?<div style={{padding:12,color:'var(--text-muted)',textAlign:'center'}}>לא נמצאו לידים</div>:
                        filteredLeads.map(l=>(
                          <div key={l._id} style={{padding:'10px 14px',cursor:'pointer',borderBottom:'1px solid var(--border)',transition:'background 0.15s',display:'flex',justifyContent:'space-between',alignItems:'center'}}
                            onMouseEnter={e=>e.currentTarget.style.background='var(--bg-secondary)'}
                            onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                            onClick={()=>{setLeadSearch(l.title);setForm(f=>({...f,leadId:l._id}));prefillFromLead(l._id,leads);setLeadDropdownOpen(false);}}>
                            <span style={{fontWeight:600}}>{l.title}</span>
                            <span style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{l.contacts?.[0]?.phone||''}</span>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>

                <div className="form-group"><label className="form-label">חבילה</label>
                  <select className="form-select" value={form.packageId} onChange={e=>selectPackage(e.target.value)}>
                    <option value="">בחר חבילה</option>
                    {packages.map(p=><option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <h4 style={{color:'var(--accent-cyan)',margin:'12px 0 8px'}}>פרטי מזמין</h4>
              <div className="form-row">
                <div className="form-group"><label className="form-label">שם</label><input className="form-input" value={form.ordererName} onChange={e=>setForm(f=>({...f,ordererName:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">ת.ז</label><input className="form-input" value={form.ordererIdNumber} onChange={e=>setForm(f=>({...f,ordererIdNumber:e.target.value}))}/></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">כתובת</label><input className="form-input" value={form.ordererAddress} onChange={e=>setForm(f=>({...f,ordererAddress:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">טלפון</label><input className="form-input" value={form.ordererPhone} onChange={e=>setForm(f=>({...f,ordererPhone:e.target.value}))}/></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">שם חתן</label><input className="form-input" value={form.groomName} onChange={e=>setForm(f=>({...f,groomName:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">שם כלה</label><input className="form-input" value={form.brideName} onChange={e=>setForm(f=>({...f,brideName:e.target.value}))}/></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">תאריך</label><input className="form-input" type="date" value={form.eventDate} onChange={e=>setForm(f=>({...f,eventDate:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">מיקום</label><input className="form-input" value={form.eventLocation} onChange={e=>setForm(f=>({...f,eventLocation:e.target.value}))}/></div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">זמן נגינה (שעות)</label>
                  <input className="form-input" type="number" step="0.5" min="0.5" max="12" value={form.performanceDuration}
                    onChange={e=>setForm(f=>({...f,performanceDuration:parseFloat(e.target.value)||4.5}))}/>
                  <div style={{fontSize:'0.78rem',color:'var(--text-muted)',marginTop:3}}>ברירת מחדל: 4.5 שעות</div>
                </div>
              </div>

              {/* Pricing Section */}
              <h4 style={{color:'var(--accent-cyan)',margin:'12px 0 8px'}}>מחיר</h4>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">מחיר חבילה (₪)</label>
                  <input className="form-input" type="number" value={form.basePrice||form.totalPrice} 
                    onChange={e=>{const base=Number(e.target.value);setForm(f=>({...f,basePrice:base,totalPrice:calcFinalPrice(base,f.discount)}));}}/>
                </div>
                <div className="form-group">
                  <label className="form-label">הנחה (₪)</label>
                  <input className="form-input" type="number" min="0" value={form.discount||''} 
                    placeholder="0" onChange={e=>handleDiscountChange(e.target.value)}/>
                </div>
              </div>
              <div style={{padding:'10px 14px',background:'linear-gradient(135deg,var(--bg-secondary),var(--bg-card))',borderRadius:8,marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{color:'var(--text-secondary)'}}>מחיר סופי:</span>
                <span style={{fontSize:'1.4rem',fontWeight:800,color:'var(--accent-gold)'}}>₪{(Number(form.totalPrice)||0).toLocaleString()}</span>
              </div>
              <div className="form-group"><label className="form-label">מקדמה (₪)</label><input className="form-input" type="number" value={form.advancePayment} onChange={e=>setForm(f=>({...f,advancePayment:e.target.value}))}/></div>
              
              {/* Products Summary */}
              {includedProds.length>0&&(
                <div>
                  <h4 style={{color:'var(--accent-cyan)',margin:'12px 0 6px'}}>מוצרים כלולים</h4>
                  {includedProds.map((p,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:8,background:'var(--bg-secondary)',borderRadius:6,marginBottom:4}}>
                      <span>{p.name}</span><span style={{color:'var(--accent-gold)'}}>₪{p.price?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
              {optionalProds.length>0&&(
                <div>
                  <h4 style={{color:'var(--warning)',margin:'12px 0 6px'}}>תוספות אופציונליות (ניתן לשנות מחיר)</h4>
                  {optionalProds.map((p,i)=>{
                    const globalIdx = form.products.findIndex((fp,fi)=>fp.isOptional&&form.products.filter(x=>x.isOptional).indexOf(fp)===i);
                    const realIdx = form.products.indexOf(p);
                    return (
                      <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 10px',background:'rgba(255,152,0,0.05)',border:'1px dashed var(--warning)',borderRadius:6,marginBottom:4,gap:12}}>
                        <span style={{flex:1,color:'var(--text-primary)'}}>{p.name}</span>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <span style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>₪</span>
                          <input type="number" min="0"
                            style={{width:90,padding:'4px 8px',background:'var(--bg-secondary)',border:'1px solid var(--warning)',borderRadius:6,color:'var(--text-primary)',fontSize:'0.9rem',textAlign:'center'}}
                            value={p.price||0}
                            onChange={e=>{
                              const newProducts=[...form.products];
                              newProducts[realIdx]={...newProducts[realIdx],price:Number(e.target.value)||0};
                              setForm(f=>({...f,products:newProducts}));
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="form-group" style={{marginTop:16}}><label className="form-label">הערות מיוחדות</label><textarea className="form-textarea" value={form.specialNotes} onChange={e=>setForm(f=>({...f,specialNotes:e.target.value}))}/></div>

              {/* ── Band Signatures Selection ── */}
              {availableSignatures.length > 0 && (
                <div style={{marginTop:16}}>
                  <label className="form-label" style={{marginBottom:8,display:'block'}}>
                    ✍️ חתימות להקה בחוזה
                    <span style={{fontSize:'0.78rem',color:'var(--text-muted)',fontWeight:400,marginRight:8}}>
                      בחר אילו חתימות יופיעו בחוזה זה
                    </span>
                  </label>
                  <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                    {availableSignatures.map(sig => {
                      const isSelected = selectedSigIds.includes(sig._id);
                      return (
                        <div key={sig._id}
                          onClick={() => setSelectedSigIds(prev =>
                            isSelected ? prev.filter(id=>id!==sig._id) : [...prev, sig._id]
                          )}
                          style={{
                            cursor:'pointer', padding:'10px 14px', borderRadius:10, minWidth:130,
                            border:`2px solid ${isSelected?'var(--accent-gold)':'var(--border)'}`,
                            background: isSelected ? 'var(--accent-gold-dim)' : 'var(--bg-secondary)',
                            transition:'all 0.2s', textAlign:'center', position:'relative'
                          }}>
                          {isSelected && (
                            <div style={{position:'absolute',top:4,left:4,background:'var(--accent-gold)',borderRadius:'50%',width:18,height:18,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.7rem',fontWeight:900,color:'#000'}}>✓</div>
                          )}
                          <img src={sig.signatureUrl} alt={sig.name}
                            style={{width:'100%',height:48,objectFit:'contain',background:'#fff',borderRadius:5,padding:3,marginBottom:6,border:'1px solid var(--border)'}}/>
                          <div style={{fontSize:'0.82rem',fontWeight:700,color:'var(--text-primary)'}}>{sig.name}</div>
                          {sig.role && <div style={{fontSize:'0.72rem',color:'var(--text-muted)'}}>{sig.role}</div>}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{marginTop:8,fontSize:'0.78rem',color:'var(--text-muted)'}}>
                    {selectedSigIds.length} מתוך {availableSignatures.length} חתימות נבחרו
                  </div>
                </div>
              )}

              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">{editId?'עדכן חוזה':'צור חוזה'}</button>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>ביטול</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contracts;
