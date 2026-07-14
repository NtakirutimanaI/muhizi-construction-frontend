import { LuBuilding2, LuRoute, LuDraftingCompass } from 'react-icons/lu';
import Marquee from './Marquee';
import type { Profile } from '../services/profileService';

interface AboutProps {
    profile: Profile;
}

const DESIGN_ICONS = [LuBuilding2, LuRoute, LuDraftingCompass];

const DEFAULT_SERVICE_ITEMS = [
    { title: 'Building Construction', description: 'We deliver high-quality residential and commercial building construction with precision and excellence.', images: ['https://images.unsplash.com/photo-1487958449943-2429e8be8625?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'], tags: ['Construction'], color: '#16324F' },
    { title: 'Road Infrastructure', description: 'Design and construction of roads, drainage systems, and large-scale infrastructure projects.', images: ['https://images.unsplash.com/photo-1513828583688-c52646db42da?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'], tags: ['Infrastructure'], color: '#16324F' },
    { title: 'Architectural Design', description: 'Modern architectural design, 3D modeling, and sustainable building design for contemporary spaces.', images: ['https://images.unsplash.com/photo-1486718448742-163732cd1544?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'], tags: ['Design'], color: '#16324F' },
];

const About: React.FC<AboutProps> = ({ profile }) => {
    const serviceItems = profile.pageContent?.services?.items || [];
    const firstThree = serviceItems.length >= 3 ? serviceItems.slice(0, 3) : DEFAULT_SERVICE_ITEMS;
    const mergedFirstThree = firstThree.map((item, idx) => ({
        ...item,
        images: item.images?.length ? item.images : (DEFAULT_SERVICE_ITEMS[idx]?.images || []),
    }));

    return (
        <section data-nav-theme="light" className="section section-indicator" id="about" style={{
            paddingBottom: '5px',
            background: '#ffffff',
        }}>
            <div className="container">
                {/* Highlighted Text + Design Cards Row */}
                <div style={{ width: '100vw', margin: '3rem calc(-50vw + 50%) 0', padding: '3rem 3.5rem 4rem', background: '#ffffff' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '280px repeat(3, 1fr)', gap: '1.75rem', maxWidth: '1400px', margin: '0 auto' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <p style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#D97706', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 1rem' }}>
                                <span style={{ width: '34px', height: '2px', background: '#D97706', display: 'inline-block' }} />
                                What We Offer
                            </p>
                            <h2 style={{ color: '#111827', fontSize: '2.2rem', fontWeight: 700, lineHeight: 1.2, margin: '0 0 2rem' }}>
                                Driven By Quality, Defined By Results
                            </h2>
                            <a href="#services" className="learn-more" style={{ background: '#D97706', borderColor: '#D97706', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '0.75rem', padding: '0 0 0 1.75rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.025em', textDecoration: 'none', transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', width: 'fit-content' }}>
                                VIEW ALL SERVICES
                                <span className="learn-more-circle" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: '#16324F', flexShrink: 0 }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(295deg)' }}>
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                        <polyline points="12 5 19 12 12 19"></polyline>
                                    </svg>
                                </span>
                            </a>
                        </div>
                        {mergedFirstThree.map((item, idx) => {
                            const Icon = DESIGN_ICONS[idx % DESIGN_ICONS.length];
                            const imgSrc = item.images?.[0] || 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                            return (
                                <div key={idx} style={{ borderRadius: '14px', overflow: 'hidden', background: '#fff', border: '1px solid rgba(15,18,34,0.06)', boxShadow: '0 4px 20px rgba(15,18,34,0.07)' }}>
                                    <div style={{ position: 'relative' }}>
                                        <img
                                            src={imgSrc}
                                            alt={item.title}
                                            style={{ width: '100%', height: '210px', objectFit: 'cover', display: 'block' }}
                                            onError={e => {
                                                const t = e.target as HTMLImageElement;
                                                t.style.display = 'none';
                                                const parent = t.parentElement!;
                                                parent.style.background = '#D97706';
                                                parent.style.minHeight = '210px';
                                                const fallbackTxt = document.createElement('div');
                                                fallbackTxt.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:1.8rem;font-weight:700;color:#fff;';
                                                fallbackTxt.textContent = item.title.charAt(0);
                                                parent.style.position = 'relative';
                                                parent.appendChild(fallbackTxt);
                                            }}
                                        />
                                        <div style={{ position: 'absolute', bottom: '15px', right: '15px', width: '40px', height: '40px', borderRadius: '50%', background: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                                            <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 700, transform: 'rotate(290deg)', display: 'inline-block' }}>&rarr;</span>
                                        </div>
                                    </div>
                                    <div style={{ padding: '1.5rem 1.6rem 1.7rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.1rem' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FBE8D3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Icon style={{ color: '#D97706', fontSize: '1.2rem' }} />
                                            </div>
                                            <h3 style={{ color: '#111827', fontSize: '1.1rem', fontWeight: 700, margin: 0, lineHeight: 1.3 }}>{item.title}</h3>
                                        </div>
                                        <div style={{ height: '1px', background: '#DCE3EA', margin: '0 0 1rem' }} />
                                        <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: 1.65, margin: 0 }}>{item.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>

            <Marquee />
        </section>
    );
};

export default About;
