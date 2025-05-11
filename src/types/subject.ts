// src/types/subject.ts
export interface Subject {
  id: string;           // 고유 ID (교과목코드 + 분반 등 조합)
  code: string;         // 교과목코드 (예: CH.10001)
  name: string;         // 교과목명 (예: 일반화학 I)
  department: string;   // 개설학과 (예: 화학과) 
  professor: string;    // 담당교수 (예: 김현우)
  credits: number;      // 학점 (예: 3.0)
  lectureType: string;  // 강의유형 (예: 대면)
  category: string;     // 과목구분 (예: 기초필수)
  section: string;      // 분반 (예: A)
  schedules: Schedule[]; // 강의 시간 목록
  classroom: string;    // 강의실 (예: (E11) 창의학습관 201호)
  maxStudents: number;  // 정원
  currentStudents: number; // 수강인원
  isEnglish: boolean;   // 영어 강의 여부
  note: string;         // 비고
}

export interface Schedule {
  day: number;          // 요일 (0: 월, 1: 화, 2: 수, 3: 목, 4: 금)
  startTime: number;    // 시작 시간 (분 단위, 예: 10:30 -> 10*60+30 = 630)
  endTime: number;      // 종료 시간 (분 단위)
}

// 색상 매핑 (과목별 색상 지정을 위한 유틸)
export const departmentColors: Record<string, string> = {
  'Capstone Design': '#E5E2FD',
  'K-School': '#FFEBEE',
  'KT-AI융합인재양성프로그램': '#E8F5E9',
  'URP': '#E3F2FD',
  '건설및환경공학과': '#FFF3E0',
  '경영공학부': '#F3E5F5',
  '공과대학': '#E0F2F1',
  '공통필수': '#FFFDE7',
  '공학생물학대학원': '#ECEFF1',
  '과학기술정책대학원': '#FBE9E7',
  '과학기술정책학 부전공 프로그램': '#E1F5FE',
  '과학저널리즘대학원프로그램': '#FFEBEE',
  '글로벌디지털혁신대학원': '#E8F5E9',
  '금융MBA': '#E3F2FD',
  '금융공학프로그램': '#FFF3E0',
  '기계공학과': '#E2FDFD',
  '기술경영전문대학원': '#F3E5F5',
  '기술경영학부': '#E0F2F1',
  '김재철AI대학원': '#FFFDE7',
  '녹색성장지속가능대학원': '#ECEFF1',
  '뇌인지공학프로그램': '#FBE9E7',
  '뇌인지과학과': '#E1F5FE',
  '데이터사이언스대학원': '#FFEBEE',
  '디지털금융MBA': '#E8F5E9',
  '디지털인문사회과학부': '#E3F2FD',
  '디지털인문사회과학부전공프로그램': '#FFF3E0',
  '로봇공학학제전공': '#F3E5F5',
  '메타버스대학원': '#E0F2F1',
  '문술미래전략대학원': '#FFFDE7',
  '문화기술대학원': '#ECEFF1',
  '문화기술학 부전공 프로그램': '#FBE9E7',
  '물리학과': '#FDE2E2',
  '미래자동차 학제전공': '#E1F5FE',
  '미래전략대학원프로그램': '#FFEBEE',
  '미래전략부전공프로그램': '#E8F5E9',
  '바이오및뇌공학과': '#E3F2FD',
  '바이오혁신경영전문대학원': '#FFF3E0',
  '반도체 학제전공': '#F3E5F5',
  '반도체공학대학원': '#E0F2F1',
  '반도체시스템공학과': '#FFFDE7',
  '산업디자인학과': '#ECEFF1',
  '산업및시스템공학과': '#FDE2FD',
  '생명과학과': '#E2FDE2',
  '생명화학공학과': '#FBE9E7',
  '소프트웨어대학원프로그램': '#E1F5FE',
  '수리과학과': '#E2F2FD',
  '신소재공학과': '#FFEBEE',
  '안보과학기술대학원': '#E8F5E9',
  '양자대학원': '#E3F2FD',
  '우주탐사공학학제전공': '#FFF3E0',
  '원자력및양자공학과': '#F3E5F5',
  '융합인재학부': '#E0F2F1',
  '의과학대학원': '#FFFDE7',
  '이그제큐티브MBA': '#ECEFF1',
  '인공지능반도체대학원': '#FBE9E7',
  '임팩트MBA': '#E1F5FE',
  '전기및전자공학부': '#F2FDE2',
  '전산학부': '#FDF2E2',
  '정보경영프로그램': '#FFEBEE',
  '정보보호대학원': '#E8F5E9',
  '정보통신공학과': '#E3F2FD',
  '정보통신공학학제전공': '#FFF3E0',
  '조천식모빌리티대학원': '#F3E5F5',
  '줄기세포및재생생물학대학원': '#E0F2F1',
  '지식재산 부전공 프로그램': '#FFFDE7',
  '지식재산대학원프로그램': '#ECEFF1',
  '카이스트MBA': '#FBE9E7',
  '프로페셔널MBA': '#E1F5FE',
  '항공우주공학과': '#E2FDEC',
  '화학과': '#F2E3FF'
};


// 기본 색상 (학과별 색상이 없을 때 사용)
export const defaultColor = '#E5E2FD';