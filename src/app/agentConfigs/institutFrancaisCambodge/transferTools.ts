import { tool } from '@openai/agents/realtime';

// Helper function to create transfer tools for agents
export function createTransferTools(agentNames: string[]) {
  return agentNames.map(agentName => 
    tool({
      name: `transfer_to_${agentName}`,
      description: `Transfer the conversation to the ${agentName} agent`,
      parameters: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: false,
      },
      execute: async () => {
        // The SDK handles the actual transfer
        return { transferring: true };
      },
    })
  );
}

// Pre-defined transfer tools for our agents
// Main can transfer to all specialists
export const mainTransferTools = createTransferTools(['courses', 'events', 'cultural']);

// Specialists can ONLY transfer between each other (no back to main - prevents double transfers)
export const coursesTransferTools = createTransferTools(['events', 'cultural']);
export const eventsTransferTools = createTransferTools(['courses', 'cultural']);
export const culturalTransferTools = createTransferTools(['courses', 'events']);