import { HTMLAttributes } from 'react';

export default function AppLogoIcon(props: HTMLAttributes<HTMLImageElement>) {
    const appName = import.meta.env.VITE_APP_NAME || 'Filmate';

    return (
        <img
            {...props}
            src={`${window.location.protocol}//${window.location.host}/logo.png`}
            alt={appName + " Logo"}
            className={`object-contain ${props.className || ''}`}
        />
    );
}
