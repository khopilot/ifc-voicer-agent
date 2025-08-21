import { RealtimeAgent } from '@openai/agents/realtime';
import { optimizedMainReceptionistAgent } from './optimizedMainAgent';
import { optimizedCoursesAgent } from './optimizedCoursesAgent';
import { optimizedEventsAgent } from './optimizedEventsAgent';
import { optimizedCulturalAgent } from './optimizedCulturalAgent';

// Company name for guardrails
export const institutFrancaisCambodgeCompanyName = 'Institut français du Cambodge';

// Create agent references for easier management
const mainAgent = optimizedMainReceptionistAgent;
const coursesAgent = optimizedCoursesAgent;
const eventsAgent = optimizedEventsAgent;
const culturalAgent = optimizedCulturalAgent;

// Configure intelligent handoff system with bidirectional connections
// This allows smooth transitions between agents while preserving context

// Main receptionist can transfer to all specialists
(mainAgent.handoffs as any).push(coursesAgent, eventsAgent, culturalAgent);

// Each specialist can transfer back to main or to other specialists
(coursesAgent.handoffs as any).push(mainAgent, eventsAgent, culturalAgent);
(eventsAgent.handoffs as any).push(mainAgent, coursesAgent, culturalAgent);
(culturalAgent.handoffs as any).push(mainAgent, coursesAgent, eventsAgent);

// Export the optimized scenario with enhanced agents
export const optimizedInstitutFrancaisCambodgeScenario = [
  mainAgent,
  coursesAgent,
  eventsAgent,
  culturalAgent,
];

// Add context preservation system
export const contextManager = {
  preserveLanguage: (fromAgent: string, toAgent: string, language: 'FR' | 'KH' | 'EN') => {
    return `[Language: ${language}] Continuing from ${fromAgent}`;
  },
  
  preserveIntent: (userIntent: string, details: string) => {
    return `[Intent: ${userIntent}] [Details: ${details}]`;
  },
  
  preserveHistory: (conversationPoints: string[]) => {
    return `[History: ${conversationPoints.join(' → ')}]`;
  }
};

// Enhanced handoff instructions for seamless transitions
export const handoffInstructions = {
  toCourses: {
    FR: "Parfait! Je vous mets en relation avec notre expert pédagogique qui va vous conseiller sur nos programmes de formation.",
    KH: "ល្អណាស់! ខ្ញុំនឹងភ្ជាប់លោកអ្នកជាមួយអ្នកជំនាញការសិក្សារបស់យើងដែលនឹងផ្តល់ដំបូន្មានអំពីកម្មវិធីសិក្សា។",
    EN: "Perfect! Let me connect you with our education specialist who will guide you through our course offerings."
  },
  
  toEvents: {
    FR: "Excellent! Notre coordinateur culturel va vous présenter nos événements passionnants.",
    KH: "អស្ចារ្យ! អ្នកសម្របសម្រួលវប្បធម៌របស់យើងនឹងបង្ហាញពីព្រឹត្តិការណ៍ដ៏គួរឱ្យរំភើប។",
    EN: "Wonderful! Our cultural coordinator will share our exciting events and activities with you."
  },
  
  toCultural: {
    FR: "Formidable! Notre conseiller Campus France va vous accompagner dans votre projet.",
    KH: "អស្ចារ្យណាស់! អ្នកប្រឹក្សា Campus France នឹងជួយលោកអ្នកក្នុងគម្រោងរបស់អ្នក។",
    EN: "Excellent! Our Campus France advisor will help you explore your opportunities."
  },
  
  toMain: {
    FR: "Je vous repasse notre accueil pour vous aider avec d'autres questions.",
    KH: "ខ្ញុំនឹងបញ្ជូនលោកអ្នកត្រឡប់ទៅផ្នែកស្វាគមន៍វិញសម្រាប់សំណួរផ្សេងទៀត។",
    EN: "Let me transfer you back to our reception for any other questions you may have."
  }
};

// Monitoring and quality assurance functions
export const qualityMetrics = {
  // Track language consistency
  checkLanguageConsistency: (conversation: any[]) => {
    const languages = conversation.map(turn => detectLanguage(turn.text));
    return languages.every(lang => lang === languages[0]);
  },
  
  // Measure handoff success
  handoffSuccess: (fromAgent: string, toAgent: string, completed: boolean) => {
    return {
      from: fromAgent,
      to: toAgent,
      success: completed,
      timestamp: new Date().toISOString()
    };
  },
  
  // Track user satisfaction indicators
  satisfactionIndicators: (conversation: any[]) => {
    const positiveWords = ['merci', 'អរគុណ', 'thanks', 'parfait', 'excellent', 'ល្អ'];
    const negativeWords = ['problème', 'បញ្ហា', 'problem', 'difficile', 'ពិបាក'];
    
    let positive = 0;
    let negative = 0;
    
    conversation.forEach(turn => {
      positiveWords.forEach(word => {
        if (turn.text.toLowerCase().includes(word)) positive++;
      });
      negativeWords.forEach(word => {
        if (turn.text.toLowerCase().includes(word)) negative++;
      });
    });
    
    return { positive, negative, sentiment: positive - negative };
  }
};

// Language detection helper
function detectLanguage(text: string): 'FR' | 'KH' | 'EN' {
  // Simple heuristic - in production, use a proper language detection library
  const frenchWords = /bonjour|merci|comment|vous|je|avec|pour|dans/i;
  const khmerChars = /[\u1780-\u17FF]/;
  const englishWords = /hello|thank|how|you|with|for|what|when/i;
  
  if (khmerChars.test(text)) return 'KH';
  if (frenchWords.test(text)) return 'FR';
  if (englishWords.test(text)) return 'EN';
  
  return 'FR'; // Default to French
}

// Export configuration for the application
export const optimizedAgentConfig = {
  scenario: optimizedInstitutFrancaisCambodgeScenario,
  companyName: institutFrancaisCambodgeCompanyName,
  contextManager,
  handoffInstructions,
  qualityMetrics,
  
  // Configuration settings
  settings: {
    defaultLanguage: 'FR',
    supportedLanguages: ['FR', 'KH', 'EN'],
    maxConversationLength: 50, // turns before suggesting to end
    handoffTimeout: 5000, // ms before retry
    voiceSettings: {
      speed: 1.0,
      pitch: 1.0,
      volume: 0.8
    }
  }
};

// For backward compatibility with existing code
export const institutFrancaisCambodgeScenario = optimizedInstitutFrancaisCambodgeScenario;
export const mainReceptionistAgent = mainAgent;