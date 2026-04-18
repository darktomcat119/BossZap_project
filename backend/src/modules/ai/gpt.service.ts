import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GptResponse {
  content: string;
  usage: { prompt_tokens: number; completion_tokens: number };
}

interface OpenAiChatResponse {
  choices: Array<{
    message: { content: string };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

@Injectable()
export class GptService {
  private readonly logger = new Logger(GptService.name);
  private readonly apiKey: string;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY', '');
    this.model = this.configService.get<string>('OPENAI_MODEL', 'gpt-4');
  }

  async chat(messages: ChatMessage[]): Promise<GptResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`GPT API error: ${error}`);
      throw new Error(`GPT API failed: ${response.status}`);
    }

    const data = (await response.json()) as OpenAiChatResponse;
    const content = data.choices[0]?.message?.content || '';

    return {
      content,
      usage: data.usage,
    };
  }

  async chatWithRetry(messages: ChatMessage[]): Promise<GptResponse> {
    try {
      return await this.chat(messages);
    } catch (error) {
      this.logger.warn('GPT call failed, retrying once...');
      try {
        return await this.chat(messages);
      } catch (retryError) {
        this.logger.error('GPT retry failed');
        throw retryError;
      }
    }
  }
}
