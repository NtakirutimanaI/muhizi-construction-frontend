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
            paddingTop: '0.75rem',
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
                .services-title-animate {
                    position: relative;
                    display: inline-block;
                    padding-bottom: 6px;
                    white-space: nowrap;
                    animation: servicesTitlePulse 3s ease-in-out infinite;
                }
                .about-services-header {
                    text-align: center;
                    margin: 0 auto 1rem;
                    max-width: 1400px;
                    width: 100%;
                }
                .about-services-title {
                    font-family: 'Poppins', sans-serif;
                    font-size: 36px;
                    font-weight: 700;
                    color: #1A1A1A;
                    margin: 0;
                    white-space: nowrap;
                    text-align: center;
                }
                @media (max-width: 768px) {
                    .about-services-title {
                        font-size: 28px;
                    }
                }
                @media (max-width: 480px) {
                    .about-services-title {
                        font-size: 24px;
                    }
                }
                .services-title-animate::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 60px;
                    height: 3px;
                    background: #B27340;
                    border-radius: 2px;
                }
                @keyframes servicesTitlePulse {
                    0% { transform: translateY(0) scale(1); opacity: 1; }
                    50% { transform: translateY(-6px) scale(1.03); opacity: 0.85; }
                    100% { transform: translateY(0) scale(1); opacity: 1; }
                }
                .about-button-wrapper {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    max-width: 1400px;
                    margin: 1rem auto 0;
                    width: 100%;
                }
                .about-button {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.6rem;
                    background: #16324F;
                    color: #ffffff !important;
                    font-family: 'Poppins', sans-serif;
                    font-size: 15px;
                    font-weight: 600;
                    padding: 0.85rem 2rem;
                    border-radius: 8px;
                    text-decoration: none !important;
                    box-shadow: 0 4px 14px rgba(22, 50, 79, 0.25);
                    transition: all 0.3s ease;
                }
                .about-button:hover {
                    background: #B27340;
                    color: #ffffff !important;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(178, 115, 64, 0.35);
                }
                @media (max-width: 768px) {
                    .about-button-wrapper {
                        margin-top: 1.25rem;
                        width: 100%;
                    }
                    .about-button {
                        width: 100%;
                        text-align: center;
                        justify-content: center;
                        padding: 0.9rem 1.25rem;
                        border-radius: 8px;
                    }
                }
                .about-stats-container {
                    padding-top: 1.25rem;
                    max-width: 700px;
                    margin: 0 auto;
                    width: 100%;
                }
                .about-stats-row {
                    display: flex !important;
                    flex-direction: row !important;
                    flex-wrap: nowrap !important;
                    align-items: center !important;
                    justify-content: center !important;
                    gap: 1rem !important;
                    width: 100% !important;
                }
                .about-stats-card {
                    flex: 1 1 0px !important;
                    min-width: 0 !important;
                    border-radius: 8px;
                    background: transparent;
                    border: none;
                    box-shadow: none;
                    padding: 0.85rem 0.6rem;
                    text-align: center;
                }
                @media (max-width: 600px) {
                    .about-stats-container {
                        max-width: 100%;
                    }
                    .about-stats-row {
                        gap: 0.4rem !important;
                    }
                    .about-stats-card {
                        padding: 0.75rem 0.25rem !important;
                    }
                    .about-stats-card p:first-child {
                        font-size: 26px !important;
                    }
                    .about-stats-card p:last-child {
                        font-size: 11px !important;
                    }
                }
            `}</style>
            <div className="container">
                {/* Highlighted Text + Design Cards Row */}
                <div style={{ width: '100vw', margin: '0 calc(-50vw + 50%) 0', padding: '0.25rem 1rem 1rem', background: 'linear-gradient(rgba(245, 245, 245, 0.88), rgba(245, 245, 245, 0.88)), url(/services-bg.png) center/cover no-repeat' }}>
                    <div className="about-services-header">
                        <h2 className="about-services-title">
                            <span className="services-title-animate">Our Services</span>
                        </h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', maxWidth: '1400px', margin: '0 auto', justifyContent: 'center' }}>
                        {mergedFirstFour.map((item, idx) => {
                            const Icon = DESIGN_ICONS[idx % DESIGN_ICONS.length];
                            return (
                                <div key={idx} className="about-card" style={{ borderRadius: '8px', background: '#fff', border: '1px solid rgba(15,18,34,0.06)', boxShadow: '0 2px 12px rgba(15,18,34,0.06)', padding: '0.9rem 1.1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transition: 'background 0.3s ease, border-color 0.3s ease' }}>
                                    <div className="about-card-icon" style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ffffff', border: '1px solid rgba(15,18,34,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.4rem', transition: 'border-color 0.3s ease, background 0.3s ease' }}>
                                        <Icon style={{ color: '#111827', fontSize: '0.95rem' }} />
                                    </div>
                                    <h3 className="about-card-title" style={{ fontFamily: 'Poppins', color: '#1A1A1A', fontSize: '15px', fontWeight: 600, fontStyle: 'normal', margin: '0 0 0.3rem', lineHeight: 1.3, transition: 'color 0.3s ease' }}>{item.title}</h3>
                                    <div className="about-card-divider" style={{ height: '1px', background: 'var(--border-color)', margin: '0 0 0.4rem', width: '100%', transition: 'background 0.3s ease' }} />
                                    <p className="about-card-desc" style={{ fontFamily: 'Poppins', color: '#1A1A1A', fontSize: '13px', fontWeight: 400, fontStyle: 'normal', lineHeight: 1.5, margin: 0, transition: 'color 0.3s ease', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.description}</p>
                                </div>
                            );
                        })}
                    </div>
                    <div className="about-button-wrapper">
                        <a href="/vision-mission-values" className="about-button">
                            More About Us <FaArrowRight />
                        </a>
                    </div>
                    {/* Stats Cards Row on same row inside larger section */}
                    <div className="about-stats-container">
                        <div className="about-stats-row">
                            <div className="about-stats-card">
                                <p style={{ fontFamily: 'Poppins', fontSize: '38px', fontWeight: 800, color: '#2F343D', fontStyle: 'normal', margin: 0, lineHeight: 1.1 }}>6+</p>
                                <p style={{ fontFamily: 'Poppins', fontSize: '13px', fontWeight: 500, color: '#666', margin: '4px 0 0' }}>Years of Experience</p>
                            </div>
                            <div className="about-stats-card">
                                <p style={{ fontFamily: 'Poppins', fontSize: '38px', fontWeight: 800, color: '#2F343D', fontStyle: 'normal', margin: 0, lineHeight: 1.1 }}>200+</p>
                                <p style={{ fontFamily: 'Poppins', fontSize: '13px', fontWeight: 500, color: '#666', margin: '4px 0 0' }}>Projects Completed</p>
                            </div>
                            <div className="about-stats-card">
                                <p style={{ fontFamily: 'Poppins', fontSize: '38px', fontWeight: 800, color: '#2F343D', fontStyle: 'normal', margin: 0, lineHeight: 1.1 }}>11+</p>
                                <p style={{ fontFamily: 'Poppins', fontSize: '13px', fontWeight: 500, color: '#666', margin: '4px 0 0' }}>Team Members</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>





        </section>
    );
};

export default About;
