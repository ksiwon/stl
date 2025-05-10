export interface Subject {
  dept: number | null;
  type: string; // 예: 전공필수, 전공선택
  code: string; // 예: "EE.20001"
  old?: string | null; // 예: "EE201"
  title: string;
  group?: string; // 분반명, 예: "A"
  prof: string[]; // ["김교수", "이교수"]
  where: string | null; // 강의실
  time: TimeBlock[]; // 강의 시간 정보
  exam?: any[]; // 시험 정보 (필요시 정의)
  credit: number;
  kcode?: string | null;
  au?: number;
  cap?: number;
  reg?: number;
}

export interface TimeBlock {
  date: number; // 요일 (0: 월 ~ 6: 일)
  sh: number; // 시작 시간 (hour)
  sm: number; // 시작 분 (minute)
  eh: number; // 종료 시간
  em: number; // 종료 분
}
