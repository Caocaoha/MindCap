export interface IdentityQuestion {
    id: number;
    stage: number;
    stageName: string;
    question: string;
    helper?: string; // Gợi ý thêm
    theme: 'dark' | 'light';
    minLength: number; // Độ dài tối thiểu để qua câu
  }
  
  export const IDENTITY_QUESTIONS: IdentityQuestion[] = [
    // --- CHẶNG 1: SOI CHIẾU BÓNG TỐI (AXIT) ---
    {
      id: 1, stage: 1, stageName: "Soi chiếu Bóng tối", theme: 'dark', minLength: 10,
      question: "Nỗi bất mãn âm ỉ và dai dẳng mà bạn đang phải sống chung hàng ngày là gì?",
      helper: "Đừng né tránh. Hãy gọi tên nó."
    },
    {
      id: 2, stage: 1, stageName: "Soi chiếu Bóng tối", theme: 'dark', minLength: 20,
      question: "Viết ra 3 điều về bản thân bạn thường xuyên phàn nàn nhưng vẫn chưa thay đổi được?"
    },
    {
      id: 4, stage: 1, stageName: "Sự thật trần trụi", theme: 'dark', minLength: 20,
      question: "Đâu là sự thật về cuộc sống của bạn mà bạn không bao giờ dám thổ lộ với người mình vô cùng kính trọng?"
    },
  
    // --- CHẶNG 2: MỎ NEO CỐT LÕI (KIỀM) ---
    {
      id: 6, stage: 2, stageName: "Mỏ neo Cốt lõi", theme: 'dark', minLength: 10,
      question: "Điều gì ở bản thân mà bạn nhất quyết không để nó bị tha hóa?"
    },
  
    // --- CHẶNG 3: VIỄN CẢNH KHỐC LIỆT (AXIT ĐẬM ĐẶC) ---
    {
      id: 7, stage: 3, stageName: "Viễn cảnh Khốc liệt", theme: 'dark', minLength: 30,
      question: "Nếu hành vi không đổi trong 5 năm tới, hãy mô tả một ngày thứ Ba bình thường: Bạn thức dậy ở đâu? Cơ thể cảm thấy thế nào?"
    },
    {
      id: 10, stage: 3, stageName: "Cái giá phải trả", theme: 'dark', minLength: 20,
      question: "Mọi người nói gì về bạn khi bạn không có mặt ở đó (trong viễn cảnh tồi tệ này)?"
    },
  
    // --- ĐIỂM DỪNG CHIẾN LƯỢC (PAUSE) ---
    // (Sẽ được xử lý trong logic UI)
  
    // --- CHẶNG 4: KHOẢNG LẶNG ---
    {
      id: 18, stage: 4, stageName: "Sự trung thành mù quáng", theme: 'dark', minLength: 20,
      question: "Bạn đang 'trung thành' với một lời hứa hay một kỳ vọng lỗi thời nào trong quá khứ?"
    },
  
    // --- CHẶNG 5: KIẾN TẠO TẦM NHÌN (ÁNH SÁNG) ---
    {
      id: 24, stage: 5, stageName: "Kiến tạo Tầm nhìn", theme: 'light', minLength: 30,
      question: "Giả sử bạn búng tay và sống một cuộc đời mơ ước sau 3 năm. Một ngày thứ Ba bình thường trông như thế nào?"
    },
    {
      id: 27, stage: 5, stageName: "Tuyên ngôn Căn tính", theme: 'light', minLength: 10,
      question: "Hãy viết bản tuyên ngôn: 'Tôi là kiểu người...'",
      helper: "Đây là Căn tính mới của bạn."
    },
  
    // --- CHẶNG 6: CHIẾN LƯỢC ---
    {
      id: 31, stage: 6, stageName: "Chiến lược", theme: 'light', minLength: 10,
      question: "Viết một câu tóm gọn về cuộc sống bạn hướng tới (Tầm nhìn)."
    },
    {
      id: 38, stage: 6, stageName: "Luật chơi", theme: 'light', minLength: 10,
      question: "Tuyên ngôn Giới hạn: Bạn tuyên bố không bao giờ hy sinh giá trị cốt lõi nào?"
    }
  ];