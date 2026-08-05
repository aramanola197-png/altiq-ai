const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./config');
const logger = require('./logger');

let genAI = null;

function getClient() {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured on the server');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
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

function humanizeGeminiError(err) {
  const raw = String(err?.message || err || '');
  const lower = raw.toLowerCase();

  if (!process.env.GEMINI_API_KEY) {
    return 'GEMINI_API_KEY is missing on the server.';
  }
  if (lower.includes('api key not valid') || lower.includes('invalid api key') || lower.includes('api_key_invalid')) {
    return 'Gemini API key is invalid. Create a new key in Google AI Studio and update GEMINI_API_KEY on Render.';
  }
  if (lower.includes('permission') || lower.includes('403')) {
    return 'Gemini API key was rejected (permission). Check the key is from AI Studio and not restricted away from server use.';
  }
  if (
    lower.includes('not found') ||
    lower.includes('404') ||
    lower.includes('is not found') ||
    lower.includes('unknown model')
  ) {
    return `Gemini model "${process.env.GEMINI_MODEL || config.geminiModel}" was not found. Set GEMINI_MODEL=gemini-3.6-flash on Render and restart.`;
  }
  if (lower.includes('quota') || lower.includes('resource_exhausted') || lower.includes('429')) {
    return 'Gemini quota exceeded. Wait a bit or check billing/limits in Google AI Studio.';
  }
  if (lower.includes('timed out')) {
    return 'AI request timed out (backend may be cold-starting on free tier). Try again in 30–60 seconds.';
  }

  // Keep a short slice of the real message for debugging without dumping stacks
  const short = raw.replace(/\s+/g, ' ').slice(0, 180);
  return short
    ? `AI request failed: ${short}`
    : 'AI service is temporarily unavailable. Please try again shortly.';
}

/**
 * Generate text from Gemini with timeout + limited retry.
 * Always server-side only.
 */
async function generateText(prompt, options = {}) {
  const modelName = options.model || config.geminiModel || process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  const model = getClient().getGenerativeModel({ model: modelName });

  let lastError;
  const attempts = 1 + (config.geminiMaxRetries || 0);

  for (let i = 0; i < attempts; i++) {
    try {
      const result = await withTimeout(
        model.generateContent(prompt),
        config.geminiTimeoutMs || 45000
      );
      const text = result.response.text();
      logger.info('gemini_success', { model: modelName, attempt: i + 1 });
      return { text, model: modelName };
    } catch (err) {
      lastError = err;
      logger.warn('gemini_attempt_failed', {
        attempt: i + 1,
        model: modelName,
        error: err.message,
      });
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 800 * (i + 1)));
      }
    }
  }

  logger.error('gemini_failed', {
    model: modelName,
    error: lastError?.message,
  });

  const error = new Error(humanizeGeminiError(lastError));
  error.code = 'AI_UNAVAILABLE';
  error.statusCode = 503;
  error.causeMessage = lastError?.message;
  throw error;
}

module.exports = { generateText };
