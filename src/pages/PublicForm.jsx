import { useState, useEffect } from 'react';
import api from '../api/axios';

const formSections = {
  he: {
    title: 'בואו נדבר על האירוע שלכם',
    subtitle: 'מלאו את הפרטים ונחזור אליכם בהקדם!',
    sections: [
      {
        heading: '👤 פרטים אישיים',
        subheading: 'ספרו לנו מי אתם',
        fields: ['fullName', 'phone', 'email']
      },
      {
        heading: '💍 פרטי האירוע',
        subheading: 'ספרו לנו על היום המיוחד',
        fields: ['eventType', 'eventDate', 'location']
      },
      {
        heading: '🎵 איך הגעתם אלינו?',
        subheading: 'נשמח לדעת',
        fields: ['howHeardAboutUs', 'referredBy']
      },
      {
        heading: '✉️ הודעה',
        subheading: 'יש משהו שחשוב לכם שנדע?',
        fields: ['message']
      }
    ],
    submit: 'שלחו פנייה',
    thankYou: 'נחזור אליכם בהקדם!',
  },
  en: {
    title: "Let's Talk About Your Event",
    subtitle: 'Fill in your details and we\'ll get back to you soon!',
    sections: [
      {
        heading: '👤 Personal Details',
        subheading: 'Tell us who you are',
        fields: ['fullName', 'phone', 'email']
      },
      {
        heading: '💍 Event Details',
        subheading: 'Tell us about your special day',
        fields: ['eventType', 'eventDate', 'location']
      },
      {
        heading: '🎵 How did you find us?',
        subheading: "We'd love to know",
        fields: ['howHeardAboutUs', 'referredBy']
      },
      {
        heading: '✉️ Message',
        subheading: 'Anything important you want us to know?',
        fields: ['message']
      }
    ],
    submit: 'Send Inquiry',
    thankYou: "We'll get back to you soon!",
  }
};

const fieldLabels = {
  he: {
    fullName: 'שם מלא',
    phone: 'טלפון',
    email: 'אימייל',
    eventType: 'סוג האירוע',
    eventDate: 'תאריך האירוע',
    location: 'מיקום האירוע',
    howHeardAboutUs: 'איך שמעתם עלינו?',
    referredBy: 'מי המליץ?',
    message: 'הודעה',
  },
  en: {
    fullName: 'Full Name',
    phone: 'Phone',
    email: 'Email',
    eventType: 'Event Type',
    eventDate: 'Event Date',
    location: 'Event Location',
    howHeardAboutUs: 'How did you hear about us?',
    referredBy: 'Who referred you?',
    message: 'Message',
  }
};

const PublicForm = () => {
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('he');

  useEffect(() => {
    api.get('/forms/config').then(({data}) => {
      setConfig(data);
      const initial = {};
      data.fields?.forEach(f => { initial[f.name] = ''; });
      setForm(initial);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/forms/submit', {...form, lang});
      setSubmitted(true);
    } catch(err) { alert(err.response?.data?.message || 'שגיאה'); }
  };

  if(loading) return (
    <div style={{display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',minHeight:'100vh',background:'#0a0a0a',gap:20}}>
      <div style={{fontSize:'3.5rem',fontFamily:'Georgia,serif',color:'#EAB21B',fontWeight:900,letterSpacing:8}}>KOLOT</div>
      <div className="spinner"/>
    </div>
  );
  if(!config) return null;

  const bg = config.backgroundColor||'#0a0a0a';
  const accent = config.accentColor||'#EAB21B';
  const sections = formSections[lang].sections;
  const labels = fieldLabels[lang];
  const isRtl = lang === 'he';

  const getField = (name) => config.fields?.find(f=>f.name===name);

  if(submitted) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:bg,direction:isRtl?'rtl':'ltr',padding:20}}>
      <div style={{textAlign:'center',maxWidth:500}}>
        {config.logoUrl&&<img src={config.logoUrl} alt="logo" style={{height:80,marginBottom:24,borderRadius:8}}/>}
        <div style={{fontSize:'4rem',marginBottom:16}}>🎉</div>
        <h1 style={{fontSize:'2.2rem',color:accent,fontFamily:'Georgia,serif',letterSpacing:4,marginBottom:12}}>{formSections[lang].thankYou}</h1>
        <p style={{color:'#B0B0B0'}}>{config.thankYouMessage}</p>
        <div style={{fontFamily:'Georgia,serif',fontSize:'2rem',color:'#fff',marginTop:32,letterSpacing:6}}>KOLOT</div>
        <div style={{color:accent,letterSpacing:4,fontSize:'0.85rem',marginTop:4}}>TURN IT UP.</div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:bg,direction:isRtl?'rtl':'ltr',padding:'40px 20px'}}>
      <div style={{maxWidth:640,margin:'0 auto'}}>
        
        {/* Header */}
        <div style={{textAlign:'center',marginBottom:36}}>
          {config.logoUrl ? (
            <img src={config.logoUrl} alt="Kolot" style={{height:80,marginBottom:16,borderRadius:8,objectFit:'contain'}}/>
          ) : (
            <>
              <div style={{fontFamily:'Georgia,serif',fontSize:'3.2rem',color:'#fff',letterSpacing:8,fontWeight:900}}>KOLOT</div>
              <div style={{fontFamily:'Georgia,serif',fontSize:'1rem',color:accent,letterSpacing:5,marginBottom:16}}>TURN IT UP.</div>
            </>
          )}
          
          {/* Language Toggle */}
          <div style={{display:'flex',justifyContent:'center',gap:8,marginBottom:20}}>
            <button onClick={()=>setLang('he')} style={{padding:'6px 18px',background:lang==='he'?accent:'transparent',color:lang==='he'?'#000':'#fff',border:`2px solid ${accent}`,borderRadius:20,fontWeight:700,cursor:'pointer',fontSize:'0.85rem',transition:'all 0.2s'}}>עברית</button>
            <button onClick={()=>setLang('en')} style={{padding:'6px 18px',background:lang==='en'?accent:'transparent',color:lang==='en'?'#000':'#fff',border:`2px solid ${accent}`,borderRadius:20,fontWeight:700,cursor:'pointer',fontSize:'0.85rem',transition:'all 0.2s'}}>English</button>
          </div>
          
          <h1 style={{fontSize:'1.6rem',color:'#fff',fontWeight:700,marginBottom:8}}>{formSections[lang].title}</h1>
          <p style={{color:'#B0B0B0',fontSize:'0.95rem'}}>{formSections[lang].subtitle}</p>
        </div>

        <form onSubmit={submit}>
          {sections.map((section,si) => {
            const sectionFields = section.fields.map(fname=>getField(fname)).filter(Boolean);
            if(sectionFields.length === 0) return null;
            return (
              <div key={si} style={{marginBottom:24,background:'rgba(26,26,46,0.85)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:16,padding:'24px 28px',backdropFilter:'blur(10px)'}}>
                {/* Section Header */}
                <div style={{marginBottom:20,paddingBottom:12,borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
                  <h2 style={{fontSize:'1.05rem',color:'#fff',fontWeight:700,marginBottom:4}}>{section.heading}</h2>
                  <p style={{color:'#888',fontSize:'0.85rem'}}>{section.subheading}</p>
                </div>

                {sectionFields.map(field => (
                  <div key={field.name} style={{marginBottom:18}}>
                    <label style={{display:'block',marginBottom:6,fontWeight:600,color:accent,fontSize:'0.875rem'}}>
                      {labels[field.name]||field.label}{field.required&&' *'}
                    </label>
                    {field.type==='select'?(
                      <select value={form[field.name]||''} onChange={e=>setForm(f=>({...f,[field.name]:e.target.value}))} required={field.required}
                        style={{width:'100%',padding:'12px 16px',background:'rgba(22,33,62,0.9)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:10,color:form[field.name]?'#fff':'#888',fontFamily:'Assistant,sans-serif',fontSize:'0.95rem',appearance:'none',outline:'none',transition:'border-color 0.2s'}}
                        onFocus={e=>e.currentTarget.style.borderColor=accent}
                        onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.15)'}>
                        <option value="">{isRtl?'בחרו...':'Choose...'}</option>
                        {field.options?.map(o=><option key={o} value={o}>{o}</option>)}
                      </select>
                    ):field.type==='textarea'?(
                      <textarea value={form[field.name]||''} onChange={e=>setForm(f=>({...f,[field.name]:e.target.value}))} required={field.required}
                        style={{width:'100%',padding:'12px 16px',background:'rgba(22,33,62,0.9)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:10,color:'#fff',fontFamily:'Assistant,sans-serif',fontSize:'0.95rem',minHeight:110,resize:'vertical',outline:'none',transition:'border-color 0.2s'}}
                        onFocus={e=>e.currentTarget.style.borderColor=accent}
                        onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.15)'}/>
                    ):(
                      <input type={field.type==='phone'?'tel':field.type==='date'?'date':field.type} value={form[field.name]||''} onChange={e=>setForm(f=>({...f,[field.name]:e.target.value}))} required={field.required}
                        style={{width:'100%',padding:'12px 16px',background:'rgba(22,33,62,0.9)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:10,color:'#fff',fontFamily:'Assistant,sans-serif',fontSize:'0.95rem',outline:'none',transition:'border-color 0.2s'}}
                        onFocus={e=>e.currentTarget.style.borderColor=accent}
                        onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.15)'}/>
                    )}
                  </div>
                ))}
              </div>
            );
          })}

          <button type="submit" style={{width:'100%',padding:'16px',background:`linear-gradient(135deg,${accent},#f5c842)`,color:'#000',border:'none',borderRadius:12,fontWeight:800,fontSize:'1.1rem',cursor:'pointer',fontFamily:'Assistant,sans-serif',transition:'all 0.2s',boxShadow:`0 4px 20px ${accent}44`,letterSpacing:1}}
            onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
            onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
            ✉️ {formSections[lang].submit}
          </button>
        </form>

        <p style={{textAlign:'center',marginTop:28,color:'#444',fontSize:'0.8rem'}}>
          © {new Date().getFullYear()} להקת קולות / Kolot Band
        </p>
      </div>
    </div>
  );
};

export default PublicForm;
