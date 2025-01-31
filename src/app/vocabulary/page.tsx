// app/vocabulary/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Search, Book, Filter, MessageSquare } from 'lucide-react';
import DOMPurify from 'isomorphic-dompurify';


interface Example {
    japanese: string;
    reading: string;
    english: string;
}

interface VocabularyItem {
    id: string;
    word: string;
    reading: string;
    meaning: string[];
    jlptLevel: string;
    partOfSpeech: string;
    examples: Example[];
    commonness: number;
    tags: string[];
}

export default function VocabularyPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [jlptFilter, setJlptFilter] = useState('all');
    const [selectedWord, setSelectedWord] = useState<VocabularyItem | null>(null);
    const [aiResponse, setAiResponse] = useState('');
    const [isLoadingAi, setIsLoadingAi] = useState(false);
    const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);

    useEffect(() => {
        fetchVocabulary();
    }, []);

    const fetchVocabulary = async () => {
        try {
            const response = await fetch('/api/vocabulary');
            const data = await response.json();
            setVocabulary(data);
        } catch (error) {
            console.error('Failed to fetch vocabulary:', error);
        }
    };

    const createMarkup = (html: string) => {
        return {
            __html: DOMPurify.sanitize(html, {
                ADD_TAGS: ['ruby', 'rt'], // Allow ruby tags for furigana
                ADD_ATTR: ['class'], // Allow class attributes for styling
            })
        };
    };

    const generateExampleOrExplanation = async (word: string, type: 'example' | 'explanation') => {
        setIsLoadingAi(true);
        setAiResponse('');

        try {
            const response = await fetch('/api/vocabulary/ai-helper', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    word,
                    type,
                    reading: selectedWord?.reading,
                    meaning: selectedWord?.meaning
                }),
            });

            if (!response.ok) throw new Error('AI request failed');

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader available');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = new TextDecoder().decode(value);
                setAiResponse(prev => prev + text);
            }

        } catch (error) {
            console.error('AI helper error:', error);
        } finally {
            setIsLoadingAi(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-4">Japanese Vocabulary</h1>

                    {/* Search and Filters */}
                    <div className="flex gap-4 mb-6">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Search vocabulary..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500"
                            />
                            <Search className="absolute right-3 top-2.5 text-gray-500" />
                        </div>
                        <select
                            value={jlptFilter}
                            onChange={(e) => setJlptFilter(e.target.value)}
                            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
                        >
                            <option value="all">All Levels</option>
                            <option value="N5">JLPT N5</option>
                            <option value="N4">JLPT N4</option>
                            <option value="N3">JLPT N3</option>
                            <option value="N2">JLPT N2</option>
                            <option value="N1">JLPT N1</option>
                        </select>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Vocabulary List */}
                    <div className="md:col-span-1 space-y-4">
                        {vocabulary.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setSelectedWord(item)}
                                className={`w-full text-left p-4 rounded-lg border transition-colors ${selectedWord?.id === item.id
                                    ? 'bg-indigo-900/50 border-indigo-500'
                                    : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-medium text-white">{item.word}</h3>
                                        <p className="text-gray-400 text-sm">{item.reading}</p>
                                    </div>
                                    <span className="text-xs px-2 py-1 rounded bg-indigo-500/20 text-indigo-300">
                                        {item.jlptLevel}
                                    </span>
                                </div>
                                <p className="text-gray-300 mt-1">{item.meaning[0]}</p>
                            </button>
                        ))}
                    </div>

                    {/* Word Details */}
                    {selectedWord ? (
                        <div className="md:col-span-2 space-y-6">
                            {/* Word Header */}
                            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">{selectedWord.word}</h2>
                                        <p className="text-lg text-gray-400">{selectedWord.reading}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm px-2 py-1 rounded bg-indigo-500/20 text-indigo-300">
                                            {selectedWord.jlptLevel}
                                        </span>
                                        <span className="text-sm px-2 py-1 rounded bg-gray-700 text-gray-300">
                                            {selectedWord.partOfSpeech}
                                        </span>
                                    </div>
                                </div>

                                {/* Meanings */}
                                <div className="space-y-2 mb-4">
                                    <h3 className="text-lg font-medium text-white">Meanings:</h3>
                                    <ul className="list-disc list-inside text-gray-300">
                                        {selectedWord.meaning.map((meaning, index) => (
                                            <li key={index}>{meaning}</li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Examples */}
                                <div className="space-y-2">
                                    <h3 className="text-lg font-medium text-white">Examples:</h3>
                                    <div className="space-y-3">
                                        {selectedWord.examples.map((example, index) => (
                                            <div key={index} className="bg-gray-700/50 p-3 rounded">
                                                <p className="text-white">{example.japanese}</p>
                                                <p className="text-gray-400 text-sm">{example.reading}</p>
                                                <p className="text-gray-300 mt-1">{example.english}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* AI Helper */}
                            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                                <h3 className="text-lg font-medium text-white mb-4">AI Helper</h3>
                                <div className="flex gap-3 mb-4">
                                    <button
                                        onClick={() => generateExampleOrExplanation(selectedWord.word, 'explanation')}
                                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                                        disabled={isLoadingAi}
                                    >
                                        <Book className="w-4 h-4 mr-2" />
                                        Explain Usage
                                    </button>
                                    <button
                                        onClick={() => generateExampleOrExplanation(selectedWord.word, 'example')}
                                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                                        disabled={isLoadingAi}
                                    >
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        Generate Examples
                                    </button>
                                </div>

                                <div className="bg-gray-900 rounded p-4 min-h-[100px]">
                                    {isLoadingAi ? (
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                                            Generating response...
                                        </div>
                                    ) : (
                                        <div
                                            className="prose prose-invert max-w-none"
                                            dangerouslySetInnerHTML={createMarkup(aiResponse)}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="md:col-span-2 bg-gray-800 rounded-lg border border-gray-700 p-6 flex items-center justify-center text-gray-400">
                            Select a word to see details
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}