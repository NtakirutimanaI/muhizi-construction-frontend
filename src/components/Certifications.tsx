import { useState } from 'react';
import { FaExternalLinkAlt, FaCertificate, FaTimes } from 'react-icons/fa';
import type { Profile } from '../services/profileService';

interface CertificationsProps {
    profile: Profile;
}

const Certifications: React.FC<CertificationsProps> = ({ profile }) => {
    const [previewImg, setPreviewImg] = useState<string | null>(null);
    const certs = profile.certifications || [];

    if (certs.length === 0) return null;

    return (
        <section className="section section-indicator" id="certifications">
            <div className="container">
                <h2 className="ark-section__heading">Certifications</h2>
                <div className="ark-grid-auto">
                    {certs.map((cert, index) => (
                        <div
                            key={index}
                            className="ark-card"
                            style={{
                                padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start',
                                cursor: cert.imageUrl ? 'pointer' : 'default',
                            }}
                            onClick={() => cert.imageUrl && setPreviewImg(cert.imageUrl)}
                        >
                            {cert.imageUrl ? (
                                <img src={cert.imageUrl} alt={cert.name} className="cert-card__thumb"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                                <div style={{
                                    width: '56px', height: '56px', borderRadius: '8px',
                                    background: 'linear-gradient(135deg, var(--primary) 0%, #5fa832 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.3rem', color: '#fff', flexShrink: 0,
                                }}>
                                    <FaCertificate />
                                </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{cert.name}</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                                    {cert.issuer}
                                </p>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {cert.date ? new Date(cert.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : ''}
                                </span>
                                {cert.credentialUrl && (
                                    <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                            fontSize: '0.85rem', marginLeft: '1rem',
                                            color: 'var(--primary-teal)', textDecoration: 'none', fontWeight: 600,
                                        }}>
                                        Verify <FaExternalLinkAlt style={{ fontSize: '0.7rem' }} />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {previewImg && (
                <div
                    onClick={() => setPreviewImg(null)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(0,0,0,0.8)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', padding: '2rem',
                    }}
                >
                    <button
                        onClick={() => setPreviewImg(null)}
                        style={{
                            position: 'absolute', top: '1.5rem', right: '1.5rem', width: '44px', height: '44px',
                            borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.2)',
                            color: '#fff', fontSize: '1.3rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)',
                        }}
                    >
                        <FaTimes />
                    </button>
                    <img
                        src={previewImg}
                        alt="Certificate"
                        style={{
                            maxWidth: '100%', maxHeight: '90vh', borderRadius: '8px',
                            boxShadow: '0 8px 40px rgba(0,0,0,0.5)', objectFit: 'contain',
                        }}
                    />
                </div>
            )}
        </section>
    );
};

export default Certifications;
