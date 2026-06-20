import { useState } from 'react';

const ApiDocs = () => {
    const [loading, setLoading] = useState(true);

    return (
        <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>API Documentation</h1>
                <p style={{ color: 'var(--text-muted)' }}>Interactive Swagger UI for the backend API.</p>
            </div>

            <div className="content-card" style={{ flex: 1, padding: 0, overflow: 'hidden', position: 'relative', background: '#fff' }}>
                {loading && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-body)', zIndex: 10 }}>
                        <div className="inline-spinner">Loading API docs...</div>
                    </div>
                )}
                <iframe
                    src="http://localhost:3000/api/docs"
                    className="swagger-frame"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title="Swagger UI"
                    onLoad={() => setLoading(false)}
                />
            </div>
        </div>
    );
};

export default ApiDocs;
