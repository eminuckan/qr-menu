import { cn } from "@/lib/utils";

interface PricingCardProps {
    title: string;
    price: number;
    description: string;
    features: string[];
    isPopular?: boolean;
    buttonText?: string;
    buttonVariant?: "primary" | "secondary";
    period: "monthly" | "yearly";
}

export function PricingCard({
    title,
    price,
    description,
    features,
    isPopular = false,
    buttonText = "Başla",
    buttonVariant = "secondary",
    period,
}: PricingCardProps) {
    const pricingCardClass = "bg-landing-background rounded-3xl p-8 border border-landing-primary/10 hover:border-landing-primary/30 transition-all flex flex-col relative";
    const pricingButtonClass = "w-full py-3 rounded-lg bg-landing-background text-landing-text border border-landing-primary/20 hover:border-landing-primary transition-all mt-8";
    const pricingButtonPrimaryClass = "w-full py-3 rounded-lg bg-landing-primary text-landing-primary-foreground hover:bg-landing-accent transition-all mt-8";

    return (
        <div className={pricingCardClass}>
            {isPopular && (
                <div className="absolute -top-3 right-8 px-3 py-1 bg-landing-primary text-landing-primary-foreground text-sm rounded-full">
                    Popüler
                </div>
            )}
            <div className="flex-1">
                <h3 className="text-2xl font-bold text-landing-text mb-4">{title}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-bold text-landing-text">₺{price}</span>
                    <span className="text-landing-text/60">/ {period === "monthly" ? "aylık" : "aylık"}</span>
                </div>
                <p className="text-landing-text/60 mb-8">{description}</p>
                <div className="space-y-4">
                    <h4 className="font-semibold text-landing-text mb-4">ÖZELLİKLER</h4>
                    {features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-landing-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-landing-text/60">{feature}</span>
                        </div>
                    ))}
                </div>
            </div>
            <button
                className={cn(
                    buttonVariant === "primary" ? pricingButtonPrimaryClass : pricingButtonClass
                )}
            >
                {buttonText}
            </button>
        </div>
    );
} 