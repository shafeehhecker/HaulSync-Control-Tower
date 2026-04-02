import { useState } from 'react';
import { Settings, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { PageHeader, StatusBadge, Btn, Modal, FormField, EmptyState } from '../../components/common';

const MOCK_RULES = [
  { id:'RULE-01', exceptionType:'UNPLANNED_HALT',   source:'*', triggerAfterMinutes:30, notifyRoles:['OPERATOR'],  escalateAfterMinutes:60,  escalateToRoles:['CONTROL_TOWER_MANAGER'], channels:['IN_APP','EMAIL'], autoResolveOnMovement:true,  active:true },
  { id:'RULE-02', exceptionType:'ROUTE_DEVIATION',  source:'*', triggerAfterMinutes:0,  notifyRoles:['OPERATOR'],  escalateAfterMinutes:30,  escalateToRoles:['CONTROL_TOWER_MANAGER'], channels:['IN_APP'],        autoResolveOnMovement:false, active:true },
  { id:'RULE-03', exceptionType:'SLA_BREACH_RISK',  source:'*', triggerAfterMinutes:0,  notifyRoles:['CONTROL_TOWER_MANAGER'], escalateAfterMinutes:30, escalateToRoles:['ADMIN'], channels:['IN_APP','EMAIL'], autoResolveOnMovement:false, active:true },
  { id:'RULE-04', exceptionType:'DELAY_RISK',       source:'haulsync-ftl', triggerAfterMinutes:60, notifyRoles:['OPERATOR'], escalateAfterMinutes:90, escalateToRoles:['CONTROL_TOWER_MANAGER'], channels:['EMAIL'], autoResolveOnMovement:false, active:false },
  { id:'RULE-05', exceptionType:'NIGHT_DRIVING',    source:'*', triggerAfterMinutes:0,  notifyRoles:['OPERATOR'],  escalateAfterMinutes:0,   escalateToRoles:[],                         channels:['IN_APP'],        autoResolveOnMovement:false, active:true },
];

export default function RulesPage() {
  const [rules, setRules] = useState(MOCK_RULES);
  const [newOpen, setNewOpen] = useState(false);

  const toggleActive = (id) => {
    setRules(p => p.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const deleteRule = (id) => {
    setRules(p => p.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Alert Rules"
        subtitle="Configure notification routing and escalation thresholds"
        actions={
          <Btn onClick={() => setNewOpen(true)}>
            <Plus size={14} /> New Rule
          </Btn>
        }
      />

      <div className="space-y-3">
        {rules.map(rule => (
          <div key={rule.id} className={`card p-5 transition-opacity ${rule.active ? '' : 'opacity-60'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs text-zinc-500">{rule.id}</span>
                  <StatusBadge status={rule.exceptionType} />
                  {rule.source !== '*'
                    ? <span className="badge-blue text-[11px] font-mono px-1.5 py-0.5 rounded">{rule.source}</span>
                    : <span className="badge-zinc text-[11px] font-mono px-1.5 py-0.5 rounded">all sources</span>
                  }
                  {!rule.active && <span className="badge-zinc text-[11px] px-1.5 py-0.5 rounded">INACTIVE</span>}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <p className="text-zinc-500 mb-0.5">Trigger after</p>
                    <p className="text-zinc-300 font-mono">{rule.triggerAfterMinutes} min</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 mb-0.5">Notify</p>
                    <p className="text-zinc-300">{rule.notifyRoles.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 mb-0.5">Escalate after</p>
                    <p className="text-zinc-300 font-mono">{rule.escalateAfterMinutes} min</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 mb-0.5">Escalate to</p>
                    <p className="text-zinc-300">{rule.escalateToRoles.join(', ') || '—'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {rule.channels.map(ch => (
                    <span key={ch} className="badge-blue text-[11px] font-mono px-1.5 py-0.5 rounded">{ch}</span>
                  ))}
                  {rule.autoResolveOnMovement && (
                    <span className="badge-green text-[11px] px-1.5 py-0.5 rounded">Auto-resolve on movement</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggleActive(rule.id)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                    ${rule.active ? 'text-green-400 hover:bg-green-500/10' : 'text-zinc-500 hover:bg-zinc-800'}`}>
                  {rule.active ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>}
                </button>
                <button onClick={() => deleteRule(rule.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          </div>
        ))}
        {rules.length === 0 && (
          <EmptyState icon={Settings} title="No rules configured"
            description="Add your first alert rule to start routing notifications" />
        )}
      </div>

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="New Alert Rule">
        <div className="space-y-4">
          <FormField label="Exception Type" required>
            <select className="input-field">
              <option value="">Select type…</option>
              {['UNPLANNED_HALT','ROUTE_DEVIATION','SLA_BREACH_RISK','DELAY_RISK','NIGHT_DRIVING','GEOFENCE_VIOLATION'].map(t => (
                <option key={t} value={t}>{t.replace(/_/g,' ')}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Source" hint="Use * for all sources">
            <input className="input-field" defaultValue="*" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Trigger after (min)">
              <input type="number" className="input-field" defaultValue={30} />
            </FormField>
            <FormField label="Escalate after (min)">
              <input type="number" className="input-field" defaultValue={60} />
            </FormField>
          </div>
          <FormField label="Channels">
            <div className="flex gap-3">
              {['IN_APP','EMAIL','WEBHOOK'].map(ch => (
                <label key={ch} className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                  <input type="checkbox" className="accent-amber-500" defaultChecked={ch==='IN_APP'} />
                  {ch}
                </label>
              ))}
            </div>
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="secondary" onClick={() => setNewOpen(false)}>Cancel</Btn>
            <Btn onClick={() => setNewOpen(false)}>Save Rule</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
