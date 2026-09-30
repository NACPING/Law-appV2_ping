const prisma = require('../config/db');

const categorySelect = { select: { id: true, name: true, color: true } };

// ไฟล์ PDF เสิร์ฟแบบ static ที่ /files/ebooks — สร้าง URL เต็มตาม host ที่แอปเรียกเข้ามา
function toEbookDto(req, ebook, favoriteIds) {
  return {
    id: ebook.id,
    title: ebook.title,
    description: ebook.description,
    issuer: ebook.issuer,
    source: ebook.source,
    sourceUrl: ebook.sourceUrl,
    versionNote: ebook.versionNote,
    publishedLabel: ebook.publishedLabel,
    pageCount: ebook.pageCount,
    fileSize: ebook.fileSize,
    fileUrl: `${req.protocol}://${req.get('host')}/files/ebooks/${ebook.slug}.pdf`,
    category: ebook.category,
    isFavorite: favoriteIds.has(ebook.id),
  };
}

async function favoriteIdsOf(userId) {
  const favs = await prisma.favorite.findMany({ where: { userId }, select: { ebookId: true } });
  return new Set(favs.map((f) => f.ebookId));
}

// GET /api/ebooks/categories — หน้า E-Book: หนังสือแยกตามหมวด
exports.categories = async (req, res) => {
  const [categories, favIds] = await Promise.all([
    prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: { ebooks: { orderBy: { title: 'asc' }, include: { category: categorySelect } } },
    }),
    favoriteIdsOf(req.user.userId),
  ]);
  res.json({
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      ebooks: c.ebooks.map((e) => toEbookDto(req, e, favIds)),
    })),
  });
};

// GET /api/ebooks?q=คำค้น&category=criminal — extend: Search e-book
exports.list = async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  const where = {};
  if (req.query.category) where.categoryId = String(req.query.category);
  if (q) where.OR = [{ title: { contains: q } }, { description: { contains: q } }];

  const [ebooks, favIds] = await Promise.all([
    prisma.ebook.findMany({ where, orderBy: { title: 'asc' }, include: { category: categorySelect } }),
    favoriteIdsOf(req.user.userId),
  ]);
  res.json({ ebooks: ebooks.map((e) => toEbookDto(req, e, favIds)) });
};

// GET /api/ebooks/favorites — หน้า Favorite
exports.favorites = async (req, res) => {
  const favs = await prisma.favorite.findMany({
    where: { userId: req.user.userId },
    orderBy: { createdAt: 'desc' },
    include: { ebook: { include: { category: categorySelect } } },
  });
  const favIds = new Set(favs.map((f) => f.ebookId));
  res.json({ ebooks: favs.map((f) => toEbookDto(req, f.ebook, favIds)) });
};

// GET /api/ebooks/:id — หน้า E-Book Details
exports.detail = async (req, res) => {
  const ebook = await prisma.ebook.findUnique({ where: { id: req.params.id }, include: { category: categorySelect } });
  if (!ebook) return res.status(404).json({ message: req.t('ebook.notFound') });
  res.json({ ebook: toEbookDto(req, ebook, await favoriteIdsOf(req.user.userId)) });
};

// PUT / DELETE /api/ebooks/:id/favorite — extend: Bookmark e-book (กดซ้ำได้ ผลเหมือนเดิม)
exports.addFavorite = async (req, res) => {
  const ebook = await prisma.ebook.findUnique({ where: { id: req.params.id }, select: { id: true } });
  if (!ebook) return res.status(404).json({ message: req.t('ebook.notFound') });
  await prisma.favorite.upsert({
    where: { userId_ebookId: { userId: req.user.userId, ebookId: ebook.id } },
    update: {},
    create: { userId: req.user.userId, ebookId: ebook.id },
  });
  res.json({ isFavorite: true });
};

exports.removeFavorite = async (req, res) => {
  await prisma.favorite.deleteMany({ where: { userId: req.user.userId, ebookId: req.params.id } });
  res.json({ isFavorite: false });
};
