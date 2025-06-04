// src/pages/CoursesPage.tsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiFilter, FiChevronDown, FiCheckCircle, FiPlus, FiSearch, FiBook, FiClock, FiUser, FiMapPin, FiInfo, FiStar, FiActivity, FiBookOpen, FiX } from 'react-icons/fi';
import Layout from '../components/Layout';
import { MenuItemType } from '../components/Sidebar';
import { Subject } from '../types/subject';
import { useSemester } from '../contexts/SemesterContext';
import { useTimetable } from '../contexts/TimetableContext';
import { 
  processSubjectData, 
  formatScheduleString,
  getFilterOptions,
  searchSubjects,
  filterSubjectsBySemester,
  getCourseDescription,
  calculateSubjectRating,
  getSubjectReviews,
  getRatingColor
} from '../utils/subjectUtils';

const CoursesPage: React.FC = () => {
  const [activeMenuItem, setActiveMenuItem] = useState<MenuItemType>('courses');
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [filteredSubjectsBySemester, setFilteredSubjectsBySemester] = useState<Subject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [department, setDepartment] = useState('All');
  const [category, setCategory] = useState('All');
  const [isEnglish, setIsEnglish] = useState<boolean | undefined>(undefined);
  
  // 각 필터의 드롭다운 상태 분리
  const [departmentFilterOpen, setDepartmentFilterOpen] = useState(false);
  const [categoryFilterOpen, setCategoryFilterOpen] = useState(false);
  const [languageFilterOpen, setLanguageFilterOpen] = useState(false);
  
  // 페이지네이션 상태 추가
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 30;
  
  const [departments, setDepartments] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // 학기 Context 사용
  const { currentSemester } = useSemester();
  const { addSubject } = useTimetable();

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
      
      // 필터 옵션 설정 (현재 학기에 맞게)
      const { departments, categories } = getFilterOptions(semesterSubjects);
      setDepartments(departments);
      setCategories(categories);
      
      console.log(`${currentSemester} 과목 데이터 로드됨: ${semesterSubjects.length}개`);
    }
  }, [currentSemester, allSubjects]);

  // 메뉴 아이템 클릭 핸들러
  const handleMenuItemClick = (item: MenuItemType) => {
    setActiveMenuItem(item);
  };

  // 검색 핸들러
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // 검색 시 페이지 리셋
  };

  // 필터 초기화
  const resetFilters = () => {
    setDepartment('All');
    setCategory('All');
    setIsEnglish(undefined);
    setSearchQuery('');
    setCurrentPage(1); // 필터 초기화 시 페이지 리셋
    // 모든 드롭다운 닫기
    setDepartmentFilterOpen(false);
    setCategoryFilterOpen(false);
    setLanguageFilterOpen(false);
  };

  // 모든 드롭다운 닫기 (다른 드롭다운 클릭 시)
  const closeAllDropdowns = () => {
    setDepartmentFilterOpen(false);
    setCategoryFilterOpen(false);
    setLanguageFilterOpen(false);
  };

  // 개설학과 필터 토글
  const toggleDepartmentFilter = () => {
    closeAllDropdowns();
    setDepartmentFilterOpen(!departmentFilterOpen);
  };

  // 과목구분 필터 토글
  const toggleCategoryFilter = () => {
    closeAllDropdowns();
    setCategoryFilterOpen(!categoryFilterOpen);
  };

  // 영어강의 필터 토글
  const toggleLanguageFilter = () => {
    closeAllDropdowns();
    setLanguageFilterOpen(!languageFilterOpen);
  };

  // 검색 결과 필터링 - 현재 학기 과목 중에서만 검색 및 필터링
  const allFilteredSubjects = searchSubjects(filteredSubjectsBySemester, searchQuery, {
    department,
    category,
    isEnglish
  });

  // 페이지네이션 계산
  const totalPages = Math.ceil(allFilteredSubjects.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPageSubjects = allFilteredSubjects.slice(startIndex, endIndex);

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 페이지 변경 시 스크롤을 상단으로 이동
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 페이지 번호 배열 생성 (최대 5개 페이지 표시)
  const getVisiblePages = () => {
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  // 과목 추가 핸들러 (실제 구현에서는 시간표에 추가하는 로직 필요)
  const handleAddCourse = (subject: Subject) => {
    const result = addSubject(subject);
    alert(result.message);
  };

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
        <PageHeader>
          <h2>개설 과목 목록</h2>
          <p>{currentSemester} 개설 과목입니다. 과목을 검색하고 시간표에 추가하세요.</p>
        </PageHeader>
        
        <SearchFilterSection>
          <SearchContainer>
            <SearchIcon>
              <FiSearch size={16} />
            </SearchIcon>
            <SearchInput 
              placeholder="과목명, 교수명, 과목코드 검색..." 
              value={searchQuery}
              onChange={handleSearch}
            />
          </SearchContainer>
          
          <FilterContainer>
            {/* 개설학과 필터 */}
            <FilterButton 
              onClick={toggleDepartmentFilter}
              active={department !== 'All'}
            >
              <FiFilter size={16} />
              <span>개설학과</span>
              {department !== 'All' && <FilterCount>1</FilterCount>}
              <FiChevronDown 
                size={16} 
                style={{ transform: departmentFilterOpen ? 'rotate(180deg)' : 'none' }} 
              />
            </FilterButton>
            
            {departmentFilterOpen && (
              <FilterDropdown>
                <FilterSection>
                  <FilterTitle>개설학과</FilterTitle>
                  <FilterOptions>
                    {departments.map(dept => (
                      <FilterOption 
                        key={dept} 
                        selected={department === dept}
                        onClick={() => {
                          setDepartment(dept);
                          setCurrentPage(1); // 필터 변경 시 페이지 리셋
                          setDepartmentFilterOpen(false);
                        }}
                      >
                        {department === dept && <FiCheckCircle size={16} />}
                        <span>{dept}</span>
                      </FilterOption>
                    ))}
                  </FilterOptions>
                </FilterSection>
              </FilterDropdown>
            )}
          </FilterContainer>

          <FilterContainer>
            {/* 과목구분 필터 */}
            <FilterButton 
              onClick={toggleCategoryFilter}
              active={category !== 'All'}
            >
              <FiBook size={16} />
              <span>과목구분</span>
              {category !== 'All' && <FilterCount>1</FilterCount>}
              <FiChevronDown 
                size={16} 
                style={{ transform: categoryFilterOpen ? 'rotate(180deg)' : 'none' }} 
              />
            </FilterButton>
            
            {categoryFilterOpen && (
              <FilterDropdown>
                <FilterSection>
                  <FilterTitle>과목구분</FilterTitle>
                  <FilterOptions>
                    {categories.map(cat => (
                      <FilterOption 
                        key={cat} 
                        selected={category === cat}
                        onClick={() => {
                          setCategory(cat);
                          setCurrentPage(1); // 필터 변경 시 페이지 리셋
                          setCategoryFilterOpen(false);
                        }}
                      >
                        {category === cat && <FiCheckCircle size={16} />}
                        <span>{cat}</span>
                      </FilterOption>
                    ))}
                  </FilterOptions>
                </FilterSection>
              </FilterDropdown>
            )}
          </FilterContainer>

          <FilterContainer>
            {/* 영어강의 필터 */}
            <FilterButton 
              onClick={toggleLanguageFilter}
              active={isEnglish !== undefined}
            >
              <span style={{ fontSize: '16px' }}>🌐</span>
              <span>영어강의</span>
              {isEnglish !== undefined && <FilterCount>1</FilterCount>}
              <FiChevronDown 
                size={16} 
                style={{ transform: languageFilterOpen ? 'rotate(180deg)' : 'none' }} 
              />
            </FilterButton>
            
            {languageFilterOpen && (
              <FilterDropdown>
                <FilterSection>
                  <FilterTitle>영어 강의</FilterTitle>
                  <FilterOptions>
                    <FilterOption 
                      selected={isEnglish === undefined}
                      onClick={() => {
                        setIsEnglish(undefined);
                        setCurrentPage(1); // 필터 변경 시 페이지 리셋
                        setLanguageFilterOpen(false);
                      }}
                    >
                      {isEnglish === undefined && <FiCheckCircle size={16} />}
                      <span>전체</span>
                    </FilterOption>
                    <FilterOption 
                      selected={isEnglish === true}
                      onClick={() => {
                        setIsEnglish(true);
                        setCurrentPage(1); // 필터 변경 시 페이지 리셋
                        setLanguageFilterOpen(false);
                      }}
                    >
                      {isEnglish === true && <FiCheckCircle size={16} />}
                      <span>영어 강의만</span>
                    </FilterOption>
                    <FilterOption 
                      selected={isEnglish === false}
                      onClick={() => {
                        setIsEnglish(false);
                        setCurrentPage(1); // 필터 변경 시 페이지 리셋
                        setLanguageFilterOpen(false);
                      }}
                    >
                      {isEnglish === false && <FiCheckCircle size={16} />}
                      <span>한국어 강의만</span>
                    </FilterOption>
                  </FilterOptions>
                </FilterSection>
              </FilterDropdown>
            )}
          </FilterContainer>

          {/* 필터 초기화 버튼 */}
          {(department !== 'All' || category !== 'All' || isEnglish !== undefined || searchQuery) && (
            <ResetButton onClick={resetFilters}>
              <FiX size={16} />
              초기화
            </ResetButton>
          )}
        </SearchFilterSection>
        
        <ResultsInfo>
          총 <strong>{allFilteredSubjects.length}</strong>개 과목
          {department !== 'All' && <FilterTag>{department}</FilterTag>}
          {category !== 'All' && <FilterTag>{category}</FilterTag>}
          {isEnglish !== undefined && <FilterTag>{isEnglish ? '영어 강의' : '한국어 강의'}</FilterTag>}
          {totalPages > 1 && (
            <span> (페이지 {currentPage} / {totalPages})</span>
          )}
        </ResultsInfo>
        
        <CoursesGrid>
          {currentPageSubjects.length > 0 ? (
            currentPageSubjects.map(subject => {
              // 리뷰 평점 데이터 가져오기
              const rating = calculateSubjectRating(subject);
              
              return (
                <CourseCard key={subject.id}>
                  <CourseHeader>
                    <CourseCode>{subject.code}</CourseCode>
                    <CourseSection>{subject.section}분반</CourseSection>
                  </CourseHeader>
                  <CourseBody>
                    <CourseName>{subject.name}</CourseName>
                    <CourseDetail>
                      <FiUser size={14} />
                      <span>{subject.professor}</span>
                    </CourseDetail>
                    <CourseDetail>
                      <FiBook size={14} />
                      <span>{subject.credits} 학점 ({subject.category})</span>
                    </CourseDetail>
                    <CourseDetail>
                      <FiClock size={14} />
                      <span>{formatScheduleString(subject.schedules)}</span>
                    </CourseDetail>
                    {subject.classroom && (
                      <CourseDetail>
                        <FiMapPin size={14} />
                        <span>{subject.classroom}</span>
                      </CourseDetail>
                    )}
                    
                    {/* 과목 설명 */}
                    <CourseDescription>
                      <FiInfo size={14} />
                      <span>
                        {(() => {
                          const description = getCourseDescription(subject.code);
                          return description.length > 100
                            ? `${description.substring(0, 100)}...`
                            : description;
                        })()}
                      </span>
                    </CourseDescription>
                    
                  {/* 과목 평점 표시 (있는 경우에만) */}
                  {rating && (
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
                  )}
                    
                    <CourseBadges>
                      {subject.isEnglish && <CourseBadge color="#E5E2FD">영어 강의</CourseBadge>}
                      <CourseBadge color="#F8F8F8">현재 {subject.currentStudents}명 수강</CourseBadge>
                      {subject.note && (
                        <CourseBadge color="#FDE2E2">
                          {subject.note}
                        </CourseBadge>
                      )}
                    </CourseBadges>
                  </CourseBody>
                  <CourseFooter>
                    <ButtonGroup>
                      <MoreButton onClick={() => openSubjectModal(subject)}>
                        <FiInfo size={16} />
                        리뷰 상세
                      </MoreButton>
                      <AddButton onClick={() => handleAddCourse(subject)}>
                        <FiPlus size={16} />
                        시간표에 추가
                      </AddButton>
                    </ButtonGroup>
                  </CourseFooter>
                </CourseCard>
              );
            })
          ) : (
            <EmptyState>
              <EmptyStateText>
                {searchQuery || department !== 'All' || category !== 'All' || isEnglish !== undefined
                  ? '검색 결과가 없습니다.'
                  : `${currentSemester}에 개설된 과목이 없습니다.`}
              </EmptyStateText>
              {(searchQuery || department !== 'All' || category !== 'All' || isEnglish !== undefined) && (
                <EmptyStateAction onClick={resetFilters}>
                  필터 초기화
                </EmptyStateAction>
              )}
            </EmptyState>
          )}
        </CoursesGrid>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <PaginationContainer>
            <PaginationButton
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              처음
            </PaginationButton>
            <PaginationButton
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              이전
            </PaginationButton>
            
            {getVisiblePages().map(page => (
              <PaginationButton
                key={page}
                onClick={() => handlePageChange(page)}
                active={currentPage === page}
              >
                {page}
              </PaginationButton>
            ))}
            
            <PaginationButton
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              다음
            </PaginationButton>
            <PaginationButton
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              마지막
            </PaginationButton>
          </PaginationContainer>
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
                  handleAddCourse(selectedSubject);
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

const SearchFilterSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  min-width: 250px;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors.gray[600]};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 12px 10px 36px;
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

const FilterContainer = styled.div`
  position: relative;
`;

const FilterButton = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background-color: ${props => props.active ? props.theme.colors.purple[100] : props.theme.colors.white};
  border: 1px solid ${props => props.active ? props.theme.colors.primary : props.theme.colors.gray[200]};
  border-radius: 4px;
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.gray[600]};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.active ? props.theme.colors.purple[100] : props.theme.colors.gray[100]};
    border-color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.gray[300]};
  }
`;

const FilterCount = styled.span`
  background-color: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.white};
  font-size: ${props => props.theme.typography.T7.fontSize};
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FilterDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 10;
  width: 280px;
  background-color: ${props => props.theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-top: 8px;
  padding: 16px;
  border: 1px solid ${props => props.theme.colors.gray[200]};
`;

const FilterSection = styled.div`
  margin-bottom: 0;
`;

const FilterTitle = styled.div`
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  font-weight: 600;
  color: ${props => props.theme.colors.black};
  margin-bottom: 12px;
`;

const FilterOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
`;

const FilterOption = styled.div<{ selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  color: ${props => props.selected ? props.theme.colors.primary : props.theme.colors.gray[600]};
  background-color: ${props => props.selected ? props.theme.colors.purple[100] : 'transparent'};
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.selected ? props.theme.colors.purple[100] : props.theme.colors.gray[100]};
  }

  svg {
    color: ${props => props.theme.colors.primary};
  }
`;

const ResetButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  background-color: ${props => props.theme.colors.white};
  color: ${props => props.theme.colors.gray[600]};
  border: 1px solid ${props => props.theme.colors.gray[300]};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.theme.colors.gray[100]};
    color: ${props => props.theme.colors.gray[600]};
  }
`;

const ResultsInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  color: ${props => props.theme.colors.gray[600]};
`;

const FilterTag = styled.div`
  display: inline-block;
  padding: 4px 8px;
  background-color: ${props => props.theme.colors.purple[100]};
  color: ${props => props.theme.colors.primary};
  border-radius: 4px;
  font-size: ${props => props.theme.typography.T7.fontSize};
  font-weight: 600;
`;

const CoursesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
`;

const CourseCard = styled.div`
  background-color: ${props => props.theme.colors.white};
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  height: 100%;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const CourseHeader = styled.div`
  background-color: ${props => props.theme.colors.primary};
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CourseCode = styled.div`
  font-family: ${props => props.theme.typography.T5.fontFamily};
  font-size: ${props => props.theme.typography.T5.fontSize};
  font-weight: 600;
  color: ${props => props.theme.colors.white};
`;

const CourseSection = styled.div`
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  color: ${props => props.theme.colors.white};
  background-color: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
`;

const CourseBody = styled.div`
  padding: 16px;
  flex: 1;
`;

const CourseName = styled.div`
  font-family: ${props => props.theme.typography.T4.fontFamily};
  font-size: ${props => props.theme.typography.T4.fontSize};
  font-weight: 600;
  color: ${props => props.theme.colors.black};
  margin-bottom: 12px;
  line-height: 1.3;
`;

const CourseDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  color: ${props => props.theme.colors.gray[600]};
`;

const CourseBadges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
`;

const CourseBadge = styled.div<{ color: string }>`
  font-family: ${props => props.theme.typography.T7.fontFamily};
  font-size: ${props => props.theme.typography.T7.fontSize};
  font-weight: 500;
  color: ${props => props.theme.colors.gray[600]};
  background-color: ${props => props.color};
  padding: 4px 8px;
  border-radius: 4px;
`;

const CourseFooter = styled.div`
  padding: 12px 16px;
  border-top: 1px solid ${props => props.theme.colors.gray[200]};
`;

const EmptyState = styled.div`
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background-color: ${props => props.theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const EmptyStateText = styled.div`
  font-family: ${props => props.theme.typography.T5.fontFamily};
  font-size: ${props => props.theme.typography.T5.fontSize};
  color: ${props => props.theme.colors.gray[600]};
  margin-bottom: 16px;
`;

const EmptyStateAction = styled.button`
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;

  &:hover {
    background-color: ${props => props.theme.colors.purple[100]};
  }
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

// 페이지네이션 스타일
const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 32px;
  padding: 24px 0;
`;

const PaginationButton = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
  padding: 0 12px;
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  font-weight: ${props => props.active ? '600' : '400'};
  background-color: ${props => {
    if (props.active) return props.theme.colors.primary;
    return props.theme.colors.white;
  }};
  color: ${props => {
    if (props.active) return props.theme.colors.white;
    return props.theme.colors.gray[600];
  }};
  border: 1px solid ${props => {
    if (props.active) return props.theme.colors.primary;
    return props.theme.colors.gray[200];
  }};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background-color: ${props => {
      if (props.active) return props.theme.colors.primary;
      return props.theme.colors.purple[100];
    }};
    border-color: ${props => {
      if (props.active) return props.theme.colors.primary;
      return props.theme.colors.primary;
    }};
    color: ${props => {
      if (props.active) return props.theme.colors.white;
      return props.theme.colors.primary;
    }};
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(163, 50, 255, 0.2);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

export default CoursesPage;