"use client";
import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  LayoutDashboard,
  Users2,
  ChevronDown,
  LogOut,
  UserCog,
  Menu as MenuIcon,
  Settings,
  ChevronsUpDown,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const menuItems = [
  { title: "Ana Sayfa", href: "/dashboard", icon: LayoutDashboard },
  { title: "Menü Yönetimi", href: "/dashboard/menu", icon: MenuIcon },
  { title: "Alan Yönetimi", href: "/dashboard/areas", icon: Users2 },
  { title: "Uygulama Ayarları", href: "/dashboard/settings", icon: Settings },
];

const Logo = () => (
  <svg
    width="73"
    height="49"
    viewBox="0 0 73 49"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-8 w-auto lg:px-3"
  >
    <path
      d="M46.8676 24C46.8676 36.4264 36.794 46.5 24.3676 46.5C11.9413 46.5 1.86765 36.4264 1.86765 24C1.86765 11.5736 11.9413 1.5 24.3676 1.5C36.794 1.5 46.8676 11.5736 46.8676 24Z"
      fill="#68DBFF"
    />
    <path
      d="M71.1324 24C71.1324 36.4264 61.1574 46.5 48.8529 46.5C36.5484 46.5 26.5735 36.4264 26.5735 24C26.5735 11.5736 36.5484 1.5 48.8529 1.5C61.1574 1.5 71.1324 11.5736 71.1324 24Z"
      fill="#FF7917"
    />
    <path
      d="M36.6705 42.8416C42.8109 38.8239 46.8676 31.8858 46.8676 24C46.8676 16.1144 42.8109 9.17614 36.6705 5.15854C30.5904 9.17614 26.5735 16.1144 26.5735 24C26.5735 31.8858 30.5904 38.8239 36.6705 42.8416Z"
      fill="#5D2C02"
    />
  </svg>
);

export const Sidebar = () => {
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);

  const getUser = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    setUser(user);
  }, [supabase]);

  useEffect(() => {
    getUser();
  }, [getUser]);

  return (
    <aside className="fixed h-screen bg-zinc-900 flex flex-col font-medium w-16 lg:w-64 transition-all duration-300 py-6">
      {/* Logo */}
      <div className="h-12 flex items-center px-3">
        <Logo />
      </div>

      {/* Menü */}
      <div className="flex-1 px-3 space-y-1 mt-16">
        {/* mt-8 -> mt-12 */}
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center justify-center lg:justify-start h-12 lg:px-3 p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md group transition-all duration-300",
              pathname === item.href && "text-white bg-zinc-800"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="ml-3 hidden lg:inline-block text-base">
              {item.title}
            </span>
          </Link>
        ))}
      </div>

      {/* User Profile Dropdown */}
      <div className="p-3 !pb-0 mt-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="menu"
              className="w-full h-12 justify-center lg:justify-start px-3 py-2 rounded-md transition-all duration-300"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="/avatar.png" alt="@shadcn" />
                <AvatarFallback>SC</AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex items-center gap-2 flex-1">
                <span className="text-sm font-medium">
                  {user?.user?.email}
                </span>
                <ChevronsUpDown className="h-4 w-4 ml-auto" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 bg-zinc-900 border border-zinc-800"
            align="end"
            side="right"
          >
            <Link href="/dashboard/user-settings">
              <DropdownMenuItem className="h-12 px-4 text-zinc-400 hover:text-white hover:bg-zinc-800 focus:bg-zinc-800 focus:text-white cursor-pointer transition-all duration-300">
                <UserCog className="mr-3 h-5 w-5" />
                <span className="text-sm font-medium">Hesap Ayarları</span>
              </DropdownMenuItem>
            </Link>
            <Link href="/logout">
              <DropdownMenuItem className="h-12 px-4 text-red-500 hover:text-red-400 hover:bg-zinc-800 focus:bg-zinc-800 focus:text-red-400 cursor-pointer transition-all duration-300">
                <LogOut className="mr-3 h-5 w-5" />
                <span className="text-sm font-medium">Çıkış Yap</span>
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
};
