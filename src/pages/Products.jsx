import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { FiPlus, FiEdit2, FiTrash2, FiImage, FiX } from 'react-icons/fi';

// Skeleton component
const ProductSkeleton = () => (
  <div className="card" style={{position:'relative',overflow:'hidden'}}>
    <div style={{height:160,background:'var(--bg-secondary)',borderRadius:8,marginBottom:16,animation:'skeleton-pulse 1.5s ease-in-out infinite'}}/>
    <div style={{height:20,background:'var(--bg-secondary)',borderRadius:4,marginBottom:8,width:'70%',animation:'skeleton-pulse 1.5s ease-in-out infinite'}}/>
    <div style={{height:14,background:'var(--bg-secondary)',borderRadius:4,marginBottom:16,animation:'skeleton-pulse 1.5s ease-in-out infinite'}}/>
    <div style={{height:14,background:'var(--bg-secondary)',borderRadius:4,width:'50%',animation:'skeleton-pulse 1.5s ease-in-out infinite'}}/>
  </div>
);

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name:'', description:'', defaultPrice:'', category:'general', imageUrl:'' });
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => { fetchProducts(); }, []);
  
  const fetchProducts = async () => {
    try { const {data}=await api.get('/products'); setProducts(data); } 
    catch(e){} 
    finally { setLoading(false); }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setForm(f => ({...f, imageUrl: reader.result}));
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch(err) {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = {...form, defaultPrice: Number(form.defaultPrice)||0};
    if(editId) await api.put(`/products/${editId}`, payload);
    else await api.post('/products', payload);
    closeModal();
    fetchProducts();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setForm({name:'',description:'',defaultPrice:'',category:'general',imageUrl:''});
    setImagePreview('');
  };

  const edit = (p) => {
    setEditId(p._id);
    setForm({name:p.name,description:p.description||'',defaultPrice:p.defaultPrice,category:p.category,imageUrl:p.imageUrl||''});
    setImagePreview(p.imageUrl||'');
    setShowModal(true);
  };

  const del = async (id) => {
    if(!confirm('למחוק מוצר זה?')) return;
    await api.delete(`/products/${id}`);
    fetchProducts();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">מוצרים</h1>
        <button className="btn btn-primary" onClick={()=>{closeModal();setShowModal(true);}}>
          <FiPlus/> מוצר חדש
        </button>
      </div>

      {loading ? (
        <div className="grid-3">
          {[1,2,3,4,5,6].map(i=><ProductSkeleton key={i}/>)}
        </div>
      ) : products.length===0 ? (
        <div className="empty-state">
          <div className="icon">📦</div>
          <h3>אין מוצרים</h3>
          <p>התחילו להוסיף מוצרים</p>
        </div>
      ) : (
        <div className="grid-3">
          {products.map(p=>(
            <div key={p._id} className="card" style={{padding:0,overflow:'hidden',position:'relative'}}>
              {/* Product Image */}
              {p.imageUrl ? (
                <div style={{height:160,overflow:'hidden',position:'relative'}}>
                  <img src={p.imageUrl} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform 0.3s ease'}}
                    onMouseEnter={e=>e.currentTarget.style.transform='scale(1.05)'}
                    onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}
                  />
                  <div style={{position:'absolute',inset:0,background:'linear-gradient(to top, rgba(0,0,0,0.7), transparent)'}}/>
                </div>
              ) : (
                <div style={{height:130,background:'linear-gradient(135deg, var(--bg-secondary), var(--bg-card))',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <FiImage style={{fontSize:48,color:'var(--text-muted)',opacity:0.3}}/>
                </div>
              )}
              <div style={{padding:16}}>
                <div className="card-header" style={{marginBottom:8}}>
                  <h3 className="card-title">{p.name}</h3>
                  <div style={{display:'flex',gap:4}}>
                    <button className="btn-icon" onClick={()=>edit(p)}><FiEdit2/></button>
                    <button className="btn-icon" style={{color:'var(--error)'}} onClick={()=>del(p._id)}><FiTrash2/></button>
                  </div>
                </div>
                <p style={{color:'var(--text-secondary)',fontSize:'0.9rem',marginBottom:12,minHeight:36}}>{p.description||'ללא תיאור'}</p>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span className="chip">{p.category}</span>
                  <span style={{fontWeight:800,color:'var(--accent-gold)',fontSize:'1.2rem'}}>₪{p.defaultPrice?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal&&(
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{maxWidth:480}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editId?'ערוך מוצר':'מוצר חדש'}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={submit}>
              {/* Image Upload */}
              <div className="form-group">
                <label className="form-label">תמונת מוצר</label>
                <div style={{position:'relative',cursor:'pointer'}} onClick={()=>fileRef.current?.click()}>
                  {imagePreview ? (
                    <div style={{position:'relative',height:180,borderRadius:8,overflow:'hidden',border:'2px solid var(--accent-gold)'}}>
                      <img src={imagePreview} alt="preview" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                      <button type="button"
                        style={{position:'absolute',top:8,left:8,background:'rgba(0,0,0,0.7)',border:'none',color:'#fff',borderRadius:'50%',width:28,height:28,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}
                        onClick={e=>{e.stopPropagation();setImagePreview('');setForm(f=>({...f,imageUrl:''}));}}>
                        <FiX/>
                      </button>
                      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.3)',display:'flex',alignItems:'center',justifyContent:'center',opacity:0,transition:'opacity 0.2s'}}
                        onMouseEnter={e=>e.currentTarget.style.opacity=1}
                        onMouseLeave={e=>e.currentTarget.style.opacity=0}>
                        <span style={{color:'#fff',fontWeight:700}}>שנה תמונה</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{height:120,border:'2px dashed var(--border)',borderRadius:8,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,color:'var(--text-muted)',transition:'all 0.2s'}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent-gold)';e.currentTarget.style.background='var(--accent-gold-dim)'}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='transparent'}}>
                      <FiImage style={{fontSize:28}}/>
                      <span style={{fontSize:'0.85rem'}}>לחץ להעלאת תמונה</span>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleImageChange}/>
                {uploading&&<p style={{color:'var(--accent-cyan)',fontSize:'0.85rem',marginTop:4}}>טוען...</p>}
              </div>

              <div className="form-group"><label className="form-label">שם *</label><input className="form-input" required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
              <div className="form-group"><label className="form-label">תיאור</label><textarea className="form-textarea" style={{minHeight:70}} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">מחיר ברירת מחדל</label><input className="form-input" type="number" value={form.defaultPrice} onChange={e=>setForm(f=>({...f,defaultPrice:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">קטגוריה</label><input className="form-input" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}/></div>
              </div>
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

export default Products;
