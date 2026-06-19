import Hero from '../../components/Hero';
import About from '../../components/About';
import WhatWeOffer from '../../components/WhatWeOffer';
import Stats from '../../components/Stats';
import Experience from '../../components/Experience';
import Projects from '../../components/Projects';
import LatestUpdates from '../../components/LatestUpdates';
import Events from '../../components/Events';
import Jobs from '../../components/Jobs';
import TeamMembers from '../../components/TeamMembers';
import Certifications from '../../components/Certifications';
import Contact from '../../components/Contact';
import { useOutletContext } from 'react-router-dom';
import type { Profile } from '../../services/profileService';

const Home = () => {
    const { profile } = useOutletContext<{ profile: Profile | null }>();

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-center p-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-200 mb-2">Service Unavailable</h1>
                    <p className="text-neutral-400">Unable to load website data</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Hero />
            <div className="section-divider" />
            <About profile={profile} />
            <div className="section-divider" />
            <WhatWeOffer />
            <Stats profile={profile} />
            <div className="section-divider" />
            <Experience profile={profile} />
            <div className="section-divider" />
            <Projects profile={profile} />
            <div className="section-divider" />
            <LatestUpdates />
            <div className="section-divider" />
            <Events />
            <div className="section-divider" />
            <Jobs />
            <div className="section-divider" />
            <TeamMembers profile={profile} />
            <div className="section-divider" />
            <Certifications profile={profile} />
            <div className="section-divider" />
            <Contact profile={profile} />
        </>
    );
};

export default Home;
