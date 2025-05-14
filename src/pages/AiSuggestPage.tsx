// src/pages/AiSuggestPage.tsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiCpu, FiCheckCircle, FiAlertCircle, FiBook, FiClock, FiUser, FiPlus, 
         FiInfo, FiX, FiStar, FiActivity, FiBookOpen } from 'react-icons/fi';
import Layout from '../components/Layout';
import { MenuItemType } from '../components/Sidebar';
import { Subject } from '../types/subject';
import { useSemester } from '../contexts/SemesterContext';
import { useTimetable } from '../contexts/TimetableContext';
import { 
  processSubjectData, 
  formatScheduleString, 
  getSubjectColor,
  hasSubjectConflict,
  calculateTotalCredits,
  filterSubjectsBySemester,
  calculateSubjectRating,
  getCourseDescription,
  getSubjectReviews,
  getRatingColor
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
  const [activeMenuItem, setActiveMenuItem] = useState<MenuItemType>('Suggest');
  const [isGenerating, setIsGenerating] = useState(false);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [filteredSubjectsBySemester, setFilteredSubjectsBySemester] = useState<Subject[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<Subject[]>([]);
  
  // Context에서 시간표 데이터와 함수 가져오기
  const { selectedSubjects, addSubject } = useTimetable();
  
  const [preferences, setPreferences] = useState<StudentPreference>({
    major: '전산학부',
    year: '2',
    preferredDays: [0, 1, 2, 3, 4],
    preferNoMorning: true,
    totalCredits: 18,
    preferEnglish: false,
    interests: []
  });
  
  // 모달 상태
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 학기 Context 사용
  const { currentSemester } = useSemester();
  
  // 모든 과목 데이터 로드
  useEffect(() => {
    try {
      const subjects = processSubjectData();
      setAllSubjects(subjects);
    } catch (error) {
      console.error('과목 데이터 로드 중 오류 발생:', error);
    }
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
  
  // 모달 열기
  const openSubjectModal = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsModalOpen(true);
  };

  // 모달 닫기
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSubject(null);
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

  // 과목 추가 핸들러 - Context의 addSubject 함수 사용
  const handleAddSubject = (subject: Subject) => {
    const result = addSubject(subject);
    alert(result.message);
  };

  return (
    <Layout activeMenuItem={activeMenuItem} onMenuItemClick={handleMenuItemClick}>
      <PageContainer>
        <PageHeader>
          <h2>시간표 추천</h2>
          <p>{currentSemester}에 대해 선호도와 제약사항을 입력하면 시간표를 추천해 드립니다.</p>
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
                    
                    {/* 과목 설명 */}
                    <CourseDescription>
                      <FiInfo size={14} />
                      <span>
                        {(() => {
                          const description = getCourseDescription(subject.code);
                          return description.length > 80
                            ? `${description.substring(0, 80)}...`
                            : description;
                        })()}
                      </span>
                    </CourseDescription>
                    
                    {/* 과목 평점 표시 (있는 경우에만) */}
                    {(() => {
                      const rating = calculateSubjectRating(subject);
                      if (!rating) return null;
                      
                      return (
                        <RatingSection>
                          <RatingTitle>강의 평가 ({rating.reviewCount}명)</RatingTitle>
                          <RatingGrid>
                            <RatingItem>
                              <RatingLabel>
                                <FiStar size={12} />
                                <span>학점점</span>
                                <RatingValue color={getRatingColor(rating.grade)}>
                                  {rating.grade}
                                </RatingValue>
                              </RatingLabel>
                            </RatingItem>
                            <RatingItem>
                              <RatingLabel>
                                <FiActivity size={12} />
                                <span>로드드</span>
                                <RatingValue color={getRatingColor(rating.workload)}>
                                  {rating.workload}
                                </RatingValue>
                              </RatingLabel>
                            </RatingItem>
                            <RatingItem>
                              <RatingLabel>
                                <FiBookOpen size={12} />
                                <span>강의</span>
                                <RatingValue color={getRatingColor(rating.teaching)}>
                                  {rating.teaching}
                                </RatingValue>
                              </RatingLabel>
                            </RatingItem>
                          </RatingGrid>
                        </RatingSection>
                      );
                    })()}
                    
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
                    <ButtonGroup>
                      <MoreButton onClick={() => openSubjectModal(subject)}>
                        <FiInfo size={16} />
                        리뷰 상세
                      </MoreButton>
                      <AddButton onClick={() => handleAddSubject(subject)}>
                        <FiPlus size={16} />
                        시간표에 추가
                      </AddButton>
                    </ButtonGroup>
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
        
        {/* 리뷰 상세 모달 */}
        {isModalOpen && selectedSubject && (
          <Modal>
            <ModalOverlay onClick={closeModal} />
            <ModalContent>
              <ModalHeader>
                <ModalTitle>
                  <span>{selectedSubject.code}</span>
                  <span>{selectedSubject.name}</span>
                </ModalTitle>
                <CloseButton onClick={closeModal}>
                  <FiX size={20} />
                </CloseButton>
              </ModalHeader>
              
              <ModalBody>
                {/* 과목 정보 섹션 */}
                <CourseInfoSection>
                  <CourseInfoTitle>과목 정보</CourseInfoTitle>
                  <CourseInfoGrid>
                    <CourseInfoItem>
                      <CourseInfoLabel>교수</CourseInfoLabel>
                      <CourseInfoValue>{selectedSubject.professor}</CourseInfoValue>
                    </CourseInfoItem>
                    <CourseInfoItem>
                      <CourseInfoLabel>학점</CourseInfoLabel>
                      <CourseInfoValue>{selectedSubject.credits}</CourseInfoValue>
                    </CourseInfoItem>
                    <CourseInfoItem>
                      <CourseInfoLabel>구분</CourseInfoLabel>
                      <CourseInfoValue>{selectedSubject.category}</CourseInfoValue>
                    </CourseInfoItem>
                    <CourseInfoItem>
                      <CourseInfoLabel>시간</CourseInfoLabel>
                      <CourseInfoValue>{formatScheduleString(selectedSubject.schedules)}</CourseInfoValue>
                    </CourseInfoItem>
                  </CourseInfoGrid>
                  
                  <CourseDescriptionFull>
                    <CourseInfoLabel>과목 설명</CourseInfoLabel>
                    <p>{getCourseDescription(selectedSubject.code)}</p>
                  </CourseDescriptionFull>
                </CourseInfoSection>
                
                {/* 강의 평가 섹션 */}
                {(() => {
                  const rating = calculateSubjectRating(selectedSubject);
                  if (!rating) return null;
                  
                  return (
                    <RatingSectionFull>
                      <CourseInfoTitle>강의 평가 ({rating.reviewCount}명)</CourseInfoTitle>
                      <RatingRow>
                        <RatingLabel>학점점:</RatingLabel>
                        <RatingValueInline color={getRatingColor(rating.grade)}>
                          {rating.grade}
                        </RatingValueInline>
                        <RatingLabel>로드드:</RatingLabel>
                        <RatingValueInline color={getRatingColor(rating.workload)}>
                          {rating.workload}
                        </RatingValueInline>
                        <RatingLabel>강의:</RatingLabel>
                        <RatingValueInline color={getRatingColor(rating.teaching)}>
                          {rating.teaching}
                        </RatingValueInline>
                      </RatingRow>
                      
                      {/* 막대 그래프 표시 */}
                      <RatingGridFull>
                        <RatingItemFull>
                          <RatingLabelFull>학점점</RatingLabelFull>
                          <RatingBarContainer>
                            <RatingBar 
                              width={(rating.gradeScore / 4.0) * 100} 
                              color={getRatingColor(rating.grade)}
                            />
                          </RatingBarContainer>
                          <RatingValueFull color={getRatingColor(rating.grade)}>
                            {rating.grade}
                          </RatingValueFull>
                        </RatingItemFull>
                        <RatingItemFull>
                          <RatingLabelFull>로드드</RatingLabelFull>
                          <RatingBarContainer>
                            <RatingBar 
                              width={(rating.workloadScore / 4.0) * 100} 
                              color={getRatingColor(rating.workload)}
                            />
                          </RatingBarContainer>
                          <RatingValueFull color={getRatingColor(rating.workload)}>
                            {rating.workload}
                          </RatingValueFull>
                        </RatingItemFull>
                        <RatingItemFull>
                          <RatingLabelFull>강의</RatingLabelFull>
                          <RatingBarContainer>
                            <RatingBar 
                              width={(rating.teachingScore / 4.0) * 100} 
                              color={getRatingColor(rating.teaching)}
                            />
                          </RatingBarContainer>
                          <RatingValueFull color={getRatingColor(rating.teaching)}>
                            {rating.teaching}
                          </RatingValueFull>
                        </RatingItemFull>
                      </RatingGridFull>
                    </RatingSectionFull>
                  );
                })()}
                
                {/* 리뷰 목록 섹션 */}
                <ReviewsSection>
                  <CourseInfoTitle>수강생 리뷰</CourseInfoTitle>
                  {(() => {
                    const reviews = getSubjectReviews(selectedSubject.code, selectedSubject.professor);
                    
                    if (reviews.length === 0) {
                      return <EmptyReviews>아직 리뷰가 없습니다.</EmptyReviews>;
                    }
                    
                    return (
                      <ReviewsList>
                        {reviews.map((review, index) => (
                          <ReviewItem key={index}>
                            <ReviewHeader>
                              <ReviewSemester>{review.학기}</ReviewSemester>
                              <ReviewRatings>
                                <ReviewRating>
                                  <span>학점점: </span>
                                  <RatingValueSmall color={getRatingColor(review.평점.grade)}>
                                    {review.평점.grade}
                                  </RatingValueSmall>
                                </ReviewRating>
                                <ReviewRating>
                                  <span>로드드: </span>
                                  <RatingValueSmall color={getRatingColor(review.평점.workload)}>
                                    {review.평점.workload}
                                  </RatingValueSmall>
                                </ReviewRating>
                                <ReviewRating>
                                  <span>강의: </span>
                                  <RatingValueSmall color={getRatingColor(review.평점.teaching)}>
                                    {review.평점.teaching}
                                  </RatingValueSmall>
                                </ReviewRating>
                              </ReviewRatings>
                            </ReviewHeader>
                            <ReviewContent>{review.리뷰내용}</ReviewContent>
                          </ReviewItem>
                        ))}
                      </ReviewsList>
                    );
                  })()}
                </ReviewsSection>
              </ModalBody>
              
              <ModalFooter>
                <AddButtonLarge onClick={() => {
                  handleAddSubject(selectedSubject);
                  closeModal();
                }}>
                  <FiPlus size={18} />
                  시간표에 추가
                </AddButtonLarge>
              </ModalFooter>
            </ModalContent>
          </Modal>
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

// 과목 설명 스타일
const CourseDescription = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 10px;
  margin-bottom: 10px;
  font-family: ${props => props.theme.typography.T7.fontFamily};
  font-size: ${props => props.theme.typography.T7.fontSize};
  color: ${props => props.theme.colors.gray[600]};
  line-height: 1.4;
  
  svg {
    flex-shrink: 0;
    margin-top: 2px;
  }
  
  span {
    flex: 1;
  }
`;

// 평점 관련 스타일
const RatingSection = styled.div`
  margin: 10px 0;
  background-color: ${props => props.theme.colors.gray[100]};
  padding: 8px;
  border-radius: 4px;
`;

const RatingTitle = styled.div`
  font-family: ${props => props.theme.typography.T7.fontFamily};
  font-size: ${props => props.theme.typography.T7.fontSize};
  font-weight: 600;
  color: ${props => props.theme.colors.gray[600]};
  margin-bottom: 6px;
`;

const RatingGrid = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const RatingItem = styled.div`
  display: flex;
  align-items: center;
`;

const RatingLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: ${props => props.theme.typography.T7.fontFamily};
  font-size: ${props => props.theme.typography.T7.fontSize};
  color: ${props => props.theme.colors.gray[600]};
`;

const RatingValue = styled.span<{ color: string }>`
  font-family: ${props => props.theme.typography.T7.fontFamily};
  font-size: ${props => props.theme.typography.T7.fontSize};
  font-weight: 600;
  color: ${props => props.color};
  margin-left: 4px;
`;

// 버튼 그룹
const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
`;

const MoreButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  background-color: ${props => props.theme.colors.white};
  color: ${props => props.theme.colors.gray[600]};
  border: 1px solid ${props => props.theme.colors.gray[300]};
  border-radius: 4px;
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1; // 동일한 flex 값으로 같은 너비 지정

  &:hover {
    background-color: ${props => props.theme.colors.gray[100]};
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  font-weight: 600;
  background-color: ${props => props.theme.colors.purple[100]};
  color: ${props => props.theme.colors.primary};
  border: 1px solid ${props => props.theme.colors.primary};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1; // 동일한 flex 값으로 같은 너비 지정

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

// 모달 관련 스타일
const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
`;

const ModalContent = styled.div`
  position: relative;
  background-color: ${props => props.theme.colors.white};
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 101;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid ${props => props.theme.colors.gray[200]};
`;

const ModalTitle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  
  span:first-child {
    font-family: ${props => props.theme.typography.T5.fontFamily};
    font-size: ${props => props.theme.typography.T5.fontSize};
    font-weight: 600;
    color: ${props => props.theme.colors.primary};
  }
  
  span:last-child {
    font-family: ${props => props.theme.typography.T3.fontFamily};
    font-size: ${props => props.theme.typography.T3.fontSize};
    font-weight: 600;
    color: ${props => props.theme.colors.black};
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.gray[600]};
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    color: ${props => props.theme.colors.black};
  }
`;

const ModalBody = styled.div`
  padding: 24px;
  overflow-y: auto;
  max-height: calc(90vh - 200px);
`;

const ModalFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid ${props => props.theme.colors.gray[200]};
  display: flex;
  justify-content: flex-end;
`;

const CourseInfoSection = styled.div`
  margin-bottom: 24px;
`;

const CourseInfoTitle = styled.h4`
  font-family: ${props => props.theme.typography.T4.fontFamily};
  font-size: ${props => props.theme.typography.T4.fontSize};
  font-weight: 600;
  color: ${props => props.theme.colors.black};
  margin: 0 0 16px 0;
`;

const CourseInfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
`;

const CourseInfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const CourseInfoLabel = styled.div`
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  font-weight: 600;
  color: ${props => props.theme.colors.gray[600]};
`;

const CourseInfoValue = styled.div`
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  color: ${props => props.theme.colors.black};
`;

const CourseDescriptionFull = styled.div`
  margin-top: 16px;
  
  p {
    font-family: ${props => props.theme.typography.T6.fontFamily};
    font-size: ${props => props.theme.typography.T6.fontSize};
    color: ${props => props.theme.colors.gray[600]};
    line-height: 1.6;
    margin: 8px 0 0 0;
  }
`;

// 같은 줄에 표시하기 위한 평점 행
const RatingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const RatingValueInline = styled.span<{ color: string }>`
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  font-weight: 600;
  color: ${props => props.color};
  margin-right: 14px;
`;

const RatingSectionFull = styled.div`
  margin-bottom: 24px;
  padding: 16px;
  background-color: ${props => props.theme.colors.gray[100]};
  border-radius: 8px;
`;

const RatingGridFull = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const RatingItemFull = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const RatingLabelFull = styled.div`
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  color: ${props => props.theme.colors.gray[600]};
  width: 60px;
`;

const RatingBarContainer = styled.div`
  flex: 1;
  height: 10px;
  background-color: ${props => props.theme.colors.gray[200]};
  border-radius: 5px;
  overflow: hidden;
`;

const RatingBar = styled.div<{ width: number; color: string }>`
  height: 100%;
  width: ${props => props.width}%;
  background-color: ${props => props.color};
  border-radius: 5px;
`;

const RatingValueFull = styled.div<{ color: string }>`
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  font-weight: 600;
  color: ${props => props.color};
  width: 60px;
  text-align: right;
`;

const ReviewsSection = styled.div`
  margin-bottom: 16px;
`;

const ReviewsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ReviewItem = styled.div`
  padding: 16px;
  background-color: ${props => props.theme.colors.gray[100]};
  border-radius: 8px;
`;

const ReviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
`;

const ReviewSemester = styled.div`
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  padding: 4px 8px;
  background-color: ${props => props.theme.colors.purple[100]};
  border-radius: 4px;
`;

const ReviewRatings = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const ReviewRating = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: ${props => props.theme.typography.T7.fontFamily};
  font-size: ${props => props.theme.typography.T7.fontSize};
  color: ${props => props.theme.colors.gray[600]};
`;

const RatingValueSmall = styled.span<{ color: string }>`
  color: ${props => props.color};
  font-weight: 600;
`;

const ReviewContent = styled.div`
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  color: ${props => props.theme.colors.gray[600]};
  line-height: 1.6;
  white-space: pre-line;
`;

const EmptyReviews = styled.div`
  padding: 24px 0;
  text-align: center;
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  color: ${props => props.theme.colors.gray[600]};
`;

const AddButtonLarge = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  font-family: ${props => props.theme.typography.T5.fontFamily};
  font-size: ${props => props.theme.typography.T5.fontSize};
  font-weight: 600;
  background-color: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.white};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #8A2BD9;
  }
`;

export default AiSuggestPage;