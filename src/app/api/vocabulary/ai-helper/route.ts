// app/api/vocabulary/ai-helper/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import OpenAI from 'openai';
import { verify } from 'jsonwebtoken';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1',
});

interface AiHelperRequest {
    word: string;
    type: 'example' | 'explanation';
    reading?: string;
    meaning?: string[];
}


function getSystemPrompt(type: 'example' | 'explanation'): string {
    const basePrompt = `You are a Japanese language expert helping students understand vocabulary usage.`;

    const stylingRules = `
STRICT STYLING RULES:
- Format in clean HTML using these EXACT class names:
  * 'vocab-example': For example sentences
  * 'usage-note': For usage explanations
  * 'context-box': For contextual information
  * 'collocation-item': For common word combinations
  * 'culture-note': For cultural context

- Apply these Tailwind-inspired utility classes:
  <div class="vocab-example bg-gray-800/50 p-4 rounded-lg border border-gray-600 mb-4">
    <p class="text-gray-200 font-medium mb-2">Example:</p>
    <p class="text-gray-300">Example content</p>
  </div>
  
  <div class="usage-note bg-indigo-900/20 p-4 rounded-lg border border-indigo-500 mb-4">
    <p class="text-indigo-300 font-medium">Usage Note:</p>
    <p class="text-gray-200">Usage explanation</p>
  </div>

  <div class="context-box bg-gray-800/30 p-3 rounded mb-3">
    <p class="text-gray-300">Contextual information</p>
  </div>

- Typography requirements:
  * Headings: Use h4 for subsections with class "subsection-title text-lg text-white mb-3"
  * Body text: text-gray-200 for explanations
  * Bold text: <strong class="text-gray-100 font-semibold">
  * Lists: <ul class="list-disc list-inside space-y-2 pl-4 text-gray-200">
  
- Always use <ruby> tags for Japanese text with furigana
- Never use inline styles
- Avoid markdown formatting
- Use proper semantic HTML
- Maintain spacing with margin-bottom (mb-*) classes`;

    if (type === 'explanation') {
        return `${basePrompt}

Create a comprehensive explanation with these sections:
1. Basic Usage
2. Common Contexts
3. Nuances & Connotations
4. Common Collocations
5. Cultural Notes (if applicable)

${stylingRules}

Example structure:
<section class="vocab-section mb-6">
  <h4 class="subsection-title">Basic Usage</h4>
  <div class="usage-note">
    <p class="text-gray-200">Usage explanation with <ruby>日本語<rt>にほんご</rt></ruby> examples</p>
  </div>
</section>`;
    } else {
        return `${basePrompt}

Generate 3 natural example sentences showing progressive complexity:
1. Basic usage
2. Intermediate context
3. Advanced application

${stylingRules}

Example structure:
<div class="vocab-example">
  <div class="example-content mb-3">
    <p class="japanese mb-2"><ruby>例文<rt>れいぶん</rt></ruby></p>
    <p class="translation text-gray-300">English translation</p>
    <p class="context text-gray-400 text-sm">Context note</p>
  </div>
</div>`;
    }
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

        const body = await request.json() as AiHelperRequest;

        if (!body.word || !body.type) {
            return NextResponse.json(
                { error: 'Word and type are required' },
                { status: 400 }
            );
        }

        const prompt = getSystemPrompt(body.type);
        const userPrompt = body.type === 'explanation'
            ? `Explain the usage of the Japanese word "${body.word}" (reading: ${body.reading || 'N/A'}).`
            : `Generate 3 natural example sentences using the Japanese word "${body.word}" (reading: ${body.reading || 'N/A'}).`;


        const stream = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: prompt
                },
                {
                    role: "user",
                    content: userPrompt
                }
            ],
            temperature: 0.7,
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
        console.error('AI helper error:', error);
        return NextResponse.json(
            { error: 'AI service unavailable' },
            { status: 500 }
        );
    }
}