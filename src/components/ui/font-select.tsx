import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Inter, Poppins, Roboto, Montserrat, Raleway } from 'next/font/google';

// Google Fontları
const inter = Inter({ subsets: ['latin'] });
const poppins = Poppins({ weight: ['400', '500', '600', '700'], subsets: ['latin'] });
const roboto = Roboto({ weight: ['400', '500', '700'], subsets: ['latin'] });
const montserrat = Montserrat({ subsets: ['latin'] });
const raleway = Raleway({ subsets: ['latin'] });

const fonts = [
    {
        value: "montserrat",
        label: "Montserrat",
        className: montserrat.className,
        font: montserrat
    },
    {
        value: "inter",
        label: "Inter",
        className: inter.className,
        font: inter
    },
    {
        value: "poppins",
        label: "Poppins",
        className: poppins.className,
        font: poppins
    },
    {
        value: "roboto",
        label: "Roboto",
        className: roboto.className,
        font: roboto
    },
    {
        value: "raleway",
        label: "Raleway",
        className: raleway.className,
        font: raleway
    }
] as const;

interface FontSelectProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
}

export const FontSelect = ({ value, onChange, label }: FontSelectProps) => {
    const selectedFont = fonts.find(f => f.value === value) || fonts[0];

    return (
        <div className="space-y-2">
            {label && <Label>{label}</Label>}
            <Select defaultValue={selectedFont.value} value={value} onValueChange={onChange}>
                <SelectTrigger>
                    <SelectValue defaultValue={selectedFont.value}>
                        {selectedFont.label}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {fonts.map((font) => (
                        <SelectItem
                            key={font.value}
                            value={font.value}
                            className={font.className}
                        >
                            {font.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};

export const defaultFont = fonts[0];

// Font className'ini almak için yardımcı fonksiyon
export const getFontClassName = (fontValue: string) => {
    const font = fonts.find(f => f.value === fontValue);
    return font?.className || defaultFont.className;
}; 