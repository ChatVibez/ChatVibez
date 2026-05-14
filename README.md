# ChatVibez

A ChatGPT-like web application powered by **GPT-5.5** via the [Runware API](https://runware.ai). Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Real-time streaming responses (token-by-token)
- Conversation management (create, switch, delete)
- Persistent chat history (localStorage)
- Dark theme UI inspired by ChatGPT
- Mobile responsive with sidebar toggle
- Stop generation mid-stream
- Suggestion prompts for quick start

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI**: GPT-5.5 via Runware API (OpenAI-compatible endpoint)

## Getting Started

### Prerequisites

- Node.js 18+
- A [Runware API key](https://my.runware.ai/signup)

### Installation

```bash
git clone https://github.com/ChatVibez/ChatVibez.git
cd ChatVibez
npm install
```

### Configuration

Create a `.env.local` file in the root directory:

```env
RUNWARE_API_KEY=your_runware_api_key_here
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── api/chat/route.ts   # API route - proxies to Runware
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main page
├── components/
│   ├── ChatArea.tsx        # Message display + empty state
│   ├── ChatInput.tsx       # Message input with send/stop
│   ├── ChatMessage.tsx     # Individual message bubble
│   └── Sidebar.tsx         # Conversation list
├── hooks/
│   └── useChat.ts          # Chat logic + streaming + state
└── types/
    └── chat.ts             # TypeScript interfaces
```

## How It Works

1. User sends a message
2. The frontend calls `/api/chat` with the conversation history
3. The API route forwards the request to Runware's OpenAI-compatible endpoint (`https://api.runware.ai/v1/chat/completions`)
4. Responses stream back via Server-Sent Events (SSE)
5. Tokens appear in real-time as they are generated

## License

MIT
