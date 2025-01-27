import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import NextTopLoader from "nextjs-toploader";
import { Inter, Poppins, Roboto, Montserrat, Raleway } from 'next/font/google';

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

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`
                ${inter.variable} 
                ${poppins.variable} 
                ${roboto.variable} 
                ${montserrat.variable} 
                ${raleway.variable}
            `}>
        <NextTopLoader height={5} />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
