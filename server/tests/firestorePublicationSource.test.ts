import { describe, expect, test } from 'vitest';
import type { Firestore } from 'firebase-admin/firestore';
import { createFirestorePublicationSource } from '../src/services/firestorePublicationSource';
import { DELETED_VERSION } from '../src/utils/searchPublicationSync';

type FakeDoc = { data: Record<string, unknown>; updateTime: { seconds: number; nanoseconds: number } };

// Minimal Firestore stand-in: collection(c).doc(id).get(), recording each path read.
const fakeDb = (docs: Record<string, FakeDoc>) => {
  const reads: string[] = [];
  const db = {
    collection: (collection: string) => ({
      doc: (id: string) => ({
        get: async () => {
          const path = `${collection}/${id}`;
          reads.push(path);
          const doc = docs[path];
          return doc
            ? { exists: true, updateTime: doc.updateTime, data: () => doc.data }
            : { exists: false, updateTime: undefined, data: () => undefined };
        },
      }),
    }),
  } as unknown as Firestore;
  return { db, reads };
};

describe('Firestore PublicationSource', () => {
  test('reads one document by exact path; version comes from updateTime', async () => {
    const { db, reads } = fakeDb({
      'articles/a1': { data: { title: 'Статья', published: true }, updateTime: { seconds: 1_790_000_000, nanoseconds: 1_234 } },
    });
    const doc = await createFirestorePublicationSource(db).readDocument('articles', 'a1');
    expect(doc).toEqual({ exists: true, data: { title: 'Статья', published: true }, version: '1790000000.000001234' });
    expect(reads).toEqual(['articles/a1']);
  });

  test('a missing document reads as deleted, the same on every read', async () => {
    const { db, reads } = fakeDb({});
    const source = createFirestorePublicationSource(db);
    expect(await source.readDocument('firstPerson', 'gone')).toEqual({ exists: false, version: DELETED_VERSION });
    expect(await source.readDocument('firstPerson', 'gone')).toEqual({ exists: false, version: DELETED_VERSION });
    expect(reads).toEqual(['firstPerson/gone', 'firstPerson/gone']);
  });

  test('refuses ids with "/" and non-search collections before reading anything', async () => {
    const { db, reads } = fakeDb({});
    const source = createFirestorePublicationSource(db);
    await expect(source.readDocument('articles', 'a1/nested/x')).rejects.toThrow(/Invalid document id/);
    await expect(source.readDocument('articles', '')).rejects.toThrow(/Invalid document id/);
    await expect(source.readDocument('users', 'u1')).rejects.toThrow(/not a search source/);
    await expect(source.readAuthor('a/b')).rejects.toThrow(/Invalid document id/);
    expect(reads).toEqual([]);
  });

  test('readAuthor reads authors/{id} and returns only the fields records use', async () => {
    const { db, reads } = fakeDb({
      'authors/au1': {
        data: { firstName: 'Иван', lastName: 'Петров', noBgAvatar: 'https://p.example/a.png', email: 'private@example.com', bio: 'Био' },
        updateTime: { seconds: 1, nanoseconds: 0 },
      },
    });
    const source = createFirestorePublicationSource(db);
    expect(await source.readAuthor('au1')).toEqual({ firstName: 'Иван', lastName: 'Петров', noBgAvatar: 'https://p.example/a.png' });
    expect(await source.readAuthor('missing')).toBeNull();
    expect(reads).toEqual(['authors/au1', 'authors/missing']);
  });
});
