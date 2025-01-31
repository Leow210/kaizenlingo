# KaizenLingo - AI-Powered Japanese Learning Platform

An intelligent language learning platform combining structured curriculum with AI-powered tutoring using GPT-4o.

## Features

- Currently Supports Japanese, will support Cantonese, Mandarin and Russian in future
- AI conversation partner with adjustable proficiency levels
- Dynamic lesson generation based on user interests
- Comprehensive vocabulary system with JLPT levels
- Interactive quizzes and progress tracking
- Real-time language corrections and explanations

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- PostgreSQL with Prisma ORM
- OpenAI GPT-4 API
- TailwindCSS
- JWT Authentication

## Prerequisites

- Node.js 18+
- PostgreSQL
- OpenAI API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/kaizenlingo.git
cd kaizenlingo
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Fill in your `.env` file:
```
DATABASE_URL="postgresql://username:password@localhost:5432/kaizenlingo"
OPENAI_API_KEY="your-api-key"
JWT_SECRET="your-secret-key"
```

4. Set up the database:
```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

5. Run the development server:
```bash
npm run dev
```

## Usage

Visit `http://localhost:3000` to start using the application.

### Key Features:

- `/dashboard`: Main learning interface
- `/lessons`: Structured and AI-generated lessons
- `/vocabulary`: Word lookup and practice
- `/chat`: AI conversation practice

## Configuration

### AI Settings
- Model: GPT-4o
- Temperature: 0.7
- Max tokens: Varies by feature

### Authentication
- JWT tokens with HTTP-only cookies
- 7-day session duration
- Protected API routes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Open a pull request
