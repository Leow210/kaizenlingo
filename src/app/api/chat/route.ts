// app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1',
});

interface ChatRequest {
    message: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    userLanguage?: string;
    correctionsEnabled?: boolean;
}

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token');

        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const decoded = verify(token.value, process.env.JWT_SECRET!);
        if (!decoded || typeof decoded === 'string') {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            );
        }

        const body = await request.json() as ChatRequest;

        if (!body?.message || !body?.level) {
            return NextResponse.json(
                { error: 'Message and level are required' },
                { status: 400 }
            );
        }

        const systemMessage = getSystemPrompt(
            body.level,
            body.userLanguage,
            body.correctionsEnabled ?? true
        );

        const stream = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: body.message }
            ],
            temperature: 0.7,
            max_tokens: 500,
            stream: true,
        });

        const readableStream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                for await (const chunk of stream) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    controller.enqueue(encoder.encode(content));
                }
                controller.close();
            },
        });

        return new Response(readableStream, {
            headers: { 'Content-Type': 'text/plain' },
        });
    } catch (error) {
        console.error('Chat error:', error);
        return NextResponse.json(
            { error: 'Chat service unavailable' },
            { status: 500 }
        );
    }
}

function getSystemPrompt(
    level: string,
    userLanguage?: string,
    correctionsEnabled = true
): string {
    const correctionInstruction = correctionsEnabled ?
        `Always politely point out and explain any mistakes in Japanese usage, grammar, or pronunciation.
        Format corrections like this: "[Correction: <incorrect> → <correct>] <explanation>"` :
        "Do not correct mistakes unless explicitly asked. Focus on natural conversation.";

    const basePrompt = `You are a Japanese language tutor. ${userLanguage ? `The student's native language is ${userLanguage}.` : ''}
        ${correctionInstruction}`;

    switch (level) {
        case 'beginner':
            return `${basePrompt} 
                Teach using simple Japanese words and always provide English translations. 
                Focus on basic grammar and everyday phrases.
                Break down concepts clearly and use romaji when introducing new words.`;

        case 'intermediate':
            return `${basePrompt}
                Communicate primarily in Japanese but provide English translations for new or complex terms.
                Use more natural Japanese expressions and introduce common colloquialisms.
                Use hiragana, katakana, and basic kanji.
                Explain grammar points in simple terms.`;

        case 'advanced':
            return `${basePrompt}
                Communicate exclusively in Japanese unless specifically asked for translations.
                Use natural, native-level Japanese including idioms and advanced grammar.
                Use kanji freely and expect understanding of complex topics.
                Provide nuanced explanations of grammar and usage.`;

        default:
            return basePrompt;
    }
}