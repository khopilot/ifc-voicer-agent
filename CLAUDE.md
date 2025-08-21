# OpenAI Realtime Agents Project

## Project Overview
This is a Next.js application built with TypeScript that implements OpenAI's Agents SDK for real-time conversational AI experiences.

## Tech Stack
- **Framework**: Next.js 15.3.1 with App Router
- **Language**: TypeScript 5
- **AI SDK**: @openai/agents 0.0.5
- **Styling**: Tailwind CSS 3.4.1
- **React**: Version 19.0.0
- **UI Components**: Radix UI icons
- **Markdown**: react-markdown for rendering

## Project Structure
```
openai-realtime-agents/
├── src/
│   ├── app/          # Next.js app directory
│   ├── components/   # React components
│   └── lib/          # Utility functions and helpers
├── public/           # Static assets
└── .env.sample       # Environment variables template
```

## Development Commands
```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

## Key Features
- Real-time conversational AI using OpenAI's Agents SDK
- TypeScript for type safety
- Modern React with hooks and functional components
- Responsive UI with Tailwind CSS
- Markdown rendering support

## Environment Variables
Copy `.env.sample` to `.env.local` and configure:
- OpenAI API credentials
- Other service configurations as needed

## Testing Strategy
- Unit tests for utility functions
- Component testing for UI elements
- Integration tests for API endpoints
- End-to-end tests for critical user flows

## Code Standards
- TypeScript strict mode enabled
- ESLint configuration for code quality
- Functional React components with hooks
- Async/await for asynchronous operations
- Comprehensive error handling

## Performance Considerations
- Next.js automatic code splitting
- Image optimization with Next.js Image component
- API route caching where appropriate
- Efficient state management

## Security Best Practices
- Environment variables for sensitive data
- Input validation and sanitization
- Secure API communication
- Rate limiting considerations

## Development Workflow
1. Create feature branch from main
2. Implement changes with proper TypeScript types
3. Run lint and fix any issues
4. Test locally with `npm run dev`
5. Build and verify with `npm run build`
6. Create pull request with detailed description

## Claude Code Specific Instructions
- Always run `npm run lint` after making code changes
- Ensure TypeScript types are properly defined
- Follow existing code patterns and conventions
- Use the @openai/agents SDK according to its documentation
- Maintain clean, readable code with descriptive variable names
- Handle errors gracefully with appropriate user feedback

## Important Notes
- This project uses React 19 (latest version)
- Next.js 15 with App Router (not Pages Router)
- Keep dependencies up to date but test thoroughly
- Follow OpenAI's best practices for the Agents SDK