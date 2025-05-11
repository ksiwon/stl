// src/pages/MainPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiPlus, FiInfo, FiClock, FiUser, FiMapPin } from 'react-icons/fi';
import Layout from '../components/Layout';
import { MenuItemType } from '../components/Sidebar';
import { Subject } from '../types/subject';
import { useSemester } from '../contexts/SemesterContext';
import { 
  processSubjectData, 
  getSubjectColor, 
  formatScheduleString, 
  calculateTotalCredits,
  checkConflictsWithSelectedSubjects,
  filterSubjectsBySemester
} from '../utils/subjectUtils';
import { styled } from 'styled-components';

const MainPage: React.FC = () => {
  const [activeMenuItem, setActiveMenuItem] = useState<MenuItemType>('timetable');
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [filteredSubjectsBySemester, setFilteredSubjectsBySemester] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredSubject, setHoveredSubject] = useState<Subject | null>(null);

  // 시간표 라벨
  const days = ['월', '화', '수', '목', '금'];
  const hours = Array.from({ length: 15 }, (_, i) => 9 + i); // 9시부터 23시까지
  const timetableGridRef = useRef<HTMLDivElement>(null);
  const [gridDimensions, setGridDimensions] = useState({ width: 0, timeColWidth: 70 });

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

  // 과목 추가 핸들러
  const addSubject = (subject: Subject) => {
    // 이미 추가된 과목인지 확인
    if (selectedSubjects.some(s => s.id === subject.id)) {
      alert('이미 추가된 과목입니다.');
      return;
    }

    // 시간 충돌 확인
    const { hasConflict, conflictingSubjects } = checkConflictsWithSelectedSubjects(
      subject, 
      selectedSubjects
    );

    if (hasConflict) {
      const conflictNames = conflictingSubjects.map(s => s.name).join(', ');
      alert(`다음 과목과 시간이 충돌합니다: ${conflictNames}`);
      return;
    }

    // 과목 추가
    setSelectedSubjects([...selectedSubjects, subject]);
  };

  // 과목 제거 핸들러
  const removeSubject = (subjectId: string) => {
    setSelectedSubjects(selectedSubjects.filter(subject => subject.id !== subjectId));
  };

  // 검색 결과 필터링 - 현재 학기 과목 중에서만 검색
  const searchResults = filteredSubjectsBySemester.filter(subject =>
    subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.professor.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 20); // 최대 20개만 표시

  // 총 학점 계산
  const totalCredits = calculateTotalCredits(selectedSubjects);

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
                <span>총 {selectedSubjects.length}과목</span>
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
              <h3>개설 과목 목록</h3>
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
                    </CourseInfo>
                    <AddButton onClick={() => addSubject(subject)}>
                      <FiPlus size={18} />
                    </AddButton>
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
                총 {selectedSubjects.length}과목 / {totalCredits} 학점
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
    font-family: ${props => props.theme.typography.T4.fontFamily};
    font-size: ${props => props.theme.typography.T4.fontSize};
    font-weight: ${props => props.theme.typography.T4.fontWeight};
    color: ${props => props.theme.colors.black};
    margin: 0;
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
  max-height: 40vh; // 화면 높이의 40%로 제한

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

const AddButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.purple[100]};
  color: ${props => props.theme.colors.primary};
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  margin-left: 12px;

  &:hover {
    background-color: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.white};
    transform: scale(1.1);
  }
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
  max-height: 40vh; // 화면 높이의 30%로 제한
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

export default MainPage;