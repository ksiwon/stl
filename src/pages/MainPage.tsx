// src/pages/MainPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiPlus, FiInfo, FiClock, FiUser, FiMapPin, FiStar, FiActivity, FiBookOpen, FiDownload, FiShare } from 'react-icons/fi';
import { toPng, toBlob } from 'html-to-image';
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
  const timetableWrapperRef = useRef<HTMLDivElement>(null);
  const [gridDimensions, setGridDimensions] = useState({ width: 0, timeColWidth: 70 });

  // 학기 Context 사용
  const { currentSemester } = useSemester();

  // 모달 상태
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSurveyPopup, setShowSurveyPopup] = useState(true);

  // 토스트 메시지 표시 함수
  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    const toast = document.createElement('div');
    toast.textContent = message;
    
    const colors = {
      success: { bg: '#10B981', text: '#ffffff' },
      error: { bg: '#EF4444', text: '#ffffff' },
      warning: { bg: '#F59E0B', text: '#ffffff' }
    };
    
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type].bg};
      color: ${colors[type].text};
      padding: 12px 16px;
      border-radius: 4px;
      z-index: 1000;
      font-family: Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideInRight 0.3s ease-out;
    `;
    
    // 애니메이션 추가
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    if (!document.head.querySelector('style[data-toast-animations]')) {
      style.setAttribute('data-toast-animations', 'true');
      document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    // 3초 후 제거
    setTimeout(() => {
      if (document.body.contains(toast)) {
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast);
          }
        }, 300);
      }
    }, 3000);
  };

  // PNG로 저장하는 함수
  const handleSaveTimetable = async () => {
    if (!timetableWrapperRef.current) return;

    try {
      showToast('시간표를 저장하는 중...', 'success');

      const dataUrl = await toPng(timetableWrapperRef.current, {
        cacheBust: true,
        filter: (node) => {
          // HTMLElement인 경우에만 classList 검사
          if (node instanceof HTMLElement) {
            return (
              !node.classList.contains('remove-button') &&
              !node.classList.contains('tooltip')
            );
          }
          // 텍스트 노드 등은 그대로 렌더
          return true;
        },
      });

      const link = document.createElement('a');
      link.download = `시간표_${currentSemester}_${new Date()
        .toISOString()
        .slice(0, 10)}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('시간표가 저장되었습니다!', 'success');
    } catch (error) {
      console.error('저장 중 오류:', error);
      showToast('시간표 저장에 실패했습니다.', 'error');
    }
  };

  // 클립보드에 복사하는 함수
  const handleCopyTimetable = async () => {
    if (!timetableWrapperRef.current) return;

    try {
      showToast('시간표를 복사하는 중...', 'success');

      const blob = await toBlob(timetableWrapperRef.current, {
        cacheBust: true,
        filter: (node) => {
          if (node instanceof HTMLElement) {
            return (
              !node.classList.contains('remove-button') &&
              !node.classList.contains('tooltip')
            );
          }
          return true;
        },
      });
      if (!blob) throw new Error('이미지 생성 실패');

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      showToast('클립보드에 복사되었습니다!', 'success');
    } catch (error) {
      console.error('복사 중 오류:', error);
      showToast('복사에 실패했습니다. 다운로드로 저장합니다.', 'warning');

      // 대체 다운로드 로직
      try {
        const dataUrl = await toPng(timetableWrapperRef.current, {
          cacheBust: true,
          filter: (node) => {
            if (node instanceof HTMLElement) {
              return (
                !node.classList.contains('remove-button') &&
                !node.classList.contains('tooltip')
              );
            }
            return true;
          },
        });
        const link = document.createElement('a');
        link.download = `시간표_${currentSemester}_${new Date()
          .toISOString()
          .slice(0, 10)}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        console.error('다운로드 실패:', e);
      }
    }
  };

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

  const handleCloseSurveyPopup = (dontShowAgain = false) => {
    setShowSurveyPopup(false);
    if (dontShowAgain) {
      localStorage.setItem('stl-survey-seen', 'true');
    }
  };

  const handleGoToSurvey = () => {
    window.open('https://forms.gle/6nN4QEw9mA4hx2jR7', '_blank');
    handleCloseSurveyPopup(true);
  };

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
                <TimetableButton onClick={handleSaveTimetable}>
                  <FiDownload size={16} />
                  저장
                </TimetableButton>
                <TimetableButton onClick={handleCopyTimetable}>
                  <FiShare size={16} />
                  공유
                </TimetableButton>
              </ActionButtons>
            </TimetableHeader>

            {/* 시간표 그리드와 과목 블록 */}
            <TimetableWrapper ref={timetableWrapperRef}>
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

              {/* 과목 블록 */}
              {selectedSubjects.map(subject => (
                subject.schedules.map((schedule, index) => {
                  const dayIndex = schedule.day;
                  const startFromNine = schedule.startTime - (9 * 60); // 9시부터의 분 차이
                  const duration = schedule.endTime - schedule.startTime; // 지속 시간 (분)
                  
                  // 다섯 개 요일 칸 너비 계산
                  const dayColumnWidth = (gridDimensions.width - gridDimensions.timeColWidth) / 5;
                  
                  // 요일 칸 시작 위치 계산 (시간 칸 너비 + 해당 요일 위치)
                  const left = gridDimensions.timeColWidth + (dayIndex * dayColumnWidth);
                  
                  // 상단 위치 계산: 헤더(30px) + (9시부터의 분/30분 단위) * 30px
                  const top = 30 + (startFromNine / 30) * 30;
                  
                  // 높이 계산: (지속 시간/30분 단위) * 30px
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
                      <RemoveButton 
                        className="remove-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setHoveredSubject(null);
                          removeSubject(subject.id);
                        }}
                      >
                        <FiX size={14} />
                      </RemoveButton>
                    </CourseBlock>
                  );
                })
              ))}
            </TimetableWrapper>

            {/* 툴팁 */}
            {hoveredSubject && (
              <SubjectTooltip className="tooltip">
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

          {/* 내 수업 목록 */}
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

        {showSurveyPopup && (
          <SurveyPopup>
            <SurveyPopupOverlay onClick={() => handleCloseSurveyPopup()} />
            <SurveyPopupContent>
              <SurveyPopupHeader>
                <SurveyPopupTitle>STL 프로젝트에 오신 것을 환영합니다! 🎉</SurveyPopupTitle>
                <SurveyPopupCloseButton onClick={() => handleCloseSurveyPopup()}>
                  <FiX size={20} />
                </SurveyPopupCloseButton>
              </SurveyPopupHeader>
              
              <SurveyPopupBody>
                <SurveyPopupText>
                  안녕하세요, STL 개발자 <SurveyPopupHighlight>22학번 박정원</SurveyPopupHighlight>입니다.
                </SurveyPopupText>
                <SurveyPopupText>
                  STL(Siwon's Timetable Linker)은 <SurveyPopupHighlight>[ID430] AI Human Behavior 수업의 개인 프로젝트</SurveyPopupHighlight>로, 
                  AI가 자동으로 시간표를 만들어주는 플랫폼입니다.
                </SurveyPopupText>
                
                <SurveyPopupText>
                  매 학기마다 OTL 후기 비교하고, 포탈에서 개설 과목 하나하나 찾아보느라 시간표 짜기 정말 번거롭지 않으셨나요? 
                  이 문제를 해결하고자 STL 프로젝트를 시작했습니다!
                </SurveyPopupText>
                
                <SurveyPopupDivider />
                
                <SurveyPopupText>
                  👉 해당 설문은 STL 서비스를 사용해본 후 간단한 피드백을 받기 위한 것입니다.<br />
                  👉 <SurveyPopupHighlight>모든 응답은 익명으로 처리되며</SurveyPopupHighlight>, 서비스 개선에만 활용됩니다.
                </SurveyPopupText>
                
                <SurveyPopupText>
                  <SurveyPopupHighlight>5분 내외</SurveyPopupHighlight>로 작성 가능하니, 많은 참여 부탁드립니다! 😊 감사합니다!
                </SurveyPopupText>
              </SurveyPopupBody>
              
              <SurveyPopupFooter>
                <SurveyPopupButtonPrimary onClick={handleGoToSurvey}>
                  설문 참여하기
                </SurveyPopupButtonPrimary>
              </SurveyPopupFooter>
            </SurveyPopupContent>
          </SurveyPopup>
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

// Styled Components - Theme 적용
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
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  font-weight: ${props => props.theme.typography.T6.fontWeight};
  background-color: ${props => props.theme.colors.white};
  color: ${props => props.theme.colors.primary};
  border: 1px solid ${props => props.theme.colors.primary};
  border-radius: 6px;
  padding: 8px 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    background-color: ${props => props.theme.colors.purple[100]};
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(163, 50, 255, 0.2);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const TimetableWrapper = styled.div`
  position: relative;
  width: 100%;
  height: auto;
  background-color: ${props => props.theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  
  /* 캡처 모드일 때 깔끔한 스타일 */
  &.capture-mode {
    border: 1px solid ${props => props.theme.colors.gray[200]};
    
    .remove-button {
      display: none !important;
    }
    
    .tooltip {
      display: none !important;
    }
  }
`;

const TimetableGrid = styled.div`
  display: grid;
  grid-template-columns: 70px repeat(5, 1fr);
  grid-auto-rows: 30px; // 각 행이 30px (30분 단위)
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
  max-height: 60vh;
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
  max-height: 60vh;

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
  flex: 1;

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
  flex: 1;

  &:hover {
    background-color: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.white};
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
  max-height: 60vh;
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

const SurveyPopup = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SurveyPopupOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
`;

const SurveyPopupContent = styled.div`
  position: relative;
  background-color: ${props => props.theme.colors.white};
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(163, 50, 255, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 201;
  border: 2px solid ${props => props.theme.colors.purple[100]};
`;

const SurveyPopupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}, #8A2BD9);
  color: ${props => props.theme.colors.white};
`;

const SurveyPopupTitle = styled.h2`
  font-family: ${props => props.theme.typography.T3.fontFamily};
  font-size: ${props => props.theme.typography.T3.fontSize};
  font-weight: ${props => props.theme.typography.T3.fontWeight};
  margin: 0;
  color: ${props => props.theme.colors.white};
`;

const SurveyPopupCloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.white};
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const SurveyPopupBody = styled.div`
  padding: 24px;
  overflow-y: auto;
  flex: 1;
`;

const SurveyPopupText = styled.p`
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  font-weight: ${props => props.theme.typography.T6.fontWeight};
  line-height: ${props => props.theme.typography.T6.lineHeight};
  color: ${props => props.theme.colors.black};
  margin: 0 0 16px 0;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SurveyPopupHighlight = styled.span`
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
`;

const SurveyPopupDivider = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${props => props.theme.colors.gray[200]};
  margin: 20px 0;
`;

const SurveyPopupFooter = styled.div`
  padding: 20px 24px;
  border-top: 1px solid ${props => props.theme.colors.gray[200]};
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  background-color: ${props => props.theme.colors.gray[100]};
`;

const SurveyPopupButtonPrimary = styled.button`
  padding: 10px 20px;
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  font-weight: 600;
  background-color: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.white};
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(163, 50, 255, 0.3);

  &:hover {
    background-color: #8A2BD9;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(163, 50, 255, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

export default MainPage;