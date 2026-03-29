import { useState, useEffect } from 'react';
import api from '../api/axios';
import { FiCalendar, FiRefreshCw } from 'react-icons/fi';

const CalendarPage = () => {
  const [leads, setLeads] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchLeads(); }, []);
  const fetchLeads = async () => {
    try {
      const {data} = await api.get('/leads');
      const items = Array.isArray(data) ? data : data.leads || data;
      setLeads(items.filter(l=>l.eventDate));
    } catch(e){} finally { setLoading(false); }
  };


  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth()+1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  
  const days = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const monthNames = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
  const dayNames = ['א','ב','ג','ד','ה','ו','ש'];

  const getLeadsForDay = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return leads.filter(l => {
      const ld = new Date(l.eventDate);
      return ld.getDate()===date.getDate() && ld.getMonth()===date.getMonth() && ld.getFullYear()===date.getFullYear();
    });
  };

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth()-1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth()+1));

  if(loading) return (
    <div>
      <div className="page-header"><h1 className="page-title">יומן</h1></div>
      <div className="card">
        <div style={{height:32,background:'var(--bg-secondary)',borderRadius:4,marginBottom:24,width:'40%',margin:'0 auto 24px',animation:'skeleton-pulse 1.5s ease-in-out infinite'}}/>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2}}>
          {Array(35).fill(null).map((_,i)=>(
            <div key={i} style={{height:80,background:'var(--bg-secondary)',borderRadius:6,animation:'skeleton-pulse 1.5s ease-in-out infinite',animationDelay:`${i*0.03}s`}}/>
          ))}
        </div>
      </div>
    </div>
  );


  return (
    <div>
      <div className="page-header">
        <h1 className="page-title"><FiCalendar style={{marginLeft:8}}/> יומן</h1>
      </div>

      <div className="card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
          <button className="btn btn-secondary btn-sm" onClick={prevMonth}>→</button>
          <h2 style={{fontFamily:'var(--font-heading)',fontSize:'1.5rem',letterSpacing:2}}>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h2>
          <button className="btn btn-secondary btn-sm" onClick={nextMonth}>←</button>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2}}>
          {dayNames.map(d => (
            <div key={d} style={{textAlign:'center',padding:8,fontWeight:700,color:'var(--accent-gold)',fontSize:'0.9rem'}}>{d}</div>
          ))}
          {Array(firstDay).fill(null).map((_,i) => <div key={`e${i}`}/>)}
          {Array.from({length:days},(_,i)=>i+1).map(day => {
            const dayLeads = getLeadsForDay(day);
            const isToday = new Date().getDate()===day && new Date().getMonth()===currentMonth.getMonth() && new Date().getFullYear()===currentMonth.getFullYear();
            return (
              <div key={day} style={{
                minHeight:80, padding:6, border:'1px solid var(--border)', borderRadius:6,
                background: isToday?'var(--accent-gold-dim)':'var(--bg-secondary)',
              }}>
                <div style={{fontWeight:isToday?800:400,color:isToday?'var(--accent-gold)':'var(--text-secondary)',fontSize:'0.8rem',marginBottom:4}}>{day}</div>
                {dayLeads.map(l => (
                  <div key={l._id} style={{
                    padding:'2px 6px', borderRadius:4, fontSize:'0.7rem', marginBottom:2, cursor:'pointer',
                    background: l.status==='won'?'var(--success-dim)':'var(--accent-gold-dim)',
                    color: l.status==='won'?'var(--success)':'var(--accent-gold)',
                    fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                  }} title={l.title} onClick={()=>window.location.href=`/leads/${l._id}`}>
                    {l.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <div style={{display:'flex',gap:16,marginTop:16,justifyContent:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:12,height:12,borderRadius:3,background:'var(--accent-gold-dim)',border:'1px solid var(--accent-gold)'}}/><span style={{fontSize:'0.85rem',color:'var(--text-secondary)'}}>מעקב</span></div>
          <div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:12,height:12,borderRadius:3,background:'var(--success-dim)',border:'1px solid var(--success)'}}/><span style={{fontSize:'0.85rem',color:'var(--text-secondary)'}}>WIN</span></div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
