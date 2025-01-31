// app/lessons/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
    ChevronLeft,
    CheckCircle,
    XCircle,
    ArrowRight,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface Question {
    id: string;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
}

interface Lesson {
    id: string;
    title: string;
    content: string;
    level: string;
    quiz?: Question[];
    isAiGenerated?: boolean;
}

export default function LessonView({ params }: { params: { id: string } }) {
    const id = React.use(params).id;
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [showQuiz, setShowQuiz] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLesson();
    }, [id]);

    const fetchLesson = async () => {
        try {
            const response = await fetch(`/api/lessons/${id}`);
            if (!response.ok) throw new Error('Failed to fetch lesson');
            const data = await response.json();

            // Clean the content by removing markdown code block syntax
            data.content = data.content.replace(/```html\n|\n```/g, '');
            setLesson(data);
        } catch (error) {
            console.error('Failed to fetch lesson:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSelect = (answer: string) => {
        if (showResult) return;
        setSelectedAnswer(answer);
        setShowResult(true);

        if (lesson?.quiz && answer === lesson.quiz[currentQuestion].correctAnswer) {
            setScore(prev => prev + 1);
        }
    };

    const handleNextQuestion = () => {
        if (lesson?.quiz && currentQuestion < lesson.quiz.length - 1) {
            setCurrentQuestion(prev => prev + 1);
            setSelectedAnswer(null);
            setShowResult(false);
        } else {
            // Mark lesson as completed
            fetch(`/api/progress/${lesson.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ completed: true, score }),
            }).catch(console.error);

            setShowQuiz(false);
        }
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!lesson) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center text-gray-400">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                    <h2 className="text-xl">Lesson not found</h2>
                    <Link href="/lessons" className="text-indigo-400 hover:text-indigo-300 mt-4 inline-block">
                        Return to lessons
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 py-6">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/lessons"
                        className="flex items-center text-gray-400 hover:text-white mb-4"
                    >
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        Back to Lessons
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">{lesson.title}</h1>
                            <span className="text-indigo-400">{lesson.level} Level</span>
                        </div>
                        {lesson.isAiGenerated && (
                            <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-sm">
                                AI Generated
                            </span>
                        )}
                    </div>
                </div>

                {!showQuiz ? (
                    <>
                        {/* Lesson Content */}
                        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
                            <div
                                dangerouslySetInnerHTML={{ __html: lesson.content }}
                                className="prose prose-invert max-w-none prose-headings:text-gray-100 prose-p:text-gray-200 prose-li:text-gray-200 prose-code:text-gray-300 prose-pre:bg-gray-900/50"
                            />
                        </div>

                        {/* Quiz Button */}
                        {lesson.quiz && lesson.quiz.length > 0 && (
                            <button
                                onClick={() => setShowQuiz(true)}
                                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Take Quiz
                            </button>
                        )}
                    </>
                ) : (
                    /* Quiz Section */
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        {lesson.quiz && (
                            <>
                                <div className="mb-6">
                                    <div className="flex justify-between text-gray-400 mb-2">
                                        <span>Question {currentQuestion + 1} of {lesson.quiz.length}</span>
                                        <span>Score: {score}</span>
                                    </div>
                                    <h3 className="text-xl text-white mb-4">
                                        {lesson.quiz[currentQuestion].question}
                                    </h3>
                                </div>

                                <div className="space-y-3">
                                    {lesson.quiz[currentQuestion].options.map((option, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleAnswerSelect(option)}
                                            disabled={showResult}
                                            className={`w-full p-4 rounded-lg text-left transition-colors ${selectedAnswer === option
                                                ? option === lesson.quiz![currentQuestion].correctAnswer
                                                    ? 'bg-green-500/20 border-green-500'
                                                    : 'bg-red-500/20 border-red-500'
                                                : 'bg-gray-700 hover:bg-gray-600'
                                                } border ${showResult && option === lesson.quiz[currentQuestion].correctAnswer
                                                    ? 'border-green-500'
                                                    : 'border-gray-600'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-white">{option}</span>
                                                {showResult && option === lesson.quiz[currentQuestion].correctAnswer && (
                                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                                )}
                                                {showResult && selectedAnswer === option &&
                                                    option !== lesson.quiz[currentQuestion].correctAnswer && (
                                                        <XCircle className="w-5 h-5 text-red-500" />
                                                    )}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {showResult && lesson.quiz[currentQuestion].explanation && (
                                    <div className="mt-4 p-4 bg-gray-700/50 rounded-lg">
                                        <p className="text-gray-200">
                                            {lesson.quiz[currentQuestion].explanation}
                                        </p>
                                    </div>
                                )}

                                {showResult && (
                                    <div className="mt-6 flex justify-end">
                                        <button
                                            onClick={handleNextQuestion}
                                            className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                        >
                                            {currentQuestion === lesson.quiz.length - 1 ? 'Finish' : 'Next'}
                                            <ArrowRight className="w-5 h-5 ml-2" />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Custom styles for lesson content */}

        </div>
    );
}