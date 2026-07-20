import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (token: string, user: User, refreshToken?: string) => void;
    logout: () => void;
    updateUser: (user: Partial<User>) => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            const savedToken = localStorage.getItem('accessToken');
            const savedUser = localStorage.getItem('user');

            if (savedToken) {
                try {
                    const me = await authService.getMe();
                    const mappedUser: User = {
                        id: me.id,
                        email: me.email,
                        firstName: me.profile?.firstName || '',
                        lastName: me.profile?.lastName || '',
                        role: me.role,
                        avatar: me.profile?.avatar || undefined,
                    };
                    localStorage.setItem('user', JSON.stringify(mappedUser));
                    setToken(savedToken);
                    setUser(mappedUser);
                } catch {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                    setToken(null);
                    setUser(null);
                }
            } else {
                localStorage.removeItem('user');
            }
            setLoading(false);
        };
        init();
    }, []);

    const login = (newToken: string, newUser: any, refreshToken?: string) => {
        const mappedUser: User = {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.profile?.firstName || newUser.firstName || '',
            lastName: newUser.profile?.lastName || newUser.lastName || '',
            role: newUser.role,
            avatar: newUser.profile?.avatar || newUser.avatar || undefined,
        };
        localStorage.setItem('accessToken', newToken);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(mappedUser));
        setToken(newToken);
        setUser(mappedUser);
    };

    const logout = () => {
        authService.logout().catch(() => {});
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        // Use window location for a hard redirect to ensure state clean up
        window.location.href = '/login';
    };

    const updateUser = (updates: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...updates };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!token,
                login,
                logout,
                updateUser,
                loading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
