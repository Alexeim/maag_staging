import { describe, expect, test } from 'vitest';
import {
  ALGOLIA_FREE_PLAN_MAX_RECORD_BYTES,
  buildSearchRecords,
  SearchRecordTooLargeError,
  type SearchRecord,
} from '../src/utils/searchRecords';

const LIMIT = ALGOLIA_FREE_PLAN_MAX_RECORD_BYTES;
const utf8Bytes = (record: SearchRecord): number => Buffer.byteLength(JSON.stringify(record), 'utf8');
const published = { published: true, publishedAt: { _seconds: 1_790_000_000, _nanoseconds: 0 } };

// Every text field an editor can fill on a gated material, each with a marker
// that must never reach the index.
const gatedFields = {
  lead: 'SECRET-lead', leadHtml: '<p>SECRET-leadHtml</p>',
  cardLead: 'SECRET-cardLead', cardTitle: 'SECRET-cardTitle',
  subtitle: 'SECRET-subtitle', intro: 'SECRET-intro',
  mainQuote: 'SECRET-mainQuote', imageCaption: 'SECRET-imageCaption',
  secondImageCaption: 'SECRET-secondImageCaption',
  content: [
    { type: 'first-paragraph', text: 'SECRET-first-paragraph' },
    { type: 'paragraph', html: '<p>SECRET-paragraph</p>' },
    { type: 'two-columns', left: { type: 'text', content: 'SECRET-nested' } },
    { type: 'qa', question: 'SECRET-question', answerHtml: '<p>SECRET-answer</p>' },
    { type: 'image', caption: 'SECRET-caption' },
  ],
  slides: [{ text: 'SECRET-slide', caption: 'SECRET-slide-caption' }],
  carouselContent: [{ imageUrl: 'https://img.example/1', caption: 'SECRET-carousel' }],
  authorId: 'SECRET-authorId',
};

describe('drafts and deleted documents', () => {
  test.each([false, undefined, null, 'true', 1])('published=%s gives no records', (flag) => {
    const result = buildSearchRecords({
      collection: 'articles', id: 'a1',
      data: { ...published, published: flag, title: 'Черновик', content: [{ type: 'paragraph', text: 'Текст' }] },
    });
    expect(result).toEqual({ publicationId: 'articles/a1', records: [], warnings: [] });
  });

  test('a deleted document (no data) still names its publication', () => {
    expect(buildSearchRecords({ collection: 'interviews', id: 'gone', data: undefined }))
      .toEqual({ publicationId: 'interviews/gone', records: [], warnings: [] });
  });

  test('an unknown collection is a programming error, not an empty result', () => {
    expect(() => buildSearchRecords({ collection: 'users', id: 'u1', data: published })).toThrow(/not a search source/);
  });
});

describe('open materials', () => {
  test('finds a mention inside a nested block and keeps the snapshot id', () => {
    const { records } = buildSearchRecords({
      collection: 'articles', id: 'snapshot-id',
      data: {
        ...published, id: 'stale-stored-id', title: 'Святые угодники и колбасники', tags: ['история'],
        lead: 'Вводка',
        content: [{ type: 'two-columns', right: { type: 'text', html: '<p>Праздник святого Антония</p>' } }],
      },
    });
    expect(records).toEqual([{
      objectID: 'articles/snapshot-id#0', publicationId: 'articles/snapshot-id',
      collection: 'articles', sourceId: 'snapshot-id', type: 'article',
      href: '/article/snapshot-id', title: 'Святые угодники и колбасники', tags: ['история'],
      access: 'open', introduction: 'Вводка', content: 'Праздник святого Антония',
      chunkIndex: 0, chunkCount: 1,
    }]);
  });

  test('uses Firestore collection names and the page routes', () => {
    const tips = buildSearchRecords({ collection: 'articles', id: 't1', data: { ...published, title: 'Советы', articleType: 'tips' } });
    expect(tips.records[0]).toMatchObject({ type: 'tips', href: '/tips/t1' });
    const opinion = buildSearchRecords({ collection: 'firstPerson', id: 'f1', data: { ...published, title: 'Мнение', variant: 'opinion' } });
    expect(opinion.records[0]).toMatchObject({ publicationId: 'firstPerson/f1', type: 'opinion', href: '/first-person/f1' });
  });

  test('splits a long publication into fitting chunks without losing or cutting words', () => {
    const paragraphs = Array.from({ length: 60 }, (_, index) =>
      `Абзац ${index}: ${'длинное предложение о «Ferme de Gally» и "кавычках" \\ '.repeat(8)}конец${index}`);
    const { records } = buildSearchRecords({
      collection: 'interviews', id: 'long',
      data: {
        ...published, title: 'Блек ле Ра: Стрит-арт умер в 2000 году', interviewee: 'Блек ле Ра',
        lead: 'Вводка интервью', content: paragraphs.map((text) => ({ type: 'paragraph', text })),
      },
    });
    expect(records.length).toBeGreaterThan(1);
    records.forEach((record, index) => {
      expect(utf8Bytes(record)).toBeLessThanOrEqual(LIMIT);
      expect(record).toMatchObject({
        objectID: `interviews/long#${index}`, publicationId: 'interviews/long',
        chunkIndex: index, chunkCount: records.length, interviewee: 'Блек ле Ра',
      });
      expect('introduction' in record).toBe(index === 0);
    });
    // Paragraphs are whole units here, so every chunk boundary is a paragraph
    // boundary. The prototype extractor appends the interviewee to the body.
    const joined = records.map((record) => record.content).join('\n');
    expect(joined).toBe([...paragraphs, 'Блек ле Ра'].join('\n'));
  });

  test('splits a paragraph by words and an oversized word by characters', () => {
    const words = Array.from({ length: 2500 }, (_, index) => `слово${index}`).join(' ');
    const longWord = 'ж'.repeat(12_000);
    const { records } = buildSearchRecords({
      collection: 'news', id: 'n1',
      data: { ...published, title: 'Новость', content: [{ type: 'paragraph', text: words }, { type: 'paragraph', text: longWord }] },
    });
    records.forEach((record) => expect(utf8Bytes(record)).toBeLessThanOrEqual(LIMIT));
    const wordChunks = records.filter((record) => record.content?.startsWith('слово'));
    expect(wordChunks.length).toBeGreaterThan(1);
    expect(wordChunks.map((record) => record.content).join(' ')).toBe(words);
    expect(records.filter((record) => record.content?.startsWith('ж')).map((record) => record.content).join(''))
      .toBe(longWord);
  });

  test('is deterministic for the same document version', () => {
    const input = {
      collection: 'guides', id: 'g1',
      data: { ...published, title: 'Гид', tags: ['париж'], content: [{ type: 'paragraph', text: 'Текст '.repeat(3000) }] },
    };
    expect(buildSearchRecords(input)).toEqual(buildSearchRecords(input));
  });

  test('refuses a record whose metadata alone exceeds the limit', () => {
    expect(() => buildSearchRecords({
      collection: 'news', id: 'huge', data: { ...published, title: 'Я'.repeat(6_000) },
    })).toThrow(SearchRecordTooLargeError);
  });
});

describe('restricted (paid) materials', () => {
  test.each(['articles', 'guides', 'interviews', 'flippers', 'visual-stories'])(
    '%s: one record, whitelisted fields only, no gated text anywhere',
    (collection) => {
      const { records } = buildSearchRecords({
        collection, id: 'p1',
        data: {
          ...published, ...gatedFields, paid: true, title: 'Открытый заголовок', tags: ['театр'], interviewee: 'Герой',
          imageUrl: 'https://cover.example/cover.jpg',
        },
      });
      expect(records).toHaveLength(1);
      // The public card cover is the only URL allowed; flippers use their first slide.
      const { imageUrl, ...rest } = records[0];
      expect(imageUrl).toBe(collection === 'flippers' ? 'https://img.example/1' : 'https://cover.example/cover.jpg');
      expect(JSON.stringify(rest)).not.toMatch(/SECRET|https:/);
      const expectedKeys = ['access', 'chunkCount', 'chunkIndex', 'collection', 'href', 'imageUrl', 'objectID',
        'publicationId', 'sourceId', 'tags', 'title', 'type'];
      if (collection === 'interviews') expectedKeys.push('interviewee');
      expect(Object.keys(records[0]).sort()).toEqual(expectedKeys.sort());
      expect(records[0]).toMatchObject({ access: 'restricted', title: 'Открытый заголовок', tags: ['театр'] });
      expect(utf8Bytes(records[0])).toBeLessThanOrEqual(LIMIT);
    },
  );

  test('a paid interview keeps the public hero name', () => {
    const { records } = buildSearchRecords({
      collection: 'interviews', id: 'i1',
      data: { ...published, ...gatedFields, paid: true, title: 'Стрит-арт умер', interviewee: '  Блек  ле Ра ' },
    });
    expect(records[0].interviewee).toBe('Блек ле Ра');
  });

  test.each(['articles', 'guides', 'interviews', 'flippers', 'visual-stories'])(
    '%s: a missing paid field means open, without a warning',
    (collection) => {
      const { records, warnings } = buildSearchRecords({
        collection, id: 'old', data: { ...published, title: 'Старый материал', content: [{ type: 'paragraph', text: 'Текст' }] },
      });
      expect(warnings).toEqual([]);
      expect(records[0]).toMatchObject({ access: 'open', content: 'Текст' });
    },
  );

  test.each(['true', 'false', 1, 0, null, {}])('unexpected paid=%j excludes gated text and warns', (paid) => {
    const { records, warnings } = buildSearchRecords({
      collection: 'interviews', id: 'odd',
      data: { ...published, ...gatedFields, paid, title: 'Странный доступ', interviewee: 'Герой' },
    });
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ access: 'restricted', interviewee: 'Герой' });
    expect(JSON.stringify(records)).not.toContain('SECRET');
    expect(warnings).toEqual([`unexpected paid value ${JSON.stringify(paid)}; gated text excluded`]);
  });

  test.each(['news', 'events', 'firstPerson', 'photosOfTheDay'])(
    '%s has no gate: open by default, an unexpected paid closes and warns',
    (collection) => {
      const base = { ...published, title: 'Без гейта', content: [{ type: 'paragraph', text: 'Открытый текст' }] };
      // firstPerson defaults to the "first-person" variant, which needs a name.
      const author = { firstName: 'Анна', lastName: 'Автор' };
      for (const paid of [undefined, false]) {
        const open = buildSearchRecords({ collection, id: 'x', data: { ...base, paid }, author });
        expect(open.warnings).toEqual([]);
        expect(open.records[0]).toMatchObject({ access: 'open', content: 'Открытый текст' });
      }
      const odd = buildSearchRecords({ collection, id: 'x', data: { ...base, paid: true }, author });
      expect(odd.records[0].access).toBe('restricted');
      expect(JSON.stringify(odd.records)).not.toContain('Открытый текст');
      expect(odd.warnings).toEqual(['paid set on a collection without a gate true; gated text excluded']);
    },
  );

  test('a long paid material still produces a single record without its text', () => {
    const { records } = buildSearchRecords({
      collection: 'articles', id: 'p2',
      data: { ...published, paid: true, title: 'Длинная', content: [{ type: 'paragraph', text: 'SECRET '.repeat(10_000) }] },
    });
    expect(records).toHaveLength(1);
    expect(JSON.stringify(records)).not.toContain('SECRET');
  });
});

describe('card fields: imageUrl and displayTitle', () => {
  const cover = 'https://cover.example/cover.jpg';
  const slide = 'https://slide.example/1.jpg';
  const portrait = 'https://portrait.example/author.png';
  const author = { firstName: ' Иван ', lastName: 'Петров', noBgAvatar: portrait };
  const card = (collection: string, data: Record<string, unknown>, withAuthor: typeof author | null = author) =>
    buildSearchRecords({ collection, id: 'c1', data: { ...published, title: 'Заголовок', ...data }, author: withAuthor });

  test.each([
    ['articles', { imageUrl: cover }, cover],
    ['news', { imageUrl: cover }, cover],
    ['events', { imageUrl: cover }, cover],
    ['guides', { imageUrl: cover }, cover],
    ['interviews', { imageUrl: cover, interviewee: 'Герой' }, cover],
    ['photosOfTheDay', { imageUrl: cover, caption: 'Подпись' }, cover],
    ['flippers', { imageUrl: cover, carouselContent: [{ imageUrl: slide }] }, slide],
    ['flippers', { imageUrl: cover, carouselContent: [] }, cover],
    ['visual-stories', { imageUrl: cover, slides: [{ imageUrl: slide }] }, cover],
    ['visual-stories', { imageUrl: '', slides: [{ imageUrl: slide }] }, slide],
    ['firstPerson', { variant: 'opinion', imageUrl: cover }, cover],
    ['firstPerson', { variant: 'opinion' }, portrait],
    ['firstPerson', {}, portrait],
    ['articles', { imageUrl: '  ' }, undefined],
  ])('%s %j → imageUrl %s (publicMaterialsController rules)', (collection, data, expected) => {
    const { records } = card(collection, data);
    records.forEach((record) => expect(record.imageUrl).toBe(expected));
  });

  test('first-person: displayTitle = author name + stored tail, in every chunk', () => {
    const { records, warnings } = card('firstPerson', {
      title: 'о том, как он попал в кино',
      content: Array.from({ length: 3 }, () => ({ type: 'paragraph', text: 'текст '.repeat(1000) })),
    });
    expect(warnings).toEqual([]);
    expect(records.length).toBeGreaterThan(1);
    records.forEach((record) => expect(record).toMatchObject({
      type: 'first-person', title: 'о том, как он попал в кино', displayTitle: 'Иван Петров о том, как он попал в кино',
    }));
  });

  test('first-person without an author name: the tail is shown, with a warning', () => {
    for (const withAuthor of [null, { firstName: '', lastName: '  ', noBgAvatar: portrait }]) {
      const { records, warnings } = card('firstPerson', { title: ' о сгоревшем рынке ' }, withAuthor);
      expect(records[0].displayTitle).toBe('о сгоревшем рынке');
      expect(warnings).toEqual(['author name missing; displayTitle is the stored title tail']);
    }
  });

  test('opinion keeps its own title and gets no displayTitle, author or not', () => {
    for (const withAuthor of [author, null]) {
      const { records, warnings } = card('firstPerson', { variant: 'opinion', title: 'Почему молодежь бурлит?', imageUrl: cover }, withAuthor);
      expect(records[0].type).toBe('opinion');
      expect(records[0]).not.toHaveProperty('displayTitle');
      expect(warnings).toEqual([]);
    }
  });

  test('only first-person gets a displayTitle; the author is ignored elsewhere', () => {
    const { records } = card('articles', { imageUrl: cover });
    expect(records[0]).not.toHaveProperty('displayTitle');
    expect(JSON.stringify(records)).not.toContain('Петров');
  });

  test('a paid interview gets its public cover but still no text', () => {
    const { records } = card('interviews', { ...gatedFields, paid: true, imageUrl: cover, interviewee: 'Герой' });
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ access: 'restricted', imageUrl: cover, interviewee: 'Герой' });
    expect(JSON.stringify(records)).not.toContain('SECRET');
  });
});
