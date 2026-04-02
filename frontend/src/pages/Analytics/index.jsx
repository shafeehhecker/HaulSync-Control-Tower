import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart2, TrendingUp, AlertTriangle, Truck } from 'lucide-react';
import { PageHeader, StatCard } from '../../components/common';

const EXCEPTION_TREND = [
  { day:'Mon', exceptions:12, resolved:10 },
  { day:'Tue', exceptions:8,  resolved:8  },
  { day:'Wed', exceptions:15, resolved:11 },
  { day:'Thu', exceptions:9,  resolved:9  },
  { day:'Fri', exceptions:18, resolved:14 },
  { day:'Sat', exceptions:6,  resolved:6  },
  { day:'Sun', exceptions:7,  resolved:7  },
];

const EXCEPTION_TYPES = [
  { name:'Halt',          value:28, color:'#f87171' },
  { name:'Delay Risk',    value:22, color:'#fbbf24' },
  { name:'SLA Breach',    value:15, color:'#fb923c' },
  { name:'Route Dev.',    value:19, color:'#c084fc' },
  { name:'Night Drive',   value:10, color:'#60a5fa' },
  { name:'Geofence',      value:6,  color:'#4ade80' },
];

const TRANSPORTER_PERF = [
  { name:'FastFreight', exceptions:12, onTime:88 },
  { name:'NorthLine',   exceptions:8,  onTime:92 },
  { name:'Atlas',       exceptions:5,  onTime:95 },
  { name:'SwiftCargo',  exceptions:15, onTime:81 },
  { name:'SunMove',     exceptions:9,  onTime:89 },
  { name:'Delta',       exceptions:3,  onTime:97 },
];

const TooltipStyle = {
  contentStyle: { background:'#18181B', border:'1px solid #3F3F46', borderRadius:'8px', color:'#FAFAFA', fontSize:'12px' },
  labelStyle: { color:'#A1A1AA' },
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Insights & Analytics"
        subtitle="Operational performance, exception trends and transporter scoring"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger">
        <StatCard label="Total Exceptions"  value="100"    icon={AlertTriangle} color="red"    delta="last 7 days" />
        <StatCard label="Resolution Rate"   value="85%"    icon={TrendingUp}    color="green"  delta="↑ 3% vs prev week" />
        <StatCard label="Avg TTR"           value="22 min" icon={BarChart2}     color="blue"   delta="time to resolve" />
        <StatCard label="Risky Lanes"       value="4"      icon={Truck}         color="amber"  delta="above threshold" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Exception trend */}
        <div className="card p-5">
          <h3 className="font-display font-semibold text-zinc-100 text-sm mb-4">Exception Trend — Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={EXCEPTION_TREND} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
              <XAxis dataKey="day" tick={{ fill:'#71717A', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#71717A', fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip {...TooltipStyle} />
              <Bar dataKey="exceptions" fill="#F59E0B" radius={[4,4,0,0]} name="Raised" />
              <Bar dataKey="resolved"   fill="#4ade80" radius={[4,4,0,0]} name="Resolved" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500 inline-block"/><span className="text-xs text-zinc-500">Raised</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-400 inline-block"/><span className="text-xs text-zinc-500">Resolved</span></div>
          </div>
        </div>

        {/* Exception type breakdown */}
        <div className="card p-5">
          <h3 className="font-display font-semibold text-zinc-100 text-sm mb-4">Exception Type Breakdown</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={EXCEPTION_TYPES} cx="50%" cy="50%" innerRadius={48} outerRadius={72}
                  dataKey="value" stroke="none">
                  {EXCEPTION_TYPES.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {EXCEPTION_TYPES.map((e) => (
                <div key={e.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: e.color }} />
                    <span className="text-xs text-zinc-400">{e.name}</span>
                  </div>
                  <span className="text-xs font-mono text-zinc-300">{e.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Transporter performance */}
      <div className="card p-5">
        <h3 className="font-display font-semibold text-zinc-100 text-sm mb-4">Transporter Performance</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={TRANSPORTER_PERF} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
            <XAxis dataKey="name" tick={{ fill:'#71717A', fontSize:11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left"  tick={{ fill:'#71717A', fontSize:11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill:'#71717A', fontSize:11 }} axisLine={false} tickLine={false} domain={[0,100]} unit="%" />
            <Tooltip {...TooltipStyle} />
            <Bar yAxisId="left"  dataKey="exceptions" fill="#f87171" radius={[4,4,0,0]} name="Exceptions" />
            <Bar yAxisId="right" dataKey="onTime"     fill="#4ade80" radius={[4,4,0,0]} name="On-Time %" />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-400 inline-block"/><span className="text-xs text-zinc-500">Exceptions</span></div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-400 inline-block"/><span className="text-xs text-zinc-500">On-Time %</span></div>
        </div>
      </div>
    </div>
  );
}
