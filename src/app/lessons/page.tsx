// app/lessons/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Sparkles, X, CheckCircle, ArrowRight } from 'lucide-react';
import LessonGenerationModal from '../../components/LessonGenerationModal';

interface Lesson {
    id: string;
    title: string;
    description?: string;
    level: string;
    isAiGenerated: boolean;
    progress?: {
        completed: boolean;
        score?: number;
    };
}

export default function LessonsPage() {
    const router = useRouter();
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [userLessons, setUserLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLessons = async () => {
            try {
                const response = await fetch('/api/lessons?includeAll=true');
                if (!response.ok) throw new Error('Failed to fetch lessons');
                const data = await response.json();
                setUserLessons(data.lessons);
            } catch (error) {
                console.error('Failed to fetch lessons:', error);
                setError('Failed to fetch lessons. Please try again later.');
                setUserLessons([]);
            } finally {
                setLoading(false);
            }
        };
        fetchLessons();
    }, []);

    const handleGenerateLesson = async (options: any) => {
        try {
            const response = await fetch('/api/lessons/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(options),
            });

            if (response.ok) {
                const data = await response.json();
                router.push(`/lessons/${data.lessonId}`);
            } else {
                throw new Error('Failed to generate lesson');
            }
        } catch (error) {
            console.error('Failed to generate lesson:', error);
        }
    };

    const handleDeleteLesson = async (lessonId: string) => {
        try {
            await fetch(`/api/lessons/${lessonId}`, { method: 'DELETE' });
            setUserLessons(prev => prev.filter(lesson => lesson.id !== lessonId));
        } catch (error) {
            console.error('Failed to delete lesson:', error);
        }
    };

    const filteredLessons = (userLessons || []).filter(lesson =>
        lesson.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-white">Japanese Lessons</h1>
                    <button
                        onClick={() => setShowGenerateModal(true)}
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Generate Custom Lesson
                    </button>
                </div>

                {/* Search and Filters */}
                <div className="mb-8">
                    <input
                        type="text"
                        placeholder="Search lessons..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                {/* Lessons Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLessons.map((lesson) => (
                        <div
                            key={lesson.id}
                            className="bg-gray-800 p-6 rounded-lg border border-gray-700 relative hover:border-indigo-500 transition-colors"
                        >
                            {/* Delete Button */}
                            {lesson.isAiGenerated && (
                                <button
                                    onClick={() => handleDeleteLesson(lesson.id)}
                                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}

                            {/* Completion Badge */}
                            {lesson.progress?.completed && (
                                <div className="absolute top-3 left-3 flex items-center text-green-500">
                                    <CheckCircle className="w-5 h-5 mr-1" />
                                    <span className="text-sm">Completed</span>
                                </div>
                            )}

                            <BookOpen className="w-8 h-8 text-indigo-500 mb-4" />

                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold text-white">
                                    {lesson.title}
                                </h3>
                                {lesson.isAiGenerated && (
                                    <span className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full text-xs">
                                        AI Generated
                                    </span>
                                )}
                            </div>

                            <p className="text-gray-400 text-sm mb-4">
                                {lesson.description || 'Japanese language lesson'}
                            </p>

                            <div className="flex justify-between items-center">
                                <span className="text-sm text-indigo-400">
                                    {lesson.level} Level
                                </span>
                                <button
                                    onClick={() => router.push(`/lessons/${lesson.id}`)}
                                    className={`flex items-center ${lesson.progress?.completed
                                        ? 'text-green-500 hover:text-green-400'
                                        : 'text-indigo-400 hover:text-indigo-300'
                                        } transition-colors`}
                                >
                                    {lesson.progress?.completed ? 'Review Lesson' : 'Start Lesson'}
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Generate Lesson Modal */}
                {showGenerateModal && (
                    <LessonGenerationModal
                        onClose={() => setShowGenerateModal(false)}
                        onGenerate={handleGenerateLesson}
                    />
                )}

                {/* Empty State */}
                {filteredLessons.length === 0 && (
                    <div className="text-center py-12">
                        <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl text-gray-400 mb-2">No lessons found</h3>
                        <p className="text-gray-600">
                            {searchTerm ? 'Try a different search' : 'Generate your first lesson to get started'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}