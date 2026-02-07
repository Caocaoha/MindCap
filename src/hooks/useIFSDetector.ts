import { useState, useRef } from 'react';

// Từ khóa theo tài liệu
const KEYWORDS = {
  MANAGER: /vì|nên|tuy nhiên|phải|cần|gấp|mục tiêu/gi,
  FIREFIGHTER: /kệ|thôi|mệt|chết tiệt/gi,
  EXILE: /vô dụng|tổn thương|tại sao tôi|nhỏ bé/gi,
};

export const useIFSDetector = () => {
  const [detectedPart, setDetectedPart] = useState<
    'Self' | 'Manager' | 'Firefighter' | 'Exile'
  >('Self');
  const lastKeyTime = useRef<number>(Date.now());
  const pauseCount = useRef(0);

  const analyzeBehavior = (text: string, isDeleted: boolean) => {
    const now = Date.now();
    const diff = now - lastKeyTime.current;

    // Cảm biến Exile: Quãng nghỉ dài (> 3 giây)
    if (diff > 3000 && text.length > 0) {
      pauseCount.current++;
      if (pauseCount.current > 2) setDetectedPart('Exile');
    }

    // Cảm biến Firefighter: Hành vi xóa trắng
    if (isDeleted && text.length === 0) {
      setDetectedPart('Firefighter');
      return;
    }

    // Phân loại thô qua từ khóa
    if (KEYWORDS.MANAGER.test(text)) setDetectedPart('Manager');
    else if (KEYWORDS.FIREFIGHTER.test(text)) setDetectedPart('Firefighter');
    else if (KEYWORDS.EXILE.test(text)) setDetectedPart('Exile');
    else setDetectedPart('Self');

    lastKeyTime.current = now;
  };

  return { detectedPart, analyzeBehavior, pauseCount: pauseCount.current };
};
