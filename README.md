# Dion - Screenplay Writing Platform

A professional screenplay writing platform with AI-powered coaching. Write, edit, and refine your scripts with intelligent feedback and scene navigation.

## Features

### ✍️ Professional Editor
- **Monaco Editor**: Industry-standard code editor experience with syntax highlighting and autocomplete
- **Smart Formatting**: Auto-format screenplay elements (action, character, dialogue, parentheticals) with proper indentation
- **Tab Navigation**: Cycle between screenplay element types with keyboard shortcuts

### 🎬 Scene Navigation
- **Scene Sidebar**: Jump between scenes instantly with parsed screenplay structure
- **Scene Parsing**: Automatic detection and navigation of scene headings

### 🤖 AI Coaching
- **Two Coaching Modes**:
  - **Director Mode**: Provides grounded observations, tentative interpretations, and thoughtful questions
  - **Socratic Mode**: Questions-only approach to help you discover your own answers
- **Context-Aware Feedback**: Coaching adapts based on:
  - Current element type (dialogue, action, scene heading, etc.)
  - Scene position (early, middle, late)
  - Active character
  - Your writer profile preferences
- **Conversation History**: All coaching conversations are saved and build a personalized writing profile
- **Writer Profile**: Customize coaching tone (gentle/rigorous), focus areas (character/pacing/dialogue/theme), and preferences

### 📄 Script Management
- **Multiple Projects**: Organize scripts within projects
- **Script Import**: Upload scripts in multiple formats:
  - Fountain (`.fountain`)
  - Plain text (`.txt`, `.md`)
  - Microsoft Word (`.docx`)
  - PDF (`.pdf`) - text-based only
- **Script Analysis**: AI-powered analysis of uploaded scripts to extract structure and metadata
- **Version History**: Track script versions with change reasons

### ☁️ Cloud Sync
- Automatic saving and syncing
- Access your projects from anywhere

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **Authentication**: [Clerk](https://clerk.com)
- **Database**: PostgreSQL with [Prisma ORM](https://www.prisma.io)
- **AI**: [OpenAI API](https://platform.openai.com) for Socratic Agent
- **Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/) (VS Code editor)
- **File Processing**: 
  - [Mammoth](https://github.com/mwilliamson/mammoth.js) for DOCX
  - [pdfjs-dist](https://mozilla.github.io/pdf.js/) for PDF
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript

## Prerequisites

- Node.js 20.x
- PostgreSQL database
- Clerk account (for authentication)
- OpenAI API key (for AI coaching features)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd vlscreenplayFeature
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dion?schema=public"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app

# OpenAI (for Socratic Agent)
OPENAI_API_KEY=sk-...
```

**Get your keys:**
- Clerk keys: [clerk.com](https://clerk.com)
- OpenAI API key: [platform.openai.com](https://platform.openai.com/api-keys)

### 4. Set Up Database

Run Prisma migrations to set up the database schema:

```bash
npx prisma migrate dev
```

Generate Prisma Client:

```bash
npx prisma generate
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
vlscreenplayFeature/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── public/                    # Static assets
├── src/
│   ├── app/
│   │   ├── (marketing)/       # Landing page
│   │   ├── app/               # Protected app routes
│   │   │   ├── projects/     # Project management
│   │   │   └── scripts/      # Script editor
│   │   ├── api/              # API routes
│   │   │   ├── agent/        # AI coaching endpoints
│   │   │   ├── projects/     # Project CRUD
│   │   │   └── scripts/      # Script operations
│   │   ├── sign-in/          # Clerk sign-in
│   │   └── sign-up/          # Clerk sign-up
│   ├── components/
│   │   ├── app/              # App layout components
│   │   ├── editor/           # Editor components
│   │   ├── landing/          # Landing page components
│   │   └── projects/          # Project management components
│   └── lib/
│       ├── agent/            # AI coaching logic
│       ├── ai/               # OpenAI integration
│       ├── auth/             # Authentication helpers
│       ├── db/               # Database client
│       ├── domain/           # Domain logic
│       ├── importers/        # File import utilities
│       └── scripts/          # Script processing
└── package.json
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma migrate dev` - Create and apply database migrations
- `npx prisma generate` - Generate Prisma Client
- `npx prisma studio` - Open Prisma Studio (database GUI)

## Database Schema

Key models:
- **User**: User accounts linked to Clerk
- **Project**: Screenplay projects
- **Script**: Individual scripts within projects (Fountain format)
- **ScriptVersion**: Version history for scripts
- **WriterProfile**: User preferences for AI coaching
- **AgentThread**: Conversation threads with AI coach
- **AgentMessage**: Messages in coaching conversations

## AI Coaching Features

### Coaching Modes

**Director Mode** (default):
- Provides observations about what's happening in the scene
- Offers tentative interpretations
- Asks context-aware questions
- Adapts to your writer profile

**Socratic Mode**:
- Questions-only approach
- Helps you discover your own answers
- No advice or suggestions

### Writer Profile

Customize your coaching experience:
- **Tone**: Gentle (warmer, curious) or Rigorous (direct, diagnostic)
- **Focus**: Character, Pacing, Dialogue, Theme, or Balanced
- **Preferences**: Avoid theme questions, avoid symbolism, custom notes

### Context Awareness

The AI coach adapts based on:
- Element type (dialogue, action, scene heading, etc.)
- Scene position (early, middle, late)
- Active character
- Conversation history
- Your writer profile

## Script Import

Supported formats:
- **Fountain** (`.fountain`) - Native format, imported as-is
- **Plain Text** (`.txt`, `.md`) - Converted to Fountain format
- **Microsoft Word** (`.docx`) - Text extracted and converted to Fountain
- **PDF** (`.pdf`) - Text-based PDFs only (scanned PDFs not supported)

Maximum file size: 15MB for analysis, 2MB for script content

## Deployment

### Deploy on Vercel

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

The project is optimized for Vercel deployment with Next.js.

### Environment Variables for Production

Make sure to set all environment variables in your deployment platform:
- `DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`
- `OPENAI_API_KEY`

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Monaco Editor Documentation](https://microsoft.github.io/monaco-editor/)
- [Fountain Screenplay Format](https://fountain.io)

## License

Private project.
