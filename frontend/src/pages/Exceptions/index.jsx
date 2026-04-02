import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Search, ChevronDown } from 'lucide-react';
import { PageHeader, StatusBadge, SeverityDot, Btn, Modal, FormField, EmptyState, Table } from '../../components/common';

const MOCK = [
  { id:'EX-001', type:'UNPLANNED_HALT',   shipmentId:'SHP-8821', transporter:'FastFreight Co', severity:'HIGH',   status:'OPEN',        raisedAt:'14:32', description:'Vehicle stationary for 38 min outside geofenced stop' },
  { id:'EX-002', type:'SLA_BREACH_RISK',  shipmentId:'SHP-8799', transporter:'NorthLine Ltd',  severity:'HIGH',   status:'ESCALATED',   raisedAt:'14:18', description:'Current ETA 17:45 vs SLA 17:30 — 15 min risk window' },
  { id:'EX-003', type:'ROUTE_DEVIATION',  shipmentId:'SHP-8834', transporter:'Atlas Haulage',  severity:'MEDIUM', status:'ACKNOWLEDGED',raisedAt:'13:40', description:'Vehicle deviated 4.2 km from planned route polyline' },
  { id:'EX-004', type:'DELAY_RISK',       shipmentId:'SHP-8801', transporter:'SwiftCargo',     severity:'MEDIUM', status:'OPEN',        raisedAt:'13:05', description:'ETA slipped by 55 min beyond delay threshold' },
  { id:'EX-005', type:'NIGHT_DRIVING',    shipmentId:'SHP-8812', transporter:'SunMove Express',severity:'LOW',    status:'OPEN',        raisedAt:'02:10', description:'Vehicle in motion during restricted hours 02:00–05:00' },
  { id:'EX-006', type:'GEOFENCE_VIOLATION',shipmentId:'SHP-8788',transporter:'DeltaLogistics', severity:'MEDIUM', status:'RESOLVED',    raisedAt:'11:22', description:'Entry into restricted industrial zone detected' },
];

const ACTIONS = ['Contacted transporter', 'Dispatched support vehicle', 'Notified customer', 'Escalated to manager', 'Awaiting update', 'Route re-planned'];

export default function ExceptionsPage() {
  const [items, setItems] = useState(MOCK);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [actionNote, setActionNote] = useState('');
  const [actionType, setActionType] = useState('');

  const filtered = items.filter(ex => {
    const matchesFilter = filter === 'All' || ex.status === filter;
    const matchesSearch = !search || [ex.id, ex.shipmentId, ex.transporter, ex.type].some(
      v => v.toLowerCase().includes(search.toLowerCase())
    );
    return matchesFilter && matchesSearch;
  });

  const resolveException = (id) => {
    setItems(p => p.map(ex => ex.id === id ? { ...ex, status: 'RESOLVED' } : ex));
    setSelected(null);
  };

  const columns = [
    { key:'id', label:'Exception', render: r => (
        <div>
          <p className="font-mono text-xs text-zinc-400">{r.id}</p>
          <StatusBadge status={r.type} />
        </div>
      )
    },
    { key:'severity', label:'Severity', render: r => (
        <div className="flex items-center gap-2">
          <SeverityDot level={r.severity} />
          <span className="text-xs text-zinc-400">{r.severity}</span>
        </div>
      )
    },
    { key:'shipmentId', label:'Shipment', render: r => (
        <div>
          <p className="font-medium text-zinc-200">{r.shipmentId}</p>
          <p className="text-xs text-zinc-500">{r.transporter}</p>
        </div>
      )
    },
    { key:'description', label:'Description', render: r => (
        <p className="text-xs text-zinc-400 max-w-xs truncate">{r.description}</p>
      )
    },
    { key:'raisedAt', label:'Raised', render: r => (
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <Clock size={11} /> {r.raisedAt}
        </div>
      )
    },
    { key:'status', label:'Status', render: r => <StatusBadge status={r.status} /> },
    { key:'actions', label:'', render: r => r.status !== 'RESOLVED' ? (
        <button onClick={(e) => { e.stopPropagation(); setSelected(r); }}
          className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
          Take Action →
        </button>
      ) : null
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Exceptions"
        subtitle="Disruptions detected across all active shipments"
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">{items.filter(e => e.status !== 'RESOLVED').length} open</span>
          </div>
        }
      />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input className="input-field pl-9" placeholder="Search exceptions…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['All','OPEN','ACKNOWLEDGED','ESCALATED','RESOLVED'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${filter === s ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-800">
          <AlertTriangle size={15} className="text-amber-400" />
          <span className="font-display font-semibold text-zinc-100 text-sm">
            Exceptions <span className="text-zinc-500 font-normal">({filtered.length})</span>
          </span>
        </div>
        <Table
          columns={columns}
          rows={filtered}
          onRowClick={setSelected}
          emptyState={<EmptyState icon={CheckCircle2} title="No exceptions" description="All shipments are operating normally" />}
        />
      </div>

      {/* Action modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)}
        title={`Exception ${selected?.id}`} width="max-w-xl">
        {selected && (
          <div className="space-y-5">
            <div className="p-4 bg-zinc-800/50 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <SeverityDot level={selected.severity} />
                <StatusBadge status={selected.type} />
                <StatusBadge status={selected.status} />
              </div>
              <p className="text-sm text-zinc-300 font-medium">{selected.shipmentId} · {selected.transporter}</p>
              <p className="text-xs text-zinc-400">{selected.description}</p>
            </div>

            <FormField label="Action Taken" required>
              <select className="input-field" value={actionType} onChange={e => setActionType(e.target.value)}>
                <option value="">Select action…</option>
                {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </FormField>

            <FormField label="Notes">
              <textarea className="input-field" rows={3} placeholder="Add resolution notes…"
                value={actionNote} onChange={e => setActionNote(e.target.value)} />
            </FormField>

            <div className="flex items-center gap-2 justify-end pt-2">
              <Btn variant="secondary" onClick={() => setSelected(null)}>Cancel</Btn>
              <Btn variant="success" onClick={() => resolveException(selected.id)}>
                <CheckCircle2 size={14} /> Mark Resolved
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
