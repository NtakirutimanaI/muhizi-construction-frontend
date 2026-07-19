import { useState, useEffect } from 'react';
import { FaUserCircle } from 'react-icons/fa';
import { profileService } from '../../services/profileService';
import type { Profile } from '../../services/profileService';
import { useAuth } from '../../context/AuthContext';
import Loading from '../../components/Loading';
import { loadPageCache, savePageCache } from '../../utils/pageCache';
import GeneralTab from './profile-sections/GeneralTab';

const tabs = [
    { key: 'general', label: 'General', icon: FaUserCircle },
];

const ProfileManagement = () => {
    const { updateUser } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => { loadProfile(); }, []);

    const loadProfile = async () => {
        const cached = loadPageCache<Profile>('pg_profile_management');
        if (cached) {
            setProfile(cached);
            updateUser({ firstName: cached.firstName, lastName: cached.lastName, email: cached.email, avatar: cached.avatar });
        }
        try {
            const data = await profileService.getMyProfile();
            setProfile(data);
            updateUser({ firstName: data.firstName, lastName: data.lastName, email: data.email, avatar: data.avatar });
            savePageCache('pg_profile_management', data);
        } catch (error) {
            console.error('Failed to load profile', error);
        }
    };

    const handleProfileUpdate = (updatedProfile: Profile) => {
        setProfile(updatedProfile);
        updateUser({ firstName: updatedProfile.firstName, lastName: updatedProfile.lastName, email: updatedProfile.email, avatar: updatedProfile.avatar });
    };

    if (!profile) return <div style={{ textAlign: 'center', padding: '2rem' }}>Failed to load profile</div>;

    return (
        <div>
            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '4px', overflowX: 'auto', flexWrap: 'nowrap' }}>
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '0.75rem 1.25rem',
                                fontSize: '0.9rem',
                                fontWeight: isActive ? 700 : 500,
                                color: isActive ? 'var(--primary-teal)' : 'var(--text-muted)',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: isActive ? '2px solid var(--primary-teal)' : '2px solid transparent',
                                marginBottom: '-6px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s',
                            }}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            {activeTab === 'general' && (
                <GeneralTab profile={profile} onUpdate={(updatedProfile) => { handleProfileUpdate(updatedProfile); window.dispatchEvent(new CustomEvent('profile-updated')); }} />
            )}
        </div>
    );
};

export default ProfileManagement;
