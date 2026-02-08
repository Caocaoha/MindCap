import { db, type Entry } from '../db';
import { extractKeywords, findCommonKeywords } from './localNLP';

// CẤU HÌNH [cite: 90]
const SEMANTIC_WINDOW_DAYS = 90; // Quét trong 90 ngày [cite: 91]
const TEMPORAL_WINDOW_MS = 5 * 60 * 1000; // 5 phút [cite: 93]

export const echoEngine = {
  // Hàm chính: Gọi mỗi khi user Save entry mới
  processEntry: async (newEntry: Entry) => {
    if (!newEntry.id || !newEntry.content) return;

    const entryKeywords = extractKeywords(newEntry.content);
    const now = new Date().getTime();
    const rangeStart = now - (SEMANTIC_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    // Lấy các entry tiềm năng (trong 90 ngày) để so sánh
    const candidates = await db.entries
      .where('createdAt')
      .above(new Date(rangeStart))
      .toArray();

    const linksToCreate: any[] = [];

    for (const oldEntry of candidates) {
      if (oldEntry.id === newEntry.id) continue; // Bỏ qua chính nó

      // --- CHECK LEVEL 2: TEMPORAL ECHO (Thời gian) [cite: 93] ---
      const timeDiff = Math.abs(newEntry.createdAt.getTime() - oldEntry.createdAt.getTime());
      if (timeDiff <= TEMPORAL_WINDOW_MS) {
        linksToCreate.push({
          sourceId: newEntry.id,
          targetId: oldEntry.id,
          type: 'temporal',
          strength: 1, // Trọng số thấp [cite: 85]
          createdAt: new Date()
        });
        continue; // Nếu đã khớp thời gian thì thôi check ngữ nghĩa (hoặc check cả 2 tùy logic)
      }

      // --- CHECK LEVEL 1: SEMANTIC ECHO (Ngữ nghĩa) [cite: 90] ---
      const oldKeywords = extractKeywords(oldEntry.content);
      const common = findCommonKeywords(entryKeywords, oldKeywords);

      // Điều kiện: Trùng ít nhất 2 từ khóa [cite: 92]
      if (common.length >= 2) {
        linksToCreate.push({
          sourceId: newEntry.id,
          targetId: oldEntry.id,
          type: 'semantic',
          strength: 2, // Trọng số trung bình (Echo Link) [cite: 86]
          keywords: common,
          createdAt: new Date()
        });
      }
    }

    // Lưu vào DB
    if (linksToCreate.length > 0) {
      await db.echo_links.bulkAdd(linksToCreate);
      console.log(`[EchoEngine] Created ${linksToCreate.length} links for Entry #${newEntry.id}`);
    }
  }
};