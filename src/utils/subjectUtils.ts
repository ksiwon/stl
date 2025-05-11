// src/utils/subjectUtils.ts
import { Subject, Schedule, departmentColors, defaultColor } from '../types/subject';
import subjectData from '../data/subjectData.json';

// 시간 형식 변환 (HH:MM -> 분)
export const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr || timeStr.trim() === '') return 0;
  
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// 강의 시간 파싱 (예: "월 10:30~12:00" -> { day: 0, startTime: 630, endTime: 720 })
export const parseSchedule = (scheduleStr: string): Schedule[] => {
  if (!scheduleStr || scheduleStr.trim() === '') {
    return [];
  }

  const schedules: Schedule[] = [];
  const scheduleLines = scheduleStr.split("\n");

  for (const line of scheduleLines) {
    // 요일 추출
    const dayMatch = line.match(/[월화수목금토일]/);
    if (!dayMatch) continue;

    const dayChar = dayMatch[0];
    const dayMap: Record<string, number> = {
      '월': 0, '화': 1, '수': 2, '목': 3, '금': 4, '토': 5, '일': 6
    };
    const day = dayMap[dayChar];

    // 시간 추출
    const timeMatch = line.match(/(\d{1,2}):(\d{2})~(\d{1,2}):(\d{2})/);
    if (!timeMatch) continue;

    const startHour = parseInt(timeMatch[1]);
    const startMinute = parseInt(timeMatch[2]);
    const endHour = parseInt(timeMatch[3]);
    const endMinute = parseInt(timeMatch[4]);

    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    schedules.push({ day, startTime, endTime });
  }

  return schedules;
};

// 강 : 실 : 학 파싱 (예: "3.0 : 0.0 : 3.0" -> 3)
export const parseCredits = (creditsStr: string): number => {
  if (!creditsStr || creditsStr.trim() === '') return 0;
  
  const match = creditsStr.match(/(\d+\.\d+)\s*:\s*(\d+\.\d+)\s*:\s*(\d+\.\d+)/);
  if (!match) return 0;
  
  // 세 번째 숫자가 학점
  return parseFloat(match[3]);
};

// 교과목 데이터 변환 (수정된 부분)
export const processSubjectData = (): Subject[] => {
  // subjectData가 배열인지 확인
  if (!Array.isArray(subjectData)) {
    console.error('subjectData is not an array:', subjectData);
    return [];
  }
  
  return subjectData.map((item: any, index: number) => {
    const id = `${item.교과목코드}-${item.분반}-${index}`;
    const schedules = parseSchedule(item.강의시간);
    const credits = parseCredits(item['강 : 실 : 학']);
    
    // Subject 인터페이스에 맞게 변환
    const subject: Subject & { _originalData?: any } = {
      id,
      code: item.교과목코드,
      name: item.교과목명,
      department: item.개설학과,
      professor: item.담당교수,
      credits,
      lectureType: item.강의유형,
      category: item.과목구분,
      section: item.분반,
      schedules,
      classroom: item.강의실 || '',
      maxStudents: item.정원 ? Number(item.정원) : 0,
      currentStudents: item.수강인원 ? Number(item.수강인원) : 0,
      isEnglish: item.영어 === 'Y',
      note: item.비고 || '',
      
      // 원본 데이터도 함께 저장 (학기 필터링용)
      _originalData: item
    };
    
    return subject;
  });
};

// 과목 색상 가져오기
export const getSubjectColor = (subject: Subject): string => {
  return departmentColors[subject.department] || defaultColor;
};

// 시간 형식 변환 (분 -> HH:MM)
export const formatMinutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// 요일 변환 (숫자 -> 한글)
export const getDayString = (day: number): string => {
  const days = ['월', '화', '수', '목', '금', '토', '일'];
  return days[day] || '';
};

// 시간표 문자열 생성 (예: "월 10:30~12:00, 수 10:30~12:00")
export const formatScheduleString = (schedules: Schedule[]): string => {
  return schedules.map(schedule => {
    const day = getDayString(schedule.day);
    const start = formatMinutesToTime(schedule.startTime);
    const end = formatMinutesToTime(schedule.endTime);
    return `${day} ${start}~${end}`;
  }).join(', ');
};

// 과목 검색 기능
export const searchSubjects = (
  subjects: Subject[],
  query: string,
  filters: {
    department?: string;
    category?: string;
    isEnglish?: boolean;
  } = {}
): Subject[] => {
  return subjects.filter(subject => {
    // 검색어 필터링
    const searchMatch = query === '' || 
      subject.code.toLowerCase().includes(query.toLowerCase()) ||
      subject.name.toLowerCase().includes(query.toLowerCase()) ||
      subject.professor.toLowerCase().includes(query.toLowerCase());
    
    // 학과 필터링
    const departmentMatch = !filters.department || 
      filters.department === 'All' || 
      subject.department === filters.department;
    
    // 과목구분 필터링
    const categoryMatch = !filters.category || 
      filters.category === 'All' || 
      subject.category === filters.category;
    
    // 영어 강의 필터링
    const englishMatch = filters.isEnglish === undefined || 
      subject.isEnglish === filters.isEnglish;
    
    return searchMatch && departmentMatch && categoryMatch && englishMatch;
  });
};

// 시간 충돌 체크
export const hasTimeConflict = (schedule1: Schedule, schedule2: Schedule): boolean => {
  // 요일이 다르면 충돌 없음
  if (schedule1.day !== schedule2.day) {
    return false;
  }
  
  // 시간 범위가 겹치는지 확인
  return !(
    schedule1.endTime <= schedule2.startTime || 
    schedule1.startTime >= schedule2.endTime
  );
};

// 과목 간 시간 충돌 체크
export const hasSubjectConflict = (subject1: Subject, subject2: Subject): boolean => {
  for (const schedule1 of subject1.schedules) {
    for (const schedule2 of subject2.schedules) {
      if (hasTimeConflict(schedule1, schedule2)) {
        return true;
      }
    }
  }
  return false;
};

// 현재 선택된 과목들과 충돌하는지 체크
export const checkConflictsWithSelectedSubjects = (
  subject: Subject,
  selectedSubjects: Subject[]
): { hasConflict: boolean, conflictingSubjects: Subject[] } => {
  const conflictingSubjects = selectedSubjects.filter(
    selectedSubject => hasSubjectConflict(subject, selectedSubject)
  );
  
  return {
    hasConflict: conflictingSubjects.length > 0,
    conflictingSubjects
  };
};

// 총 학점 계산
export const calculateTotalCredits = (subjects: Subject[]): number => {
  return subjects.reduce((total, subject) => total + subject.credits, 0);
};

// 필터링 옵션 목록 생성 (Set 관련 오류 수정)
export const getFilterOptions = (subjects: Subject[]) => {
  // Set 대신 일반 배열 및 필터링 사용
  const uniqueDepartments = ['All'];
  const uniqueCategories = ['All'];
  
  subjects.forEach(subject => {
    if (!uniqueDepartments.includes(subject.department)) {
      uniqueDepartments.push(subject.department);
    }
    
    if (!uniqueCategories.includes(subject.category)) {
      uniqueCategories.push(subject.category);
    }
  });
  
  return {
    departments: uniqueDepartments,
    categories: uniqueCategories
  };
};

// 시간표에서 위치 계산하기 위한 함수
export const getSchedulePosition = (schedule: Schedule) => {
  const startTime = schedule.startTime;
  const endTime = schedule.endTime;
  
  // 9시부터 시작하는 상대적 시간 계산
  const startFromNine = startTime - (9 * 60);
  const duration = endTime - startTime;
  
  // 30분 단위로 행 계산
  const startRow = Math.floor(startFromNine / 30) + 2; // +2는 헤더 행 고려
  const spanRows = Math.ceil(duration / 30);
  
  // 결과 반환
  return {
    gridColumn: `${schedule.day + 2}`, // 첫 번째 열은 시간
    gridRow: `${startRow} / span ${spanRows}`,
  };
};

// 학기명 변환 (영어 -> 한글)
const semesterMap: Record<string, string> = {
  'Spring 2025': '봄학기',
  'Summer 2025': '여름학기',
  'Fall 2025': '가을학기',
  'Winter 2025': '겨울학기'
};

// 학기에 따른 과목 필터링 함수
export const filterSubjectsBySemester = (subjects: Subject[], semester: string): Subject[] => {
  // 원본 JSON 데이터의 '개설학기' 필드를 저장해두었다고 가정
  return subjects.filter(subject => {
    // subject에 원본 JSON 데이터 필드가 있는지 확인
    const originalData = (subject as any)._originalData;
    if (originalData && originalData.개설학기) {
      const koreanSemester = semesterMap[semester] || '봄학기';
      return originalData.개설학기 === koreanSemester;
    }
    
    return true; // 원본 데이터가 없으면 모든 과목 포함
  });
};