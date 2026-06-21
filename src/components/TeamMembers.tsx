import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import type { Profile } from '../services/profileService';

interface TeamMembersProps {
    profile: Profile;
}

const TeamMembers: React.FC<TeamMembersProps> = ({ profile }) => {
    const members = profile.teamMembers || [];

    if (members.length === 0) return null;

    const [current, setCurrent] = useState(0);

    const prev = () => setCurrent((c) => (c === 0 ? members.length - 1 : c - 1));
    const next = () => setCurrent((c) => (c === members.length - 1 ? 0 : c + 1));

    const getImageUrl = (member: any) => {
        if (member.imageUrl) return member.imageUrl;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&size=300`;
    };

    const getPrevIndex = () => (current === 0 ? members.length - 1 : current - 1);
    const getNextIndex = () => (current === members.length - 1 ? 0 : current + 1);

    return (
        <section data-nav-theme="light" className="section section-indicator" id="team">
            <div className="container">
                <motion.span
                    className="ark-section__sub"
                    style={{ display: 'inline-block', marginLeft: '30px', color: '#111' }}
                    animate={{ x: [-20, 20, -20] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                >
                    Meet Professionals
                </motion.span>
                <h2 className="ark-section__heading">Our Team</h2>

                <div className="team-carousel">
                    <button className="team-carousel__arrow team-carousel__arrow--left" onClick={prev}>
                        <FaChevronLeft />
                    </button>

                    <div className="team-carousel__viewport">
                        <div className="team-carousel__track">
                            {/* Prev card */}
                            <div
                                className="team-carousel__card team-carousel__card--side"
                                onMouseEnter={() => setCurrent(getPrevIndex())}
                            >
                                <div className="team-carousel__img-wrap">
                                    <img
                                        key={`prev-${getPrevIndex()}`}
                                        src={getImageUrl(members[getPrevIndex()])}
                                        alt={members[getPrevIndex()].name}
                                        className="team-carousel__img"
                                    />
                                </div>
                            </div>

                            {/* Center card */}
                            <div className="team-carousel__card team-carousel__card--center">
                                <div className="team-carousel__img-wrap">
                                    <img
                                        key={`center-${current}`}
                                        src={getImageUrl(members[current])}
                                        alt={members[current].name}
                                        className="team-carousel__img"
                                    />
                                </div>
                                <h3 className="team-carousel__name">{members[current].name}</h3>
                                <p className="team-carousel__role">{members[current].role}</p>
                            </div>

                            {/* Next card */}
                            <div
                                className="team-carousel__card team-carousel__card--side"
                                onMouseEnter={() => setCurrent(getNextIndex())}
                            >
                                <div className="team-carousel__img-wrap">
                                    <img
                                        key={`next-${getNextIndex()}`}
                                        src={getImageUrl(members[getNextIndex()])}
                                        alt={members[getNextIndex()].name}
                                        className="team-carousel__img"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button className="team-carousel__arrow team-carousel__arrow--right" onClick={next}>
                        <FaChevronRight />
                    </button>
                </div>

                <div className="team-carousel__dots">
                    {members.map((_, i) => (
                        <span
                            key={i}
                            className={`team-carousel__dot ${i === current ? 'active' : ''}`}
                            onClick={() => setCurrent(i)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TeamMembers;
