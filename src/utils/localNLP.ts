const VIETNAMESE_STOP_WORDS = new Set([
    'là', 'và', 'của', 'thì', 'mà', 'như', 'để', 'với', 'cho', 'về', 'ở', 'tại', 'trong', 
    'các', 'những', 'cái', 'con', 'người', 'được', 'bị', 'khi', 'lúc', 'này', 'đó', 
    'kia', 'nào', 'ai', 'gì', 'sao', 'không', 'có', 'một', 'hai', 'ba', 'tôi', 'bạn'
  ]);
  
  export const extractKeywords = (text: string): string[] => {
    if (!text) return [];
    const normalized = text.toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
      .replace(/\s{2,}/g, " ");
    const words = normalized.split(' ');
    const keywords = words.filter(w => w.length > 1 && !VIETNAMESE_STOP_WORDS.has(w));
    return Array.from(new Set(keywords));
  };
  
  export const findCommonKeywords = (arr1: string[], arr2: string[]) => {
    return arr1.filter(value => arr2.includes(value));
  };