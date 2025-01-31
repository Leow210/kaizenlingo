// components/Navbar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Book, BookOpen, Layout, MessageCircle, User, LogOut, Menu, X, LogIn } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';

interface NavLinkProps {
    href: string;
    children: React.ReactNode;
    icon: LucideIcon;
}

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const router = useRouter();

    const isActive = (path: string) => pathname === path;

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const NavLink = ({ href, children, icon: Icon }: NavLinkProps) => (
        <Link
            href={href}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${isActive(href)
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
            onClick={() => setIsOpen(false)}
        >
            <Icon className="w-5 h-5 mr-3" />
            <span>{children}</span>
        </Link>
    );

    return (
        <nav className="bg-gray-900 border-b border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo and brand */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="flex items-center">
                            <BookOpen className="h-8 w-8 text-indigo-500" />
                            <span className="ml-2 text-xl font-bold text-white">KaizenLingo</span>
                        </Link>
                    </div>

                    {/* Desktop navigation */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-center space-x-4">
                            {user ? (
                                <>
                                    <NavLink href="/dashboard" icon={MessageCircle}>
                                        Chat
                                    </NavLink>
                                    <NavLink href="/lessons" icon={Book}>
                                        Lessons
                                    </NavLink>
                                    <NavLink href="/vocabulary" icon={Layout}>
                                        Vocabulary
                                    </NavLink>
                                    <button
                                        className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
                                        onClick={handleLogout}
                                    >
                                        <LogOut className="w-5 h-5 mr-3" />
                                        <span>Logout</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
                                    >
                                        <LogIn className="w-5 h-5 mr-3" />
                                        <span>Login</span>
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                        <User className="w-5 h-5 mr-3" />
                                        <span>Sign Up</span>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none"
                        >
                            {isOpen ? (
                                <X className="block h-6 w-6" />
                            ) : (
                                <Menu className="block h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div className={`${isOpen ? 'block' : 'hidden'} md:hidden`}>
                <div className="px-2 pt-2 pb-3 space-y-1">
                    {user ? (
                        <>
                            <NavLink href="/dashboard" icon={Layout}>
                                Dashboard
                            </NavLink>
                            <NavLink href="/lessons" icon={Book}>
                                Lessons
                            </NavLink>
                            <NavLink href="/chat" icon={MessageCircle}>
                                Practice
                            </NavLink>
                            <NavLink href="/profile" icon={User}>
                                Profile
                            </NavLink>
                            <button
                                className="w-full flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-5 h-5 mr-3" />
                                <span>Logout</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                <LogIn className="w-5 h-5 mr-3" />
                                <span>Login</span>
                            </Link>
                            <Link
                                href="/register"
                                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                <User className="w-5 h-5 mr-3" />
                                <span>Sign Up</span>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}