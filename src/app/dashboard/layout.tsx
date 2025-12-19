'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Paperclip,
  User,
  LogOut,
  BotMessageSquare,
  HeartHandshake,
  Menu,
  Loader2,
} from 'lucide-react';

import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Logo } from '@/components/logo';
import { useAuth, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { type UserProfile } from '@/lib/data';

function getUserCpf() {
    if (typeof window !== 'undefined') {
        return window.sessionStorage.getItem('userCpf');
    }
    return null;
}

function UserMenu() {
    const router = useRouter();
    const auth = useAuth();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const userCpf = getUserCpf();

    const userDocRef = useMemoFirebase(() => userCpf && firestore ? doc(firestore, 'users', userCpf) : null, [userCpf, firestore]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    const handleLogout = async () => {
        if (typeof window !== 'undefined') {
            window.sessionStorage.removeItem('userCpf');
        }
        await auth.signOut();
        router.push('/');
    };

    if (isUserLoading || isProfileLoading) {
        return <Loader2 className="animate-spin h-6 w-6" />;
    }

    if (!user || !userProfile) {
        // This might happen briefly on load, or if the CPF isn't found
        return null; 
    }

    const nameInitial = userProfile.fullName ? userProfile.fullName.charAt(0).toUpperCase() : '?';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                    <AvatarFallback>{nameInitial}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>{userProfile.fullName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/dashboard/perfil">Perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function NavLinks() {
    const pathname = usePathname();
    return (
        <>
            {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname === item.href ? 'bg-muted text-primary' : ''}`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
            ))}
        </>
    );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const [userCpf, setUserCpf] = useState<string | null>(null);

  useEffect(() => {
    // This check ensures we run this logic only on the client
    if (typeof window !== 'undefined') {
      const storedCpf = window.sessionStorage.getItem('userCpf');
      setUserCpf(storedCpf);
      if (!isUserLoading && (!user || !storedCpf)) {
          router.push('/');
      }
    }
  }, [user, isUserLoading, router]);

  if(isUserLoading || !user || !userCpf) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <Logo />
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                <NavLinks />
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                  href="#"
                  className="flex items-center gap-2 text-lg font-semibold"
                >
                  <Logo />
                </Link>
                <NavLinks />
              </nav>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            {/* Can add a search form here */}
          </div>
          <UserMenu />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 animate-in fade-in-50">
            {children}
        </main>
      </div>
    </div>
  );
}

const navItems = [
  { href: '/dashboard', label: 'Painel', icon: LayoutDashboard },
  { href: '/dashboard/beneficios', label: 'Benefícios', icon: HeartHandshake },
  { href: '/dashboard/solicitar-beneficio', label: 'Solicitar', icon: FileText },
  { href: '/dashboard/meus-pedidos', label: 'Meus Pedidos', icon: Paperclip },
  { href: '/dashboard/assistente-virtual', label: 'Assistente Virtual', icon: BotMessageSquare },
  { href: '/dashboard/perfil', label: 'Meu Perfil', icon: User },
];
