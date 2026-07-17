import { useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { FaEnvelopeOpenText, FaCheckCircle } from 'react-icons/fa';
import { subscriberService } from '../../services/subscriberService';
import type { Profile } from '../../services/profileService';

const Unsubscribe = () => {
    const { id } = useParams<{ id: string }>();
    const outlet = useOutletContext<{ profile: Profile | null } | undefined>();
    const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

    const handleUnsubscribe = async () => {
        if (!id) return;
        setStatus('loading');
        try {
            await subscriberService.unsubscribe(id);
            setStatus('done');
        } catch {
            setStatus('error');
        }
    };

    return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem' }}>
            <div style={{ maxWidth: '420px', textAlign: 'center' }}>
                {status === 'done' ? (
                    <>
                        <FaCheckCircle style={{ fontSize: '2.5rem', color: '#22c55e', marginBottom: '1rem' }} />
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>You're unsubscribed</h1>
                        <p style={{ color: '#64748B', fontSize: '0.95rem' }}>
                            You won't receive further updates from {outlet?.profile?.company || 'us'}.
                        </p>
                    </>
                ) : (
                    <>
                        <FaEnvelopeOpenText style={{ fontSize: '2.5rem', color: '#D97706', marginBottom: '1rem' }} />
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>Unsubscribe from emails?</h1>
                        <p style={{ color: '#64748B', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                            You'll stop receiving updates from {outlet?.profile?.company || 'us'}. You can always sign up again later.
                        </p>
                        <button
                            onClick={handleUnsubscribe}
                            disabled={status === 'loading'}
                            style={{
                                background: '#D97706', color: '#fff', border: 'none', borderRadius: '9999px',
                                padding: '0.7rem 1.75rem', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
                            }}
                        >
                            {status === 'loading' ? 'Unsubscribing...' : 'Unsubscribe'}
                        </button>
                        {status === 'error' && (
                            <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '1rem' }}>
                                Something went wrong. Please try again.
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Unsubscribe;
