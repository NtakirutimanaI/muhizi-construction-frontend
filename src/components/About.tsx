import { LuConstruction, LuHardHat } from 'react-icons/lu';
import { FaSatellite, FaClipboardCheck, FaArrowRight } from 'react-icons/fa';
import Marquee from './Marquee';
import type { Profile } from '../services/profileService';

interface AboutProps {
    profile: Profile;
}

const DESIGN_ICONS = [LuConstruction, FaSatellite, FaClipboardCheck, LuHardHat];

const DEFAULT_SERVICE_ITEMS = [
    { title: 'Design & Build Civil Structures', description: 'Planning and construction of roads, bridges, and drainage from concept to handover.', images: ['https://images.unsplash.com/photo-1487958449943-2429e8be8625?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'], tags: ['Construction'], color: '#16324F' },
    { title: 'Geomatics Services', description: 'Drone surveying, mapping, and GIS data for precise project planning.', images: ['https://images.unsplash.com/photo-1513828583688-c52646db42da?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'], tags: ['Surveying'], color: '#16324F' },
    { title: 'Building Permit Application', description: 'Fast-track your building permits through expert regulatory handling.', images: ['https://images.unsplash.com/photo-1486718448742-163732cd1544?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'], tags: ['Permits'], color: '#16324F' },
    { title: 'Contracting & Site Supervision', description: 'Quality and safety-driven on-site project management.', images: [], tags: ['Supervision'], color: '#16324F' },
];

const About: React.FC<AboutProps> = ({ profile }) => {
    const serviceItems = profile.pageContent?.services?.items || [];
    const firstFour = serviceItems.length >= 4 ? serviceItems.slice(0, 4) : DEFAULT_SERVICE_ITEMS;
    const mergedFirstFour = firstFour.map((item, idx) => ({
        ...item,
        images: item.images?.length ? item.images : (DEFAULT_SERVICE_ITEMS[idx]?.images || []),
    }));

    return (
        <section data-nav-theme="light" className="section section-indicator" id="about" style={{
            paddingBottom: '5px',
            background: '#f5f5f5',
        }}>
            <style>{`
                .about-card:hover { background: #000 !important; }
                .about-card:hover .about-card-icon { border-color: rgba(255,255,255,0.2) !important; background: transparent !important; }
                .about-card:hover .about-card-icon svg { color: #fff !important; }
                .about-card:hover .about-card-title { color: #fff !important; }
                .about-card:hover .about-card-divider { background: rgba(255,255,255,0.2) !important; }
                .about-card:hover .about-card-desc { color: #fff !important; }
            `}</style>
            <div className="container">
                {/* Highlighted Text + Design Cards Row */}
                <div style={{ width: '100vw', margin: '2rem calc(-50vw + 50%) 0', padding: '0.5rem 3.5rem 3rem', background: '#f5f5f5' }}>
                    <div style={{ textAlign: 'left', marginBottom: '1.5rem', maxWidth: '1400px', margin: '0 auto 1.5rem', paddingLeft: '150px' }}>
                        <h2 style={{ fontFamily: 'Poppins', fontSize: '28px', fontWeight: 700, color: '#1A1A1A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <span style={{ color: '#999', fontWeight: 400 }}>---</span> Our Services <span style={{ color: '#999', fontWeight: 400 }}>---</span>
                        </h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 230px)', gap: '1.25rem', maxWidth: '1400px', margin: '0 auto', justifyContent: 'center' }}>
                        {mergedFirstFour.map((item, idx) => {
                            const Icon = DESIGN_ICONS[idx % DESIGN_ICONS.length];
                            return (
                                <div key={idx} className="about-card" style={{ borderRadius: '8px', background: '#fff', border: '1px solid rgba(15,18,34,0.06)', boxShadow: '0 2px 12px rgba(15,18,34,0.06)', padding: '1.25rem 1.3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transition: 'background 0.3s ease, border-color 0.3s ease' }}>
                                    <div className="about-card-icon" style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ffffff', border: '1px solid rgba(15,18,34,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.6rem', transition: 'border-color 0.3s ease, background 0.3s ease' }}>
                                        <Icon style={{ color: '#111827', fontSize: '1.1rem' }} />
                                    </div>
                                    <h3 className="about-card-title" style={{ fontFamily: 'Poppins', color: '#1A1A1A', fontSize: '17px', fontWeight: 600, fontStyle: 'normal', margin: '0 0 0.5rem', lineHeight: 1.3, transition: 'color 0.3s ease' }}>{item.title}</h3>
                                    <div className="about-card-divider" style={{ height: '1px', background: 'var(--border-color)', margin: '0 0 0.6rem', width: '100%', transition: 'background 0.3s ease' }} />
                                    <p className="about-card-desc" style={{ fontFamily: 'Poppins', color: '#1A1A1A', fontSize: '17px', fontWeight: 400, fontStyle: 'normal', lineHeight: 1.55, margin: 0, transition: 'color 0.3s ease', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.description}</p>
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ maxWidth: '1400px', margin: '1.25rem auto 0', marginTop: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ paddingLeft: '135px' }}>
                            <a href="/vision-mission-values" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 1.4rem', borderRadius: 5, border: '2px solid var(--border-color)', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', transition: 'all 0.3s ease' }}>
                                More About Us <FaArrowRight />
                            </a>
                        </div>
                        <div style={{ display: 'flex', gap: '3rem', paddingRight: '135px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontFamily: 'Poppins', fontSize: '52px', fontWeight: 800, color: '#2F343D', fontStyle: 'normal', margin: 0 }}>6+</p>
                                <p style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 400, color: '#666', margin: '4px 0 0' }}>Years of Experience</p>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontFamily: 'Poppins', fontSize: '52px', fontWeight: 800, color: '#2F343D', fontStyle: 'normal', margin: 0 }}>200+</p>
                                <p style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 400, color: '#666', margin: '4px 0 0' }}>Projects Completed</p>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontFamily: 'Poppins', fontSize: '52px', fontWeight: 800, color: '#2F343D', fontStyle: 'normal', margin: 0 }}>11+</p>
                                <p style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 400, color: '#666', margin: '4px 0 0' }}>Team Members</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <Marquee />
        </section>
    );
};

export default About;
