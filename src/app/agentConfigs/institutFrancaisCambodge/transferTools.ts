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
export const mainTransferTools = createTransferTools(['courses', 'events', 'cultural']);
export const coursesTransferTools = createTransferTools(['mainReceptionist', 'events', 'cultural']);
export const eventsTransferTools = createTransferTools(['mainReceptionist', 'courses', 'cultural']);
export const culturalTransferTools = createTransferTools(['mainReceptionist', 'courses', 'events']);