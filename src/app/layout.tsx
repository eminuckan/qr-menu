import type { Metadata } from "next";
import { Inter, Chakra_Petch } from "next/font/google";

import { Toaster } from "react-hot-toast";
import NextTopLoader from "nextjs-toploader";
import { Poppins, Roboto, Montserrat, Raleway } from 'next/font/google';
import "./styles/globals.css";
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

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

const chakraPetch = Chakra_Petch({
  weight: ['700'],
  subsets: ["latin"],
  display: "swap",
  variable: '--font-logo'
});

export const metadata: Metadata = {
  title: {
    template: "%s | QRFloww",
    default: "QRFloww - QR Menü Yönetim Sistemi",
  },
  description: "Modern işletmeler için akıllı QR menü ve sipariş yönetim sistemi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={`
                ${inter.className} 
                ${poppins.variable} 
                ${roboto.variable} 
                ${montserrat.variable} 
                ${raleway.variable}
                ${chakraPetch.variable}
            `}>
      <body className="min-h-screen bg-background text-foreground">
        <NextTopLoader height={5} />
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#333',
              padding: '16px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              fontSize: '14px',
              maxWidth: '400px',
              border: '1px solid #e2e8f0',
            },
            success: {
              style: {
                backgroundColor: '#f8fafc',
                border: '1px solid #22c55e',
              },
              iconTheme: {
                primary: '#22c55e',
                secondary: '#ffffff',
              },
            },
            error: {
              style: {
                backgroundColor: '#f8fafc',
                border: '1px solid #ef4444',
              },
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
