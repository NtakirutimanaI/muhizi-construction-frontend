import { useState } from 'react';

const Approvals = () => {
    const [count, setCount] = useState(0);
    return (
        <div className="admin-page" style={{ padding: '2rem' }}>
            <h1 style={{ color: '#8B4513', fontSize: '2rem' }}>Approvals Page</h1>
            <p>Count: {count}</p>
            <button onClick={() => setCount(c => c + 1)} style={{ padding: '0.5rem 1rem', background: '#8B4513', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Increment
            </button>
        </div>
    );
};

export default Approvals;
