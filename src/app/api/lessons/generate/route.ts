// app/api/lessons/generate/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import OpenAI from 'openai';
import { prisma } from '../../../../lib/prisma';
import { verify } from 'jsonwebtoken';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1',
});

interface LessonPrompt {
    topic: string;
    level: string;
    instructionLanguage: string;
    complexity: string;
}

function getSystemPrompt(options: LessonPrompt): string {
    const basePrompt = `You are an expert Japanese language teacher creating a structured lesson.`;

    let languageInstruction = '';
    switch (options.instructionLanguage) {
        case 'japanese':
            languageInstruction = 'Provide all instructions and explanations in Japanese only.';
            break;
        case 'mixed':
            languageInstruction = 'Provide explanations in both Japanese and English, with Japanese first followed by English translations.';
            break;
        default:
            languageInstruction = 'Provide all instructions and explanations in English.';
    }

    let complexityInstruction = '';
    switch (options.complexity) {
        case 'simple':
            complexityInstruction = 'Keep explanations brief and straightforward, focusing on core concepts.';
            break;
        case 'detailed':
            complexityInstruction = 'Provide detailed explanations with multiple examples and in-depth analysis of concepts.';
            break;
        default:
            complexityInstruction = 'Provide balanced explanations with clear examples.';
    }

    return `${basePrompt}
${languageInstruction}
${complexityInstruction}

Create a comprehensive lesson with these sections:
1. Introduction (brief overview)
2. Vocabulary (with furigana and translations)
3. Main Content (with examples)
4. Grammar Points (if applicable)
5. Practice Examples
6. Cultural Context
7. Common Mistakes to Avoid

STRICT STYLING RULES:
- Format in clean HTML using these EXACT class names:
  * 'example-block': For example containers
  * 'note-box': For important notes
  * 'warning-box': For warnings
  * 'practice-exercise': For practice sections
  * 'vocab-item': For vocabulary entries
  * 'grammar-point': For grammar explanations

- Apply these Tailwind-inspired utility classes:
  <div class="example-block bg-gray-800/50 p-4 rounded-lg border border-gray-600 mb-4">
    <p class="text-gray-200 font-medium mb-2">Example:</p>
    <p class="text-gray-300">Example content</p>
  </div>
  
  <div class="note-box bg-indigo-900/20 p-4 rounded-lg border border-indigo-500 mb-4">
    <p class="text-indigo-300 font-medium">Note:</p>
    <p class="text-gray-200">Important note content</p>
  </div>

- Typography requirements:
  * Headings: Use h3 for section titles with class "section-title text-xl text-white mb-4"
  * Body text: text-gray-200 for paragraphs
  * Bold text: <strong class="text-gray-100 font-semibold">
  * Lists: <ul class="list-disc list-inside space-y-2 pl-4 text-gray-200">
  
- Always use <ruby> tags for Japanese text with furigana
- Never use inline styles (style="...")
- Avoid markdown formatting
- Use proper semantic HTML
- Maintain spacing with margin-bottom (mb-*) classes

Example structure:
<section class="lesson-section mb-8">
  <h3 class="section-title">Vocabulary</h3>
  <div class="vocab-item bg-gray-800/30 p-3 rounded mb-3">
    <ruby>日本語<rt>にほんご</rt></ruby> 
    <span class="text-gray-300">(Japanese language)</span>
  </div>
</section>

Include practical, real-world examples matching the student's level.`;
}

function getQuizPrompt(options: LessonPrompt): string {
    return `Create EXACTLY 5 multiple-choice quiz questions based on the lesson content.
${options.instructionLanguage === 'japanese' ? 'Write questions in Japanese.' :
            options.instructionLanguage === 'mixed' ? 'Write questions in both Japanese and English.' :
                'Write questions in English.'}

Format as a JSON array with 5 objects following this structure:
[
    {
        "question": "Question text",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "correctAnswer": "Option 1",
        "explanation": "Detailed explanation",
        "difficulty": "easy"
    },
    // ...4 more objects
]

STRICT RULES:
1. Root element MUST be an array
2. EXACTLY 5 items in the array
3. No Markdown formatting
4. No nested objects or properties
5. All questions must relate to the lesson content`;
}


export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token');

        if (!token?.value) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let decoded;
        try {
            decoded = verify(token.value, process.env.JWT_SECRET!);
        } catch (err) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        if (!decoded || typeof decoded === 'string') {
            return NextResponse.json({ error: 'Invalid token format' }, { status: 401 });
        }

        const userId = decoded.sub as string;
        const options: LessonPrompt = await request.json();

        if (!options?.topic || !options?.level) {
            return NextResponse.json({
                error: 'Missing required fields',
                details: { topic: !options?.topic, level: !options?.level }
            }, { status: 400 });
        }

        // Generate lesson content with error handling
        const lessonResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: getSystemPrompt(options) },
                { role: "user", content: `Create a ${options.level} level lesson about: ${options.topic}` }
            ],
            temperature: 0.7,
            max_tokens: 2000,
        }).catch(error => {
            throw new Error(`OpenAI API error: ${error.message}`);
        });

        const lessonContent = lessonResponse.choices[0]?.message?.content;
        if (!lessonContent) {
            throw new Error('No lesson content generated');
        }

        // Generate quiz with error handling
        const quizResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: getQuizPrompt(options) },
                { role: "user", content: `Create quiz questions for a ${options.level} lesson about: ${options.topic}\n\nLesson content: ${lessonContent}` }
            ],
            temperature: 0.7,
        }).catch(error => {
            throw new Error(`Quiz generation failed: ${error.message}`);
        });

        const rawQuizContent = quizResponse.choices[0]?.message?.content;
        if (!rawQuizContent) {
            throw new Error('No quiz content generated');
        }

        // Parse quiz content with validation
        const cleanedQuizContent = rawQuizContent.replace(/```(json)?/g, '').trim();
        let quiz = [];

        try {
            const parsed = JSON.parse(cleanedQuizContent);
            quiz = Array.isArray(parsed) ? parsed :
                Array.isArray(parsed.questions) ? parsed.questions :
                    Array.isArray(parsed.quiz) ? parsed.quiz : [];

            if (quiz.length !== 5) {
                throw new Error(`Invalid number of questions: ${quiz.length}`);
            }

            // Validate quiz structure
            quiz.forEach((question, index) => {
                if (!question.question || !Array.isArray(question.options) || !question.correctAnswer) {
                    throw new Error(`Invalid question format at index ${index}`);
                }
            });
        } catch (error) {
            throw new Error(`Quiz parsing failed: ${error.message}`);
        }

        // Create lesson in database with error handling
        const lesson = await prisma.lesson.create({
            data: {
                title: `${options.topic} (${options.level})`,
                content: lessonContent,
                level: options.level,
                topic: options.topic,
                quiz: quiz,
                isAiGenerated: true,
                description: `AI-generated ${options.complexity} lesson about ${options.topic} for ${options.level} level students.`,
                tags: [],
                user: {
                    connect: {
                        id: userId
                    }
                },
                language: {
                    connect: {
                        code: 'ja'
                    }
                }
            }
        }).catch((error) => {
            throw new Error(`Lesson creation failed: ${error.message}`);
        });

        await prisma.progress.create({
            data: {
                user: {
                    connect: {
                        id: userId
                    }
                },
                lesson: {
                    connect: {
                        id: lesson.id
                    }
                },
                completed: false,
                attempts: 0
            }
        }).catch((error) => {
            throw new Error(`Progress creation failed: ${error.message}`);
        });

        return NextResponse.json({
            lessonId: lesson.id,
            message: 'Lesson generated successfully'
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        const errorDetails = error instanceof Error ? error.stack : null;

        // Ensure we're passing an object, not null
        const errorResponse = {
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
        };

        console.error('Lesson generation failed:', errorResponse);

        return NextResponse.json(errorResponse, { status: 500 });
    }
}
