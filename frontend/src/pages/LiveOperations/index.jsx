import { useState } from 'react';
import { Search, Filter, MapPin, Clock, Truck } from 'lucide-react';
import { PageHeader, StatusBadge, LivePulse, Btn, EmptyState, Table } from '../../components/common';

const MOCK_SHIPMENTS = [
  { id:'SHP-8821', reference:'HS/2026/8821', origin:'Mumbai', destination:'Delhi', transporter:'FastFreight Co', vehicle:'MH-04-AB-1234', status:'HALTED',     eta:'16:30', slaDeadline:'17:00', source:'haulsync-ftl' },
  { id:'SHP-8799', reference:'HS/2026/8799', origin:'Pune',   destination:'Nagpur',transporter:'NorthLine Ltd',  vehicle:'MH-12-CD-5678', status:'DELAYED',     eta:'18:45', slaDeadline:'17:30', source:'haulsync-ftl' },
  { id:'SHP-8834', reference:'HS/2026/8834', origin:'Chennai',destination:'Bangalore',transporter:'Atlas Haulage',vehicle:'TN-09-EF-9012',status:'IN_TRANSIT',  eta:'15:50', slaDeadline:'16:30', source:'haulsync-ftl' },
  { id:'SHP-8801', reference:'HS/2026/8801', origin:'Kolkata',destination:'Bhubaneswar',transporter:'SwiftCargo', vehicle:'WB-02-GH-3456',status:'IN_TRANSIT',  eta:'14:20', slaDeadline:'15:00', source:'generic' },
  { id:'SHP-8812', reference:'HS/2026/8812', origin:'Jaipur', destination:'Ahmedabad',transporter:'SunMove Express',vehicle:'RJ-14-IJ-7890',status:'IN_TRANSIT',eta:'06:10', slaDeadline:'07:00', source:'haulsync-ftl' },
  { id:'SHP-8788', reference:'HS/2026/8988', origin:'Hyderabad',destination:'Vijayawada',transporter:'DeltaLogistics',vehicle:'TS-08-KL-2345',status:'DELIVERED',eta:'12:15', slaDeadline:'13:00', source:'generic' },
];

const STATUS_FILTER = ['All', 'IN_TRANSIT', 'HALTED', 'DELAYED', 'EXCEPTION', 'DELIVERED'];

export default function LiveOperations() {
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('All');

  const filtered = MOCK_SHIPMENTS.filter(s => {
    const matchesSearch = !search || [s.id, s.reference, s.transporter, s.origin, s.destination].some(
      v => v.toLowerCase().includes(search.toLowerCase())
    );
    const matchesFilter = filter === 'All' || s.status === filter;
    return matchesSearch && matchesFilter;
  });

  const columns = [
    { key:'reference', label:'Shipment', render: r => (
        <div>
          <p className="text-zinc-200 font-medium">{r.reference}</p>
          <p className="text-xs text-zinc-500 font-mono">{r.id}</p>
        </div>
      )
    },
    { key:'route', label:'Route', render: r => (
        <div className="flex items-center gap-1.5 text-sm text-zinc-300">
          <span>{r.origin}</span>
          <span className="text-zinc-600">→</span>
          <span>{r.destination}</span>
        </div>
      )
    },
    { key:'transporter', label:'Transporter', render: r => (
        <div>
          <p className="text-zinc-300 text-sm">{r.transporter}</p>
          <p className="text-xs text-zinc-500 font-mono">{r.vehicle}</p>
        </div>
      )
    },
    { key:'status', label:'Status', render: r => <StatusBadge status={r.status} /> },
    { key:'eta', label:'ETA', render: r => (
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="text-zinc-500" />
          <span className="font-mono text-xs text-zinc-300">{r.eta}</span>
        </div>
      )
    },
    { key:'slaDeadline', label:'SLA Deadline', render: r => (
        <span className="font-mono text-xs text-zinc-400">{r.slaDeadline}</span>
      )
    },
    { key:'source', label:'Source', render: r => (
        <span className="text-[11px] font-mono text-zinc-500 badge-zinc px-1.5 py-0.5 rounded">{r.source}</span>
      )
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Live Operations"
        subtitle="All active shipments across connected sources"
        actions={<LivePulse label="LIVE" />}
      />

      {/* Source badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-zinc-500">Sources:</span>
        {['haulsync-ftl', 'generic', 'third-party-tms'].map(s => (
          <span key={s} className="text-[11px] font-mono badge-blue px-2 py-0.5 rounded-md">{s}</span>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input className="input-field pl-9" placeholder="Search shipments…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUS_FILTER.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${filter === s ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Truck size={15} className="text-amber-400" />
            <span className="font-display font-semibold text-zinc-100 text-sm">
              Shipments <span className="text-zinc-500 font-normal">({filtered.length})</span>
            </span>
          </div>
          <Btn variant="secondary" size="sm">
            <Filter size={12} /> Filter
          </Btn>
        </div>
        <Table
          columns={columns}
          rows={filtered}
          onRowClick={() => {}}
          emptyState={
            <EmptyState icon={Truck} title="No shipments found"
              description="Try adjusting your search or filter criteria" />
          }
        />
      </div>
    </div>
  );
}
