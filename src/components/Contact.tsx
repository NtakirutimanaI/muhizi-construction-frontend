import { useState } from 'react';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaPlus, FaYoutube, FaInstagram, FaLinkedin, FaWhatsapp } from 'react-icons/fa';
import { profileService, type ContactMessage, type Profile } from '../services/profileService';
import { useToast } from '../context/ToastContext';

interface ContactProps {
    profile: Profile;
}

const FAQS = [
    { q: 'What services does MUHIZI CONSTRUCTION offer?', a: 'MUHIZI CONSTRUCTION offers a comprehensive range of construction and real estate services including building construction, road construction, real estate development, property management, architectural design, interior & exterior finishing, renovation & remodeling, and project management.' },
    { q: 'How can I request a quote?', a: 'Simply fill out the contact form with details about your project, and our team will get back to you within 24 hours with a tailored proposal.' },
    { q: 'Do you offer post-construction support?', a: 'Yes, we provide ongoing maintenance, property management, and support packages to ensure your structures remain safe, up-to-date, and in excellent condition.' },
    { q: 'What types of projects do you handle?', a: 'We specialize in residential buildings, commercial complexes, roads and highways, industrial facilities, real estate developments, renovations, and infrastructure projects across Rwanda.' },
];

const Contact: React.FC<ContactProps> = ({ profile }) => {
    const { showToast } = useToast();
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
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        <section className="section" id="contact" style={{ borderBottom: 'none', padding: '60px 0' }}>
            <div className="container">
                <h2 className="ark-section__heading" style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0.5rem' }}>Get In Touch</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', maxWidth: '400px' }}>Looking forward to hearing from you</p>

                {/* Grid: Form + Info */}
                <div className="ark-contact__grid">
                    {/* Form Card */}
                    <div className="ark-contact__card">
                        <h3 className="ark-contact__card-title">Send us a message</h3>
                        <p className="ark-contact__card-desc">Fill out the form and we'll get back to you within 24 hours</p>
                        <form onSubmit={handleSubmit} className="ark-contact__form">
                            <div className="ark-contact__form-row">
                                <label>
                                    First Name *
                                    <input type="text" name="firstName" required value={localData.firstName} onChange={handleChange} placeholder="John" />
                                </label>
                                <label>
                                    Last Name *
                                    <input type="text" name="lastName" required value={localData.lastName} onChange={handleChange} placeholder="Doe" />
                                </label>
                            </div>
                            <div className="ark-contact__form-row">
                                <label>
                                    Email *
                                    <input type="email" name="email" required value={localData.email} onChange={handleChange} placeholder="john@example.com" />
                                </label>
                                <label>
                                    Subject
                                    <input type="text" name="subject" value={localData.subject} onChange={handleChange} placeholder="What's this about?" />
                                </label>
                            </div>
                            <label>
                                Message *
                                <textarea name="message" required value={localData.message} onChange={handleChange} rows={5} placeholder="Tell us about your project..." />
                            </label>
                            <button type="submit" className="btn-submit" disabled={status === 'loading'} style={{ width: '100%', marginTop: '0.5rem' }}>
                                {status === 'loading' ? 'Sending...' : 'Send Message'}
                            </button>
                            {status === 'success' && (
                                <p style={{ color: 'var(--primary)', fontWeight: 600, margin: 0 }}>✅ Message sent successfully!</p>
                            )}
                            {status === 'error' && (
                                <p style={{ color: '#ff5252', fontWeight: 600, margin: 0 }}>❌ Failed to send. Please try again.</p>
                            )}
                        </form>
                    </div>

                    {/* Info Card */}
                    <div className="ark-contact__card">
                        <h3 className="ark-contact__card-title">Contact Information</h3>
                        <p className="ark-contact__card-desc">Reach out through any of these channels</p>
                        <div className="ark-contact__info-list">
                            <div className="ark-contact__info-item">
                                <div className="ark-contact__info-icon"><FaPhone /></div>
                                <div>
                                    <h4>Phone</h4>
                                    <p>{profile.phone || '123-456-7890'}</p>
                                </div>
                            </div>
                            <div className="ark-contact__info-item">
                                <div className="ark-contact__info-icon"><FaEnvelope /></div>
                                <div>
                                    <h4>Email</h4>
                                    <p>{profile.email}</p>
                                </div>
                            </div>
                            <div className="ark-contact__info-item">
                                <div className="ark-contact__info-icon"><FaMapMarkerAlt /></div>
                                <div>
                                    <h4>Location</h4>
                                    <p>{profile.location || 'Kigali, Rwanda'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="ark-contact__social">
                            <h4 className="ark-contact__social-title">Follow Us</h4>
                            <div className="ark-contact__social-links">
                                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="ark-contact__social-link" title="YouTube"><FaYoutube /></a>
                                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="ark-contact__social-link" title="Instagram"><FaInstagram /></a>
                                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="ark-contact__social-link" title="LinkedIn"><FaLinkedin /></a>
                                <a href="https://wa.me/250787832490" target="_blank" rel="noopener noreferrer" className="ark-contact__social-link" title="WhatsApp"><FaWhatsapp /></a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Map */}
                {profile.location && (
                    <div className="ark-contact__map">
                        <h3 className="ark-contact__map-title">Find Us</h3>
                        <div className="ark-contact__map-wrap">
                            <iframe
                                className="ark-contact__map-iframe"
                                title="Office Location"
                                loading="lazy"
                                src={`https://maps.google.com/maps?q=${encodeURIComponent(profile.location)}&output=embed`}
                            />
                        </div>
                    </div>
                )}

                {/* FAQ */}
                <div className="ark-contact__faqs">
                    <h3 className="ark-contact__faqs-title">Frequently Asked Questions</h3>
                    <div className="ark-contact__faq-list">
                        {FAQS.map((faq, i) => (
                            <div
                                key={i}
                                className={`ark-contact__faq ${openFaq === i ? 'ark-contact__faq--open' : ''}`}
                                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                            >
                                <button className="ark-contact__faq-q">
                                    {faq.q}
                                    <span className="ark-contact__faq-icon"><FaPlus size={14} /></span>
                                </button>
                                <div className="ark-contact__faq-a">
                                    <p>{faq.a}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Contact;
