// app/dashboard/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { Send, Book, MessageCircle, Star, TrendingUp } from 'lucide-react';

type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced';

interface Stats {
    wordsLearned: number;
    lessonsCompleted: number;
    studyStreak: number;
    accuracy: number;
}

export default function Dashboard() {
    const { user } = useAuth();
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [level, setLevel] = useState<ProficiencyLevel>('beginner');
    const [correctionsEnabled, setCorrectionsEnabled] = useState(true);
    const [stats, setStats] = useState<Stats>({
        wordsLearned: 0,
        lessonsCompleted: 0,
        studyStreak: 0,
        accuracy: 0
    });
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const initialMessages = {
            beginner: 'Hello! I can help you learn Japanese. What would you like to practice?',
            intermediate: 'こんにちは！日本語を練習しましょう。\n(Hello! Let\'s practice Japanese.)',
            advanced: '初めまして！どのように日本語の勉強をお手伝いできますか？'
        };
        setChatHistory([{ role: 'assistant', content: initialMessages[level] }]);
        fetchUserStats();
    }, [level]);

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory]);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchUserStats = async () => {
        try {
            const response = await fetch('/api/user/stats');
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim() || loading) return;

        setLoading(true);
        const userMessage = message;
        setMessage('');

        // Add user message and temporary assistant message
        setChatHistory(prev => [
            ...prev,
            { role: 'user', content: userMessage },
            { role: 'assistant', content: '' }
        ]);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    level,
                    userLanguage: user?.nativeLanguage,
                    correctionsEnabled
                }),
            });

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) return;

            let accumulatedText = '';
            let done = false;

            while (!done) {
                const { value, done: streamDone } = await reader.read();
                done = streamDone;
                const chunk = decoder.decode(value, { stream: true });

                if (chunk) {
                    accumulatedText += chunk;

                    // Update chat history immutably
                    setChatHistory(prev => {
                        const newHistory = [...prev];
                        const lastMessage = newHistory[newHistory.length - 1];

                        if (lastMessage.role === 'assistant') {
                            newHistory[newHistory.length - 1] = {
                                ...lastMessage,
                                content: accumulatedText
                            };
                        }

                        return newHistory;
                    });
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
            setChatHistory(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.'
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 py-6">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-4">
                        Welcome back, {user?.name || 'Learner'}
                    </h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-4">
                        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                            <h2 className="text-white font-bold mb-3">Proficiency Level</h2>
                            <select
                                value={level}
                                onChange={(e) => setLevel(e.target.value as ProficiencyLevel)}
                                className="w-full bg-gray-700 text-white rounded p-2 border border-gray-600 mb-4"
                            >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>

                            <div className="flex items-center justify-between">
                                <span className="text-gray-300 text-sm">Enable Corrections</span>
                                <button
                                    onClick={() => setCorrectionsEnabled(!correctionsEnabled)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${correctionsEnabled ? 'bg-indigo-600' : 'bg-gray-600'
                                        }`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${correctionsEnabled ? 'translate-x-6' : 'translate-x-1'
                                        }`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-3">
                        <div className="bg-gray-800 rounded-lg border border-gray-700 h-[500px] flex flex-col">
                            <div className="p-4 border-b border-gray-700">
                                <h2 className="text-xl font-bold text-white">Japanese Learning Assistant</h2>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {chatHistory.map((chat, index) => (
                                    <div
                                        key={index}
                                        className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-lg p-3 whitespace-pre-wrap ${chat.role === 'user'
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-700 text-gray-200'
                                                }`}
                                        >
                                            {chat.content}
                                            {index === chatHistory.length - 1 && loading && (
                                                <span className="ml-1 inline-block h-2 w-2 bg-current align-middle rounded-full animate-pulse" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>

                            <div className="p-4 border-t border-gray-700">
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Type your message..."
                                        className="flex-1 bg-gray-700 text-gray-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        disabled={loading}
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={loading || !message.trim()}
                                        className="bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}