# Institut français du Cambodge Voice Assistant

A multilingual AI voice assistant for Institut français du Cambodge, supporting French, Khmer, and English conversations.

## 🌟 Features

- **Trilingual Support**: Seamless conversation in French, Khmer, and English
- **4 Specialized Agents**:
  - Reception: General inquiries and routing
  - Courses: Language course information and enrollment
  - Events: Cultural activities and programming
  - Cultural Exchange: Campus France and scholarship guidance
- **Push-to-Talk**: Privacy-focused with manual microphone activation
- **Language Selector**: Explicit language choice for optimal routing
- **Professional UI**: Minimalist design with smooth animations

## 🚀 Quick Start

1. **Clone the repository**:
```bash
git clone https://github.com/khopilot/ifc-voicer-agent.git
cd ifc-voicer-agent
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up your OpenAI API key**:
```bash
cp .env.local.example .env.local
# Edit .env.local and add your OpenAI API key
```

4. **Run the development server**:
```bash
npm run dev
```

5. **Open your browser**:
Navigate to `http://localhost:3000`

## 🎯 Usage

1. Click "Connecter" to start
2. Select your preferred language (FR/KH/EN)
3. Hold the microphone button to speak
4. The AI will route you to the appropriate specialist based on your needs

## 🏗️ Architecture

- **Framework**: Next.js 15 with TypeScript
- **AI**: OpenAI Realtime API with Agents SDK
- **Audio**: WebRTC for real-time communication
- **UI**: React with Canvas animations

## 📝 Agent Routing

- **Courses**: "I want to learn French", "តើមានថ្នាក់ភាសាបារាំងទេ?"
- **Events**: "What's happening this week?", "Y a-t-il un concert?"
- **Cultural**: "I want to study in France", "Comment obtenir une bourse?"

## 🔒 Privacy

- Microphone is muted by default
- Audio only captured when holding the talk button
- No continuous listening

## 📄 License

This project is based on OpenAI's Realtime Agents SDK.