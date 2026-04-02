import { useState, useEffect } from 'react';
import {
  Truck, AlertTriangle, Bell, CheckCircle2,
  Clock, TrendingUp, Zap, Activity,
} from 'lucide-react';
import { StatCard, PageHeader, StatusBadge, LivePulse, TimelineEntry, SeverityDot } from '../components/common';
import api from '../api/client';

const MOCK_STATS = {
  activeShipments: 142,
  exceptions: 7,
  pendingAlerts: 12,
  resolvedToday: 34,
  slaAtRisk: 3,
  onTimeRate: '91.4%',
};

const MOCK_EXCEPTIONS = [
  { id:'EX-001', type:'UNPLANNED_HALT',    shipment:'SHP-8821', transporter:'FastFreight Co', severity:'HIGH',   since:'38 min ago' },
  { id:'EX-002', type:'SLA_BREACH_RISK',   shipment:'SHP-8799', transporter:'NorthLine Ltd',  severity:'HIGH',   since:'1h 12m ago' },
  { id:'EX-003', type:'ROUTE_DEVIATION',   shipment:'SHP-8834', transporter:'Atlas Haulage',  severity:'MEDIUM', since:'22 min ago' },
  { id:'EX-004', type:'DELAY_RISK',        shipment:'SHP-8801', transporter:'SwiftCargo',     severity:'MEDIUM', since:'55 min ago' },
  { id:'EX-005', type:'NIGHT_DRIVING',     shipment:'SHP-8812', transporter:'SunMove Express',severity:'LOW',    since:'2h ago' },
];

const MOCK_TIMELINE = [
  { time:'14:32', title:'SHP-8821 halt auto-detected', description:'Vehicle stationary for 38 min — operator notified', color:'red' },
  { time:'14:18', title:'SHP-8799 SLA breach risk raised', description:'ETA revised — 1h 45m to deadline', color:'amber' },
  { time:'13:55', title:'SHP-8790 exception resolved', description:'Halt resolved — vehicle resumed, action logged', color:'green' },
  { time:'13:40', title:'SHP-8834 route deviation', description:'Vehicle deviated 4.2 km from planned route', color:'orange' },
  { time:'13:10', title:'3 alerts auto-escalated', description:'Escalation threshold passed, managers notified', color:'amber' },
  { time:'12:48', title:'SHP-8780 delivered on time', description:'POD captured — SLA met', color:'green' },
];

export default function Dashboard() {
  const [stats] = useState(MOCK_STATS);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-100">Command Center</h1>
          <p className="text-zinc-400 text-sm mt-1">Real-time operations overview</p>
        </div>
        <LivePulse label="LIVE · AUTO-REFRESH" />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 stagger">
        <StatCard label="Active Shipments"  value={stats.activeShipments} icon={Truck}         color="blue"   delta="↑ 8 vs yesterday" />
        <StatCard label="Open Exceptions"   value={stats.exceptions}      icon={AlertTriangle}  color="red"    delta="3 high severity" pulse />
        <StatCard label="Pending Alerts"    value={stats.pendingAlerts}   icon={Bell}           color="amber"  delta="4 escalated" />
        <StatCard label="Resolved Today"    value={stats.resolvedToday}   icon={CheckCircle2}   color="green"  delta="avg 22 min TTR" />
        <StatCard label="SLA at Risk"       value={stats.slaAtRisk}       icon={Clock}          color="orange" delta="within 2h window" />
        <StatCard label="On-Time Rate"      value={stats.onTimeRate}      icon={TrendingUp}     color="teal"   delta="last 7 days" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Active exceptions */}
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-400" />
              <h2 className="font-display font-semibold text-zinc-100 text-sm">Active Exceptions</h2>
            </div>
            <a href="/exceptions" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">View all →</a>
          </div>
          <div className="divide-y divide-zinc-800/60">
            {MOCK_EXCEPTIONS.map((ex) => (
              <div key={ex.id} className="flex items-center gap-4 px-5 py-3 hover:bg-zinc-900/40 transition-colors cursor-pointer">
                <SeverityDot level={ex.severity} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-zinc-500">{ex.id}</span>
                    <StatusBadge status={ex.type} />
                  </div>
                  <p className="text-sm text-zinc-300 mt-0.5 truncate">{ex.shipment} · {ex.transporter}</p>
                </div>
                <p className="text-xs text-zinc-500 flex-shrink-0">{ex.since}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Activity timeline */}
        <div className="card">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-800">
            <Activity size={15} className="text-amber-400" />
            <h2 className="font-display font-semibold text-zinc-100 text-sm">Activity Feed</h2>
          </div>
          <div className="px-5 py-4">
            {MOCK_TIMELINE.map((ev, i) => (
              <TimelineEntry key={i} {...ev} last={i === MOCK_TIMELINE.length - 1} />
            ))}
          </div>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label:'Exception Rate', value:'4.9%', sub:'of active shipments', color:'text-amber-400' },
          { label:'Avg Response Time', value:'18 min', sub:'alert → action taken', color:'text-blue-400' },
          { label:'Auto-Resolved', value:'62%', sub:'no manual action needed', color:'text-green-400' },
        ].map((s) => (
          <div key={s.label} className="card px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">{s.label}</p>
              <p className={`font-display text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{s.sub}</p>
            </div>
            <Zap size={28} className="text-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
