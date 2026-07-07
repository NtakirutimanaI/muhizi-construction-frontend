import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadService } from '../services/uploadService';

interface ProfileFormModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type FormData = {
    // Profile Info
    profileImage: string | null;
    talentTitle: string;
    phone: string;
    address: string;
    email: string;
    // BIO
    bio: string;
    // Resume
    resumeFile: File | null;
    // Social Links
    github: string;
    linkedin: string;
    twitter: string;
    instagram: string;
    // Languages
    languages: { name: string; level: string }[];
    // Preferred work mode
    workMode: string;
    // Finished Projects
    techSkills: { projectName: string; description: string; link: string; imageFile: File | null }[];
    // Experience
    experience: { company: string; role: string; startDate: string; endDate: string; description: string }[];
    // Skills
    skills: string[];
    // Education
    education: { institution: string; degree: string; field: string; startYear: string; endYear: string }[];
};

const initialFormData: FormData = {
    profileImage: null,
    talentTitle: '',
    phone: '',
    address: '',
    email: '',
    bio: '',
    resumeFile: null,
    github: '',
    linkedin: '',
    twitter: '',
    instagram: '',
    languages: [],
    workMode: '',
    techSkills: [],
    experience: [],
    skills: [],
    education: [],
};

const languageOptions = ['English', 'French', 'Kinyarwanda', 'Swahili', 'Arabic', 'Portuguese', 'Spanish', 'German', 'Chinese', 'Japanese'];
const levelOptions = ['Beginner', 'Intermediate', 'Advanced', 'Fluent', 'Native'];

const ProfileFormModal: React.FC<ProfileFormModalProps> = ({ isOpen, onClose }) => {
    const [form, setForm] = useState<FormData>(initialFormData);
    const [activeSection, setActiveSection] = useState('profile');
    const [techSkillPreviews, setTechSkillPreviews] = useState<(string | null)[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filledFields = [
        form.talentTitle, form.phone, form.address, form.email,
        form.bio, form.workMode,
        ...form.skills,
        ...form.languages.map(l => l.name),
        ...form.techSkills.map(s => s.projectName),
        ...form.experience.map(e => e.company),
        ...form.education.map(e => e.institution),
    ].filter(Boolean).length;

    const totalFields = 25;
    const percentage = Math.min(Math.round((filledFields / totalFields) * 100), 100);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const uploaded = await uploadService.uploadFile(file);
                setForm(prev => ({ ...prev, profileImage: uploaded.secureUrl }));
            } catch {
                alert('Failed to upload image');
            }
        }
    };

    const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const addLanguage = () => {
        setForm(prev => ({ ...prev, languages: [...prev.languages, { name: '', level: '' }] }));
    };
    const updateLanguage = (index: number, field: 'name' | 'level', value: string) => {
        setForm(prev => {
            const langs = [...prev.languages];
            langs[index] = { ...langs[index], [field]: value };
            return { ...prev, languages: langs };
        });
    };
    const removeLanguage = (index: number) => {
        setForm(prev => ({ ...prev, languages: prev.languages.filter((_, i) => i !== index) }));
    };

    const addTechSkill = () => {
        setForm(prev => ({ ...prev, techSkills: [...prev.techSkills, { projectName: '', description: '', link: '', imageFile: null }] }));
    };
    const updateTechSkill = (index: number, field: 'projectName' | 'description' | 'link', value: string) => {
        setForm(prev => {
            const skills = [...prev.techSkills];
            skills[index] = { ...skills[index], [field]: value };
            return { ...prev, techSkills: skills };
        });
    };
    const removeTechSkill = (index: number) => {
        setForm(prev => ({ ...prev, techSkills: prev.techSkills.filter((_, i) => i !== index) }));
    };
    const handleTechSkillImage = async (index: number, file: File | null) => {
        if (!file) {
            setForm(prev => {
                const skills = [...prev.techSkills];
                skills[index] = { ...skills[index], imageFile: null };
                return { ...prev, techSkills: skills };
            });
            setTechSkillPreviews(prev => {
                const arr = [...prev];
                arr[index] = null;
                return arr;
            });
            return;
        }
        try {
            const uploaded = await uploadService.uploadFile(file);
            setForm(prev => {
                const skills = [...prev.techSkills];
                skills[index] = { ...skills[index], imageFile: null, imageUrl: uploaded.secureUrl };
                return { ...prev, techSkills: skills };
            });
            setTechSkillPreviews(prev => {
                const arr = [...prev];
                arr[index] = uploaded.secureUrl;
                return arr;
            });
        } catch {
            alert('Failed to upload image');
        }
    };

    const addExperience = () => {
        setForm(prev => ({ ...prev, experience: [...prev.experience, { company: '', role: '', startDate: '', endDate: '', description: '' }] }));
    };
    const updateExperience = (index: number, field: string, value: string) => {
        setForm(prev => {
            const exp = [...prev.experience];
            exp[index] = { ...exp[index], [field]: value };
            return { ...prev, experience: exp };
        });
    };
    const removeExperience = (index: number) => {
        setForm(prev => ({ ...prev, experience: prev.experience.filter((_, i) => i !== index) }));
    };

    const addEducation = () => {
        setForm(prev => ({ ...prev, education: [...prev.education, { institution: '', degree: '', field: '', startYear: '', endYear: '' }] }));
    };
    const updateEducation = (index: number, field: string, value: string) => {
        setForm(prev => {
            const edu = [...prev.education];
            edu[index] = { ...edu[index], [field]: value };
            return { ...prev, education: edu };
        });
    };
    const removeEducation = (index: number) => {
        setForm(prev => ({ ...prev, education: prev.education.filter((_, i) => i !== index) }));
    };

    const addSkill = () => {
        setForm(prev => ({ ...prev, skills: [...prev.skills, ''] }));
    };
    const updateSkill = (index: number, value: string) => {
        setForm(prev => {
            const skills = [...prev.skills];
            skills[index] = value;
            return { ...prev, skills };
        });
    };
    const removeSkill = (index: number) => {
        setForm(prev => ({ ...prev, skills: prev.skills.filter((_, i) => i !== index) }));
    };

    const sections = [
        { id: 'profile', label: 'Profile Info' },
        { id: 'bio', label: 'Bio' },
        { id: 'resume', label: 'Resume / CV' },
        { id: 'social', label: 'Social Links' },
        { id: 'languages', label: 'Languages' },
        { id: 'workmode', label: 'Work Mode' },
        { id: 'techskills', label: 'Finished Projects' },
        { id: 'experience', label: 'Experience' },
        { id: 'skills', label: 'Skills' },
        { id: 'education', label: 'Education' },
    ];

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="profile-modal-overlay"
                    key="profile-modal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        className="profile-modal"
                        key="profile-modal-inner"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                    >
                        <button className="profile-modal__close" onClick={onClose}>&#10005;</button>

                        <div className="profile-modal__layout">
                            {/* Left Sidebar */}
                            <aside className="profile-modal__sidebar">
                                <div className="profile-modal__avatar-section">
                                    <div className="profile-modal__avatar" onClick={() => fileInputRef.current?.click()}>
                                        {form.profileImage ? (
                                            <img src={form.profileImage} alt="Profile" />
                                        ) : (
                                            <span>+</span>
                                        )}
                                    </div>
                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} hidden />
                                </div>

                                <div className="profile-modal__info">
                                    <label className="profile-modal__label">
                                        Talent Title
                                        <input type="text" value={form.talentTitle} onChange={e => updateField('talentTitle', e.target.value)} placeholder="e.g. Construction Manager" />
                                    </label>
                                    <label className="profile-modal__label">
                                        Phone
                                        <input type="tel" value={form.phone} onChange={e => updateField('phone', e.target.value)} placeholder="+250 788 123 456" />
                                    </label>
                                    <label className="profile-modal__label">
                                        Address
                                        <input type="text" value={form.address} onChange={e => updateField('address', e.target.value)} placeholder="Kigali, Rwanda" />
                                    </label>
                                    <label className="profile-modal__label">
                                        Email
                                        <input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} placeholder="john@example.com" />
                                    </label>
                                </div>

                                {/* Sticky Section Nav */}
                                <nav className="profile-modal__section-nav">
                                    {sections.map(s => (
                                        <button
                                            key={s.id}
                                            className={`profile-modal__section-link ${activeSection === s.id ? '--active' : ''}`}
                                            onClick={() => {
                                                setActiveSection(s.id);
                                                document.getElementById(`section-${s.id}`)?.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </nav>
                            </aside>

                            {/* Right Content */}
                            <div className="profile-modal__content">
                                {/* Profile Completion */}
                                <div className="profile-modal__completion">
                                    <div className="profile-modal__completion-bar">
                                        <div className="profile-modal__completion-fill" style={{ width: `${percentage}%` }} />
                                    </div>
                                    <span className="profile-modal__completion-text">Profile {percentage}% complete</span>
                                </div>

                                <div className="profile-modal__sections">
                                    {/* BIO */}
                                    <section id="section-bio" className="profile-modal__section">
                                        <h3>BIO</h3>
                                        <p className="profile-modal__section-hint">Explain what you do</p>
                                        <textarea
                                            value={form.bio}
                                            onChange={e => updateField('bio', e.target.value)}
                                            placeholder="Tell us about yourself, your expertise, and what drives you..."
                                            rows={5}
                                        />
                                    </section>

                                    {/* Resume / CV */}
                                    <section id="section-resume" className="profile-modal__section">
                                        <h3>Resume / CV</h3>
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            onChange={e => updateField('resumeFile', e.target.files?.[0] || null)}
                                        />
                                        {form.resumeFile && <span className="profile-modal__file-name">{form.resumeFile.name}</span>}
                                    </section>

                                    {/* Social Links */}
                                    <section id="section-social" className="profile-modal__section">
                                        <h3>Social Media Links</h3>
                                        <div className="profile-modal__social-grid">
                                            <label className="profile-modal__label">
                                                GitHub
                                                <input type="url" value={form.github} onChange={e => updateField('github', e.target.value)} placeholder="https://github.com/username" />
                                            </label>
                                            <label className="profile-modal__label">
                                                LinkedIn
                                                <input type="url" value={form.linkedin} onChange={e => updateField('linkedin', e.target.value)} placeholder="https://linkedin.com/in/username" />
                                            </label>
                                            <label className="profile-modal__label">
                                                Twitter
                                                <input type="url" value={form.twitter} onChange={e => updateField('twitter', e.target.value)} placeholder="https://twitter.com/username" />
                                            </label>
                                            <label className="profile-modal__label">
                                                Instagram
                                                <input type="url" value={form.instagram} onChange={e => updateField('instagram', e.target.value)} placeholder="https://instagram.com/username" />
                                            </label>
                                        </div>
                                    </section>

                                    {/* Languages */}
                                    <section id="section-languages" className="profile-modal__section">
                                        <h3>Languages</h3>
                                        {form.languages.map((lang, i) => (
                                            <div key={i} className="profile-modal__row">
                                                <select value={lang.name} onChange={e => updateLanguage(i, 'name', e.target.value)}>
                                                    <option value="">Select language</option>
                                                    {languageOptions.map(l => <option key={l} value={l}>{l}</option>)}
                                                </select>
                                                <select value={lang.level} onChange={e => updateLanguage(i, 'level', e.target.value)}>
                                                    <option value="">Select level</option>
                                                    {levelOptions.map(l => <option key={l} value={l}>{l}</option>)}
                                                </select>
                                                <button className="profile-modal__remove-btn" onClick={() => removeLanguage(i)}>&#10005;</button>
                                            </div>
                                        ))}
                                        <button className="profile-modal__add-btn" onClick={addLanguage}>+ Add Language</button>
                                    </section>

                                    {/* Preferred Work Mode */}
                                    <section id="section-workmode" className="profile-modal__section">
                                        <h3>Preferred Work Mode</h3>
                                        <div className="profile-modal__workmode">
                                            {['Remote', 'On-site', 'Hybrid', 'Freelance'].map(mode => (
                                                <button
                                                    key={mode}
                                                    className={`profile-modal__workmode-btn ${form.workMode === mode ? '--selected' : ''}`}
                                                    onClick={() => updateField('workMode', mode)}
                                                >
                                                    {mode}
                                                </button>
                                            ))}
                                        </div>
                                    </section>

                                    {/* Finished Projects */}
                                    <section id="section-techskills" className="profile-modal__section">
                                        <h3>Finished Projects</h3>
                                        <p className="profile-modal__section-hint">Add project name, description, and link/image</p>
                                        {form.techSkills.map((skill, i) => (
                                            <div key={i} className="profile-modal__card">
                                                <div className="profile-modal__card-header">
                                                    <span>Project {i + 1}</span>
                                                    <button className="profile-modal__remove-btn" onClick={() => removeTechSkill(i)}>&#10005;</button>
                                                </div>
                                                <label className="profile-modal__label">
                                                    Project Name
                                                    <input type="text" value={skill.projectName} onChange={e => updateTechSkill(i, 'projectName', e.target.value)} placeholder="Project name" />
                                                </label>
                                                <label className="profile-modal__label">
                                                    Description
                                                    <textarea value={skill.description} onChange={e => updateTechSkill(i, 'description', e.target.value)} placeholder="Describe the project..." rows={2} />
                                                </label>
                                                <label className="profile-modal__label" style={{ gridColumn: '1 / -1' }}>
                                                    Link or Image Upload
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                        <input type="url" value={skill.link} onChange={e => updateTechSkill(i, 'link', e.target.value)} placeholder="https://..." />
                                                        <div>
                                                            <input type="file" accept="image/*" onChange={e => handleTechSkillImage(i, e.target.files?.[0] || null)} style={{ fontSize: '0.82rem', width: '100%' }} />
                                                            {skill.imageFile && <span style={{ fontSize: '0.78rem', color: 'var(--primary)', marginTop: '0.2rem', display: 'block' }}>{skill.imageFile.name}</span>}
                                                        </div>
                                                    </div>
                                                    {techSkillPreviews[i] && (
                                                        <img src={techSkillPreviews[i]!} alt="Preview" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', marginTop: '0.5rem', border: '1px solid rgba(0,0,0,0.08)' }} />
                                                    )}
                                                </label>
                                            </div>
                                        ))}
                                        <button className="profile-modal__add-btn" onClick={addTechSkill}>+ Add Project</button>
                                    </section>

                                    {/* Experience */}
                                    <section id="section-experience" className="profile-modal__section">
                                        <h3>Experience</h3>
                                        {form.experience.map((exp, i) => (
                                            <div key={i} className="profile-modal__card">
                                                <div className="profile-modal__card-header">
                                                    <span>Experience {i + 1}</span>
                                                    <button className="profile-modal__remove-btn" onClick={() => removeExperience(i)}>&#10005;</button>
                                                </div>
                                                <div className="profile-modal__row-2">
                                                    <label className="profile-modal__label">
                                                        Company
                                                        <input type="text" value={exp.company} onChange={e => updateExperience(i, 'company', e.target.value)} placeholder="Company name" />
                                                    </label>
                                                    <label className="profile-modal__label">
                                                        Role
                                                        <input type="text" value={exp.role} onChange={e => updateExperience(i, 'role', e.target.value)} placeholder="Job title" />
                                                    </label>
                                                </div>
                                                <div className="profile-modal__row-2">
                                                    <label className="profile-modal__label">
                                                        Start Date
                                                        <input type="month" value={exp.startDate} onChange={e => updateExperience(i, 'startDate', e.target.value)} />
                                                    </label>
                                                    <label className="profile-modal__label">
                                                        End Date
                                                        <input type="month" value={exp.endDate} onChange={e => updateExperience(i, 'endDate', e.target.value)} />
                                                    </label>
                                                </div>
                                                <label className="profile-modal__label">
                                                    Description
                                                    <textarea value={exp.description} onChange={e => updateExperience(i, 'description', e.target.value)} placeholder="Describe your responsibilities..." rows={2} />
                                                </label>
                                            </div>
                                        ))}
                                        <button className="profile-modal__add-btn" onClick={addExperience}>+ Add Experience</button>
                                    </section>

                                    {/* Skills */}
                                    <section id="section-skills" className="profile-modal__section">
                                        <h3>Skills</h3>
                                        {form.skills.map((skill, i) => (
                                            <div key={i} className="profile-modal__row">
                                                <input type="text" value={skill} onChange={e => updateSkill(i, e.target.value)} placeholder="e.g. Structural Engineering, Masonry, ..." />
                                                <button className="profile-modal__remove-btn" onClick={() => removeSkill(i)}>&#10005;</button>
                                            </div>
                                        ))}
                                        <button className="profile-modal__add-btn" onClick={addSkill}>+ Add Skill</button>
                                    </section>

                                    {/* Education */}
                                    <section id="section-education" className="profile-modal__section">
                                        <h3>Education</h3>
                                        {form.education.map((edu, i) => (
                                            <div key={i} className="profile-modal__card">
                                                <div className="profile-modal__card-header">
                                                    <span>Education {i + 1}</span>
                                                    <button className="profile-modal__remove-btn" onClick={() => removeEducation(i)}>&#10005;</button>
                                                </div>
                                                <label className="profile-modal__label">
                                                    Institution
                                                    <input type="text" value={edu.institution} onChange={e => updateEducation(i, 'institution', e.target.value)} placeholder="University / School" />
                                                </label>
                                                <div className="profile-modal__row-2">
                                                    <label className="profile-modal__label">
                                                        Degree
                                                        <input type="text" value={edu.degree} onChange={e => updateEducation(i, 'degree', e.target.value)} placeholder="Bachelor's, Master's, ..." />
                                                    </label>
                                                    <label className="profile-modal__label">
                                                        Field of Study
                                                        <input type="text" value={edu.field} onChange={e => updateEducation(i, 'field', e.target.value)} placeholder="Computer Science" />
                                                    </label>
                                                </div>
                                                <div className="profile-modal__row-2">
                                                    <label className="profile-modal__label">
                                                        Start Year
                                                        <input type="number" value={edu.startYear} onChange={e => updateEducation(i, 'startYear', e.target.value)} placeholder="2020" />
                                                    </label>
                                                    <label className="profile-modal__label">
                                                        End Year
                                                        <input type="number" value={edu.endYear} onChange={e => updateEducation(i, 'endYear', e.target.value)} placeholder="2024" />
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                        <button className="profile-modal__add-btn" onClick={addEducation}>+ Add Education</button>
                                    </section>

                                    {/* Submit */}
                                    <div className="profile-modal__submit">
                                        <button className="jobs__profile-btn" onClick={() => { alert('Profile submitted!'); onClose(); }}>
                                            Submit Profile
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ProfileFormModal;
