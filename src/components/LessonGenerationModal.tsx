import React, { useState } from 'react';
import { Loader2, Sparkles, X } from 'lucide-react';

interface LessonGenerationModalProps {
    onClose: () => void;
    onGenerate: (options: LessonGenerationOptions) => Promise<void>;
}

interface LessonGenerationOptions {
    topic: string;
    level: string;
    instructionLanguage: string;
    complexity: string;
}

export default function LessonGenerationModal({ onClose, onGenerate }: LessonGenerationModalProps) {
    const [generatingLesson, setGeneratingLesson] = useState(false);
    const [topic, setTopic] = useState('');
    const [level, setLevel] = useState('beginner');
    const [instructionLanguage, setInstructionLanguage] = useState('english');
    const [complexity, setComplexity] = useState('normal');
    const [status, setStatus] = useState('');

    const handleGenerate = async () => {
        setGeneratingLesson(true);
        setStatus('Initiating lesson generation...');

        try {
            await onGenerate({
                topic,
                level,
                instructionLanguage,
                complexity
            });
        } catch (error) {
            console.error('Failed to generate lesson:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                    disabled={generatingLesson}
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <Sparkles className="w-5 h-5 mr-2 text-indigo-400" />
                        Generate Custom Lesson
                    </h2>
                    <p className="text-gray-400 mt-1">Customize your learning experience</p>
                </div>

                <div className="space-y-4">
                    {/* Topic Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">
                            What would you like to learn about?
                        </label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g., Counting objects in Japanese"
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                            disabled={generatingLesson}
                        />
                    </div>

                    {/* Level Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">
                            Proficiency Level
                        </label>
                        <select
                            value={level}
                            onChange={(e) => setLevel(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            disabled={generatingLesson}
                        >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </div>

                    {/* Instruction Language */}
                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">
                            Instruction Language
                        </label>
                        <select
                            value={instructionLanguage}
                            onChange={(e) => setInstructionLanguage(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            disabled={generatingLesson}
                        >
                            <option value="english">English</option>
                            <option value="japanese">Japanese</option>
                            <option value="mixed">Mixed (Japanese & English)</option>
                        </select>
                    </div>

                    {/* Complexity Level */}
                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">
                            Content Complexity
                        </label>
                        <select
                            value={complexity}
                            onChange={(e) => setComplexity(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            disabled={generatingLesson}
                        >
                            <option value="simple">Simple - Basic explanations</option>
                            <option value="normal">Normal - Balanced detail</option>
                            <option value="detailed">Detailed - In-depth explanations</option>
                        </select>
                    </div>

                    {/* Generation Status */}
                    {generatingLesson && (
                        <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                                <span className="text-gray-200">{status}</span>
                            </div>
                            <div className="mt-2">
                                <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 animate-pulse rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                            disabled={generatingLesson}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={generatingLesson || !topic.trim()}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {generatingLesson ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                'Generate Lesson'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}