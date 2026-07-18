import Hero from '../../components/Hero';
import About from '../../components/About';
import AboutPage from './About';
import WhatWeOffer from '../../components/WhatWeOffer';
import Commitment from '../../components/Commitment';
import Projects from '../../components/Projects';
import FollowUs from '../../components/FollowUs';
import News from '../../components/News';
import TeamMembers from '../../components/TeamMembers';
import Certifications from '../../components/Certifications';
import Faq from '../../components/Faq';
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
            <AboutPage />
            <About profile={profile} />
            <WhatWeOffer heading={pc?.services?.heading} subtitle={pc?.services?.subtitle} items={pc?.services?.items} />
            <Commitment profile={profile} />
            <Projects profile={profile} />
            <FollowUs profile={profile} />
            <TeamMembers profile={profile} />
            <Certifications profile={profile} />
            <Faq profile={profile} />
            <Contact profile={profile} />
            <News profile={profile} />
        </>
    );
};

export default Home;
