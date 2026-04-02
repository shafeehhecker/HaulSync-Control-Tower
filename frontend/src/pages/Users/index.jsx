import { useState } from 'react';
import { Users, Plus, Trash2, Edit2, Shield } from 'lucide-react';
import { PageHeader, Btn, Modal, FormField, EmptyState, Table, StatusBadge } from '../../components/common';

const MOCK_USERS = [
  { id:'USR-001', name:'Admin User',      email:'admin@haulsync.local',      role:'SUPER_ADMIN',            active:true,  lastLogin:'Today 09:12' },
  { id:'USR-002', name:'CT Manager',      email:'ct-manager@haulsync.local', role:'CONTROL_TOWER_MANAGER',  active:true,  lastLogin:'Today 08:45' },
  { id:'USR-003', name:'Ops Operator',    email:'operator@haulsync.local',   role:'OPERATOR',               active:true,  lastLogin:'Today 14:22' },
  { id:'USR-004', name:'Viewer Account',  email:'viewer@haulsync.local',     role:'VIEWER',                 active:true,  lastLogin:'Yesterday' },
  { id:'USR-005', name:'Night Operator',  email:'nightops@haulsync.local',   role:'OPERATOR',               active:false, lastLogin:'3 days ago' },
];

const ROLES = ['SUPER_ADMIN','ADMIN','CONTROL_TOWER_MANAGER','OPERATOR','VIEWER'];

const ROLE_COLORS = {
  SUPER_ADMIN:            'badge-red',
  ADMIN:                  'badge-orange',
  CONTROL_TOWER_MANAGER:  'badge-amber',
  OPERATOR:               'badge-blue',
  VIEWER:                 'badge-zinc',
};

export default function UsersPage() {
  const [users, setUsers]     = useState(MOCK_USERS);
  const [newOpen, setNewOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm]       = useState({ name:'', email:'', role:'OPERATOR', password:'' });

  const saveNew = () => {
    setUsers(p => [...p, { ...form, id:`USR-00${p.length+1}`, active:true, lastLogin:'Never' }]);
    setNewOpen(false);
    setForm({ name:'', email:'', role:'OPERATOR', password:'' });
  };

  const toggleActive = (id) => {
    setUsers(p => p.map(u => u.id === id ? { ...u, active: !u.active } : u));
  };

  const deleteUser = (id) => {
    setUsers(p => p.filter(u => u.id !== id));
  };

  const columns = [
    { key:'name', label:'User', render: r => (
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-amber-400 text-xs font-bold">{r.name.charAt(0)}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-200">{r.name}</p>
            <p className="text-xs text-zinc-500">{r.email}</p>
          </div>
        </div>
      )
    },
    { key:'role', label:'Role', render: r => (
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${ROLE_COLORS[r.role] || 'badge-zinc'}`}>
          {r.role.replace(/_/g,' ')}
        </span>
      )
    },
    { key:'active', label:'Status', render: r => (
        r.active
          ? <span className="badge-green text-[11px] px-2 py-0.5 rounded-md">Active</span>
          : <span className="badge-zinc text-[11px] px-2 py-0.5 rounded-md">Inactive</span>
      )
    },
    { key:'lastLogin', label:'Last Login', render: r => (
        <span className="text-xs text-zinc-500">{r.lastLogin}</span>
      )
    },
    { key:'actions', label:'', render: r => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); setEditUser(r); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
            <Edit2 size={13}/>
          </button>
          <button onClick={(e) => { e.stopPropagation(); toggleActive(r.id); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
            <Shield size={13}/>
          </button>
          <button onClick={(e) => { e.stopPropagation(); deleteUser(r.id); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 size={13}/>
          </button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Users"
        subtitle="Manage access and roles for Control Tower"
        actions={
          <Btn onClick={() => setNewOpen(true)}>
            <Plus size={14}/> Add User
          </Btn>
        }
      />

      {/* Role reference */}
      <div className="card p-4">
        <p className="text-xs text-zinc-500 font-medium mb-3 uppercase tracking-wider">Role Permissions</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {[
            { role:'SUPER_ADMIN',           desc:'Full system access' },
            { role:'ADMIN',                 desc:'All ops, no config' },
            { role:'CONTROL_TOWER_MANAGER', desc:'Monitor + configure rules' },
            { role:'OPERATOR',              desc:'Acknowledge + action' },
            { role:'VIEWER',                desc:'Read-only dashboard' },
          ].map(r => (
            <div key={r.role} className="p-2.5 bg-zinc-800/50 rounded-lg">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${ROLE_COLORS[r.role] || 'badge-zinc'}`}>
                {r.role.replace(/_/g,' ')}
              </span>
              <p className="text-[11px] text-zinc-500 mt-1.5">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-800">
          <Users size={15} className="text-amber-400"/>
          <span className="font-display font-semibold text-zinc-100 text-sm">
            Users <span className="text-zinc-500 font-normal">({users.length})</span>
          </span>
        </div>
        <Table
          columns={columns}
          rows={users}
          emptyState={<EmptyState icon={Users} title="No users" description="Add your first user to get started"/>}
        />
      </div>

      {/* New User Modal */}
      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Add User">
        <div className="space-y-4">
          <FormField label="Full Name" required>
            <input className="input-field" placeholder="e.g. Jane Smith"
              value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}/>
          </FormField>
          <FormField label="Email" required>
            <input type="email" className="input-field" placeholder="jane@haulsync.local"
              value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))}/>
          </FormField>
          <FormField label="Role" required>
            <select className="input-field" value={form.role}
              onChange={e => setForm(p => ({...p, role: e.target.value}))}>
              {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
            </select>
          </FormField>
          <FormField label="Password" required>
            <input type="password" className="input-field" placeholder="Min. 8 characters"
              value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))}/>
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="secondary" onClick={() => setNewOpen(false)}>Cancel</Btn>
            <Btn onClick={saveNew} disabled={!form.name || !form.email || !form.password}>
              Create User
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
        {editUser && (
          <div className="space-y-4">
            <FormField label="Full Name">
              <input className="input-field" defaultValue={editUser.name}/>
            </FormField>
            <FormField label="Role">
              <select className="input-field" defaultValue={editUser.role}>
                {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
              </select>
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Btn variant="secondary" onClick={() => setEditUser(null)}>Cancel</Btn>
              <Btn onClick={() => setEditUser(null)}>Save Changes</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
