// app/(auth)/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

interface FormData {
    email: string;
    password: string;
    name: string;
    nativeLanguage: string;
    targetLanguage: string;
}

interface ValidationErrors {
    email?: string;
    password?: string;
    name?: string;
    nativeLanguage?: string;
    targetLanguage?: string;
}

export default function RegisterPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<FormData>({
        email: '',
        password: '',
        name: '',
        nativeLanguage: '',
        targetLanguage: 'japanese'  // Default value
    });

    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

    const validateForm = (): boolean => {
        const errors: ValidationErrors = {};

        if (!formData.email) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Please enter a valid email';
        }

        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 3) {
            errors.password = 'Password must be at least 3 characters';
        }

        if (!formData.name) {
            errors.name = 'Name is required';
        }

        if (!formData.nativeLanguage) {
            errors.nativeLanguage = 'Please select your native language';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            // Automatically log in after successful registration
            const loginRes = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                }),
            });

            if (loginRes.ok) {
                router.push('/dashboard');
            } else {
                router.push('/login');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear validation error when user starts typing
        if (validationErrors[name as keyof ValidationErrors]) {
            setValidationErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                        Create your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-400">
                        Start your language learning journey today
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm space-y-4">
                        {/* Name Field */}
                        <div>
                            <label htmlFor="name" className="sr-only">Name</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Username"
                                value={formData.name}
                                onChange={handleInputChange}
                            />
                            {validationErrors.name && (
                                <p className="mt-1 text-sm text-red-500">{validationErrors.name}</p>
                            )}
                        </div>

                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="sr-only">Email address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Email address"
                                value={formData.email}
                                onChange={handleInputChange}
                            />
                            {validationErrors.email && (
                                <p className="mt-1 text-sm text-red-500">{validationErrors.email}</p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div className="relative">
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleInputChange}
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 px-3 flex items-center"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
                                )}
                            </button>
                            {validationErrors.password && (
                                <p className="mt-1 text-sm text-red-500">{validationErrors.password}</p>
                            )}
                        </div>

                        {/* Native Language Field */}
                        <div>
                            <label htmlFor="nativeLanguage" className="sr-only">Native Language</label>
                            <select
                                id="nativeLanguage"
                                name="nativeLanguage"
                                required
                                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={formData.nativeLanguage}
                                onChange={handleInputChange}
                            >
                                <option value="">Select your native language</option>
                                <option value="english">English</option>
                                <option value="spanish">Spanish</option>
                                <option value="chinese">Chinese</option>
                                <option value="japanese">Japanese</option>
                                <option value="korean">Korean</option>
                                <option value="other">Other</option>
                            </select>
                            {validationErrors.nativeLanguage && (
                                <p className="mt-1 text-sm text-red-500">{validationErrors.nativeLanguage}</p>
                            )}
                        </div>

                        {/* Target Language Field */}
                        <div>
                            <label htmlFor="targetLanguage" className="sr-only">Language to Learn</label>
                            <select
                                id="targetLanguage"
                                name="targetLanguage"
                                required
                                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={formData.targetLanguage}
                                onChange={handleInputChange}
                            >
                                <option value="">Select your target language (you can change this at any time)</option>
                                <option value="japanese">Japanese</option>
                                <option value="mandarin">Mandarin Chinese</option>
                                <option value="cantonese">Cantonese</option>
                                <option value="russian">Russian</option>
                            </select>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${loading
                                ? 'bg-indigo-500 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700'
                                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating account...
                                </span>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </div>
                </form>

                <div className="text-center">
                    <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
                        Already have an account? Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}