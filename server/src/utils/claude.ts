import Anthropic from '@anthropic-ai/sdk';

// Initialize Claude client
const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY || ''
});

const MODEL = 'claude-sonnet-4-20250514';

export interface SummaryResult {
  summary: string;
  tags: string[];
  keyPoints: string[];
}

export interface ModerationResult {
  isAppropriate: boolean;
  issues: string[];
  suggestions: string[];
}

export interface AnswerResult {
  answer: string;
  confidence: number;
}

/**
 * Generate AI summary and tags for a note
 */
export const generateNoteSummary = async (
  title: string,
  description: string,
  subject: string,
  module: string
): Promise<SummaryResult> => {
  try {
    const prompt = `You are an AI assistant helping students with their study notes.

Given the following note details:
- Title: ${title}
- Description: ${description || 'No description'}
- Subject: ${subject}
- Module: ${module}

Please provide:
1. A concise 3-5 bullet point summary highlighting the main topics covered
2. 5-10 relevant tags for categorization (single words or short phrases)
3. Key learning points

Format your response as JSON:
{
  "summary": "Brief overview in 2-3 sentences",
  "tags": ["tag1", "tag2", ...],
  "keyPoints": ["point1", "point2", ...]
}`;

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = message.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return result;
      }
    }

    // Fallback
    return {
      summary: `Notes on ${title} covering ${subject} - ${module}`,
      tags: [subject.toLowerCase(), module.toLowerCase()],
      keyPoints: ['Refer to the document for detailed information']
    };
  } catch (error) {
    console.error('Claude API error:', error);
    // Return fallback
    return {
      summary: `Study notes on ${title}`,
      tags: [subject.toLowerCase()],
      keyPoints: ['Check document for details']
    };
  }
};

/**
 * Check content for appropriateness (moderation)
 */
export const moderateContent = async (
  content: string,
  contentType: 'note' | 'comment'
): Promise<ModerationResult> => {
  try {
    const prompt = `You are a content moderator for an educational platform.

Analyze the following ${contentType} content for appropriateness:

"${content}"

Check for:
- Inappropriate language or content
- Spam or irrelevant content
- Potential copyright violations
- Duplicate or low-quality submissions

Respond in JSON format:
{
  "isAppropriate": true/false,
  "issues": ["issue1", "issue2", ...],
  "suggestions": ["suggestion1", ...]
}`;

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });

    const contentBlock = message.content[0];
    if (contentBlock.type === 'text') {
      const jsonMatch = contentBlock.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    // Fallback - assume appropriate
    return {
      isAppropriate: true,
      issues: [],
      suggestions: []
    };
  } catch (error) {
    console.error('Claude moderation error:', error);
    return {
      isAppropriate: true,
      issues: [],
      suggestions: []
    };
  }
};

/**
 * Answer questions based on note context
 */
export const answerQuestion = async (
  question: string,
  noteContext: {
    title: string;
    description: string;
    subject: string;
    module: string;
    summary?: string;
  }
): Promise<AnswerResult> => {
  try {
    const prompt = `You are an AI tutor helping students understand their study materials.

Note Context:
- Title: ${noteContext.title}
- Subject: ${noteContext.subject}
- Module: ${noteContext.module}
- Description: ${noteContext.description || 'N/A'}
${noteContext.summary ? `- Summary: ${noteContext.summary}` : ''}

Student Question: "${question}"

Provide a helpful, accurate answer based on the context. If the question cannot be answered with the given context, say so politely and suggest what additional information might help.

Keep your answer concise (2-4 sentences) and educational.`;

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });

    const contentBlock = message.content[0];
    if (contentBlock.type === 'text') {
      return {
        answer: contentBlock.text.trim(),
        confidence: 0.8
      };
    }

    return {
      answer: 'I apologize, but I cannot provide an answer at this time.',
      confidence: 0
    };
  } catch (error) {
    console.error('Claude answer error:', error);
    return {
      answer: 'I apologize, but I encountered an error. Please try again.',
      confidence: 0
    };
  }
};

/**
 * Generate study tips based on subject and module
 */
export const generateStudyTips = async (
  subject: string,
  module: string
): Promise<string[]> => {
  try {
    const prompt = `Generate 5 concise study tips for students learning about ${module} in ${subject}.

Format as a simple list, one tip per line.`;

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    });

    const contentBlock = message.content[0];
    if (contentBlock.type === 'text') {
      const tips = contentBlock.text
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(tip => tip.length > 0)
        .slice(0, 5);

      return tips;
    }

    return [];
  } catch (error) {
    console.error('Claude study tips error:', error);
    return [];
  }
};
