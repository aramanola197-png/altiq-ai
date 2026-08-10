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
    return 'Gemini API key was rejected (permission). Check the key in AI Studio.';
  }
  if (lower.includes('not found') || lower.includes('404') || lower.includes('unknown model')) {
    return `Gemini model was not found. Set GEMINI_MODEL=gemini-3.6-flash (or gemini-2.5-flash) on Render and restart.`;
  }
  if (lower.includes('quota') || lower.includes('resource_exhausted') || lower.includes('429')) {
    return 'Gemini quota exceeded. Wait a few minutes or use another API key / billing tier.';
  }
  if (lower.includes('timed out')) {
    return 'AI request timed out (cold start or slow model). Try again in 30–60 seconds.';
  }
  if (lower.includes('safety') || lower.includes('blocked') || lower.includes('candidate')) {
    return 'The model blocked this reply. Rephrase your question and try again.';
  }

  const short = raw.replace(/\s+/g, ' ').slice(0, 160);
  return short ? `AI request failed: ${short}` : 'AI service is temporarily unavailable. Please try again shortly.';
}

function extractText(result) {
  try {
    const text = result?.response?.text?.();
    if (text && String(text).trim()) return String(text).trim();
  } catch (e) {
    // response.text() throws when no candidates / blocked
    throw new Error(e.message || 'Empty or blocked model response');
  }
  // Fallback: inspect candidates
  const cand = result?.response?.candidates?.[0];
  const parts = cand?.content?.parts;
  if (Array.isArray(parts)) {
    const joined = parts.map((p) => p.text).filter(Boolean).join('\n').trim();
    if (joined) return joined;
  }
  throw new Error('Empty or blocked model response');
}

function modelCandidates(preferred) {
  const primary = preferred || config.geminiModel || process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  const list = [
    primary,
    'gemini-3.6-flash',
    'gemini-2.5-flash',
    'gemini-3.5-flash',
    'gemini-2.5-flash-lite',
  ];
  return [...new Set(list.filter(Boolean))];
}

/**
 * Generate text with timeout, model fallbacks, and clear errors.
 */
async function generateText(prompt, options = {}) {
  const models = modelCandidates(options.model);
  let lastError;

  for (const modelName of models) {
    try {
      const model = getClient().getGenerativeModel({ model: modelName });
      const result = await withTimeout(
        model.generateContent(prompt),
        config.geminiTimeoutMs || 60000
      );
      const text = extractText(result);
      logger.info('gemini_success', { model: modelName });
      return { text, model: modelName };
    } catch (err) {
      lastError = err;
      logger.warn('gemini_attempt_failed', {
        model: modelName,
        error: err.message,
      });
      // Don't retry other models on quota/key errors
      const lower = String(err.message || '').toLowerCase();
      if (
        lower.includes('api key') ||
        lower.includes('quota') ||
        lower.includes('resource_exhausted') ||
        lower.includes('429') ||
        lower.includes('permission')
      ) {
        break;
      }
    }
  }

  logger.error('gemini_failed', { error: lastError?.message });
  const error = new Error(humanizeGeminiError(lastError));
  error.code = 'AI_UNAVAILABLE';
  error.statusCode = 503;
  error.causeMessage = lastError?.message;
  throw error;
}

module.exports = { generateText };
