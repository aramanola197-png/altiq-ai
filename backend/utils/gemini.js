const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./config');
const logger = require('./logger');

let genAI = null;

function getClient() {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI request timed out')), ms)
    ),
  ]);
}

/**
 * Generate text from Gemini with timeout + limited retry.
 * Always server-side only.
 */
async function generateText(prompt, options = {}) {
  const modelName = options.model || config.geminiModel;
  const model = getClient().getGenerativeModel({ model: modelName });

  let lastError;
  const attempts = 1 + (config.geminiMaxRetries || 0);

  for (let i = 0; i < attempts; i++) {
    try {
      const result = await withTimeout(
        model.generateContent(prompt),
        config.geminiTimeoutMs
      );
      const text = result.response.text();
      logger.info('gemini_success', { model: modelName, attempt: i + 1 });
      return { text, model: modelName };
    } catch (err) {
      lastError = err;
      logger.warn('gemini_attempt_failed', {
        attempt: i + 1,
        error: err.message,
      });
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 800 * (i + 1)));
      }
    }
  }

  logger.error('gemini_failed', { error: lastError?.message });
  const error = new Error(
    'AI service is temporarily unavailable. Your work has been preserved. Please try again shortly.'
  );
  error.code = 'AI_UNAVAILABLE';
  error.statusCode = 503;
  throw error;
}

module.exports = { generateText };
