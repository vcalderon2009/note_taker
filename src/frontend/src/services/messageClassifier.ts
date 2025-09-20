
interface ClassificationResponse {
  classification: 'BRAIN_DUMP' | 'SIMPLE_TASK' | 'SIMPLE_NOTE' | 'MESSAGE_ANALYSIS';
  confidence: number;
  reasoning: string;
}

export class MessageClassifier {
  private static readonly API_BASE = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8000/api';

  static async classifyMessage(message: string): Promise<ClassificationResponse> {
    try {
      const response = await fetch(`${this.API_BASE}/classify-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`Classification failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Message classification failed:', error);
      
      // Fallback to simple heuristics if LLM classification fails
      return this.fallbackClassification(message);
    }
  }

  private static fallbackClassification(message: string): ClassificationResponse {
    const text = message.toLowerCase();
    const isLongMessage = message.length > 100;
    const hasMultipleItems = message.includes(' and ') || message.includes(',') || message.includes(';');
    const isMeetingNotes = text.includes('meeting') || text.includes('notes');
    
    if (isLongMessage && (hasMultipleItems || isMeetingNotes)) {
      return {
        classification: 'BRAIN_DUMP',
        confidence: 0.7,
        reasoning: 'Long message with multiple items detected (fallback)'
      };
    } else if (text.includes('task') || text.includes('todo') || text.includes('create a task') || 
               text.includes('schedule') || text.includes('need to') || text.includes('review')) {
      return {
        classification: 'SIMPLE_TASK',
        confidence: 0.6,
        reasoning: 'Task-related keywords detected (fallback)'
      };
    } else if (text.includes('note') || text.includes('remember') || text.includes('thinking') || 
               text.includes('project') || text.includes('idea')) {
      return {
        classification: 'SIMPLE_NOTE',
        confidence: 0.6,
        reasoning: 'Note-related keywords detected (fallback)'
      };
    } else {
      return {
        classification: 'MESSAGE_ANALYSIS',
        confidence: 0.5,
        reasoning: 'General message requiring analysis (fallback)'
      };
    }
  }
}
