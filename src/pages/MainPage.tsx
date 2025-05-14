// src/pages/MainPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiPlus, FiInfo, FiClock, FiUser, FiMapPin, FiStar, FiActivity, FiBookOpen } from 'react-icons/fi';
import Layout from '../components/Layout';
import { MenuItemType } from '../components/Sidebar';
import { Subject } from '../types/subject';
import { useSemester } from '../contexts/SemesterContext';
import { useTimetable } from '../contexts/TimetableContext';
import { 
  getSubjectColor, 
  calculateTotalCredits,
  processSubjectData, 
  formatScheduleString,
  filterSubjectsBySemester,
  getCourseDescription,
  calculateSubjectRating,
  getSubjectReviews,
  getRatingColor
} from '../utils/subjectUtils';
import { styled } from 'styled-components';

const MainPage: React.FC = () => {
  const [activeMenuItem, setActiveMenuItem] = useState<MenuItemType>('timetable');
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [filteredSubjectsBySemester, setFilteredSubjectsBySemester] = useState<Subject[]>([]);
  // selectedSubjects 상태를 Context에서 가져옴
  const { selectedSubjects, addSubject, removeSubject } = useTimetable();
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredSubject, setHoveredSubject] = useState<Subject | null>(null);

  // 시간표 라벨
  const days = ['월', '화', '수', '목', '금'];
  const hours = Array.from({ length: 15 }, (_, i) => 9 + i); // 9시부터 23시까지
  const timetableGridRef = useRef<HTMLDivElement>(null);
  const [gridDimensions, setGridDimensions] = useState({ width: 0, timeColWidth: 70 });

  // 학기 Context 사용
  const { currentSemester } = useSemester();

  // 모달 상태
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      console.log(`${currentSemester} 과목 데이터 로드됨: ${semesterSubjects.length}개`);
    }
  }, [currentSemester, allSubjects]);

  // 그리드 크기 측정
  useEffect(() => {
    if (timetableGridRef.current) {
      const gridWidth = timetableGridRef.current.clientWidth;
      setGridDimensions({
        width: gridWidth,
        timeColWidth: 70
      });
    }
    
    const handleResize = () => {
      if (timetableGridRef.current) {
        const gridWidth = timetableGridRef.current.clientWidth;
        setGridDimensions({
          width: gridWidth,
          timeColWidth: 70
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 메뉴 아이템 클릭 핸들러
  const handleMenuItemClick = (item: MenuItemType) => {
    setActiveMenuItem(item);
  };

  // 과목 추가 핸들러 - Context의 addSubject 함수를 사용
  const handleAddSubject = (subject: Subject) => {
    const result = addSubject(subject);
    if (!result.success) {
      alert(result.message);
    }
  };

  // 검색 결과 필터링 - 현재 학기 과목 중에서만 검색
  const searchResults = filteredSubjectsBySemester.filter(subject =>
    subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.professor.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 20); // 최대 20개만 표시

  // 총 학점 계산
  const totalCredits = calculateTotalCredits(selectedSubjects);

  // 과목 상세 정보 모달 열기
  const openSubjectModal = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsModalOpen(true);
  };

  // 모달 닫기
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSubject(null);
  };

  return (
    <Layout activeMenuItem={activeMenuItem} onMenuItemClick={handleMenuItemClick}>
      <PageContainer>
        {/* 시간표 영역 */}
        <LeftSection>
          <TimetableContainer>
            <TimetableHeader>
              <TitleSection>
                <h2>내 시간표</h2>
                <Semester>{currentSemester}</Semester>
              </TitleSection>
              <CreditsInfo>
                <span>총 {selectedSubjects.length} 과목</span>
                <span>|</span>
                <span>{totalCredits} 학점</span>
              </CreditsInfo>
              <ActionButtons>
                <TimetableButton>저장</TimetableButton>
                <TimetableButton>내보내기</TimetableButton>
              </ActionButtons>
            </TimetableHeader>

            {/* 시간표 그리드와 과목 블록 - 기존 코드 유지 */}
            <TimetableWrapper>
              <TimetableGrid ref={timetableGridRef}>
                {/* 헤더 */}
                <TimeHeader>시간/요일</TimeHeader>
                {days.map(day => (
                  <DayHeader key={day}>{day}</DayHeader>
                ))}
                
                {/* 시간 셀 */}
                {hours.map(hour => (
                  <React.Fragment key={hour}>
                    <TimeCell>{`${hour}:00`}</TimeCell>
                    {days.map((day, index) => (
                      <GridCell key={`${hour}-${day}-00`} />
                    ))}
                    <TimeCell>{`${hour}:30`}</TimeCell>
                    {days.map((day, index) => (
                      <GridCell key={`${hour}-${day}-30`} />
                    ))}
                  </React.Fragment>
                ))}
              </TimetableGrid>

              {/* 과목 블록 - 기존 코드 유지 */}
              {selectedSubjects.map(subject => (
                subject.schedules.map((schedule, index) => {
                  const dayIndex = schedule.day;
                  const startFromNine = schedule.startTime - (9 * 60);
                  const duration = schedule.endTime - schedule.startTime;
                  
                  // 다섯 개 요일 칸 너비 계산
                  const dayColumnWidth = (gridDimensions.width - gridDimensions.timeColWidth) / 5;
                  
                  // 요일 칸 시작 위치 계산
                  const left = gridDimensions.timeColWidth + (dayIndex * dayColumnWidth);
                  
                  // 나머지 계산은 동일
                  const top = (startFromNine / 30) * 30 + 30;
                  const height = (duration / 30) * 30;
                  
                  return (
                    <CourseBlock
                      key={`${subject.id}-${index}`}
                      style={{
                        position: 'absolute',
                        left: `${left}px`,
                        top: `${top}px`,
                        width: `${dayColumnWidth}px`,
                        height: `${height}px`,
                        zIndex: 5,
                      }}
                      color={getSubjectColor(subject)}
                      onMouseOver={() => setHoveredSubject(subject)}
                      onMouseOut={() => setHoveredSubject(null)}
                    >
                      <CourseCode>{subject.code}</CourseCode>
                      <CourseName>{subject.name}</CourseName>
                      <CourseProfessor>{subject.professor}</CourseProfessor>
                      <CourseRoom>{subject.classroom}</CourseRoom>
                      <RemoveButton onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setHoveredSubject(null);
                        removeSubject(subject.id);
                      }}>
                        <FiX size={14} />
                      </RemoveButton>
                    </CourseBlock>
                  );
                })
              ))}
            </TimetableWrapper>

            {/* 툴팁 - 기존 코드 유지 */}
            {hoveredSubject && (
              <SubjectTooltip>
                <TooltipHeader>
                  <span>{hoveredSubject.code}</span>
                  <span>{hoveredSubject.section}분반</span>
                </TooltipHeader>
                <TooltipBody>
                  <TooltipTitle>{hoveredSubject.name}</TooltipTitle>
                  <TooltipDetail>
                    <FiInfo size={14} />
                    <span>담당교수: {hoveredSubject.professor}</span>
                  </TooltipDetail>
                  <TooltipDetail>
                    <FiInfo size={14} />
                    <span>강의실: {hoveredSubject.classroom || '미지정'}</span>
                  </TooltipDetail>
                  <TooltipDetail>
                    <FiInfo size={14} />
                    <span>학점: {hoveredSubject.credits}</span>
                  </TooltipDetail>
                  <TooltipDetail>
                    <FiInfo size={14} />
                    <span>시간: {formatScheduleString(hoveredSubject.schedules)}</span>
                  </TooltipDetail>
                  {hoveredSubject.isEnglish && (
                    <TooltipTag>영어 강의</TooltipTag>
                  )}
                </TooltipBody>
              </SubjectTooltip>
            )}
          </TimetableContainer>
        </LeftSection>
        
        {/* 오른쪽 섹션: 과목 목록과 내 수업 목록 */}
        <RightSection>
          {/* 개설 과목 목록 */}
          <CourseSection>
            <CourseSectionHeader>
              <h3>개설 과목</h3>
              <SearchInput 
                placeholder="과목명, 교수명, 과목코드 검색..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </CourseSectionHeader>
            
            <CourseList>
              {searchResults.length > 0 ? (
                searchResults.map(subject => (
                  <CourseItem key={subject.id}>
                    <CourseInfo>
                      <CourseItemCode>{subject.code}</CourseItemCode>
                      <CourseItemName>{subject.name}</CourseItemName>
                      <CourseItemDetails>
                        <span>{subject.professor}</span>
                        <span>•</span>
                        <span>{subject.credits} 학점</span>
                        <span>•</span>
                        <span>{subject.section}분반</span>
                        {subject.isEnglish && <EnglishBadge>영어</EnglishBadge>}
                      </CourseItemDetails>
                      <CourseSchedule>
                        {formatScheduleString(subject.schedules)}
                      </CourseSchedule>
                      
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
                                  <span>학점</span>
                                  <RatingValue color={getRatingColor(rating.grade)}>
                                    {rating.grade}
                                  </RatingValue>
                                </RatingLabel>
                              </RatingItem>
                              <RatingItem>
                                <RatingLabel>
                                  <FiActivity size={12} />
                                  <span>로드</span>
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
                      <ButtonGroup>
                        <MoreButton onClick={() => openSubjectModal(subject)}>
                          <FiInfo size={16} />
                          리뷰 상세
                        </MoreButton>
                        <AddButton onClick={() => addSubject(subject)}>
                          <FiPlus size={16} />
                          추가
                        </AddButton>
                      </ButtonGroup>
                    </CourseInfo>
                  </CourseItem>
                ))
              ) : (
                <EmptyState>
                  {searchQuery 
                    ? '검색 결과가 없습니다.' 
                    : `${currentSemester}에 개설된 과목이 없습니다.`}
                </EmptyState>
              )}
            </CourseList>
          </CourseSection>

          {/* 내 수업 목록 - 개설 과목 목록 아래에 배치 */}
          <SelectedCoursesSection>
            <SelectedCoursesSectionHeader>
              <h3>내 수업 목록</h3>
              <SelectedCoursesCount>
                총 {selectedSubjects.length} 과목 / {totalCredits} 학점
              </SelectedCoursesCount>
            </SelectedCoursesSectionHeader>
            
            {selectedSubjects.length > 0 ? (
              <SelectedCoursesList>
                {selectedSubjects.map(subject => (
                  <SelectedCourseItem key={subject.id}>
                    <SelectedCourseInfo>
                      <SelectedCourseHeader>
                        <SelectedCourseCode>{subject.code}</SelectedCourseCode>
                        {subject.schedules.length === 0 && (
                          <NoScheduleWarning>시간 미정</NoScheduleWarning>
                        )}
                      </SelectedCourseHeader>
                      <SelectedCourseName>{subject.name}</SelectedCourseName>
                      <SelectedCourseDetails>
                        <SelectedCourseDetail>
                          <FiUser size={14} />
                          <span>{subject.professor}</span>
                        </SelectedCourseDetail>
                        {subject.schedules.length > 0 && (
                          <SelectedCourseDetail>
                            <FiClock size={14} />
                            <span>{formatScheduleString(subject.schedules)}</span>
                          </SelectedCourseDetail>
                        )}
                        {subject.classroom && (
                          <SelectedCourseDetail>
                            <FiMapPin size={14} />
                            <span>{subject.classroom}</span>
                          </SelectedCourseDetail>
                        )}
                        
                        {/* 과목 평점 표시 (있는 경우에만) */}
                        {(() => {
                          const rating = calculateSubjectRating(subject);
                          if (!rating) return null;
                          
                          return (
                            <RatingRow>
                              <RatingItem>
                                <RatingLabel>
                                  <FiStar size={12} />
                                  <span>학점</span>
                                  <RatingValue color={getRatingColor(rating.grade)}>
                                    {rating.grade}
                                  </RatingValue>
                                </RatingLabel>
                              </RatingItem>
                              <RatingItem>
                                <RatingLabel>
                                  <FiActivity size={12} />
                                  <span>로드</span>
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
                            </RatingRow>
                          );
                        })()}
                      </SelectedCourseDetails>
                    </SelectedCourseInfo>
                    <RemoveSelectedCourseButton onClick={() => removeSubject(subject.id)}>
                      <FiX size={16} />
                    </RemoveSelectedCourseButton>
                  </SelectedCourseItem>
                ))}
              </SelectedCoursesList>
            ) : (
              <EmptySelectedCourses>
                아직 선택된 과목이 없습니다
              </EmptySelectedCourses>
            )}
          </SelectedCoursesSection>
        </RightSection>

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
                        <RatingLabel>학점:</RatingLabel>
                        <RatingValueInline color={getRatingColor(rating.grade)}>
                          {rating.grade}
                        </RatingValueInline>
                        <RatingLabel>로드:</RatingLabel>
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
                          <RatingLabelFull>학점</RatingLabelFull>
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
                          <RatingLabelFull>로드</RatingLabelFull>
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
                                  <span>학점: </span>
                                  <RatingValueSmall color={getRatingColor(review.평점.grade)}>
                                    {review.평점.grade}
                                  </RatingValueSmall>
                                </ReviewRating>
                                <ReviewRating>
                                  <span>로드: </span>
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
  gap: 24px;
  width: 100%;
`;

const LeftSection = styled.div`
  flex: 3;
  min-width: 400px;
`;

const RightSection = styled.div`
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const TimetableContainer = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
`;

const TimetableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const TitleSection = styled.div`
  h2 {
    font-family: ${props => props.theme.typography.T3.fontFamily};
    font-size: ${props => props.theme.typography.T3.fontSize};
    font-weight: ${props => props.theme.typography.T3.fontWeight};
    color: ${props => props.theme.colors.black};
    margin: 0 0 4px 0;
  }
`;

const Semester = styled.div`
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  color: ${props => props.theme.colors.gray[600]};
`;

const CreditsInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: ${props => props.theme.typography.T5.fontFamily};
  font-size: ${props => props.theme.typography.T5.fontSize};
  color: ${props => props.theme.colors.primary};

  span:nth-child(2) {
    color: ${props => props.theme.colors.gray[300]};
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
`;

const TimetableButton = styled.button`
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  font-weight: ${props => props.theme.typography.T6.fontWeight};
  background-color: ${props => props.theme.colors.white};
  color: ${props => props.theme.colors.primary};
  border: 1px solid ${props => props.theme.colors.primary};
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.theme.colors.purple[100]};
  }
`;

// 시간표 래퍼 추가 - 상대 위치 컨테이너
const TimetableWrapper = styled.div`
  position: relative;
  width: 100%;
  height: auto;
`;

// 시간표 그리드 - 기본 구조 유지
const TimetableGrid = styled.div`
  display: grid;
  grid-template-columns: 70px repeat(5, 1fr);
  grid-auto-rows: 30px; // 30분 간격으로 행 높이 설정
  background-color: ${props => props.theme.colors.white};
  border: 1px solid ${props => props.theme.colors.gray[200]};
  border-radius: 8px;
  overflow: hidden;
`;

const TimeHeader = styled.div`
  grid-column: 1;
  grid-row: 1;
  background-color: ${props => props.theme.colors.white};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  font-weight: 600;
  color: ${props => props.theme.colors.gray[600]};
  border-right: 1px solid ${props => props.theme.colors.gray[200]};
  border-bottom: 1px solid ${props => props.theme.colors.gray[200]};
`;

const DayHeader = styled.div`
  background-color: ${props => props.theme.colors.white};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${props => props.theme.typography.T5.fontFamily};
  font-size: ${props => props.theme.typography.T5.fontSize};
  font-weight: 600;
  color: ${props => props.theme.colors.black};
  padding: 10px;
  border-right: 1px solid ${props => props.theme.colors.gray[200]};
  border-bottom: 1px solid ${props => props.theme.colors.gray[200]};
`;

const TimeCell = styled.div`
  background-color: ${props => props.theme.colors.white};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${props => props.theme.typography.T7.fontFamily};
  font-size: ${props => props.theme.typography.T7.fontSize};
  color: ${props => props.theme.colors.gray[600]};
  border-right: 1px solid ${props => props.theme.colors.gray[200]};
  border-bottom: 1px solid ${props => props.theme.colors.gray[200]};
`;

const GridCell = styled.div`
  background-color: ${props => props.theme.colors.white};
  border-right: 1px solid ${props => props.theme.colors.gray[200]};
  border-bottom: 1px solid ${props => props.theme.colors.gray[200]};
`;

// CourseBlock 스타일 수정 - 절대 위치로 변경
const CourseBlock = styled.div<{ color: string }>`
  background-color: ${props => props.color || props.theme.colors.purple[100]};
  border-left: 3px solid ${props => props.theme.colors.primary};
  border-radius: 4px;
  padding: 8px;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: scale(1.01);
    z-index: 10;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const CourseCode = styled.div`
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  font-weight: 600;
  color: ${props => props.theme.colors.black};
  margin-bottom: 4px;
`;

const CourseName = styled.div`
  font-family: ${props => props.theme.typography.T7.fontFamily};
  font-size: ${props => props.theme.typography.T7.fontSize};
  font-weight: 500;
  color: ${props => props.theme.colors.black};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
`;

const CourseProfessor = styled.div`
  font-family: ${props => props.theme.typography.T7.fontFamily};
  font-size: ${props => props.theme.typography.T7.fontSize};
  color: ${props => props.theme.colors.gray[600]};
`;

const CourseRoom = styled.div`
  font-family: ${props => props.theme.typography.T7.fontFamily};
  font-size: ${props => props.theme.typography.T7.fontSize};
  color: ${props => props.theme.colors.blue[600]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  background-color: rgba(255, 255, 255, 0.7);
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  
  ${CourseBlock}:hover & {
    opacity: 1;
  }
  
  &:hover {
    background-color: ${props => props.theme.colors.red[100]};
    color: ${props => props.theme.colors.red[600]};
  }
`;

const SubjectTooltip = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  width: 300px;
  background-color: ${props => props.theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  pointer-events: none;
`;

const TooltipHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.white};
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  font-weight: 600;
`;

const TooltipBody = styled.div`
  padding: 16px;
`;

const TooltipTitle = styled.div`
  font-family: ${props => props.theme.typography.T4.fontFamily};
  font-size: ${props => props.theme.typography.T4.fontSize};
  font-weight: 600;
  color: ${props => props.theme.colors.black};
  margin-bottom: 12px;
`;

const TooltipDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  color: ${props => props.theme.colors.gray[600]};
`;

const TooltipTag = styled.div`
  display: inline-block;
  padding: 4px 8px;
  background-color: ${props => props.theme.colors.blue[100]};
  color: ${props => props.theme.colors.blue[600]};
  border-radius: 4px;
  font-family: ${props => props.theme.typography.T7.fontFamily};
  font-size: ${props => props.theme.typography.T7.fontSize};
  font-weight: 600;
  margin-top: 8px;
`;

const CourseSection = styled.div`
  background-color: ${props => props.theme.colors.white};
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  max-height: 60vh; // 화면 높이의 60%로 제한
`;

const CourseSectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  h3 {
    flex-shrink: 0;
    font-family: ${props => props.theme.typography.T4.fontFamily};
    font-size: ${props => props.theme.typography.T4.fontSize};
    font-weight: ${props => props.theme.typography.T4.fontWeight};
    color: ${props => props.theme.colors.black};
    margin-right: 8px;
  }
`;

const SearchInput = styled.input`
  width: 300px;
  padding: 10px 12px;
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

const CourseList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  max-height: 60vh; // 화면 높이의 60%로 제한

  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.gray[100]};
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: ${props => props.theme.colors.gray[300]};
    border-radius: 3px;
  }
`;

const CourseItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: ${props => props.theme.colors.gray[100]};
  border-radius: 8px;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  }
`;

const CourseInfo = styled.div`
  flex: 1;
`;

const CourseItemCode = styled.div`
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 4px;
`;

const CourseItemName = styled.div`
  font-family: ${props => props.theme.typography.T5.fontFamily};
  font-size: ${props => props.theme.typography.T5.fontSize};
  font-weight: 500;
  color: ${props => props.theme.colors.black};
  margin-bottom: 4px;
`;

const CourseItemDetails = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: ${props => props.theme.typography.T7.fontFamily};
  font-size: ${props => props.theme.typography.T7.fontSize};
  color: ${props => props.theme.colors.gray[600]};
  margin-bottom: 8px;
  flex-wrap: wrap;
`;

const EnglishBadge = styled.span`
  display: inline-block;
  padding: 2px 6px;
  background-color: ${props => props.theme.colors.blue[100]};
  color: ${props => props.theme.colors.blue[600]};
  border-radius: 4px;
  font-size: ${props => props.theme.typography.T7.fontSize};
  font-weight: 600;
`;

const CourseSchedule = styled.div`
  font-family: ${props => props.theme.typography.T7.fontFamily};
  font-size: ${props => props.theme.typography.T7.fontSize};
  color: ${props => props.theme.colors.black};
  background-color: ${props => props.theme.colors.gray[200]};
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
`;

const EmptyState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-family: ${props => props.theme.typography.T5.fontFamily};
  font-size: ${props => props.theme.typography.T5.fontSize};
  color: ${props => props.theme.colors.gray[600]};
`;

const SelectedCoursesSection = styled.div`
  background-color: ${props => props.theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
`;

const SelectedCoursesSectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: ${props => props.theme.colors.purple[100]};
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  border-bottom: 1px solid ${props => props.theme.colors.gray[200]};

  h3 {
    font-family: ${props => props.theme.typography.T4.fontFamily};
    font-size: ${props => props.theme.typography.T4.fontSize};
    font-weight: ${props => props.theme.typography.T4.fontWeight};
    color: ${props => props.theme.colors.primary};
    margin: 0;
  }
`;

const SelectedCoursesCount = styled.div`
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  color: ${props => props.theme.colors.gray[600]};
  background-color: ${props => props.theme.colors.white};
  padding: 4px 10px;
  border-radius: 16px;
`;

const SelectedCoursesList = styled.div`
  max-height: 60vh; // 화면 높이의 60%로 제한
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.gray[100]};
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: ${props => props.theme.colors.gray[300]};
    border-radius: 3px;
  }
`;

const SelectedCourseItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid ${props => props.theme.colors.gray[200]};
  transition: background-color 0.2s;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: ${props => props.theme.colors.gray[100]};
  }
`;

const SelectedCourseInfo = styled.div`
  flex: 1;
`;

const SelectedCourseHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
`;

const SelectedCourseCode = styled.div`
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
`;

const SelectedCourseName = styled.div`
  font-family: ${props => props.theme.typography.T5.fontFamily};
  font-size: ${props => props.theme.typography.T5.fontSize};
  font-weight: 500;
  color: ${props => props.theme.colors.black};
  margin-bottom: 8px;
`;

const SelectedCourseDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SelectedCourseDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: ${props => props.theme.typography.T7.fontFamily};
  font-size: ${props => props.theme.typography.T7.fontSize};
  color: ${props => props.theme.colors.gray[600]};
`;

const NoScheduleWarning = styled.div`
  display: inline-block;
  padding: 2px 6px;
  background-color: ${props => props.theme.colors.red[100]};
  color: ${props => props.theme.colors.red[600]};
  font-family: ${props => props.theme.typography.T7.fontFamily};
  font-size: ${props => props.theme.typography.T7.fontSize};
  font-weight: 500;
  border-radius: 4px;
`;

const RemoveSelectedCourseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.gray[100]};
  color: ${props => props.theme.colors.gray[600]};
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  margin-left: 12px;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.theme.colors.red[100]};
    color: ${props => props.theme.colors.red[600]};
  }
`;

const EmptySelectedCourses = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  color: ${props => props.theme.colors.gray[600]};
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

// 평점 관련 스타일
const RatingSection = styled.div`
  margin: 12px 0;
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
`;

const RatingItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const RatingLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: ${props => props.theme.typography.T7.fontFamily};
  font-size: ${props => props.theme.typography.T7.fontSize};
  color: ${props => props.theme.colors.gray[600]};
`;

const RatingValue = styled.div<{ color: string }>`
  font-family: ${props => props.theme.typography.T7.fontFamily};
  font-size: ${props => props.theme.typography.T7.fontSize};
  font-weight: 600;
  color: ${props => props.color};
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

// 과목 설명 스타일
const CourseDescription = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 12px;
  margin-bottom: 12px;
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

export default MainPage;