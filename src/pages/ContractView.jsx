import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';

const ContractView = () => {
  const { linkToken } = useParams();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [selectedOptionals, setSelectedOptionals] = useState({});
  const [signed, setSigned] = useState(false);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const contractRef = useRef(null);
  const [lang, setLang] = useState('he'); // 'he' or 'en'
  const [editing, setEditing] = useState(false);
  const [editedFields, setEditedFields] = useState({});

  const t = {
    he: {
      title: 'הסכם הופעה',
      bandSub: 'להקת קולות',
      packageLabel: 'תופיע בהרכב',
      included: 'כולל:',
      extras: 'תוספות - בחרו מה מעניין אתכם:',
      addToPackage: 'הוסף לחבילה',
      eventDetails: 'פרטי האירוע',
      ordererDetails: 'פרטי המזמין',
      date: 'תאריך:',
      location: 'אולם/מיקום:',
      orderer: 'המזמין:',
      address: 'כתובת:',
      phone: 'טלפון:',
      idNumber: 'ת.ז:',
      groom: 'שם חתן:',
      bride: 'שם כלה:',
      duration: 'זמן נגינה:',
      hours: 'שעות',
      packagePrice: 'מחיר חבילה:',
      paymentTitle: 'סכום ותנאי תשלום',
      discount: 'הנחה מיוחדת:',
      extras_total: 'תוספות שנבחרו:',
      finalPrice: 'סכום סופי:',
      advance: 'מקדמה:',
      notes: 'הערות מיוחדות:',
      signTitle: 'חתימות',
      bandRep: 'נציגי להקת קולות',
      client: 'המזמין',
      signHere: 'חתום כאן',
      fullName: 'שם מלא',
      confirmSign: 'אשר חתימה',
      clear: 'נקה',
      signed: '✓ חוזה חתום',
      signedBy: 'נחתם ע"י:',
      signedAt: 'בתאריך:',
      weddingOf: 'החתונה של',
      and: 'ו',
      footer: '055-5081080 • KOLOTMUSIC@GMAIL.COM • KOLOTBAND.CO.IL',
      expiredTitle: 'החוזה אינו זמין',
      expiredText: 'הסכם זה כבר נחתם ואינו זמין לצפייה. לפרטים נוספים צרו קשר עם הלהקה.',
      selectedTotal: 'סה"כ תוספות שנבחרו',
    },
    en: {
      title: 'Performance Agreement',
      bandSub: 'Kolot Band',
      packageLabel: 'Performing in formation',
      included: 'Included:',
      extras: 'Add-ons - Choose what interests you:',
      addToPackage: 'Add to package',
      eventDetails: 'Event Details',
      ordererDetails: 'Orderer Details',
      date: 'Date:',
      location: 'Venue:',
      orderer: 'Orderer:',
      address: 'Address:',
      phone: 'Phone:',
      idNumber: 'ID:',
      groom: 'Groom:',
      bride: 'Bride:',
      duration: 'Performance duration:',
      hours: 'hours',
      packagePrice: 'Package price:',
      paymentTitle: 'Payment Terms',
      discount: 'Special discount:',
      extras_total: 'Selected add-ons:',
      finalPrice: 'Total:',
      advance: 'Advance:',
      notes: 'Special Notes:',
      signTitle: 'Signatures',
      bandRep: 'Kolot Band Representatives',
      client: 'Client',
      signHere: 'Sign Here',
      fullName: 'Full Name',
      confirmSign: 'Confirm Signature',
      clear: 'Clear',
      signed: '✓ Contract Signed',
      signedBy: 'Signed by:',
      signedAt: 'Date:',
      weddingOf: 'The wedding of',
      and: '&',
      footer: '055-5081080 • KOLOTMUSIC@GMAIL.COM • KOLOTBAND.CO.IL',
      expiredTitle: 'Contract No Longer Available',
      expiredText: 'This contract has already been signed and is no longer available. Please contact the band for more information.',
      selectedTotal: 'Total selected add-ons',
    }
  };
  const tx = t[lang];

  useEffect(() => { fetchContract(); }, [linkToken]);

  const fetchContract = async () => {
    try {
      const {data} = await api.get(`/contracts/public/${linkToken}`);
      setContract(data);
      setEditedFields({
        eventDate: data.eventDate ? new Date(data.eventDate).toISOString().split('T')[0] : '',
        eventLocation: data.eventLocation || '',
        performanceDuration: data.performanceDuration || 4.5,
        ordererName: data.ordererName || '',
        ordererIdNumber: data.ordererIdNumber || '',
        ordererAddress: data.ordererAddress || '',
        ordererPhone: data.ordererPhone || '',
        groomName: data.groomName || '',
        brideName: data.brideName || '',
      });
    } catch(e) {
      if(e.response?.status === 403) setExpired(true);
    } finally { setLoading(false); }
  };

  const saveEdits = async () => {
    try {
      await api.patch(`/contracts/public/${linkToken}/update-details`, editedFields);
      setContract(c => ({...c, ...editedFields,
        eventDate: editedFields.eventDate ? new Date(editedFields.eventDate).toISOString() : c.eventDate
      }));
      setEditing(false);
    } catch(e) {
      alert(lang==='he'?'שגיאה בשמירה':'Save failed');
    }
  };

  const startDraw = (e) => {
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches?e.touches[0].clientX:e.clientX)-rect.left;
    const y = (e.touches?e.touches[0].clientY:e.clientY)-rect.top;
    ctx.beginPath(); ctx.moveTo(x,y); setIsDrawing(true);
  };
  const draw = (e) => {
    if(!isDrawing) return; e.preventDefault();
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches?e.touches[0].clientX:e.clientX)-rect.left;
    const y = (e.touches?e.touches[0].clientY:e.clientY)-rect.top;
    ctx.lineWidth=2.5; ctx.lineCap='round'; ctx.strokeStyle='#1a1a2e'; ctx.lineTo(x,y); ctx.stroke();
  };
  const stopDraw = () => setIsDrawing(false);
  const clearSig = () => { const c=canvasRef.current; c.getContext('2d').clearRect(0,0,c.width,c.height); };

  const toggleOptional = (prodId) => {
    setSelectedOptionals(prev => ({...prev, [prodId]: !prev[prodId]}));
  };

  const getOptionalTotal = () => {
    if(!contract) return 0;
    return contract.products
      .filter(p => p.isOptional && selectedOptionals[p.product?.toString()||p.name])
      .reduce((sum,p) => sum + (p.price||0), 0);
  };

  const getFinalTotal = () => {
    if(!contract) return 0;
    const base = contract.basePrice || contract.totalPrice || 0;
    const discount = contract.discount || 0;
    return base - discount + getOptionalTotal();
  };

  const submitSign = async () => {
    if(!signerName.trim()) { alert(lang==='he'?'נא להזין שם':'Please enter your name'); return; }
    const sigUrl = canvasRef.current.toDataURL();
    const selectedIds = contract.products.filter(p=>p.isOptional&&selectedOptionals[p.product?.toString()||p.name]).map(p=>p.product?.toString()||p.name);
    try {
      await api.post(`/contracts/public/${linkToken}/sign`, {
        signatureUrl:sigUrl, signerName,
        selectedOptionalProducts: selectedIds,
        finalTotalPrice: getFinalTotal(),
      });
      setSigned(true);
    } catch(e){ alert(e.response?.data?.message||(lang==='he'?'שגיאה':'Error')); }
  };

  const printPDF = () => {
    window.print();
  };

  if(loading) return (
    <div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:'100vh',background:'#f0f2f5'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'3rem',marginBottom:16,fontFamily:'Georgia,serif',color:'#EAB21B',fontWeight:900,letterSpacing:8}}>KOLOT</div>
        <div className="spinner" style={{margin:'0 auto'}}/>
      </div>
    </div>
  );

  if(expired) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#f0f2f5'}}>
      <div style={{maxWidth:480,padding:40,background:'#fff',borderRadius:16,textAlign:'center',boxShadow:'0 8px 40px rgba(0,0,0,0.12)'}}>
        <div style={{fontSize:'4rem',marginBottom:16}}>🔒</div>
        <h2 style={{color:'#1a1a2e',marginBottom:12}}>{tx.expiredTitle}</h2>
        <p style={{color:'#666'}}>{tx.expiredText}</p>
        <p style={{marginTop:24,color:'#EAB21B',fontWeight:700}}>KOLOT BAND</p>
      </div>
    </div>
  );

  if(!contract) return (
    <div style={{textAlign:'center',padding:60,background:'#f0f2f5',minHeight:'100vh'}}>
      <h2>חוזה לא נמצא</h2>
    </div>
  );

  const includedProds = contract.products?.filter(p=>!p.isOptional&&p.isSelected) || [];
  const optionalProds = contract.products?.filter(p=>p.isOptional) || [];
  const basePrice = contract.basePrice || contract.totalPrice || 0;
  const discount = contract.discount || 0;
  const optionalTotal = getOptionalTotal();
  const finalTotal = getFinalTotal();

  return (
    <div style={{background:'#f0f2f5',minHeight:'100vh',padding:'20px 16px',direction:lang==='he'?'rtl':'ltr'}}>
      {/* Language Toggle */}
      <div style={{display:'flex',justifyContent:'center',marginBottom:16,gap:8}}>
        <button onClick={()=>setLang('he')} style={{padding:'6px 18px',background:lang==='he'?'#1a1a2e':'#fff',color:lang==='he'?'#fff':'#1a1a2e',border:'2px solid #1a1a2e',borderRadius:20,fontWeight:700,cursor:'pointer',fontSize:'0.9rem',transition:'all 0.2s'}}>עברית</button>
        <button onClick={()=>setLang('en')} style={{padding:'6px 18px',background:lang==='en'?'#1a1a2e':'#fff',color:lang==='en'?'#fff':'#1a1a2e',border:'2px solid #1a1a2e',borderRadius:20,fontWeight:700,cursor:'pointer',fontSize:'0.9rem',transition:'all 0.2s'}}>English</button>
      </div>

      <div ref={contractRef} style={{maxWidth:820,margin:'0 auto',background:'#fff',borderRadius:16,overflow:'hidden',boxShadow:'0 8px 40px rgba(0,0,0,0.12)'}}>
        {/* Header */}
        <div style={{background:'linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)',padding:'36px 40px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            {contract.logoUrl && <img src={contract.logoUrl} alt="logo" style={{height:60,marginBottom:8,borderRadius:4}}/>}
            <h1 style={{fontFamily:'Georgia,serif',fontSize:'2.8rem',color:'#EAB21B',letterSpacing:6,fontWeight:900}}>KOLOT</h1>
            <div style={{color:'#81C7D5',fontFamily:'Georgia,serif',letterSpacing:3,fontSize:'0.9rem'}}>TURN IT UP.</div>
          </div>
          <div style={{textAlign:lang==='he'?'left':'right',color:'#fff'}}>
            <div style={{fontSize:'1.4rem',fontWeight:700}}>{tx.title}</div>
            <div style={{color:'#81C7D5',fontSize:'0.9rem',marginTop:4}}>{tx.bandSub}</div>
          </div>
        </div>

        <div style={{padding:'36px 40px'}}>
          {/* Event Title */}
          <div style={{textAlign:'center',marginBottom:32,paddingBottom:24,borderBottom:'2px solid #f0f2f5'}}>
            <h2 style={{fontSize:'1.8rem',color:'#1a1a2e',fontFamily:'Georgia,serif'}}>
              {contract.groomName&&contract.brideName
                ?`${tx.weddingOf} ${contract.brideName} ${tx.and}${contract.groomName}`
                :tx.title}
            </h2>
          </div>

          {/* Event Details */}
          {contract.status !== 'signed' && !signed && (
            <div style={{display:'flex',justifyContent:'center',marginBottom:16,gap:10}}>
              {!editing ? (
                <button onClick={()=>setEditing(true)}
                  style={{padding:'8px 22px',background:'#1a1a2e',color:'#EAB21B',border:'2px solid #EAB21B',borderRadius:10,fontWeight:700,cursor:'pointer',fontSize:'0.9rem'}}>
                  {'\u270F\uFE0F'} {lang==='he'?'עריכת פרטים':'Edit Details'}
                </button>
              ) : (
                <div style={{display:'flex',gap:8}}>
                  <button onClick={saveEdits}
                    style={{padding:'8px 22px',background:'#4CAF50',color:'#fff',border:'none',borderRadius:10,fontWeight:700,cursor:'pointer',fontSize:'0.9rem'}}>
                    {lang==='he'?'שמור שינויים':'Save Changes'}
                  </button>
                  <button onClick={()=>setEditing(false)}
                    style={{padding:'8px 18px',background:'#f0f2f5',color:'#333',border:'none',borderRadius:10,fontWeight:700,cursor:'pointer',fontSize:'0.9rem'}}>
                    {lang==='he'?'ביטול':'Cancel'}
                  </button>
                </div>
              )}
            </div>
          )}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:28}}>
            <div style={{background:'#f8f9fb',padding:20,borderRadius:12,border:'1px solid #e8eaf0'}}>
              <h3 style={{color:'#EAB21B',marginBottom:14,fontFamily:'Georgia,serif',letterSpacing:1}}>{tx.eventDetails}</h3>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                <div style={{display:'flex',flexDirection:'column',gap:3}}>
                  <strong style={{color:'#555',fontSize:'0.85rem'}}>{tx.date}</strong>
                  {editing
                    ? <input type="date" value={editedFields.eventDate||''} onChange={e=>setEditedFields(f=>({...f,eventDate:e.target.value}))} style={{padding:'5px 8px',border:'1px solid #ccc',borderRadius:6,fontSize:'0.9rem',color:'#1a1a2e'}}/>
                    : <span style={{color:'#1a1a2e',fontWeight:500}}>{contract.eventDate?new Date(contract.eventDate).toLocaleDateString(lang==='he'?'he-IL':'en-US'):'-'}</span>}
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:3}}>
                  <strong style={{color:'#555',fontSize:'0.85rem'}}>{tx.location}</strong>
                  {editing
                    ? <input value={editedFields.eventLocation||''} onChange={e=>setEditedFields(f=>({...f,eventLocation:e.target.value}))} style={{padding:'5px 8px',border:'1px solid #ccc',borderRadius:6,fontSize:'0.9rem',color:'#1a1a2e'}}/>
                    : <span style={{color:'#1a1a2e',fontWeight:500}}>{contract.eventLocation||'-'}</span>}
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:3}}>
                  <strong style={{color:'#555',fontSize:'0.85rem'}}>{tx.groom}</strong>
                  {editing
                    ? <input value={editedFields.groomName||''} onChange={e=>setEditedFields(f=>({...f,groomName:e.target.value}))} style={{padding:'5px 8px',border:'1px solid #ccc',borderRadius:6,fontSize:'0.9rem',color:'#1a1a2e'}}/>
                    : <span style={{color:'#1a1a2e',fontWeight:500}}>{contract.groomName||'-'}</span>}
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:3}}>
                  <strong style={{color:'#555',fontSize:'0.85rem'}}>{tx.bride}</strong>
                  {editing
                    ? <input value={editedFields.brideName||''} onChange={e=>setEditedFields(f=>({...f,brideName:e.target.value}))} style={{padding:'5px 8px',border:'1px solid #ccc',borderRadius:6,fontSize:'0.9rem',color:'#1a1a2e'}}/>
                    : <span style={{color:'#1a1a2e',fontWeight:500}}>{contract.brideName||'-'}</span>}
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:3,paddingTop:8,borderTop:'1px solid #e8eaf0'}}>
                  <strong style={{color:'#555',fontSize:'0.85rem'}}>{tx.duration}</strong>
                  {editing
                    ? <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <input type="number" step="0.5" min="0.5" max="12" value={editedFields.performanceDuration||4.5}
                          onChange={e=>setEditedFields(f=>({...f,performanceDuration:parseFloat(e.target.value)||4.5}))}
                          style={{width:70,padding:'5px 8px',border:'1px solid #ccc',borderRadius:6,fontSize:'0.9rem',color:'#1a1a2e'}}/>
                        <span style={{color:'#555',fontSize:'0.85rem'}}>{tx.hours}</span>
                      </div>
                    : <span style={{color:'#1a1a2e',fontWeight:600}}>{contract.performanceDuration||4.5} {tx.hours}</span>}
                </div>
              </div>
            </div>
            <div style={{background:'#f8f9fb',padding:20,borderRadius:12,border:'1px solid #e8eaf0'}}>
              <h3 style={{color:'#EAB21B',marginBottom:14,fontFamily:'Georgia,serif',letterSpacing:1}}>{tx.ordererDetails}</h3>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                <div style={{display:'flex',flexDirection:'column',gap:3}}>
                  <strong style={{color:'#555',fontSize:'0.85rem'}}>{tx.orderer}</strong>
                  {editing
                    ? <input value={editedFields.ordererName||''} onChange={e=>setEditedFields(f=>({...f,ordererName:e.target.value}))} style={{padding:'5px 8px',border:'1px solid #ccc',borderRadius:6,fontSize:'0.9rem',color:'#1a1a2e'}}/>
                    : <span style={{color:'#1a1a2e',fontWeight:500}}>{contract.ordererName||'-'}</span>}
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:3}}>
                  <strong style={{color:'#555',fontSize:'0.85rem'}}>{tx.idNumber}</strong>
                  {editing
                    ? <input value={editedFields.ordererIdNumber||''} onChange={e=>setEditedFields(f=>({...f,ordererIdNumber:e.target.value}))} style={{padding:'5px 8px',border:'1px solid #ccc',borderRadius:6,fontSize:'0.9rem',color:'#1a1a2e'}}/>
                    : <span style={{color:'#1a1a2e',fontWeight:500}}>{contract.ordererIdNumber||'-'}</span>}
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:3}}>
                  <strong style={{color:'#555',fontSize:'0.85rem'}}>{tx.address}</strong>
                  {editing
                    ? <input value={editedFields.ordererAddress||''} onChange={e=>setEditedFields(f=>({...f,ordererAddress:e.target.value}))} style={{padding:'5px 8px',border:'1px solid #ccc',borderRadius:6,fontSize:'0.9rem',color:'#1a1a2e'}}/>
                    : <span style={{color:'#1a1a2e',fontWeight:500}}>{contract.ordererAddress||'-'}</span>}
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:3}}>
                  <strong style={{color:'#555',fontSize:'0.85rem'}}>{tx.phone}</strong>
                  {editing
                    ? <input value={editedFields.ordererPhone||''} onChange={e=>setEditedFields(f=>({...f,ordererPhone:e.target.value}))} style={{padding:'5px 8px',border:'1px solid #ccc',borderRadius:6,fontSize:'0.9rem',color:'#1a1a2e'}}/>
                    : <span style={{color:'#1a1a2e',fontWeight:500}}>{contract.ordererPhone||'-'}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Package */}
          {contract.packageName&&(
            <div style={{textAlign:'center',marginBottom:24,padding:'16px',background:'linear-gradient(135deg,#f8f9fb,#fff)',borderRadius:12,border:'1px solid #e8eaf0'}}>
              <div style={{fontSize:'0.9rem',color:'#888'}}>{tx.packageLabel}</div>
              <div style={{fontSize:'2rem',fontWeight:900,color:'#1a1a2e',fontFamily:'Georgia,serif',letterSpacing:2}}>{contract.packageName.toUpperCase()}</div>
            </div>
          )}

          {/* Included Products */}
          {includedProds.length>0&&(
            <div style={{marginBottom:28}}>
              <h3 style={{color:'#EAB21B',marginBottom:16,fontFamily:'Georgia,serif',letterSpacing:1}}>{tx.included}</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12}}>
                {includedProds.map((p,i)=>(
                  <div key={i} style={{background:'#f8f9fb',borderRadius:10,overflow:'hidden',border:'1px solid #e8eaf0',textAlign:'center'}}>
                    {p.imageUrl&&<img src={p.imageUrl} alt={p.name} style={{width:'100%',height:100,objectFit:'cover'}}/>}
                    <div style={{padding:'10px 12px',fontWeight:700,fontSize:'0.9rem',color:'#1a1a2e'}}>{p.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional Products - Interactive */}
          {optionalProds.length>0&&contract.status!=='signed'&&(
            <div style={{marginBottom:28}}>
              <div style={{background:'linear-gradient(135deg,#fff8e1,#fffde7)',border:'2px solid #EAB21B',borderRadius:14,padding:24}}>
                <h3 style={{color:'#1a1a2e',marginBottom:6,fontFamily:'Georgia,serif',fontSize:'1.2rem'}}>{tx.extras}</h3>
                <p style={{color:'#888',fontSize:'0.85rem',marginBottom:20}}>
                  {lang==='he'?'המוצרים הבאים אינם כלולים בחבילה הבסיסית - ניתן להוסיף אותם לפי בחירתכם':'The following are not included in the base package - you can add them to your package'}
                </p>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:16}}>
                  {optionalProds.map((p,i)=>{
                    const key = p.product?.toString()||p.name;
                    const isSelected = !!selectedOptionals[key];
                    return (
                      <div key={i} onClick={()=>toggleOptional(key)}
                        style={{background:isSelected?'#1a1a2e':'#fff',borderRadius:12,overflow:'hidden',border:`2px solid ${isSelected?'#EAB21B':'#e8eaf0'}`,cursor:'pointer',transition:'all 0.3s ease',transform:isSelected?'scale(1.02)':'scale(1)',boxShadow:isSelected?'0 8px 24px rgba(234,178,27,0.3)':'0 2px 8px rgba(0,0,0,0.06)'}}>
                        {p.imageUrl&&(
                          <div style={{position:'relative',height:140,overflow:'hidden'}}>
                            <img src={p.imageUrl} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform 0.3s',transform:isSelected?'scale(1.05)':'scale(1)'}}/>
                            {isSelected&&<div style={{position:'absolute',top:8,right:8,background:'#EAB21B',borderRadius:'50%',width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:'0.9rem'}}>✓</div>}
                            <div style={{position:'absolute',bottom:0,left:0,right:0,height:60,background:'linear-gradient(to top,rgba(0,0,0,0.7),transparent)'}}/>
                          </div>
                        )}
                        {!p.imageUrl&&isSelected&&<div style={{textAlign:'center',padding:'16px 0 0',fontSize:'2rem'}}>✓</div>}
                        <div style={{padding:'12px 14px'}}>
                          <div style={{fontWeight:700,fontSize:'0.95rem',color:isSelected?'#EAB21B':'#1a1a2e',marginBottom:4}}>{p.name}</div>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <span style={{fontSize:'1.1rem',fontWeight:800,color:isSelected?'#fff':'#1a1a2e'}}>+₪{p.price?.toLocaleString()}</span>
                            <span style={{fontSize:'0.75rem',padding:'3px 8px',borderRadius:10,background:isSelected?'rgba(234,178,27,0.2)':'#f0f2f5',color:isSelected?'#EAB21B':'#888',fontWeight:600}}>
                              {isSelected?(lang==='he'?'נבחר ✓':'Selected ✓'):(lang==='he'?'הוסף':'Add')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {optionalTotal>0&&(
                  <div style={{marginTop:16,padding:'10px 16px',background:'rgba(234,178,27,0.15)',borderRadius:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontWeight:600,color:'#1a1a2e'}}>{tx.selectedTotal}:</span>
                    <span style={{fontWeight:800,color:'#EAB21B',fontSize:'1.1rem'}}>+₪{optionalTotal.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Price Summary */}
          <div style={{background:'linear-gradient(135deg,#1a1a2e,#16213e)',borderRadius:14,padding:28,marginBottom:28,color:'#fff'}}>
            <div style={{fontSize:'0.9rem',color:'#81C7D5',marginBottom:16}}>{tx.paymentTitle}</div>
            {basePrice>0&&(
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:'0.95rem',color:'#ccc'}}>
                <span>{tx.packagePrice}</span>
                <span style={{textDecoration:discount>0?'line-through':'none',opacity:discount>0?0.6:1}}>₪{basePrice.toLocaleString()}</span>
              </div>
            )}
            {discount>0&&(
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:'0.95rem',color:'#81C7D5'}}>
                <span>{tx.discount}</span>
                <span style={{color:'#4CAF50'}}>-₪{discount.toLocaleString()}</span>
              </div>
            )}
            {optionalTotal>0&&(
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:'0.95rem',color:'#ccc'}}>
                <span>{tx.extras_total}</span>
                <span style={{color:'#EAB21B'}}>+₪{optionalTotal.toLocaleString()}</span>
              </div>
            )}
            <div style={{borderTop:'1px solid rgba(255,255,255,0.15)',paddingTop:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:'1rem',color:'#81C7D5'}}>{tx.finalPrice}</span>
              <span style={{fontSize:'2.6rem',fontWeight:900,color:'#EAB21B'}}>₪{finalTotal.toLocaleString()}</span>
            </div>
            {contract.advancePayment>0&&(
              <div style={{marginTop:8,color:'#aaa',fontSize:'0.9rem',display:'flex',justifyContent:'space-between'}}>
                <span>{tx.advance}</span>
                <span>₪{contract.advancePayment.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Special Notes */}
          {contract.specialNotes&&(
            <div style={{background:'#fff8e1',padding:20,borderRadius:12,marginBottom:28,border:'1px solid #ffe082'}}>
              <strong style={{color:'#795548'}}>{tx.notes}</strong><br/>
              <span style={{color:'#333'}}>{contract.specialNotes}</span>
            </div>
          )}

          {/* Signature Section */}
          {contract.status==='signed'||signed ? (
            <div style={{textAlign:'center',padding:28,background:'linear-gradient(135deg,#e8f5e9,#f1f8e9)',borderRadius:14,border:'2px solid #4CAF50'}}>
              <div style={{fontSize:'1.3rem',fontWeight:700,color:'#4CAF50',marginBottom:8}}>{tx.signed}</div>
              <div style={{color:'#333'}}>{tx.signedBy} <strong>{contract.signerName}</strong></div>
              {contract.signedAt&&<div style={{fontSize:'0.85rem',color:'#666',marginTop:4}}>{tx.signedAt} {new Date(contract.signedAt).toLocaleDateString(lang==='he'?'he-IL':'en-US')}</div>}
              {contract.signatureUrl&&<img src={contract.signatureUrl} alt="חתימה" style={{maxWidth:200,marginTop:16,border:'1px solid #ddd',borderRadius:8,background:'#fff',padding:4}}/>}
              <div style={{marginTop:20}}>
                <button onClick={printPDF} style={{padding:'10px 24px',background:'#1a1a2e',color:'#EAB21B',border:'none',borderRadius:8,fontWeight:700,cursor:'pointer',fontSize:'0.95rem'}}>
                  📄 {lang==='he'?'הורד PDF':'Download PDF'}
                </button>
              </div>
            </div>
          ):(
            <div style={{border:'2px dashed #EAB21B',borderRadius:14,padding:28}}>
              <h3 style={{textAlign:'center',marginBottom:24,color:'#1a1a2e',fontFamily:'Georgia,serif'}}>{tx.signTitle}</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:28}}>
                {/* Band signature */}
                <div style={{textAlign:'center'}}>
                  <div style={{marginBottom:12,fontWeight:700,color:'#1a1a2e'}}>{tx.bandRep}</div>
                  <div style={{padding:'12px',borderBottom:'2px solid #1a1a2e',fontFamily:'Georgia,cursive',fontSize:'1.4rem',color:'#EAB21B',letterSpacing:2}}>Kolot</div>
                </div>
                {/* Client signature */}
                <div style={{textAlign:'center'}}>
                  <div style={{marginBottom:12,fontWeight:700,color:'#1a1a2e'}}>{tx.client}</div>
                  {!signing?(
                    <button onClick={()=>setSigning(true)} style={{padding:'14px 36px',background:'#EAB21B',border:'none',borderRadius:10,fontWeight:800,fontSize:'1rem',cursor:'pointer',boxShadow:'0 4px 16px rgba(234,178,27,0.4)',transition:'all 0.2s',color:'#000'}}
                      onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
                      onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                      ✍️ {tx.signHere}
                    </button>
                  ):(
                    <div>
                      <input value={signerName} onChange={e=>setSignerName(e.target.value)} placeholder={tx.fullName}
                        style={{width:'100%',padding:'10px',border:'1px solid #ddd',borderRadius:8,marginBottom:10,textAlign:'center',fontSize:'1rem',fontFamily:'Assistant,sans-serif'}}/>
                      <canvas ref={canvasRef} width={300} height={110}
                        style={{border:'2px solid #1a1a2e',borderRadius:8,background:'#fff',cursor:'crosshair',touchAction:'none',display:'block',margin:'0 auto'}}
                        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}/>
                      <div style={{fontSize:'0.75rem',color:'#aaa',marginTop:4,marginBottom:10}}>{lang==='he'?'חתמו כאן במסגרת האפורה':'Sign above'}</div>
                      <div style={{display:'flex',gap:8,justifyContent:'center'}}>
                        <button onClick={submitSign} style={{padding:'10px 24px',background:'#4CAF50',color:'#fff',border:'none',borderRadius:8,fontWeight:700,cursor:'pointer',fontSize:'0.9rem'}}>{tx.confirmSign}</button>
                        <button onClick={clearSig} style={{padding:'10px 16px',background:'#f0f2f5',border:'none',borderRadius:8,cursor:'pointer',color:'#333'}}>{tx.clear}</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{background:'#1a1a2e',padding:'20px 40px',textAlign:'center',color:'#666',fontSize:'0.8rem'}}>
          {tx.footer}
        </div>
      </div>
    </div>
  );
};

export default ContractView;
