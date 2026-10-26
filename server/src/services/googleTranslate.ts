import { v3 } from '@google-cloud/translate';
import type { TranslationFormat, TranslationSegment } from './articleTranslation';

// Google Cloud Translation (Translation LLM) for article segments.
//
// Region: Translation LLM answers in us-central1 and, in the EU, only in
// europe-west1 through the EU endpoint (checked with real calls on
// 2026-10-26; europe-west4/-west9 are rejected). Default is the EU one.
// Credentials: the same service account as Firestore (FIREBASE_CONFIG_JSON),
// which holds roles/cloudtranslate.user.

const DEFAULT_LOCATION = 'europe-west1';
// Documented: at most 1024 strings per request. The character cap is not
// confirmed in the docs we found, so it is a conservative, tunable guess.
const MAX_ITEMS_PER_REQUEST = 1024;
const DEFAULT_MAX_CHARS_PER_REQUEST = 20_000;

const MIME_TYPE: Record<TranslationFormat, string> = {
  html: 'text/html',
  text: 'text/plain',
};

export interface ChunkLimits {
  maxItems: number;
  maxChars: number;
}

// Splits segments into requests: one format per request (they need different
// mime types), within the item and character caps. A single segment longer
// than maxChars goes alone rather than being cut.
export const chunkSegments = (
  segments: TranslationSegment[],
  limits: ChunkLimits,
): TranslationSegment[][] => {
  const chunks: TranslationSegment[][] = [];
  for (const format of ['html', 'text'] as const) {
    let current: TranslationSegment[] = [];
    let chars = 0;
    for (const segment of segments.filter((item) => item.format === format)) {
      const length = segment.source.length;
      const full =
        current.length >= limits.maxItems ||
        (current.length > 0 && chars + length > limits.maxChars);
      if (full) {
        chunks.push(current);
        current = [];
        chars = 0;
      }
      current.push(segment);
      chars += length;
    }
    if (current.length > 0) chunks.push(current);
  }
  return chunks;
};

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

const readServiceAccount = (): ServiceAccount => {
  const raw = process.env.FIREBASE_CONFIG_JSON;
  if (!raw) throw new Error('FIREBASE_CONFIG_JSON is not set');
  return JSON.parse(raw) as ServiceAccount;
};

export interface TranslationRun {
  translations: Record<string, string>;
  provider: 'google-translation-llm';
  model: string;
  location: string;
  requests: number;
  characters: number;
}

export const translateSegments = async (
  segments: TranslationSegment[],
  { source = 'ru', target = 'fr' }: { source?: string; target?: string } = {},
): Promise<TranslationRun> => {
  const account = readServiceAccount();
  const location = process.env.TRANSLATION_LOCATION || DEFAULT_LOCATION;
  const maxChars =
    Number(process.env.TRANSLATION_MAX_CHARS_PER_REQUEST) || DEFAULT_MAX_CHARS_PER_REQUEST;
  const client = new v3.TranslationServiceClient({
    credentials: { client_email: account.client_email, private_key: account.private_key },
    projectId: account.project_id,
    // EU regions are only served by the EU endpoint.
    ...(location.startsWith('europe-') ? { apiEndpoint: 'translate-eu.googleapis.com' } : {}),
  });
  const parent = `projects/${account.project_id}/locations/${location}`;
  const model = `${parent}/models/general/translation-llm`;

  const translations: Record<string, string> = {};
  const chunks = chunkSegments(segments, { maxItems: MAX_ITEMS_PER_REQUEST, maxChars });
  for (const chunk of chunks) {
    const [response] = await client.translateText({
      parent,
      model,
      mimeType: MIME_TYPE[chunk[0].format],
      sourceLanguageCode: source,
      targetLanguageCode: target,
      contents: chunk.map((segment) => segment.source),
    });
    const results = response.translations ?? [];
    if (results.length !== chunk.length) {
      throw new Error(
        `Translation returned ${results.length} strings for ${chunk.length} sent`,
      );
    }
    chunk.forEach((segment, index) => {
      translations[segment.key] = results[index]?.translatedText ?? '';
    });
  }

  return {
    translations,
    provider: 'google-translation-llm',
    model,
    location,
    requests: chunks.length,
    characters: segments.reduce((sum, segment) => sum + segment.source.length, 0),
  };
};
