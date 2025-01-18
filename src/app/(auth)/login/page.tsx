"use client";

import { LoginForm } from "@/components/forms/LoginForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { QrCode, ChefHat } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 via-stone-200 to-stone-300 relative overflow-hidden">
      {/* Arkaplan Desenleri */}
      <div className="absolute inset-0 bg-grid-stone-800/[0.02] -z-10" />
      <div className="absolute inset-0 flex items-center justify-center opacity-5">
        <QrCode className="w-[800px] h-[800px] animate-pulse" />
      </div>

      <div className="w-full max-w-[400px] p-4 relative z-10">
        <Card className="backdrop-blur-sm bg-white/90 shadow-xl">
          <CardHeader className="space-y-4">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-stone-100 rounded-full">
                <ChefHat className="w-10 h-10 text-stone-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center font-bold">
              QR Menü Yönetimi
            </CardTitle>
            <CardDescription className="text-center">
              Dijital menü yönetim sistemine hoş geldiniz
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              variant="link"
              className="text-sm text-stone-600 hover:text-stone-800"
            >
              Şifremi Unuttum
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
