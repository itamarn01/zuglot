import { useState, useEffect } from 'react';
import api from '../api/axios';
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiCheck, FiPlusCircle } from 'react-icons/fi';

const PackageSkeleton = () => (
  <div className="card" style={{position:'relative',overflow:'hidden'}}>
    <div style={{height:4,background:'var(--bg-secondary)',marginBottom:16,animation:'skeleton-pulse 1.5s ease-in-out infinite'}}/>
    <div style={{height:22,background:'var(--bg-secondary)',borderRadius:4,marginBottom:12,width:'60%',animation:'skeleton-pulse 1.5s ease-in-out infinite'}}/>
    <div style={{height:14,background:'var(--bg-secondary)',borderRadius:4,marginBottom:20,animation:'skeleton-pulse 1.5s ease-in-out infinite'}}/>
    {[1,2,3].map(i=><div key={i} style={{height:32,background:'var(--bg-secondary)',borderRadius:4,marginBottom:8,animation:'skeleton-pulse 1.5s ease-in-out infinite'}}/>)}
  </div>
);

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name:'', description:'', products:[], totalPrice:'' });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [p,pr] = await Promise.all([api.get('/packages'), api.get('/products')]);
      setPackages(p.data); setProducts(pr.data);
    } catch(e){} finally { setLoading(false); }
  };

  // Toggle product - add/remove from package with isOptional flag
  const toggleProduct = (prodId, isOptional = false) => {
    setForm(f => {
      const exists = f.products.find(p => p.product === prodId);
      if (exists) return {...f, products: f.products.filter(p => p.product !== prodId)};
      const prod = products.find(p => p._id === prodId);
      return {...f, products: [...f.products, { product: prodId, customPrice: prod?.defaultPrice||0, isOptional }]};
    });
  };

  const setProductOptional = (prodId, isOptional) => {
    setForm(f => ({...f, products: f.products.map(p => p.product===prodId ? {...p, isOptional} : p)}));
  };

  const updateProductPrice = (prodId, price) => {
    setForm(f => ({...f, products: f.products.map(p => p.product===prodId ? {...p, customPrice: Number(price)} : p)}));
  };

  const calcBasePrice = () => {
    return form.products.filter(p=>!p.isOptional).reduce((s,p)=>s+(p.customPrice||0),0);
  };

  const submit = async (e) => {
    e.preventDefault();
    const basePrice = calcBasePrice();
    const payload = {
      ...form,
      basePrice,
      totalPrice: Number(form.totalPrice) || basePrice,
    };
    if(editId) await api.put(`/packages/${editId}`, payload);
    else await api.post('/packages', payload);
    closeModal(); fetchAll();
  };

  const closeModal = () => {
    setShowModal(false); setEditId(null);
    setForm({name:'',description:'',products:[],totalPrice:''});
  };

  const edit = (pkg) => {
    setEditId(pkg._id);
    setForm({
      name:pkg.name, description:pkg.description,
      products:pkg.products.map(p=>({product:p.product?._id||p.product, customPrice:p.customPrice||0, isOptional:p.isOptional||false})),
      totalPrice:pkg.totalPrice
    });
    setShowModal(true);
  };

  const del = async (id) => { if(!confirm('למחוק?')) return; await api.delete(`/packages/${id}`); fetchAll(); };

  const includedProducts = form.products.filter(p=>!p.isOptional);
  const optionalProducts = form.products.filter(p=>p.isOptional);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">חבילות</h1>
        <button className="btn btn-primary" onClick={()=>{closeModal();setShowModal(true);}}>
          <FiPlus/> חבילה חדשה
        </button>
      </div>

      {loading ? (
        <div className="grid-3">
          {[1,2,3].map(i=><PackageSkeleton key={i}/>)}
        </div>
      ) : packages.length===0 ? (
        <div className="empty-state">
          <div className="icon"><FiPackage/></div>
          <h3>אין חבילות</h3>
          <p>צרו חבילות כמו Basic, Premium, Ultimate</p>
        </div>
      ) : (
        <div className="grid-3">
          {packages.map(pkg=>{
            const inc = pkg.products?.filter(p=>!p.isOptional)||[];
            const opt = pkg.products?.filter(p=>p.isOptional)||[];
            return (
              <div key={pkg._id} className="card" style={{position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:0,right:0,left:0,height:4,background:'linear-gradient(90deg, var(--accent-gold), var(--accent-cyan))'}}/>
                <div className="card-header" style={{marginTop:8}}>
                  <h3 className="card-title" style={{fontSize:'1.3rem'}}>{pkg.name}</h3>
                  <div style={{display:'flex',gap:4}}>
                    <button className="btn-icon" onClick={()=>edit(pkg)}><FiEdit2/></button>
                    <button className="btn-icon" style={{color:'var(--error)'}} onClick={()=>del(pkg._id)}><FiTrash2/></button>
                  </div>
                </div>
                <p style={{color:'var(--text-secondary)',fontSize:'0.9rem',marginBottom:16}}>{pkg.description||''}</p>
                
                {inc.length > 0 && (
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:'0.75rem',fontWeight:700,color:'var(--accent-cyan)',textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>כולל:</div>
                    {inc.map((pp,i)=>(
                      <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid var(--border)'}}>
                        <span style={{display:'flex',alignItems:'center',gap:6}}>
                          <FiCheck style={{color:'var(--success)',fontSize:12}}/>
                          {pp.product?.name||'מוצר'}
                        </span>
                        <span style={{color:'var(--accent-gold)'}}>₪{(pp.customPrice||0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {opt.length > 0 && (
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:'0.75rem',fontWeight:700,color:'var(--warning)',textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>אופציונלי (תוספות):</div>
                    {opt.map((pp,i)=>(
                      <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid var(--border)',opacity:0.8}}>
                        <span style={{display:'flex',alignItems:'center',gap:6}}>
                          <FiPlusCircle style={{color:'var(--warning)',fontSize:12}}/>
                          {pp.product?.name||'מוצר'}
                        </span>
                        <span style={{color:'var(--warning)'}}>+₪{(pp.customPrice||0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{textAlign:'center',padding:'12px',background:'var(--bg-secondary)',borderRadius:8}}>
                  <div style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>מחיר בסיס</div>
                  <div style={{fontSize:'1.6rem',fontWeight:800,color:'var(--accent-gold)'}}>₪{(pkg.basePrice||pkg.totalPrice)?.toLocaleString()}</div>
                  {opt.length>0&&<div style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>+תוספות לפי בחירה</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal&&(
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{maxWidth:600}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editId?'ערוך חבילה':'חבילה חדשה'}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={submit}>
              <div className="form-row">
                <div className="form-group"><label className="form-label">שם *</label><input className="form-input" required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Basic / Premium / Ultimate"/></div>
                <div className="form-group"><label className="form-label">מחיר בסיס (אוטומטי)</label><input className="form-input" type="number" value={form.totalPrice} onChange={e=>setForm(f=>({...f,totalPrice:e.target.value}))} placeholder={calcBasePrice()||'חישוב אוטומטי'}/></div>
              </div>
              <div className="form-group"><label className="form-label">תיאור</label><input className="form-input" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></div>
              
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginTop:16}}>
                {/* Included Products */}
                <div>
                  <h4 style={{color:'var(--accent-cyan)',marginBottom:10,fontSize:'0.9rem',display:'flex',alignItems:'center',gap:6}}>
                    <FiCheck/> מוצרים כלולים
                  </h4>
                  {products.map(p=>{
                    const sel = form.products.find(fp=>fp.product===p._id);
                    const isIncluded = sel && !sel.isOptional;
                    return (
                      <div key={p._id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px',background:isIncluded?'rgba(129,199,213,0.1)':'var(--bg-secondary)',borderRadius:6,marginBottom:6,border:`1px solid ${isIncluded?'var(--accent-cyan)':'var(--border)'}`,cursor:'pointer',transition:'all 0.2s'}}
                        onClick={()=>{ if(!sel){toggleProduct(p._id,false);} else if(!sel.isOptional){toggleProduct(p._id);} else {setProductOptional(p._id,false);} }}>
                        <input type="checkbox" checked={isIncluded} readOnly style={{accentColor:'var(--accent-cyan)'}}/>
                        <span style={{flex:1,fontWeight:600,fontSize:'0.85rem'}}>{p.name}</span>
                        {isIncluded&&<input className="form-input" type="number" style={{width:70,padding:'4px 6px',fontSize:'0.8rem'}} value={sel.customPrice} onClick={e=>e.stopPropagation()} onChange={e=>updateProductPrice(p._id,e.target.value)}/>}
                        {!sel&&<span style={{color:'var(--text-muted)',fontSize:'0.8rem'}}>₪{p.defaultPrice}</span>}
                      </div>
                    );
                  })}
                </div>
                
                {/* Optional Products */}
                <div>
                  <h4 style={{color:'var(--warning)',marginBottom:10,fontSize:'0.9rem',display:'flex',alignItems:'center',gap:6}}>
                    <FiPlusCircle/> תוספות (אופציונלי)
                  </h4>
                  {products.map(p=>{
                    const sel = form.products.find(fp=>fp.product===p._id);
                    const isOpt = sel && sel.isOptional;
                    return (
                      <div key={p._id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px',background:isOpt?'rgba(255,152,0,0.1)':'var(--bg-secondary)',borderRadius:6,marginBottom:6,border:`1px solid ${isOpt?'var(--warning)':'var(--border)'}`,cursor:'pointer',transition:'all 0.2s'}}
                        onClick={()=>{ if(!sel){toggleProduct(p._id,true);} else if(sel.isOptional){toggleProduct(p._id);} else {setProductOptional(p._id,true);} }}>
                        <input type="checkbox" checked={isOpt} readOnly style={{accentColor:'var(--warning)'}}/>
                        <span style={{flex:1,fontWeight:600,fontSize:'0.85rem'}}>{p.name}</span>
                        {isOpt&&<input className="form-input" type="number" style={{width:70,padding:'4px 6px',fontSize:'0.8rem'}} value={sel.customPrice} onClick={e=>e.stopPropagation()} onChange={e=>updateProductPrice(p._id,e.target.value)}/>}
                        {!sel&&<span style={{color:'var(--text-muted)',fontSize:'0.8rem'}}>₪{p.defaultPrice}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Summary */}
              {includedProducts.length > 0 && (
                <div style={{marginTop:16,padding:12,background:'var(--bg-secondary)',borderRadius:8,fontSize:'0.85rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',color:'var(--text-secondary)'}}>
                    <span>בסיס ({includedProducts.length} מוצרים):</span>
                    <span style={{color:'var(--accent-cyan)'}}>₪{calcBasePrice().toLocaleString()}</span>
                  </div>
                  {optionalProducts.length>0&&<div style={{display:'flex',justifyContent:'space-between',color:'var(--text-secondary)',marginTop:4}}>
                    <span>תוספות ({optionalProducts.length} מוצרים):</span>
                    <span style={{color:'var(--warning)'}}>+₪{optionalProducts.reduce((s,p)=>s+(p.customPrice||0),0).toLocaleString()}</span>
                  </div>}
                </div>
              )}

              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">{editId?'שמור':'צור'}</button>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>ביטול</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Packages;
