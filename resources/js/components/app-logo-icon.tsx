import { HTMLAttributes } from 'react';

export default function AppLogoIcon(props: HTMLAttributes<HTMLImageElement>) {
    const appName = import.meta.env.VITE_APP_NAME || 'Tikomat';
    
    return (
        <img 
            {...props}
            src="/logo.png" 
            alt={appName + " Logo"} 
            className={`object-contain ${props.className || ''}`}
        />
    );
}
