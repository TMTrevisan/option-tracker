import { login, signup } from './actions'

export default function LoginPage({ searchParams }: { searchParams: { message: string } }) {
  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '400px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-6 text-center">Login to RollTrackr</h1>
        
        {searchParams?.message && (
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--accent-danger-bg)', color: 'var(--accent-danger)', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center' }}>
            {searchParams.message}
          </div>
        )}
        
        <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="text-sm font-semibold mb-1 block">Email</label>
            <input 
              name="email" 
              type="email" 
              required 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: '#fff' }} 
            />
          </div>
          <div>
            <label className="text-sm font-semibold mb-1 block">Password</label>
            <input 
              name="password" 
              type="password" 
              required 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: '#fff' }} 
            />
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button formAction={login} className="btn btn-primary" style={{ flex: 1, padding: '0.75rem' }}>Login</button>
            <button formAction={signup} className="btn btn-secondary" style={{ flex: 1, padding: '0.75rem' }}>Sign Up</button>
          </div>
        </form>
      </div>
    </div>
  )
}
