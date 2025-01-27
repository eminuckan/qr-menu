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
    { value: montserrat.className, label: "Montserrat", font: montserrat },
    { value: inter.className, label: "Inter", font: inter },
    { value: poppins.className, label: "Poppins", font: poppins },
    { value: roboto.className, label: "Roboto", font: roboto },
    { value: raleway.className, label: "Raleway", font: raleway }
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
                            className={font.value}
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