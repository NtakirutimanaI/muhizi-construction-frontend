import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import CountUp from '../../components/CountUp';
import type { Profile } from '../../services/profileService';

const About = () => {
  const outlet = useOutletContext<{ profile: Profile | null } | undefined>();
  const ap = outlet?.profile?.pageContent?.aboutPage;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <style>{`
        .about-page { background: #F5F7FA; font-family: var(--font-main); -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; min-height: 100vh; }

        .about-banner { width: 100%; height: 230px; overflow: hidden; }
        .about-banner img { width: 100%; height: 100%; object-fit: cover; display: block; }

        .about-ruler {
          height: 30px;
          background-color: #F5F7FA;
          background-image:
            repeating-linear-gradient(90deg, #cfcdc6 0 1px, transparent 1px 6px),
            repeating-linear-gradient(90deg, #b3b1a9 0 1px, transparent 1px 26px);
          background-size: 100% 55%, 100% 100%;
          background-position: bottom, bottom;
          background-repeat: repeat-x;
        }

        .about-content { position: relative; max-width: 1360px; margin: 0 auto; padding: 3.5rem 2.5rem 2rem; overflow: visible; }

        .about-grid { position: relative; z-index: 2; display: grid; grid-template-columns: 220px 1fr 340px; gap: 2.5rem; align-items: start; }

        .about-col-left { display: flex; flex-direction: column; }

        /* House + under-construction composite */
        .about-composite { position: relative; margin: 1.75rem 0 0 -90px; width: calc(100% + 90px); max-width: 320px; z-index: 1; }
        .about-composite img { width: 100%; display: block; }

        /* Stat card */
        .stat-card { background: #fff; border-radius: 0; padding: 1.75rem 1.5rem; box-shadow: 0 12px 30px rgba(15,18,34,0.07); position: relative; }
        .stat-card__dot { position: absolute; top: 1.5rem; right: 1.5rem; width: 9px; height: 9px; border-radius: 50%; background: #D97706; }
        .stat-card__number { font-size: 2.75rem; font-weight: 800; color: #111827; font-family: var(--font-display); line-height: 1; }
        .stat-card__line { width: 60px; height: 2px; background: #111827; margin: 1.1rem 0 0.9rem; }
        .stat-card__title { font-weight: 700; color: #111827; font-size: 1rem; margin: 0 0 0.5rem; }
        .stat-card__desc { color: #64748B; font-size: 0.85rem; line-height: 1.6; margin: 0; }

        /* Text column */
        .about-label { display: flex; align-items: center; gap: 0.6rem; color: #D97706; font-weight: 700; font-size: 0.8rem; letter-spacing: 0.05em; text-transform: uppercase; margin: 0 0 1rem; }
        .about-label::before { content: ''; width: 34px; height: 0; border-top: 2px dashed #D97706; display: inline-block; }
        .about-label span { color: #111827; }
        .about-heading { font-family: var(--font-display); font-weight: 700; font-size: clamp(2.1rem, 3.4vw, 2.9rem); line-height: 1.15; color: #111827; margin: 0 0 1.25rem; letter-spacing: -0.01em; }
        .about-heading .accent { color: #111827; }
        .about-desc { color: #64748B; font-size: 0.92rem; line-height: 1.75; max-width: 320px; margin: 0 0 1.75rem; }

        .learn-more { display: inline-flex; align-items: center; gap: 0.75rem; border: 1px solid #D97706; background: #D97706; color: #fff; font-weight: 500; padding: 0 0 0 1.75rem; border-radius: 9999px; font-size: 0.8rem; letter-spacing: 0.08em; text-decoration: none; transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .learn-more:hover { background: #B45309; border-color: #B45309; }
        .learn-more-circle { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: #16324F; flex-shrink: 0; }

        /* Visual column */
        .about-visual { position: relative; }
        .about-visual__house { position: absolute; top: -260px; right: 0; width: 340px; max-width: 100%; z-index: 3; }
        .about-visual__house img { width: 100%; display: block; border-radius: 0; filter: drop-shadow(0 25px 30px rgba(15,18,34,0.25)); }

        .global-reach { margin-top: 235px; background: #16324F; border-radius: 0; padding: 1.6rem 1.6rem 1.75rem; width: 100%; max-width: 230px; color: #fff; position: relative; z-index: 2; }
        .global-reach__label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #fff; margin: 0; }
        .global-reach__label::before { content: ''; width: 8px; height: 8px; background: #D97706; display: inline-block; }
        .global-reach__icon { width: 100%; height: 62px; object-fit: contain; object-position: right center; margin: 0.9rem 0 0.6rem; }
        .global-reach__divider { width: 45%; height: 1px; background: rgba(255,255,255,0.25); margin-bottom: 0.9rem; }
        .global-reach__number { font-size: 2.1rem; font-weight: 800; font-family: var(--font-display); color: #fff; line-height: 1; }
        .global-reach__number .plus { color: #D97706; }
        .global-reach__caption { color: #64748B; font-size: 0.75rem; margin: 0.4rem 0 0; }

        /* Hard-hat line art decoration */
        .about-hardhat-deco { position: absolute; top: 60px; right: 60px; width: 460px; max-width: 45%; height: auto; z-index: 1; opacity: 0.35; pointer-events: none; }

        @media (max-width: 1024px) {
          .about-grid { grid-template-columns: 1fr; gap: 3rem; }
          .about-visual__house { position: relative; top: 0; right: 0; width: 260px; margin: 0 0 1.5rem auto; }
          .global-reach { margin-top: 0; margin-left: auto; }
          .about-hardhat-deco { display: none; }
          .about-composite { margin: 1.75rem auto 0; width: 100%; max-width: 280px; }
        }

        @media (max-width: 640px) {
          .about-banner { height: 150px; }
          .about-content { padding: 2rem 1.25rem 1.5rem; }
          .stat-card { max-width: 260px; }
          .about-desc { max-width: 100%; }
        }
      `}</style>

      <section className="about-page" data-nav-theme="light">
        <div className="about-banner">
          <img
            src="https://images.unsplash.com/photo-1487958449943-2429e8be8625?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
            alt="Construction site overview"
          />
        </div>

        <div className="about-ruler" />

        <div className="about-content">
          <svg className="about-hardhat-deco" viewBox="0 0 460 260" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 220 C 120 220, 160 220, 220 140 C 260 90, 300 70, 360 70" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" />
            <g transform="translate(330,20)" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 70 H110" />
              <path d="M25 70 C25 35, 45 12, 60 12 C 75 12, 95 35, 95 70" />
              <path d="M60 12 V0" />
              <path d="M45 45 H75" />
            </g>
          </svg>

          <div className="about-grid">
            <div className="about-col-left">
              <div className="stat-card">
                <span className="stat-card__dot" />
                <div className="stat-card__number"><CountUp to={ap?.statNumber ?? 240} duration={1.6} />{ap?.statSuffix ?? '+'}</div>
                <div className="stat-card__line" />
                <h3 className="stat-card__title">{ap?.statTitle || 'Projects, Clients Served'}</h3>
                <p className="stat-card__desc">{ap?.statDescription || "Over 500 Projects Completed With Care, Precision, And A Focus On Our Clients' Needs."}</p>
              </div>

              <div className="about-composite">
                <img src="/img2.png" alt="" />
              </div>
            </div>

            <div>
              <p className="about-label"><span>About Us</span></p>
              <h2 className="about-heading">
                {ap?.heading || 'Turning Your Ideas Into Beautifully Crafted Spaces'}
              </h2>
              <p className="about-desc">
                {ap?.description || "We embrace the latest technologies and sustainable practices to create environmentally-friendly and energy-efficient buildings. Our mission is not just to construct structures, but to build communities and spaces where people thrive and prosper."}
              </p>
              <a href="#services" className="learn-more">
                LEARN MORE
                <span className="learn-more-circle">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(-45deg)' }}>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </span>
              </a>
            </div>

            <div className="about-visual">
              <div className="about-visual__house">
                <img
                  src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Modern house"
                />
              </div>
              <div className="global-reach">
                <p className="global-reach__label">GLOBAL REACH</p>
                <img className="global-reach__icon" src="/house.png" alt="" />
                <div className="global-reach__divider" />
                <div className="global-reach__number"><CountUp to={ap?.globalReachNumber ?? 85} duration={1.6} /><span className="plus">{ap?.globalReachSuffix ?? '+'}</span></div>
                <p className="global-reach__caption">{ap?.globalReachCaption || 'Offices Worldwide'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default About;
