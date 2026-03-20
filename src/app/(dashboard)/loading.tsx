export default function DashboardLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
      {/* Header Skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="skeleton" style={{ width: '200px', height: '36px', borderRadius: '8px', marginBottom: '0.5rem' }} />
          <div className="skeleton" style={{ width: '300px', height: '20px', borderRadius: '6px' }} />
        </div>
        <div className="skeleton" style={{ width: '140px', height: '40px', borderRadius: '8px' }} />
      </div>

      {/* Stats Cards Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card" style={{ height: '140px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem' }}>
            <div className="skeleton" style={{ width: '40%', height: '16px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ width: '70%', height: '32px', borderRadius: '6px' }} />
            <div className="skeleton" style={{ width: '50%', height: '12px', borderRadius: '4px' }} />
          </div>
        ))}
      </div>

      {/* Table/Content Skeleton */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
          <div className="skeleton" style={{ width: '150px', height: '24px', borderRadius: '6px' }} />
          <div className="skeleton" style={{ width: '100px', height: '24px', borderRadius: '6px' }} />
        </div>
        <div style={{ padding: '0' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="skeleton" style={{ width: '60px', height: '20px', borderRadius: '4px' }} />
              <div className="skeleton" style={{ width: '120px', height: '20px', borderRadius: '4px' }} />
              <div style={{ flex: 1 }} />
              <div className="skeleton" style={{ width: '80px', height: '20px', borderRadius: '4px' }} />
              <div className="skeleton" style={{ width: '100px', height: '20px', borderRadius: '4px' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
