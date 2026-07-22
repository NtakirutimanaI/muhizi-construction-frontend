import { useState } from 'react';
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaClock, FaChevronDown, FaCheck } from 'react-icons/fa';
import { profileService, type ContactMessage, type Profile } from '../services/profileService';
import { useToast } from '../context/ToastContext';

interface ContactProps {
    profile: Profile;
}

const ConstructionIllustration: React.FC = () => (
    <svg viewBox="0 0 400 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="contact-illustration-svg">
        {/* Isometric ground — line only, no fill */}
        <path d="M30 320 L200 350 L370 320" stroke="#16324F" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M30 320 L30 330" stroke="#16324F" strokeWidth="1" />
        <path d="M370 320 L370 330" stroke="#16324F" strokeWidth="1" />

        {/* Main building — isometric block */}
        <path d="M100 320 L100 170 L200 140 L200 290Z" fill="#16324F" />
        <path d="M100 170 L200 140 L280 170 L200 200Z" fill="#2C4C6E" />
        <path d="M200 290 L200 140 L280 170 L280 320Z" fill="#0F2438" />

        {/* Building windows — teal accents */}
        <rect x="115" y="195" width="16" height="20" rx="2" fill="#324A5F" opacity="0.55" />
        <rect x="140" y="187" width="16" height="20" rx="2" fill="#324A5F" opacity="0.4" />
        <rect x="115" y="230" width="16" height="20" rx="2" fill="#324A5F" opacity="0.35" />
        <rect x="140" y="222" width="16" height="20" rx="2" fill="#16324F" opacity="0.3" />
        <rect x="212" y="192" width="16" height="20" rx="2" fill="#324A5F" opacity="0.45" />
        <rect x="237" y="200" width="16" height="20" rx="2" fill="#16324F" opacity="0.25" />
        <rect x="212" y="225" width="16" height="20" rx="2" fill="#324A5F" opacity="0.3" />

        {/* Second building — under construction, exposed floors */}
        <path d="M225 320 L225 215 L305 195 L305 320Z" fill="#c8ccd6" opacity="0.4" />
        <path d="M225 215 L305 195 L350 210 L270 230Z" fill="#b8bcc8" opacity="0.35" />
        <path d="M270 320 L270 230 L350 210 L350 320Z" fill="#c8ccd6" opacity="0.25" />
        <line x1="227" y1="248" x2="303" y2="228" stroke="#16324F" strokeWidth="0.8" strokeDasharray="5 4" opacity="0.3" />
        <line x1="227" y1="275" x2="303" y2="255" stroke="#16324F" strokeWidth="0.8" strokeDasharray="5 4" opacity="0.25" />
        <line x1="272" y1="260" x2="348" y2="238" stroke="#16324F" strokeWidth="0.8" strokeDasharray="5 4" opacity="0.2" />

        {/* Crane — mast, jib, cable */}
        <line x1="55" y1="320" x2="55" y2="75" stroke="#16324F" strokeWidth="3.5" />
        <line x1="55" y1="75" x2="215" y2="75" stroke="#16324F" strokeWidth="2.5" />
        <line x1="55" y1="75" x2="25" y2="75" stroke="#16324F" strokeWidth="2.5" />
        {/* Counterweight */}
        <rect x="20" y="70" width="10" height="10" rx="2" fill="#16324F" />
        {/* Diagonal bracing */}
        <line x1="55" y1="75" x2="55" y2="130" stroke="#16324F" strokeWidth="1.5" />
        <line x1="53" y1="95" x2="68" y2="85" stroke="#16324F" strokeWidth="0.8" />
        <line x1="53" y1="115" x2="68" y2="105" stroke="#16324F" strokeWidth="0.8" />
        {/* Cable + load */}
        <line x1="175" y1="75" x2="175" y2="135" stroke="#16324F" strokeWidth="1.2" />
        <rect x="168" y="135" width="14" height="10" rx="2" fill="#16324F" opacity="0.6" />
        {/* Cab */}
        <rect x="46" y="298" width="18" height="16" rx="3" fill="#16324F" />

        {/* Worker 1 — hard hat + stick figure */}
        <circle cx="135" cy="306" r="4.5" fill="#16324F" />
        <line x1="135" y1="311" x2="135" y2="328" stroke="#16324F" strokeWidth="2" />
        <line x1="135" y1="317" x2="127" y2="324" stroke="#16324F" strokeWidth="1.8" />
        <line x1="135" y1="317" x2="143" y2="324" stroke="#16324F" strokeWidth="1.8" />

        {/* Worker 2 */}
        <circle cx="295" cy="306" r="4.5" fill="#16324F" />
        <line x1="295" y1="311" x2="295" y2="328" stroke="#16324F" strokeWidth="2" />
        <line x1="295" y1="317" x2="287" y2="324" stroke="#16324F" strokeWidth="1.8" />
        <line x1="295" y1="317" x2="303" y2="324" stroke="#16324F" strokeWidth="1.8" />

        {/* Excavator */}
        <rect x="308" y="322" width="36" height="13" rx="4" fill="#16324F" opacity="0.65" />
        <circle cx="316" cy="338" r="4.5" fill="#16324F" opacity="0.5" />
        <circle cx="340" cy="338" r="4.5" fill="#16324F" opacity="0.5" />
        <line x1="316" y1="322" x2="298" y2="302" stroke="#16324F" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />

        {/* Scattered materials — small blocks */}
        <rect x="68" y="324" width="16" height="8" rx="1" fill="#16324F" opacity="0.15" />
        <rect x="73" y="318" width="10" height="7" rx="1" fill="#16324F" opacity="0.1" />
    </svg>
);

const Contact: React.FC<ContactProps> = ({ profile }) => {
    const { showToast } = useToast();
    const contactHeading = profile.pageContent?.contactSection?.heading;
    const contactSubtitle = profile.pageContent?.contactSection?.subtitle;
    const contactLocation = profile.pageContent?.contactSection?.location;
    const contactHours = profile.pageContent?.contactSection?.hours;
    const [localData, setLocalData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        company: '',
    });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setLocalData({ ...localData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        const payload: ContactMessage = {
            name: `${localData.firstName} ${localData.lastName}`.trim(),
            email: localData.email,
            message: localData.message,
        };

        if (localData.phone && localData.phone.trim()) {
            payload.phone = localData.phone.trim();
        }
        if (localData.subject && localData.subject.trim()) {
            payload.subject = localData.subject.trim();
        }
        if (localData.company && localData.company.trim()) {
            payload.company = localData.company.trim();
        }

        try {
            await profileService.sendContactMessage(payload);
            setStatus('success');
            setLocalData({ firstName: '', lastName: '', email: '', phone: '', subject: '', message: '', company: '' });
            setTimeout(() => setStatus('idle'), 5000);
        } catch (error: any) {
            const errMsg = error?.response?.data?.message;
            const displayMsg = Array.isArray(errMsg) ? errMsg.join('. ') : (errMsg || error?.message || 'Something went wrong');
            setStatus('error');
            showToast(displayMsg, 'error');
            setTimeout(() => setStatus('idle'), 5000);
        }
    };

    return (
        <section data-nav-theme="light" className="section contact-v2" id="contact">
            <div className="contact-v2__inner">

                {/* Left: Illustration */}
                <div className="contact-v2__illustration">
                    <ConstructionIllustration />
                </div>

                {/* Middle: Info list */}
                <div className="contact-v2__info">
                    <div className="contact-v2__info-items">
                        <div className="contact-v2__info-item">
                            <div className="contact-v2__info-icon">
                                <FaPhoneAlt />
                            </div>
                            <div>
                                <h4>Call Us</h4>
                                <p>{profile.phone}</p>
                            </div>
                        </div>
                        <div className="contact-v2__info-item">
                            <div className="contact-v2__info-icon">
                                <FaEnvelope />
                            </div>
                            <div>
                                <h4>Our Email</h4>
                                <p>{profile.email}</p>
                            </div>
                        </div>
                        <div className="contact-v2__info-item">
                            <div className="contact-v2__info-icon">
                                <FaMapMarkerAlt />
                            </div>
                            <div>
                                <h4>Location</h4>
                                <p>{contactLocation || 'Rwanda, Kigali, Nyarugenge, Nyamirambo'}</p>
                            </div>
                        </div>
                        <div className="contact-v2__info-item">
                            <div className="contact-v2__info-icon">
                                <FaClock />
                            </div>
                            <div>
                                <h4>Opening Hours</h4>
                                <p>{contactHours || 'Mon – Fri, 8:00 – 18:00'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Form */}
                <div className="contact-v2__form-wrap">
                    <div className="contact-v2__eyebrow">
                        <span className="contact-v2__eyebrow-line"></span>
                        CONTACT US
                    </div>
                    <h2 className="contact-v2__heading">Let's Work<br />Together</h2>
                    <p className="contact-v2__subtext">{contactSubtitle || contactHeading || 'Have a project in mind? We\'d love to hear from you.'}</p>

                    <form onSubmit={handleSubmit} className="contact-v2__form">
                        <div className="contact-v2__form-row">
                            <input
                                type="text"
                                name="firstName"
                                required
                                value={localData.firstName}
                                onChange={handleChange}
                                placeholder="Name"
                                className="contact-v2__input"
                            />
                            <input
                                type="email"
                                name="email"
                                required
                                value={localData.email}
                                onChange={handleChange}
                                placeholder="Email"
                                className="contact-v2__input"
                            />
                        </div>
                        <div className="contact-v2__form-row">
                            <input
                                type="tel"
                                name="phone"
                                value={localData.phone}
                                onChange={handleChange}
                                placeholder="Phone no."
                                className="contact-v2__input"
                            />
                            <div className="contact-v2__select-wrap">
                                <select
                                    name="subject"
                                    value={localData.subject}
                                    onChange={handleChange}
                                    className="contact-v2__input contact-v2__select"
                                >
                                    <option value="" disabled>Your inquiry about</option>
                                    <option value="General Inquiry">General Inquiry</option>
                                    <option value="New Project">New Project</option>
                                    <option value="Partnership">Partnership</option>
                                    <option value="Support">Support</option>
                                    <option value="Other">Other</option>
                                </select>
                                <FaChevronDown className="contact-v2__select-chevron" />
                            </div>
                        </div>
                        <textarea
                            name="message"
                            required
                            value={localData.message}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Message"
                            className="contact-v2__input contact-v2__textarea"
                        />
                        <button
                            type="submit"
                            className="contact-v2__submit"
                            disabled={status === 'loading'}
                        >
                            <span className="contact-v2__submit-text">
                                {status === 'loading' ? 'SENDING...' : status === 'success' ? <><FaCheck /> SENT</> : 'CONTACT NOW'}
                            </span>
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default Contact;
