import { useCallback, useEffect, useState } from 'react';

export type Appearance = 'light';

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const applyTheme = () => {
    // Always remove dark class to ensure light mode
    document.documentElement.classList.remove('dark');
};

export function initializeTheme() {
    applyTheme();
}

export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>('light');

    const updateAppearance = useCallback(() => {
        setAppearance('light');

        // Store in localStorage for consistency
        localStorage.setItem('appearance', 'light');

        // Store in cookie for SSR
        setCookie('appearance', 'light');

        applyTheme();
    }, []);

    useEffect(() => {
        updateAppearance();
    }, [updateAppearance]);

    return { appearance, updateAppearance } as const;
}
