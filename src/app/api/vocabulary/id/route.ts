// app/api/vocabulary/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const vocabulary = await prisma.vocabulary.findUnique({
            where: { id: params.id },
            include: {
                examples: true
            }
        });

        if (!vocabulary) {
            return NextResponse.json(
                { error: 'Vocabulary not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(vocabulary);
    } catch (error) {
        console.error('Failed to fetch vocabulary:', error);
        return NextResponse.json(
            { error: 'Failed to fetch vocabulary' },
            { status: 500 }
        );
    }
}

// Update vocabulary
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token');

        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();

        const updatedVocabulary = await prisma.vocabulary.update({
            where: { id: params.id },
            data: {
                ...body,
                examples: {
                    deleteMany: {},
                    create: body.examples || []
                }
            },
            include: {
                examples: true
            }
        });

        return NextResponse.json(updatedVocabulary);
    } catch (error) {
        console.error('Failed to update vocabulary:', error);
        return NextResponse.json(
            { error: 'Failed to update vocabulary' },
            { status: 500 }
        );
    }
}

// Delete vocabulary
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token');

        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await prisma.example.deleteMany({
            where: { vocabularyId: params.id }
        });

        await prisma.vocabulary.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ message: 'Vocabulary deleted successfully' });
    } catch (error) {
        console.error('Failed to delete vocabulary:', error);
        return NextResponse.json(
            { error: 'Failed to delete vocabulary' },
            { status: 500 }
        );
    }
}