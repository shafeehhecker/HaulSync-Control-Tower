import { useState } from 'react';
import { Bell, BellOff, ChevronRight, Clock, User } from 'lucide-react';
import { PageHeader, StatusBadge, SeverityDot, Btn, EmptyState, Table } from '../../components/common';

const MOCK = [
  { id:'ALT-101', exceptionId:'EX-001', type:'UNPLANNED_HALT',   channel:'IN_APP',  assignedTo:'operator@haulsync.local',  role:'OPERATOR',  status:'PENDING',      sentAt:'14:32', escalatedAt:null },
  { id:'ALT-102', exceptionId:'EX-002', type:'SLA_BREACH_RISK',  channel:'EMAIL',   assignedTo:'ct-manager@haulsync.local',role:'CT_MANAGER', status:'ESCALATED',    sentAt:'14:18', escalatedAt:'15:18' },
  { id:'ALT-103', exceptionId:'EX-003', type:'ROUTE_DEVIATION',  channel:'IN_APP',  assignedTo:'operator@haulsync.local',  role:'OPERATOR',  status:'ACKNOWLEDGED', sentAt:'13:40', escalatedAt:null },
  { id:'ALT-104', exceptionId:'EX-004', type:'DELAY_RISK',       channel:'EMAIL',   assignedTo:'operator@haulsync.local',  role:'OPERATOR',  status:'PENDING',      sentAt:'13:05', escalatedAt:null },
  { id:'ALT-105', exceptionId:'EX-005', type:'NIGHT_DRIVING',    channel:'IN_APP',  assignedTo:'operator@haulsync.local',  role:'OPERATOR',  status:'PENDING',      sentAt:'02:10', escalatedAt:null },
  { id:'ALT-106', exceptionId:'EX-006', type:'GEOFENCE_VIOLATION',channel:'WEBHOOK',assignedTo:'ct-manager@haulsync.local',role:'CT_MANAGER', status:'RESOLVED',     sentAt:'11:22', escalatedAt:null },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(MOCK);
  const [filter, setFilter] = useState('All');

  const filtered = filter === 'All' ? alerts : alerts.filter(a => a.status === filter);

  const acknowledge = (id) => {
    setAlerts(p => p.map(a => a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a));
  };

  const channelBadge = (ch) => {
    const map = { IN_APP:'badge-blue', EMAIL:'badge-purple', WEBHOOK:'badge-zinc' };
    return <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${map[ch] || 'badge-zinc'}`}>{ch}</span>;
  };

  const columns = [
    { key:'id', label:'Alert', render: r => (
        <div>
          <p className="font-mono text-xs text-zinc-400">{r.id}</p>
          <p className="text-xs text-zinc-500">← {r.exceptionId}</p>
        </div>
      )
    },
    { key:'type', label:'Exception Type', render: r => <StatusBadge status={r.type} /> },
    { key:'channel', label:'Channel', render: r => channelBadge(r.channel) },
    { key:'assignedTo', label:'Assigned To', render: r => (
        <div>
          <p className="text-xs text-zinc-300 truncate max-w-[160px]">{r.assignedTo}</p>
          <p className="text-[11px] text-zinc-500">{r.role}</p>
        </div>
      )
    },
    { key:'sentAt', label:'Sent', render: r => (
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <Clock size={11} /> {r.sentAt}
        </div>
      )
    },
    { key:'escalatedAt', label:'Escalated', render: r => (
        r.escalatedAt
          ? <span className="text-xs text-red-400 font-mono">{r.escalatedAt}</span>
          : <span className="text-xs text-zinc-600">—</span>
      )
    },
    { key:'status', label:'Status', render: r => <StatusBadge status={r.status} /> },
    { key:'action', label:'', render: r => r.status === 'PENDING' ? (
        <button onClick={(e) => { e.stopPropagation(); acknowledge(r.id); }}
          className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
          Acknowledge
        </button>
      ) : null
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Alerts & Escalations"
        subtitle="Notification routing and escalation tracking"
        actions={
          <span className="text-xs text-zinc-500">
            {alerts.filter(a => a.status === 'PENDING').length} pending · {alerts.filter(a => a.status === 'ESCALATED').length} escalated
          </span>
        }
      />

      <div className="flex items-center gap-2 flex-wrap">
        {['All','PENDING','ACKNOWLEDGED','ESCALATED','RESOLVED'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${filter === s ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-800">
          <Bell size={15} className="text-amber-400" />
          <span className="font-display font-semibold text-zinc-100 text-sm">
            Alerts <span className="text-zinc-500 font-normal">({filtered.length})</span>
          </span>
        </div>
        <Table
          columns={columns}
          rows={filtered}
          emptyState={<EmptyState icon={BellOff} title="No alerts" description="No alerts match this filter" />}
        />
      </div>
    </div>
  );
}
