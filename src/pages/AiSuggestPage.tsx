// src/pages/AiSuggestPage.tsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiCpu, FiCheckCircle, FiAlertCircle, FiBook, FiClock, FiUser, FiPlus } from 'react-icons/fi';
import Layout from '../components/Layout';
import { MenuItemType } from '../components/Sidebar';
import { Subject } from '../types/subject';
import { useSemester } from '../contexts/SemesterContext';
import { 
  processSubjectData, 
  formatScheduleString, 
  getSubjectColor,
  hasSubjectConflict,
  calculateTotalCredits,
  filterSubjectsBySemester
} from '../utils/subjectUtils';

// AI 추천을 위한 학생 선호도 인터페이스
interface StudentPreference {
  major: string;
  year: string;
  preferredDays: number[];
  preferNoMorning: boolean;
  totalCredits: number;
  preferEnglish: boolean;
  interests: string[];
}

const AiSuggestPage: React.FC = () => {
  const [activeMenuItem, setActiveMenuItem] = useState<MenuItemType>('aiSuggest');
  const [isGenerating, setIsGenerating] = useState(false);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [filteredSubjectsBySemester, setFilteredSubjectsBySemester] = useState<Subject[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const [preferences, setPreferences] = useState<StudentPreference>({
    major: '화학과',
    year: '2',
    preferredDays: [0, 2, 4], // 월, 수, 금
    preferNoMorning: true,
    totalCredits: 18,
    preferEnglish: false,
    interests: []
  });
  
  // 학기 Context 사용
  const { currentSemester } = useSemester();
  
  // 모든 과목 데이터 로드
  useEffect(() => {
    const subjects = processSubjectData();
    setAllSubjects(subjects);
  }, []);

  // 학기 변경 시 과목 필터링
  useEffect(() => {
    if (allSubjects.length > 0) {
      const semesterSubjects = filterSubjectsBySemester(allSubjects, currentSemester);
      setFilteredSubjectsBySemester(semesterSubjects);
      // AI 추천 결과 초기화 (선택 사항)
      setAiSuggestions([]);
      console.log(`${currentSemester} 과목 데이터 로드됨: ${semesterSubjects.length}개`);
    }
  }, [currentSemester, allSubjects]);
  
  // 선호하는 전공 목록 (사용 가능한 학과 목록) - 현재 학기 과목에서만 추출
  const availableMajors = Array.from(
    new Set(filteredSubjectsBySemester.map(subject => subject.department))
  ).sort();
  
  // 관심 분야 목록
  const interestCategories = [
    '인공지능', '물리학', '화학', '기계공학', '전자공학', '생명과학', '경영학', 
    '인문학', '사회과학', '소프트웨어', '데이터 분석', '디자인'
  ];

  // 메뉴 아이템 클릭 핸들러
  const handleMenuItemClick = (item: MenuItemType) => {
    setActiveMenuItem(item);
  };
  
  // 입력 필드 변경 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'totalCredits') {
      setPreferences({
        ...preferences,
        [name]: parseInt(value)
      });
    } else {
      setPreferences({
        ...preferences,
        [name]: value
      });
    }
  };
  
  // 체크박스 변경 처리
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setPreferences({
      ...preferences,
      [name]: checked
    });
  };
  
  // 선호 요일 선택 처리
  const handleDaySelect = (day: number) => {
    if (preferences.preferredDays.includes(day)) {
      setPreferences({
        ...preferences,
        preferredDays: preferences.preferredDays.filter(d => d !== day)
      });
    } else {
      setPreferences({
        ...preferences,
        preferredDays: [...preferences.preferredDays, day]
      });
    }
  };
  
  // 관심 분야 선택 처리
  const handleInterestToggle = (interest: string) => {
    if (preferences.interests.includes(interest)) {
      setPreferences({
        ...preferences,
        interests: preferences.interests.filter(i => i !== interest)
      });
    } else {
      setPreferences({
        ...preferences,
        interests: [...preferences.interests, interest]
      });
    }
  };

  // AI 추천 생성 처리
  const handleGenerateSuggestions = () => {
    setIsGenerating(true);
    
    // 실제 구현에서는 AI 서비스 API 호출 필요
    // 여기서는 간단한 추천 알고리즘 시뮬레이션
    setTimeout(() => {
      const recommendedSubjects = generateRecommendations();
      setAiSuggestions(recommendedSubjects);
      setIsGenerating(false);
    }, 2000);
  };
  
  // 간단한 추천 알고리즘 (실제로는 더 복잡한 AI 로직 필요)
  const generateRecommendations = (): Subject[] => {
    // 현재 학기 과목 중에서만 추천
    let filteredSubjects = filteredSubjectsBySemester.filter(subject => {
      // 전공 과목 우선 (해당 전공이거나 기초필수 과목)
      const majorMatch = subject.department === preferences.major || subject.category === '기초필수';
      // 영어 강의 선호도
      const englishMatch = preferences.preferEnglish ? subject.isEnglish : true;
      
      return majorMatch && englishMatch;
    });
    
    // 시간 선호도 필터링
    filteredSubjects = filteredSubjects.filter(subject => {
      // 아침 수업 회피 옵션
      if (preferences.preferNoMorning) {
        const hasMorningClass = subject.schedules.some(schedule => schedule.startTime < 10 * 60);
        if (hasMorningClass) return false;
      }
      
      // 선호 요일 옵션
      if (preferences.preferredDays.length > 0) {
        const hasPreferredDay = subject.schedules.some(schedule => 
          preferences.preferredDays.includes(schedule.day)
        );
        if (!hasPreferredDay) return false;
      }
      
      return true;
    });
    
    // 이미 선택한 과목과 충돌 없는 과목만 필터링
    filteredSubjects = filteredSubjects.filter(subject => 
      !selectedSubjects.some(selected => hasSubjectConflict(subject, selected))
    );
    
    // 학점 제한 고려한 최적 조합 (간단한 구현)
    const remainingCredits = preferences.totalCredits - calculateTotalCredits(selectedSubjects);
    const recommendations: Subject[] = [];
    
    // 간단한 그리디 알고리즘으로 학점을 채우는 시도
    let currentCredits = 0;
    
    // 무작위로 과목 섞기 (다양성 확보)
    const shuffled = [...filteredSubjects].sort(() => Math.random() - 0.5);
    
    for (const subject of shuffled) {
      if (currentCredits + subject.credits <= remainingCredits && recommendations.length < 5) {
        recommendations.push(subject);
        currentCredits += subject.credits;
      }
      
      if (recommendations.length >= 5) break;
    }
    
    return recommendations;
  };

  // 과목 추가 핸들러
  const addSubject = (subject: Subject) => {
    // 이미 선택된 과목 확인
    if (selectedSubjects.some(s => s.id === subject.id)) {
      alert('이미 시간표에 추가된 과목입니다.');
      return;
    }
    
    // 충돌 체크
    const hasConflict = selectedSubjects.some(selected => 
      hasSubjectConflict(subject, selected)
    );
    
    if (hasConflict) {
      alert('다른 과목과 시간이 겹칩니다.');
      return;
    }
    
    // 과목 추가 (실제 구현에서는 MainPage로 전달 필요)
    setSelectedSubjects([...selectedSubjects, subject]);
    alert(`'${subject.name}' 과목이 시간표에 추가되었습니다.`);
  };

  return (
    <Layout activeMenuItem={activeMenuItem} onMenuItemClick={handleMenuItemClick}>
      <PageContainer>
        <PageHeader>
          <h2>AI 시간표 추천</h2>
          <p>{currentSemester}에 대해 선호도와 제약사항을 입력하면 AI가 최적의 시간표를 추천해 드립니다.</p>
        </PageHeader>
        
        <PreferencesSection>
          <SectionTitle>학생 정보 및 선호도</SectionTitle>
          
          <PreferenceGrid>
            <PreferenceGroup>
              <PreferenceLabel>전공</PreferenceLabel>
              <Select 
                name="major" 
                value={preferences.major}
                onChange={handleInputChange}
              >
                {availableMajors.map(major => (
                  <option key={major} value={major}>{major}</option>
                ))}
              </Select>
            </PreferenceGroup>
            
            <PreferenceGroup>
              <PreferenceLabel>학년</PreferenceLabel>
              <Select 
                name="year" 
                value={preferences.year}
                onChange={handleInputChange}
              >
                <option value="1">1학년</option>
                <option value="2">2학년</option>
                <option value="3">3학년</option>
                <option value="4">4학년</option>
              </Select>
            </PreferenceGroup>
            
            <PreferenceGroup>
              <PreferenceLabel>목표 학점</PreferenceLabel>
              <Input 
                type="number" 
                name="totalCredits" 
                value={preferences.totalCredits}
                onChange={handleInputChange}
                min="1"
                max="24"
              />
            </PreferenceGroup>
          </PreferenceGrid>
          
          <PreferenceGroup>
            <PreferenceLabel>선호하는 요일</PreferenceLabel>
            <DaysSelector>
              {['월', '화', '수', '목', '금'].map((day, index) => (
                <DayButton 
                  key={day} 
                  selected={preferences.preferredDays.includes(index)}
                  onClick={() => handleDaySelect(index)}
                >
                  {day}요일
                </DayButton>
              ))}
            </DaysSelector>
            <PreferenceHint>수업을 듣고 싶은 요일을 선택하세요.</PreferenceHint>
          </PreferenceGroup>
          
          <PreferenceGroup>
            <PreferenceLabel>관심 분야</PreferenceLabel>
            <InterestTags>
              {interestCategories.map(interest => (
                <InterestTag 
                  key={interest}
                  selected={preferences.interests.includes(interest)}
                  onClick={() => handleInterestToggle(interest)}
                >
                  {interest}
                </InterestTag>
              ))}
            </InterestTags>
          </PreferenceGroup>
          
          <PreferenceOptions>
            <CheckboxLabel>
              <Checkbox 
                type="checkbox" 
                name="preferNoMorning" 
                checked={preferences.preferNoMorning}
                onChange={handleCheckboxChange}
              />
              <span>아침 수업 피하기 (오전 10시 이전)</span>
            </CheckboxLabel>
            
            <CheckboxLabel>
              <Checkbox 
                type="checkbox" 
                name="preferEnglish" 
                checked={preferences.preferEnglish}
                onChange={handleCheckboxChange}
              />
              <span>영어 강의 선호</span>
            </CheckboxLabel>
          </PreferenceOptions>
        </PreferencesSection>
        
        <GenerateButtonContainer>
          <GenerateButton 
            onClick={handleGenerateSuggestions} 
            disabled={isGenerating || filteredSubjectsBySemester.length === 0}
          >
            {isGenerating ? (
              <>
                <SpinnerIcon />
                추천 과목 생성 중...
              </>
            ) : filteredSubjectsBySemester.length === 0 ? (
              <>
                <FiAlertCircle size={18} />
                {currentSemester}에 개설된 과목이 없습니다
              </>
            ) : (
              <>
                <FiCpu size={18} />
                AI 시간표 추천 받기
              </>
            )}
          </GenerateButton>
        </GenerateButtonContainer>
        
        {aiSuggestions.length > 0 && (
          <SuggestionsSection>
            <SectionTitle>
              <FiCheckCircle size={20} color="#107F4F" />
              AI 추천 과목
            </SectionTitle>
            
            <SuggestionDescription>
              총 {aiSuggestions.length}개 과목, {aiSuggestions.reduce((total, subj) => total + subj.credits, 0)} 학점을 추천합니다.
            </SuggestionDescription>
            
            <SuggestionList>
              {aiSuggestions.map(subject => (
                <SuggestionCard key={subject.id} color={getSubjectColor(subject)}>
                  <SuggestionHeader>
                    <CourseCode>{subject.code}</CourseCode>
                    <SectionBadge>{subject.section}분반</SectionBadge>
                  </SuggestionHeader>
                  
                  <SuggestionContent>
                    <CourseName>{subject.name}</CourseName>
                    
                    <CourseDetails>
                      <DetailItem>
                        <FiUser size={14} />
                        <span>{subject.professor}</span>
                      </DetailItem>
                      <DetailItem>
                        <FiBook size={14} />
                        <span>{subject.credits} 학점</span>
                      </DetailItem>
                      <DetailItem>
                        <FiClock size={14} />
                        <span>{formatScheduleString(subject.schedules)}</span>
                      </DetailItem>
                    </CourseDetails>
                    
                    <SuggestionReason>
                      <FiAlertCircle size={14} />
                      <span>
                        {subject.department === preferences.major 
                          ? "전공 과목이며 " 
                          : subject.category === '기초필수' 
                            ? "기초필수 과목이며 "
                            : ""}
                        {preferences.preferredDays.some(day => 
                          subject.schedules.some(s => s.day === day)) 
                          ? "선호하는 요일에 수업이 있습니다." 
                          : ""}
                      </span>
                    </SuggestionReason>
                    
                    {subject.isEnglish && (
                      <EnglishBadge>영어 강의</EnglishBadge>
                    )}
                  </SuggestionContent>
                  
                  <SuggestionActions>
                    <AddButton onClick={() => addSubject(subject)}>
                      <FiPlus size={18} />
                      시간표에 추가
                    </AddButton>
                  </SuggestionActions>
                </SuggestionCard>
              ))}
            </SuggestionList>
            
            <MoreSuggestionsButton onClick={handleGenerateSuggestions}>
              <FiCpu size={16} />
              다른 추천 받기
            </MoreSuggestionsButton>
          </SuggestionsSection>
        )}
      </PageContainer>
    </Layout>
  );
};

// Styled Components
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const PageHeader = styled.div`
  margin-bottom: 24px;

  h2 {
    font-family: ${props => props.theme.typography.T3.fontFamily};
    font-size: ${props => props.theme.typography.T3.fontSize};
    font-weight: ${props => props.theme.typography.T3.fontWeight};
    color: ${props => props.theme.colors.black};
    margin: 0 0 8px 0;
  }

  p {
    font-family: ${props => props.theme.typography.T6.fontFamily};
    font-size: ${props => props.theme.typography.T6.fontSize};
    color: ${props => props.theme.colors.gray[600]};
    margin: 0;
  }
`;

const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: ${props => props.theme.typography.T4.fontFamily};
  font-size: ${props => props.theme.typography.T4.fontSize};
  font-weight: ${props => props.theme.typography.T4.fontWeight};
  color: ${props => props.theme.colors.black};
  margin: 0 0 16px 0;
`;

const PreferencesSection = styled.div`
  background-color: ${props => props.theme.colors.white};
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const PreferenceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
`;

const PreferenceGroup = styled.div`
  margin-bottom: 20px;
`;

const PreferenceLabel = styled.div`
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  font-weight: 600;
  color: ${props => props.theme.colors.black};
  margin-bottom: 8px;
`;

const PreferenceHint = styled.div`
  font-family: ${props => props.theme.typography.T7.fontFamily};
  font-size: ${props => props.theme.typography.T7.fontSize};
  color: ${props => props.theme.colors.gray[600]};
  margin-top: 6px;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px;
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  border: 1px solid ${props => props.theme.colors.gray[200]};
  border-radius: 4px;
  background-color: ${props => props.theme.colors.white};
  outline: none;

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.purple[100]};
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  border: 1px solid ${props => props.theme.colors.gray[200]};
  border-radius: 4px;
  outline: none;

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.purple[100]};
  }
`;

const DaysSelector = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const DayButton = styled.button<{ selected: boolean }>`
  padding: 8px 12px;
  border-radius: 4px;
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  font-weight: 500;
  border: 1px solid ${props => props.selected ? props.theme.colors.primary : props.theme.colors.gray[200]};
  background-color: ${props => props.selected ? props.theme.colors.purple[100] : props.theme.colors.white};
  color: ${props => props.selected ? props.theme.colors.primary : props.theme.colors.gray[600]};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.selected ? props.theme.colors.purple[100] : props.theme.colors.gray[100]};
  }
`;

const InterestTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const InterestTag = styled.div<{ selected: boolean }>`
  padding: 6px 12px;
  border-radius: 20px;
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  border: 1px solid ${props => props.selected ? props.theme.colors.primary : props.theme.colors.gray[200]};
  background-color: ${props => props.selected ? props.theme.colors.purple[100] : props.theme.colors.white};
  color: ${props => props.selected ? props.theme.colors.primary : props.theme.colors.gray[600]};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.selected ? props.theme.colors.purple[100] : props.theme.colors.gray[100]};
  }
`;

const PreferenceOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  color: ${props => props.theme.colors.black};

  span {
    margin-left: 8px;
  }
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: ${props => props.theme.colors.primary};
`;

const GenerateButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
`;

const GenerateButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  background-color: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.white};
  border: none;
  border-radius: 4px;
  font-family: ${props => props.theme.typography.T5.fontFamily};
  font-size: ${props => props.theme.typography.T5.fontSize};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  max-width: 400px;

  &:hover {
    background-color: #8A2BD9;
  }

  &:disabled {
    background-color: ${props => props.theme.colors.gray[300]};
    cursor: not-allowed;
  }
`;

const SpinnerIcon = styled(FiCpu)`
  animation: spin 1.5s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const SuggestionsSection = styled.div`
  background-color: ${props => props.theme.colors.white};
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  margin-bottom: 32px;
`;

const SuggestionDescription = styled.div`
  font-family: ${props => props.theme.typography.T5.fontFamily};
  font-size: ${props => props.theme.typography.T5.fontSize};
  color: ${props => props.theme.colors.gray[600]};
  margin-bottom: 20px;
`;

const SuggestionList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
`;

const SuggestionCard = styled.div<{ color: string }>`
  background-color: ${props => props.theme.colors.white};
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border-top: 4px solid ${props => props.color};
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const SuggestionHeader = styled.div`
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${props => props.theme.colors.gray[200]};
`;

const CourseCode = styled.div`
  font-family: ${props => props.theme.typography.T5.fontFamily};
  font-size: ${props => props.theme.typography.T5.fontSize};
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
`;

const SectionBadge = styled.div`
  font-family: ${props => props.theme.typography.T7.fontFamily};
  font-size: ${props => props.theme.typography.T7.fontSize};
  color: ${props => props.theme.colors.gray[600]};
  background-color: ${props => props.theme.colors.gray[100]};
  padding: 4px 8px;
  border-radius: 4px;
`;

const SuggestionContent = styled.div`
  padding: 16px;
`;

const CourseName = styled.div`
  font-family: ${props => props.theme.typography.T4.fontFamily};
  font-size: ${props => props.theme.typography.T4.fontSize};
  font-weight: 600;
  color: ${props => props.theme.colors.black};
  margin-bottom: 12px;
  line-height: 1.3;
`;

const CourseDetails = styled.div`
  margin-bottom: 16px;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  color: ${props => props.theme.colors.gray[600]};
`;

const SuggestionReason = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 12px;
  font-family: ${props => props.theme.typography.T7.fontFamily};
  font-size: ${props => props.theme.typography.T7.fontSize};
  color: ${props => props.theme.colors.green[600]};
  line-height: 1.4;
  
  svg {
    margin-top: 2px;
  }
`;

const EnglishBadge = styled.div`
  display: inline-block;
  padding: 4px 8px;
  background-color: ${props => props.theme.colors.blue[100]};
  color: ${props => props.theme.colors.blue[600]};
  border-radius: 4px;
  font-family: ${props => props.theme.typography.T7.fontFamily};
  font-size: ${props => props.theme.typography.T7.fontSize};
  font-weight: 600;
  margin-top: 4px;
`;

const SuggestionActions = styled.div`
  padding: 16px;
  border-top: 1px solid ${props => props.theme.colors.gray[200]};
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px;
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  font-weight: 600;
  background-color: ${props => props.theme.colors.purple[100]};
  color: ${props => props.theme.colors.primary};
  border: 1px solid ${props => props.theme.colors.primary};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.white};
  }
`;

const MoreSuggestionsButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 16px;
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  font-weight: 600;
  background-color: ${props => props.theme.colors.white};
  color: ${props => props.theme.colors.primary};
  border: 1px solid ${props => props.theme.colors.primary};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.theme.colors.purple[100]};
  }
`;

export default AiSuggestPage;