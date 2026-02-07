// T: Chu kỳ phân rã (mặc định 24 giờ cho Task)
const DECAY_PERIOD_MS = 24 * 60 * 60 * 1000; 

export const calculateEntropy = (timestamp: number): number => {
  const now = Date.now();
  const deltaTime = now - timestamp;
  
  // Tính toán E, giới hạn trong khoảng [0, 1]
  const entropy = 1 - (deltaTime / DECAY_PERIOD_MS);
  return Math.max(0, entropy);
};

export const getEntropyStyle = (entropy: number) => {
  // Khi entropy giảm, grayscale tăng và opacity giảm
  return {
    filter: `grayscale(${100 - entropy * 100}%)`,
    opacity: 0.3 + (entropy * 0.7), // Không để biến mất hoàn toàn, tối thiểu 30%
    transition: 'filter 0.5s ease, opacity 0.5s ease'
  };
};