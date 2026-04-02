import { useState } from 'react';
import { ClipboardList, Search, Clock, User } from 'lucide-react';
import { PageHeader, StatusBadge, Btn, EmptyState, Table } from '../../components/common';

const MOCK = [
  { id:'ACT-001', exceptionId:'EX-006', shipmentId:'SHP-8788', action:'Contacted transporter',   note:'Driver confirmed detour due to road closure, route re-planned',    takenBy:'operator@haulsync.local',  takenAt:'11:45', resolvedAt:'12:10' },
  { id:'ACT-002', exceptionId:'EX-003', shipmentId:'SHP-8834', action:'Route re-planned',         note:'Alternative route pushed to driver via app',                        takenBy:'operator@haulsync.local',  takenAt:'13:52', resolvedAt:null },
  { id:'ACT-003', exceptionId:'EX-002', shipmentId:'SHP-8799', action:'Notified customer',        note:'Customer informed of 30 min delay, SLA waiver requested',           takenBy:'ct-manager@haulsync.local',takenAt:'14:25', resolvedAt:null },
  { id:'ACT-004', exceptionId:'EX-001', shipmentId:'SHP-8821', action:'Contacted transporter',   note:'Awaiting callback from driver — no response yet',                   takenBy:'operator@haulsync.local',  takenAt:'14:38', resolvedAt:null },
  { id:'ACT-005', exceptionId:'EX-005', shipmentId:'SHP-8812', action:'Awaiting update',          note:'Night driving flagged, fleet manager to review after route completes',takenBy:'operator@haulsync.local', takenAt:'02:15', resolvedAt:null },
];

export default function ActionLogPage() {
  const [search, setSearch] = useState('');

  const filtered = MOCK.filter(a =>
    !search || [a.id, a.exceptionId, a.shipmentId, a.action, a.takenBy].some(
      v => v.toLowerCase().includes(search.toLowerCase())
    )
  );

  const columns = [
    { key:'id', label:'Action ID', render: r => (
        <div>
          <p className="font-mono text-xs text-zinc-300">{r.id}</p>
          <p className="text-[11px] text-zinc-500">{r.exceptionId} · {r.shipmentId}</p>
        </div>
      )
    },
    { key:'action', label:'Action', render: r => (
        <span className="text-sm text-zinc-200 font-medium">{r.action}</span>
      )
    },
    { key:'note', label:'Notes', render: r => (
        <p className="text-xs text-zinc-400 max-w-xs truncate">{r.note}</p>
      )
    },
    { key:'takenBy', label:'Taken By', render: r => (
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-amber-500/20 flex items-center justify-center">
            <User size={10} className="text-amber-400" />
          </div>
          <span className="text-xs text-zinc-400 truncate max-w-[120px]">{r.takenBy}</span>
        </div>
      )
    },
    { key:'takenAt', label:'Taken At', render: r => (
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <Clock size={11} /> {r.takenAt}
        </div>
      )
    },
    { key:'resolvedAt', label:'Resolved At', render: r => (
        r.resolvedAt
          ? <span className="text-xs text-green-400 font-mono">{r.resolvedAt}</span>
          : <span className="badge-amber text-[11px] px-1.5 py-0.5 rounded">In Progress</span>
      )
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Action Log"
        subtitle="Full audit trail of every action taken on exceptions"
      />

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input className="input-field pl-9" placeholder="Search actions…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-800">
          <ClipboardList size={15} className="text-amber-400" />
          <span className="font-display font-semibold text-zinc-100 text-sm">
            Actions <span className="text-zinc-500 font-normal">({filtered.length})</span>
          </span>
        </div>
        <Table
          columns={columns}
          rows={filtered}
          emptyState={<EmptyState icon={ClipboardList} title="No actions logged" description="Actions will appear here as operators respond to exceptions" />}
        />
      </div>
    </div>
  );
}
