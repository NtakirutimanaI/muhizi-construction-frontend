import { useState } from 'react';
import { LuArrowUpRight, LuChevronDown, LuHeadset } from 'react-icons/lu';
import type { Profile } from '../services/profileService';

interface FaqProps {
    profile: Profile;
}

const DEFAULT_FAQ_ITEMS = [
    { question: 'What Kind Of Warranty Or Guarantee Do You Offer?', answer: 'We back every project with a workmanship warranty and work closely with material suppliers so any defect is corrected quickly at no extra cost to you.' },
    { question: 'Why Should I Choose You For My Construction Project?', answer: 'Our licensed engineers and skilled crews bring years of hands-on experience, transparent pricing, and a track record of delivering projects on time and on budget.' },
    { question: 'What Is The Process For Working With Us?', answer: 'We start with a free consultation, move into design and planning, then construction with regular progress updates, and finish with a full walkthrough before handover.' },
    { question: 'How Long Does A Typical Project Take?', answer: 'Timelines vary by scope, but most residential builds take four to nine months, while larger commercial projects are scoped individually after a site assessment.' },
    { question: 'What Types Of Projects Do You Specialize In?', answer: 'We specialize in residential and commercial construction, road and infrastructure work, architectural design, and real estate development.' },
];

const Faq: React.FC<FaqProps> = ({ profile }) => {
    const faqContent = profile.pageContent?.faq;
    const items = faqContent?.items?.length ? faqContent.items : DEFAULT_FAQ_ITEMS;
    const heading = faqContent?.heading || 'Your Construction FAQ For Customer';
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section data-nav-theme="light" className="section section-indicator" id="faq" style={{ background: '#fff' }}>
            <style>{`
                .faq-grid { display: grid; grid-template-columns: minmax(280px, 400px) 1fr; gap: 3rem; align-items: start; max-width: 1150px; margin: 0 auto; }

                .faq-eyebrow { display: flex; align-items: center; gap: 0.75rem; color: var(--accent, #D97706); font-weight: 700; font-size: 0.78rem; letter-spacing: 0.15em; text-transform: uppercase; margin: 0 0 1rem; }
                .faq-eyebrow::before { content: ''; width: 30px; height: 2px; background: var(--accent, #D97706); display: inline-block; }
                .faq-heading { font-family: var(--font-display); color: var(--text-main); font-size: clamp(1.9rem, 3.2vw, 2.5rem); font-weight: 800; line-height: 1.2; margin: 0 0 1.1rem; }
                .faq-subtitle { color: var(--text-muted); font-size: 0.92rem; line-height: 1.7; max-width: 340px; margin: 0 0 3rem; }

                .faq-support-card { display: flex; gap: 1rem; align-items: flex-start; border: 1px solid var(--border-color); border-radius: 14px; padding: 1.1rem; background: #fff; box-shadow: 0 8px 24px rgba(15,18,34,0.06); max-width: 340px; }
                .faq-support-avatar { width: 56px; height: 56px; border-radius: 10px; background: var(--text-main); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.5rem; flex-shrink: 0; }
                .faq-support-content h4 { margin: 0 0 0.4rem; font-size: 1rem; font-weight: 700; color: var(--text-main); }
                .faq-support-content p { margin: 0 0 0.85rem; font-size: 0.82rem; color: var(--text-muted); line-height: 1.5; }
                .faq-support-btn { display: inline-block; background: var(--accent, #D97706); color: #fff; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; padding: 0.55rem 1.1rem; border-radius: 9999px; text-decoration: none; transition: background 0.2s ease; }
                .faq-support-btn:hover { background: var(--accent-dark, #B45309); }

                .faq-list { display: flex; flex-direction: column; gap: 1rem; }
                .faq-item { border: 1px solid var(--border-color); border-radius: 16px; background: #F5F7FA; box-shadow: 0 2px 10px rgba(15,18,34,0.04); cursor: pointer; transition: background 0.2s ease, box-shadow 0.2s ease; padding: 1.3rem 1.5rem; }
                .faq-item:hover { box-shadow: 0 6px 18px rgba(15,18,34,0.08); }
                .faq-item--open { background: #ffffff; box-shadow: 0 10px 26px rgba(15,18,34,0.1); }
                .faq-item__q { display: flex; align-items: center; justify-content: space-between; gap: 1rem; width: 100%; background: none; border: none; padding: 0; margin: 0; font-size: 1rem; font-weight: 700; color: var(--text-main); text-align: left; cursor: pointer; }
                .faq-item__icon { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: var(--accent, #D97706); color: #fff; transition: background 0.2s ease, transform 0.2s ease; }
                .faq-item--open .faq-item__icon { background: var(--text-main); }
                .faq-item__a { margin: 0.9rem 0 0; color: var(--text-muted); font-size: 0.9rem; line-height: 1.7; }

                @media (max-width: 900px) {
                    .faq-grid { grid-template-columns: 1fr; }
                    .faq-subtitle, .faq-support-card { max-width: 100%; }
                }
            `}</style>

            <div className="container">
                <div className="faq-grid">
                    <div className="faq-left">
                        <p className="faq-eyebrow">Construction Company</p>
                        <h2 className="faq-heading">{heading}</h2>
                        <p className="faq-subtitle">
                            Real stories from homeowners and investors who trusted us to guide their construction journey.
                        </p>

                        <div className="faq-support-card">
                            <div className="faq-support-avatar">
                                <LuHeadset />
                            </div>
                            <div className="faq-support-content">
                                <h4>Need More Help?</h4>
                                <p>Let us know if you have any questions about us.</p>
                                <a href="#contact" className="faq-support-btn">Contact Us</a>
                            </div>
                        </div>
                    </div>

                    <div className="faq-list">
                        {items.map((item, i) => {
                            const isOpen = openIndex === i;
                            return (
                                <div
                                    key={i}
                                    className={`faq-item ${isOpen ? 'faq-item--open' : ''}`}
                                    onClick={() => setOpenIndex(isOpen ? null : i)}
                                >
                                    <button type="button" className="faq-item__q">
                                        {item.question}
                                        <span className="faq-item__icon">
                                            {isOpen ? <LuChevronDown size={16} /> : <LuArrowUpRight size={16} />}
                                        </span>
                                    </button>
                                    {isOpen && <p className="faq-item__a">{item.answer}</p>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Faq;
