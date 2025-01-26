"use client";

import dynamic from "next/dynamic";
import { ComponentProps } from "react";

const LottieComponent = dynamic(() => import("lottie-react"), { ssr: false });

interface LoadingProps {
    className?: string;
}

export const Loading = ({ className }: LoadingProps) => {
    return (
        <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
            <div className="w-60 h-60">
                <LottieComponent
                    animationData={require("./loading.json")}
                    loop
                />
            </div>
        </div>
    );
}; 