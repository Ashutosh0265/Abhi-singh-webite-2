import { test } from 'node:test';
import assert from 'node:assert';

// Core pagination algorithm tested in isolation (9 articles per page for 3x3 grid)
function getPaginationRange(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total];
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
}

function calculatePagination(articles, currentPage = 1, pageSize = 9) {
  const published = articles.filter(
    (a) => (a.status || 'published') === 'published' && !a.is_deleted && a.status !== 'trash'
  );
  const totalPages = Math.max(1, Math.ceil(published.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const currentArticles = published.slice(startIndex, startIndex + pageSize);
  const pages = getPaginationRange(safeCurrentPage, totalPages);

  return {
    publishedCount: published.length,
    totalPages,
    currentPage: safeCurrentPage,
    currentArticles,
    pages,
    hasPrev: safeCurrentPage > 1,
    hasNext: safeCurrentPage < totalPages,
  };
}

// ── REQUIREMENT 1: 0 PUBLISHED ARTICLES ──
test('Scenario 1: 0 published articles produces totalPages = 1, empty articles list, disabled prev/next', () => {
  const result = calculatePagination([], 1, 9);
  assert.strictEqual(result.publishedCount, 0);
  assert.strictEqual(result.totalPages, 1);
  assert.strictEqual(result.currentPage, 1);
  assert.strictEqual(result.currentArticles.length, 0);
  assert.deepStrictEqual(result.pages, [1]);
  assert.strictEqual(result.hasPrev, false);
  assert.strictEqual(result.hasNext, false);
});

// ── REQUIREMENT 2: 1 TO 8 PUBLISHED ARTICLES ──
test('Scenario 2: 1 to 8 published articles produce exactly 1 page', () => {
  for (let count = 1; count <= 8; count++) {
    const mockArticles = Array.from({ length: count }, (_, i) => ({ id: `art-${i}`, status: 'published' }));
    const result = calculatePagination(mockArticles, 1, 9);
    assert.strictEqual(result.totalPages, 1, `Count ${count} should have totalPages = 1`);
    assert.deepStrictEqual(result.pages, [1], `Count ${count} should show only page [1]`);
    assert.strictEqual(result.hasPrev, false, 'Previous must be disabled on page 1');
    assert.strictEqual(result.hasNext, false, 'Next must be disabled when totalPages is 1');
    assert.strictEqual(result.currentArticles.length, count);
  }
});

// ── REQUIREMENT 3: EXACTLY 9 PUBLISHED ARTICLES ──
test('Scenario 3: Exactly 9 published articles produce exactly 1 page (3x3 grid full)', () => {
  const mockArticles = Array.from({ length: 9 }, (_, i) => ({ id: `art-${i}`, status: 'published' }));
  const result = calculatePagination(mockArticles, 1, 9);
  assert.strictEqual(result.publishedCount, 9);
  assert.strictEqual(result.totalPages, 1);
  assert.deepStrictEqual(result.pages, [1]);
  assert.strictEqual(result.currentArticles.length, 9);
  assert.strictEqual(result.hasPrev, false);
  assert.strictEqual(result.hasNext, false);
});

// ── REQUIREMENT 4: 10 PUBLISHED ARTICLES (OVERFLOW TO 2 PAGES) ──
test('Scenario 4: 10 published articles produce 2 pages (Page 1: 9 articles, Page 2: 1 article)', () => {
  const mockArticles = Array.from({ length: 10 }, (_, i) => ({ id: `art-${i}`, status: 'published' }));
  const page1 = calculatePagination(mockArticles, 1, 9);
  assert.strictEqual(page1.totalPages, 2);
  assert.deepStrictEqual(page1.pages, [1, 2]);
  assert.strictEqual(page1.currentArticles.length, 9);
  assert.strictEqual(page1.hasPrev, false);
  assert.strictEqual(page1.hasNext, true);

  const page2 = calculatePagination(mockArticles, 2, 9);
  assert.strictEqual(page2.currentArticles.length, 1);
  assert.strictEqual(page2.hasPrev, true);
  assert.strictEqual(page2.hasNext, false);
});

// ── REQUIREMENT 5: 18 PUBLISHED ARTICLES (EXACTLY 2 FULL PAGES) ──
test('Scenario 5: 18 published articles produce exactly 2 full pages (9 articles each)', () => {
  const mockArticles = Array.from({ length: 18 }, (_, i) => ({ id: `art-${i}`, status: 'published' }));
  const page1 = calculatePagination(mockArticles, 1, 9);
  assert.strictEqual(page1.totalPages, 2);
  assert.deepStrictEqual(page1.pages, [1, 2]);
  assert.strictEqual(page1.currentArticles.length, 9);
  assert.strictEqual(page1.hasPrev, false);
  assert.strictEqual(page1.hasNext, true);

  const page2 = calculatePagination(mockArticles, 2, 9);
  assert.strictEqual(page2.currentArticles.length, 9);
  assert.strictEqual(page2.hasPrev, true);
  assert.strictEqual(page2.hasNext, false);
});

// ── REQUIREMENT 6: 50 PUBLISHED ARTICLES (6 PAGES: 5 FULL + 5 ON LAST) ──
test('Scenario 6: 50 published articles produce 6 pages (9 articles on pages 1-5, 5 on page 6)', () => {
  const mockArticles = Array.from({ length: 50 }, (_, i) => ({ id: `art-${i}`, status: 'published' }));
  const page1 = calculatePagination(mockArticles, 1, 9);
  assert.strictEqual(page1.totalPages, 6);
  assert.deepStrictEqual(page1.pages, [1, 2, 3, 4, 5, 6]);
  assert.strictEqual(page1.currentArticles.length, 9);
  assert.strictEqual(page1.hasPrev, false);
  assert.strictEqual(page1.hasNext, true);

  // Check page 2 (articles 10 to 18)
  const page2 = calculatePagination(mockArticles, 2, 9);
  assert.strictEqual(page2.currentArticles.length, 9);
  assert.strictEqual(page2.currentArticles[0].id, 'art-9'); // 10th item (0-indexed 9)
  assert.strictEqual(page2.currentArticles[8].id, 'art-17'); // 18th item

  // Check page 3 (articles 19 to 27)
  const page3 = calculatePagination(mockArticles, 3, 9);
  assert.strictEqual(page3.currentArticles.length, 9);
  assert.strictEqual(page3.currentArticles[0].id, 'art-18'); // 19th item
  assert.strictEqual(page3.currentArticles[8].id, 'art-26'); // 27th item

  // Check page 6 (articles 46 to 50: 5 articles)
  const page6 = calculatePagination(mockArticles, 6, 9);
  assert.strictEqual(page6.currentArticles.length, 5);
  assert.strictEqual(page6.currentArticles[0].id, 'art-45');
  assert.strictEqual(page6.currentArticles[4].id, 'art-49');
  assert.strictEqual(page6.hasPrev, true);
  assert.strictEqual(page6.hasNext, false);
});

// ── REQUIREMENT 7: NO DUPLICATES ACROSS PAGES ──
test('Scenario 7: No duplicate or omitted articles appear across pages', () => {
  const mockArticles = Array.from({ length: 25 }, (_, i) => ({ id: `art-${i}`, title: `Article ${i}`, status: 'published' }));
  const p1 = calculatePagination(mockArticles, 1, 9).currentArticles.map((a) => a.id);
  const p2 = calculatePagination(mockArticles, 2, 9).currentArticles.map((a) => a.id);
  const p3 = calculatePagination(mockArticles, 3, 9).currentArticles.map((a) => a.id);

  assert.strictEqual(p1.length, 9);
  assert.strictEqual(p2.length, 9);
  assert.strictEqual(p3.length, 7);

  const allIds = [...p1, ...p2, ...p3];
  const uniqueIds = new Set(allIds);
  assert.strictEqual(allIds.length, uniqueIds.size, 'All displayed articles across pages must be distinct');
  assert.strictEqual(allIds.length, 25);
});

// ── REQUIREMENT 8: DRAFT, UNPUBLISHED, AND DELETED EXCLUSION ──
test('Scenario 8: Draft, unpublished, and deleted articles are strictly excluded', () => {
  const mixedArticles = [
    { id: '1', status: 'published' },
    { id: '2', status: 'draft' },
    { id: '3', status: 'published' },
    { id: '4', status: 'unpublished' },
    { id: '5', status: 'published', is_deleted: true },
    { id: '6', status: 'trash' },
    { id: '7', status: 'published' },
  ];
  const res = calculatePagination(mixedArticles, 1, 9);
  assert.strictEqual(res.publishedCount, 3, 'Only items 1, 3, 7 should be included');
  assert.strictEqual(res.totalPages, 1);
  assert.deepStrictEqual(res.currentArticles.map((a) => a.id), ['1', '3', '7']);
});

// ── REQUIREMENT 9: GOOGLE-STYLE ELLIPSIS FOR > 7 PAGES ──
test('Scenario 9: Google-style ellipsis formatting handles 10 pages correctly', () => {
  // Page 1 of 10
  assert.deepStrictEqual(getPaginationRange(1, 10), [1, 2, 3, 4, 5, '...', 10]);
  // Page 3 of 10
  assert.deepStrictEqual(getPaginationRange(3, 10), [1, 2, 3, 4, 5, '...', 10]);
  // Page 5 of 10
  assert.deepStrictEqual(getPaginationRange(5, 10), [1, '...', 4, 5, 6, '...', 10]);
  // Page 8 of 10
  assert.deepStrictEqual(getPaginationRange(8, 10), [1, '...', 6, 7, 8, 9, 10]);
  // Page 10 of 10
  assert.deepStrictEqual(getPaginationRange(10, 10), [1, '...', 6, 7, 8, 9, 10]);
});

// ── REQUIREMENT 10: CLAMPING OUT-OF-BOUNDS PAGE NUMBERS ──
test('Scenario 10: Clamping out-of-bounds page numbers', () => {
  const articles = Array.from({ length: 15 }, (_, i) => ({ id: `art-${i}`, status: 'published' })); // 2 pages of 9
  // Request page 99
  const res = calculatePagination(articles, 99, 9);
  assert.strictEqual(res.currentPage, 2, 'Should clamp to max totalPages');
  // Request page -5
  const resNegative = calculatePagination(articles, -5, 9);
  assert.strictEqual(resNegative.currentPage, 1, 'Should clamp to min page 1');
});
