import { useState, useEffect } from 'react';
import api from '../api/axios';
import { FiUsers, FiTrendingUp, FiDollarSign, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';

const COLORS = ['#EAB21B', '#81C7D5', '#4CAF50', '#f44336', '#FF9800', '#9C27B0'];
const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/dashboard/stats');
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div>
      <div className="page-header"><h1 className="page-title">דשבורד</h1></div>
      <div className="stats-grid">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="stat-card">
            <div style={{width:50,height:50,borderRadius:10,background:'var(--bg-secondary)',animation:'skeleton-pulse 1.5s ease-in-out infinite'}}/>
            <div style={{flex:1}}>
              <div style={{height:28,background:'var(--bg-secondary)',borderRadius:4,marginBottom:8,width:'60%',animation:'skeleton-pulse 1.5s ease-in-out infinite'}}/>
              <div style={{height:14,background:'var(--bg-secondary)',borderRadius:4,width:'80%',animation:'skeleton-pulse 1.5s ease-in-out infinite'}}/>
            </div>
          </div>
        ))}
      </div>
      <div className="grid-2" style={{marginBottom:24}}>
        <div className="card" style={{height:320,background:'var(--bg-card)',animation:'skeleton-pulse 1.5s ease-in-out infinite'}}/>
        <div className="card" style={{height:320,background:'var(--bg-card)',animation:'skeleton-pulse 1.5s ease-in-out infinite'}}/>
      </div>
    </div>
  );

  if (!stats) return <div className="empty-state"><h3>שגיאה בטעינת הנתונים</h3></div>;

  const monthlyChart = stats.monthlyData?.map(m => ({
    name: MONTHS[m._id.month - 1],
    total: m.total,
    won: m.won,
    lost: m.lost,
    revenue: m.revenue,
  })) || [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">דשבורד</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon gold"><FiUsers /></div>
          <div>
            <div className="stat-value">{stats.totalLeads}</div>
            <div className="stat-label">סה"כ לידים</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cyan"><FiClock /></div>
          <div>
            <div className="stat-value">{stats.trackingLeads}</div>
            <div className="stat-label">במעקב</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FiCheckCircle /></div>
          <div>
            <div className="stat-value">{stats.wonLeads}</div>
            <div className="stat-label">WIN</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><FiXCircle /></div>
          <div>
            <div className="stat-value">{stats.lostLeads}</div>
            <div className="stat-label">LOST</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon gold"><FiTrendingUp /></div>
          <div>
            <div className="stat-value">{stats.conversionRate}%</div>
            <div className="stat-label">יחס המרה</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cyan"><FiDollarSign /></div>
          <div>
            <div className="stat-value">₪{stats.totalRevenue?.toLocaleString()}</div>
            <div className="stat-label">הכנסות</div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Monthly Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">לידים לפי חודש</h3>
          </div>
          {monthlyChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                <XAxis dataKey="name" tick={{ fill: '#B0B0B0', fontSize: 12 }} />
                <YAxis tick={{ fill: '#B0B0B0', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 8, direction: 'rtl' }} />
                <Bar dataKey="won" name="WIN" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lost" name="LOST" fill="#f44336" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total" name="סה״כ" fill="#EAB21B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><p>אין נתונים עדיין</p></div>
          )}
        </div>

        {/* Event Type Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">התפלגות סוגי אירועים</h3>
          </div>
          {stats.eventTypes?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stats.eventTypes.map(e => ({ name: e._id || 'לא צוין', value: e.count }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={50}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {stats.eventTypes.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><p>אין נתונים עדיין</p></div>
          )}
        </div>
      </div>

      {/* Handler Performance */}
      {stats.handlerStats?.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h3 className="card-title">ביצועי אנשי מכירות</h3>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>שם</th>
                  <th>סה"כ לידים</th>
                  <th>WIN</th>
                  <th>LOST</th>
                  <th>יחס המרה</th>
                  <th>הכנסות</th>
                </tr>
              </thead>
              <tbody>
                {stats.handlerStats.map((h, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700 }}>{h.handlerName}</td>
                    <td>{h.total}</td>
                    <td><span className="badge badge-won">{h.won}</span></td>
                    <td><span className="badge badge-lost">{h.lost}</span></td>
                    <td><span className="text-gold">{h.conversionRate?.toFixed(1)}%</span></td>
                    <td>₪{h.revenue?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lost Reasons */}
      {stats.lostReasons?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">סיבות LOST</h3>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {stats.lostReasons.map((r, i) => (
              <div key={i} className="chip">
                <span>{r._id}</span>
                <span className="text-error" style={{ fontWeight: 700 }}>{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
