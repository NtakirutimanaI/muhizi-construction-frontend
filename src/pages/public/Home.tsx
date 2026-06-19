import Hero from '../../components/Hero';
import About from '../../components/About';
import WhatWeOffer from '../../components/WhatWeOffer';
import Experience from '../../components/Experience';
import Projects from '../../components/Projects';
import Events from '../../components/Events';
import TeamMembers from '../../components/TeamMembers';
import Certifications from '../../components/Certifications';
import Contact from '../../components/Contact';
import { useOutletContext } from 'react-router-dom';
import type { Profile } from '../../services/profileService';

const Home = () => {
    const { profile } = useOutletContext<{ profile: Profile | null }>();
    const pc = profile?.pageContent;

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
            <Hero slides={pc?.heroSlides} videoUrl={pc?.heroVideoUrl} />
            <div className="section-divider" />
            <About profile={profile} />
            <div className="section-divider" />
            <WhatWeOffer heading={pc?.services?.heading} subtitle={pc?.services?.subtitle} items={pc?.services?.items} />
            <div className="section-divider" />
            <Experience />
            <div className="section-divider" />
            <Projects profile={profile} />
            <div className="section-divider" />
            <Events events={pc?.events} />
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
