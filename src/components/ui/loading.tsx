"use client";

import dynamic from "next/dynamic";
import loadingAnimation from "./loading.json";

const LottieComponent = dynamic(() => import("lottie-react"), { ssr: false });

interface LoadingProps {
    className?: string;
}

export const Loading = ({ className }: LoadingProps) => {
    return (
        <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
            <div className="w-60 h-60">
                <LottieComponent
                    animationData={loadingAnimation}
                    loop
                />
            </div>
        </div>
    );
};
