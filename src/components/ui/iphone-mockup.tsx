import React from 'react';
import { cn } from '@/lib/utils';

interface IPhoneMockupProps {
    children: React.ReactNode;
    className?: string;
    color?: 'space-black' | 'deep-purple' | 'gold' | 'silver';
    background?: {
        type: 'image' | 'color' | 'gradient';
        value: string;
    };
}

const IPhoneMockup: React.FC<IPhoneMockupProps> = ({
    children,
    className = '',
    color = 'space-black',
    background = {
        type: 'image',
        value: 'https://www.ifeed.pt/content/images/2022/09/iPhone-14-Pro-Space-Black-wallpaper.png'
    }
}) => {
    // Background style'ını oluştur
    const getBackgroundStyle = () => {
        switch (background.type) {
            case 'image':
                return {
                    backgroundImage: `url(${background.value})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                };
            case 'color':
                return {
                    backgroundColor: background.value
                };
            case 'gradient':
                return {
                    backgroundImage: background.value
                };
            default:
                return {};
        }
    };

    return (
        <div className={cn('iphone-front', color, className)}>
            <div className="frame" />

            {/* Antenler */}
            <div className="antenas">
                <div className="tt" />
                <div className="tr" />
                <div className="tl" />
                <div className="bb" />
                <div className="br" />
                <div className="bl" />
            </div>

            {/* Yan Tuşlar */}
            <div className="keys">
                <div className="silent" />
                <div className="volt" />
                <div className="volb" />
                <div className="lock" />
            </div>

            {/* Ekran */}
            <div className="screen" style={getBackgroundStyle()}>
                {/* Dynamic Island */}
                <div className="island">
                    <div className="camera" />
                </div>

                {/* İçerik Alanı */}
                <div className="screen-content">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default IPhoneMockup; 