import { useEffect } from 'react';

const About = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <style>{`
        .about-page { background: #f8fafc; font-family: var(--font-main); -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; min-height: 100vh; }
        .about-container { width: 100%; background: #ffffff; border-bottom: 1px solid rgba(241,245,249,0.8); box-shadow: 0 25px 50px -12px rgba(226,232,240,0.6); }
        .top-images { display: grid; grid-template-columns: repeat(5, 1fr); }
        .top-img-1 { grid-column: span 3; position: relative; height: 14rem; overflow: hidden; }
        .top-img-2 { grid-column: span 2; position: relative; height: 14rem; overflow: hidden; }
        .img-label { position: absolute; bottom: 0.75rem; left: 0.75rem; background: rgba(255,255,255,0.85); backdrop-filter: blur(4px); padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; color: #334155; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.3); display: flex; align-items: center; gap: 0.375rem; }
        .center-section { padding: 2rem 2rem 1.5rem; }
        .center-flex { display: flex; align-items: flex-start; gap: 2rem; flex-wrap: wrap; }
        .card-wrapper { background: transparent; border-radius: 16px; border: 1px solid transparent; padding: 1.5rem; box-shadow: none; max-width: 240px; display: flex; flex-direction: column; gap: 1rem; }
        .card-inner { background: #fff; border-radius: 12px; padding: 2rem 1.5rem 2.5rem; border: 1px solid #e2e8f0; }
        .card-img { border-radius: 12px; overflow: hidden; min-height: 200px; width: 300px; max-width: 100%; }
        .text-section { font-family: var(--font-display); display: flex; gap: 2rem; align-items: flex-start; margin-left: 60px; }
        .text-heading { margin-top: 0.75rem; }
        .text-heading h2 { font-size: clamp(2rem, 5vw, 2.8rem); font-weight: 700; color: #0f172a; letter-spacing: -0.02em; line-height: 1.2; font-family: var(--font-display); margin: 0; }
        .text-desc { color: #64748b; font-size: 0.875rem; margin: 0.15rem 0 0; line-height: 1.5; font-family: var(--font-main); max-width: 480px; }
        .side-images { display: flex; flex-direction: column; gap: 0.5rem; flex-shrink: 0; }
        .side-images img { display: block; }
        .divider { border-top: 1px solid rgba(226,232,240,0.8); margin: 0 2rem; }
.stats-section { padding: 1.5rem 2rem 2rem; display: flex; justify-content: center; padding-left: calc(2rem + 550px); margin-top: -100px; }
.stats-card { position: relative; text-align: center; padding: 1.5rem 2rem; background: #000; border-radius: 0; border: 1px solid #000; overflow: hidden; min-height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; width: auto; }
        .stats-card img { position: absolute; top: 0; right: 0; width: 100%; height: 50%; object-fit: cover; opacity: 0.25; z-index: 0; }
        .stats-card .stat-text { position: relative; z-index: 1; }
        .stats-card .stat-number { font-size: clamp(2.25rem, 5vw, 3rem); font-weight: 700; color: #fff; line-height: 1; font-family: var(--font-display); display: inline-block; border-bottom: 3px solid #fff; padding-bottom: 4px; padding-left: 20px; padding-right: 20px; }
        .stats-card .stat-label { margin: 0.5rem 0 0; font-size: 0.875rem; color: #ccc; font-weight: 500; text-transform: uppercase; letter-spacing: 0.025em; }
        .learn-more { display: inline-flex; align-items: center; gap: 0.75rem; border: 1px solid #f97316; background: #f97316; color: #fff; font-weight: 500; padding: 0 0 0 1.75rem; border-radius: 9999px; font-size: 0.875rem; letter-spacing: 0.025em; text-decoration: none; transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .learn-more:hover { background: #ea580c; border-color: #ea580c; }
        .learn-more-circle { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: #000; flex-shrink: 0; }
        .footer-section { padding: 1.5rem 2rem; font-size: 0.75rem; color: #94a3b8; }
        .tailwind-badge { position: fixed; bottom: 1.25rem; right: 1.25rem; background: rgba(255,255,255,0.8); backdrop-filter: blur(4px); color: #64748b; font-size: 11px; padding: 0.375rem 0.75rem; border-radius: 9999px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid rgba(226,232,240,0.6); display: flex; align-items: center; gap: 0.5rem; }

        @media (max-width: 1024px) {
          .stats-section { padding-left: 2rem; }
          .text-section { margin-left: 20px; }
          .side-images img { max-width: 100%; height: auto; }
        }

        @media (max-width: 768px) {
          .top-images { grid-template-columns: 1fr; }
          .top-img-1, .top-img-2 { grid-column: span 1; height: 12rem; }
          .center-section { padding: 1.5rem 1rem; }
          .center-flex { flex-direction: column; gap: 1.5rem; }
          .card-wrapper { max-width: 100%; }
          .card-img { width: 100%; min-height: 160px; }
          .text-section { flex-direction: column; gap: 1.5rem; margin-left: 0; }
          .side-images { width: 100%; }
          .side-images img { width: 100% !important; max-width: 100%; }
          .stats-section { padding: 1rem; }
          .stats-card { min-height: 180px; padding: 2rem 1.5rem; }
          .divider { margin: 0 1rem; }
        }

        @media (max-width: 480px) {
          .top-img-1, .top-img-2 { height: 10rem; }
          .center-section { padding: 1rem 0.75rem; }
          .card-inner { padding: 1.5rem 1rem 2rem; }
          .stats-card { min-height: 150px; padding: 1.5rem 1rem; }
          .stats-card .stat-number { font-size: 2rem; padding-left: 10px; padding-right: 10px; }
          .img-label { font-size: 0.65rem; padding: 0.2rem 0.5rem; }
        }
      `}</style>

      <section className="about-page">
        <div className="about-container">
          {/* TOP ROW: two images */}
          <div className="top-images">
            <div className="top-img-1">
              <img
                src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Architectural element detail"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => {
                  const t = e.target as HTMLImageElement;
                  t.style.display = 'none';
                  const p = t.parentElement!;
                  p.style.background = '#eef2ff';
                  p.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#818cf8;font-size:0.875rem;font-weight:500">element</div>';
                }}
              />
              <div className="img-label">
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} />
                ELEMENT · DETAIL
              </div>
            </div>

            <div className="top-img-2">
              <img
                src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="House design model"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => {
                  const t = e.target as HTMLImageElement;
                  t.style.display = 'none';
                  const p = t.parentElement!;
                  p.style.background = '#dbeafe';
                  p.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#6366f1;font-size:0.875rem;font-weight:500">house design</div>';
                }}
              />
              <div className="img-label">
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#60a5fa', display: 'inline-block' }} />
                HOUSE DESIGN · MODEL
              </div>
            </div>
          </div>

          {/* CENTER SECTION */}
          <div className="center-section">
            <div className="center-flex">
              <div className="card-wrapper">
                <div className="card-inner">
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                    <span style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', fontWeight: 700, color: '#1e293b', letterSpacing: '-0.025em', lineHeight: 1, fontFamily: 'var(--font-display)' }}>250+</span>
                  </div>
                  <div style={{ width: '100%', height: '3px', background: '#1e293b', borderRadius: '4px', marginTop: '0.5rem' }} />
                  <p style={{ color: '#475569', fontSize: '0.8rem', marginTop: '0.35rem', lineHeight: 1.5, marginBottom: 0 }}>
                    Clients Served<br />
                    <span style={{ color: '#334155', fontWeight: 500 }}>Over 500 Projects Completed</span> With Care, Precision, And A Focus On Our Clients' Needs.
                  </p>
                </div>

                <div className="card-img">
                  <img src="/img2.png" alt="Project detail" style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} />
                </div>
              </div>

              <div className="text-section">
                <div>
                  <span style={{ color: '#1e293b', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.02em' }}>—— About Us</span>
                  <div className="text-heading">
                    <h2>
                      Turning Your <br />
                      Ideas Into <br />
                      Beautifully <br />
                      <span style={{ color: '#4f46e5' }}>Crafted Spaces</span>
                    </h2>
                  </div>
                  <p className="text-desc">
                    We embrace the latest technologies and sustainable practices to create environmentally-friendly and energy-efficient buildings. Our mission is not just to construct structures, but to build communities and spaces where people thrive and prosper.
                  </p>
                  <div style={{ marginTop: '1.25rem' }}>
                    <a href="#" className="learn-more">
                      LEARN MORE
                      <span className="learn-more-circle">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(295deg)' }}>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </span>
                    </a>
                  </div>
                </div>
                <div className="side-images">
                  <img src="/img.png" alt="Construction detail" style={{ width: '440px', maxWidth: '100%' }} />
                  <img src="/small.png" alt="Architecture detail" style={{ width: '320px', maxWidth: '100%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* STATS ROW */}
          <div className="stats-section">
            <div className="stats-card">
              <img src="/house.png" alt="House" />
              <div className="stat-text">
                <span className="stat-number">25<span style={{ color: '#f97316' }}>+</span></span>
                <p className="stat-label">Projects</p>
              </div>
            </div>
          </div>

          <div className="divider" />

          {/* FOOTER */}
          <div className="footer-section" />
        </div>

        <div className="tailwind-badge">
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
          <span>tailwind · ready</span>
        </div>
      </section>
    </>
  );
};

export default About;
