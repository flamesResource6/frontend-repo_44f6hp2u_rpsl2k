import { useEffect, useMemo, useState } from 'react'

const API = import.meta.env.VITE_BACKEND_URL || ''

function useAuth() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [me, setMe] = useState(null)

  useEffect(() => {
    if (!token) return
    fetch(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setMe)
      .catch(() => setMe(null))
  }, [token])

  const login = async (email, password) => {
    const body = new URLSearchParams()
    body.append('username', email)
    body.append('password', password)
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    })
    const data = await res.json()
    if (data.access_token) {
      localStorage.setItem('token', data.access_token)
      setToken(data.access_token)
    } else {
      throw new Error(data.detail || 'Login failed')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken('')
    setMe(null)
  }

  return { token, me, login, logout }
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await onLogin(email, password)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Recruitment Manager</h1>
        <p className="text-slate-500 mb-6">Sign in to your dashboard</p>
        {error && <div className="bg-red-50 text-red-600 p-2 rounded mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Email" />
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" className="w-full border rounded px-3 py-2" placeholder="Password" />
          <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Sign In</button>
        </form>
        <p className="text-xs text-slate-500 mt-4">Seed creds after server starts: admin@demo.com / admin123, lead@demo.com / lead123, emp1@demo.com / emp123</p>
      </div>
    </div>
  )
}

function Stat({ label, value, color = 'bg-blue-100 text-blue-700' }) {
  return (
    <div className={`p-4 rounded-lg ${color}`}>
      <div className="text-xs uppercase tracking-wide opacity-80">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}

function Topbar({ me, onLogout }) {
  return (
    <div className="flex items-center justify-between p-4 border-b bg-white">
      <div className="font-semibold">Welcome, {me?.name}</div>
      <div className="text-sm text-slate-500">Role: {me?.role}</div>
      <button onClick={onLogout} className="text-sm text-red-600">Logout</button>
    </div>
  )
}

function Shell({ me, onLogout, children }) {
  const menu = useMemo(() => {
    const items = [{ key: 'requirements', label: 'Requirements' }]
    if (me?.role === 'superadmin') items.unshift({ key: 'users', label: 'Users' })
    return items
  }, [me])
  const [active, setActive] = useState(menu[0]?.key)

  return (
    <div className="min-h-screen bg-slate-50">
      <Topbar me={me} onLogout={onLogout} />
      <div className="flex">
        <aside className="w-56 bg-white border-r p-4 space-y-2">
          {menu.map(m => (
            <button key={m.key} onClick={()=>setActive(m.key)} className={`w-full text-left px-3 py-2 rounded ${active===m.key? 'bg-blue-600 text-white':'hover:bg-slate-100'}`}>{m.label}</button>
          ))}
        </aside>
        <main className="flex-1 p-6 space-y-6">
          {children(active)}
        </main>
      </div>
    </div>
  )
}

function Users({ token }) {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'lead', lead_id: '' })

  const load = () => fetch(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json()).then(setUsers)
  useEffect(load, [token])

  const submit = async (e) => {
    e.preventDefault()
    await fetch(`${API}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) })
    setForm({ name: '', email: '', password: '', role: 'lead', lead_id: '' })
    load()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-4">
        <Stat label="Total Users" value={users.length} />
      </div>
      <form onSubmit={submit} className="bg-white p-4 rounded border grid grid-cols-5 gap-2 items-end">
        <input className="border px-2 py-2 rounded col-span-1" placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
        <input className="border px-2 py-2 rounded col-span-1" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
        <input className="border px-2 py-2 rounded col-span-1" placeholder="Password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
        <select className="border px-2 py-2 rounded col-span-1" value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
          <option value="lead">Team Lead</option>
          <option value="employee">Employee</option>
          <option value="superadmin">Super Admin</option>
        </select>
        <button className="bg-blue-600 text-white rounded px-4 py-2">Create</button>
      </form>
      <div className="bg-white rounded border overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Role</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t">
                <td className="p-2">{u.name}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2 capitalize">{u.role}</td>
                <td className="p-2">
                  <button className="text-red-600" onClick={async ()=>{ await fetch(`${API}/users/${u.id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}`}}); load() }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Requirements({ token, me }) {
  const [items, setItems] = useState([])
  const [remarks, setRemarks] = useState({})
  const [form, setForm] = useState({ client_domain:'', assigned_skill:'', ecms_id:'', required_experience:'', required_location:'', assigned_budget:'', openings:1, recruiter_name:'', team_lead_remarks:'' })

  const load = () => fetch(`${API}/requirements`, { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json()).then(setItems)
  useEffect(load, [token])

  const createReq = async (e) => {
    e.preventDefault()
    await fetch(`${API}/requirements`, { method:'POST', headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(form) })
    setForm({ client_domain:'', assigned_skill:'', ecms_id:'', required_experience:'', required_location:'', assigned_budget:'', openings:1, recruiter_name:'', team_lead_remarks:'' })
    load()
  }

  const addRemark = async (reqId, text, remark_type='remark') => {
    await fetch(`${API}/remarks`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ requirement_id: reqId, text, remark_type }) })
    const rs = await fetch(`${API}/remarks/${reqId}`, { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json())
    setRemarks({ ...remarks, [reqId]: rs })
  }

  const loadRemarks = async (reqId) => {
    const rs = await fetch(`${API}/remarks/${reqId}`, { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json())
    setRemarks({ ...remarks, [reqId]: rs })
  }

  const submitProfile = async (reqId) => {
    await fetch(`${API}/submissions`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ requirement_id: reqId, count: 1 }) })
    load()
  }

  const assign = async (reqId, employee_id) => {
    await fetch(`${API}/requirements/${reqId}/assign`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ employee_id }) })
    load()
  }

  const [summary, setSummary] = useState(null)
  useEffect(() => { fetch(`${API}/dashboard/summary`, { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json()).then(setSummary) }, [token, items.length])

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Stat label="Total" value={summary.total_requirements} />
          <Stat label="Completed" value={summary.completed} color="bg-green-100 text-green-700" />
          <Stat label="Pending" value={summary.pending} color="bg-yellow-100 text-yellow-700" />
          <Stat label="Issues" value={summary.issues} color="bg-red-100 text-red-700" />
          <Stat label="Submissions" value={summary.team_performance.total_submissions} color="bg-indigo-100 text-indigo-700" />
        </div>
      )}

      {(me?.role === 'lead' || me?.role === 'superadmin') && (
        <form onSubmit={createReq} className="bg-white p-4 rounded border grid md:grid-cols-8 gap-2 items-end">
          <input className="border px-2 py-2 rounded" placeholder="Client Domain" value={form.client_domain} onChange={e=>setForm({...form, client_domain:e.target.value})} />
          <input className="border px-2 py-2 rounded" placeholder="Assigned Skill" value={form.assigned_skill} onChange={e=>setForm({...form, assigned_skill:e.target.value})} />
          <input className="border px-2 py-2 rounded" placeholder="ECMS / Job ID" value={form.ecms_id} onChange={e=>setForm({...form, ecms_id:e.target.value})} />
          <input className="border px-2 py-2 rounded" placeholder="Experience" value={form.required_experience} onChange={e=>setForm({...form, required_experience:e.target.value})} />
          <input className="border px-2 py-2 rounded" placeholder="Location" value={form.required_location} onChange={e=>setForm({...form, required_location:e.target.value})} />
          <input className="border px-2 py-2 rounded" placeholder="Budget" value={form.assigned_budget} onChange={e=>setForm({...form, assigned_budget:e.target.value})} />
          <input type="number" className="border px-2 py-2 rounded" placeholder="Openings" value={form.openings} onChange={e=>setForm({...form, openings:parseInt(e.target.value||'0',10)})} />
          <button className="bg-blue-600 text-white rounded px-4 py-2">Add</button>
        </form>
      )}

      <div className="bg-white rounded border overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              {['Client Domain','Assigned Skill','ECMS ID','Experience','Location','Budget','Openings','Profiles Submitted','Status','Recruiter','Lead Remarks','Actions'].map(h => <th key={h} className="p-2 text-left">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {items.map(it => (
              <tr key={it.id} className="border-t align-top">
                <td className="p-2">{it.client_domain}</td>
                <td className="p-2">{it.assigned_skill}</td>
                <td className="p-2">{it.ecms_id}</td>
                <td className="p-2">{it.required_experience}</td>
                <td className="p-2">{it.required_location}</td>
                <td className="p-2">{it.assigned_budget}</td>
                <td className="p-2">{it.openings}</td>
                <td className="p-2">{it.profiles_submitted || 0}</td>
                <td className="p-2">{it.status}</td>
                <td className="p-2">{it.recruiter_name || '-'}</td>
                <td className="p-2">{it.team_lead_remarks || '-'}</td>
                <td className="p-2 space-x-2">
                  {me?.role === 'employee' && (
                    <button className="text-blue-600" onClick={()=>submitProfile(it.id)}>Submit Profile</button>
                  )}
                  {(me?.role === 'lead' || me?.role === 'superadmin') && (
                    <>
                      <button className="text-green-600" onClick={()=>fetch(`${API}/requirements/${it.id}`, { method:'PATCH', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ status: it.status==='Open'?'Closed':'Open' }) }).then(load)}>{it.status==='Open'? 'Close':'Reopen'}</button>
                      <button className="text-indigo-600" onClick={()=>assign(it.id, prompt('Employee ID to assign'))}>Assign</button>
                    </>
                  )}
                  <button className="text-slate-600" onClick={()=>loadRemarks(it.id)}>Remarks</button>
                  <button className="text-amber-600" onClick={()=>addRemark(it.id, prompt('Add remark')||'')}>Add Remark</button>
                  <button className="text-red-600" onClick={()=>addRemark(it.id, prompt('Describe issue')||'', 'issue')}>Report Issue</button>
                  {remarks[it.id] && (
                    <div className="mt-2 bg-slate-50 border rounded p-2">
                      {(remarks[it.id]||[]).map(r => (
                        <div key={r.id} className="text-xs"><span className={`px-1 rounded ${r.remark_type==='issue'?'bg-red-100 text-red-700':'bg-slate-200 text-slate-700'}`}>{r.remark_type}</span> {r.text}</div>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function App() {
  const { token, me, login, logout } = useAuth()
  const [seeded, setSeeded] = useState(false)

  useEffect(() => {
    // try seed silently once
    if (!seeded) {
      fetch(`${API}/seed`, { method: 'POST' }).finally(() => setSeeded(true))
    }
  }, [seeded])

  if (!token || !me) return <Login onLogin={login} />

  return (
    <Shell me={me} onLogout={logout}>
      {(active) => (
        <>
          {active === 'users' && me.role === 'superadmin' && <Users token={token} />}
          {active === 'requirements' && <Requirements token={token} me={me} />}
        </>
      )}
    </Shell>
  )
}
