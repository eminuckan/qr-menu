import { Inter, Poppins, Roboto, Montserrat, Raleway } from 'next/font/google';

// Google Fontları
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const poppins = Poppins({
    weight: ['400', '500', '600', '700'],
    subsets: ['latin'],
    variable: '--font-poppins'
});
const roboto = Roboto({
    weight: ['400', '500', '700'],
    subsets: ['latin'],
    variable: '--font-roboto'
});
const montserrat = Montserrat({
    subsets: ['latin'],
    variable: '--font-montserrat'
});
const raleway = Raleway({
    subsets: ['latin'],
    variable: '--font-raleway'
});

// Font map'i oluştur
export const fonts = {
    inter,
    poppins,
    roboto,
    montserrat,
    raleway
} as const;

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
