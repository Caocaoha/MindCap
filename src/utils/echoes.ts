import { db } from '../db';

export const getEchoes = async (text: string) => {
  if (text.length < 3) return []; // Chỉ kích hoạt khi từ khóa đủ sâu

  const keywords = text.split(' ').filter(word => word.length > 2);
  
  // Tìm kiếm các bản ghi cũ có chứa từ khóa
  const results = await db.masterDoc
    .where('content')
    .startsWithAnyOfIgnoreCase(keywords)
    .limit(3) // Giới hạn 3 tiếng vọng để tránh gây nhiễu nhận thức [cite: 16, 26]
    .toArray();

  return results;
};