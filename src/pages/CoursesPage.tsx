// src/pages/CoursesPage.tsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiFilter, FiChevronDown, FiCheckCircle, FiPlus, FiSearch, FiBook, FiClock, FiUser, FiMapPin } from 'react-icons/fi';
import Layout from '../components/Layout';
import { MenuItemType } from '../components/Sidebar';
import { Subject } from '../types/subject';
import { useSemester } from '../contexts/SemesterContext';
import { 
  processSubjectData, 
  formatScheduleString,
  getFilterOptions,
  searchSubjects,
  filterSubjectsBySemester
} from '../utils/subjectUtils';

const CoursesPage: React.FC = () => {
  const [activeMenuItem, setActiveMenuItem] = useState<MenuItemType>('courses');
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [filteredSubjectsBySemester, setFilteredSubjectsBySemester] = useState<Subject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [department, setDepartment] = useState('All');
  const [category, setCategory] = useState('All');
  const [isEnglish, setIsEnglish] = useState<boolean | undefined>(undefined);
  const [filterOpen, setFilterOpen] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

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
  };

  // 필터 초기화
  const resetFilters = () => {
    setDepartment('All');
    setCategory('All');
    setIsEnglish(undefined);
    setSearchQuery('');
  };

  // 검색 결과 필터링 - 현재 학기 과목 중에서만 검색 및 필터링
  const filteredSubjects = searchSubjects(filteredSubjectsBySemester, searchQuery, {
    department,
    category,
    isEnglish
  });

  // 과목 추가 핸들러 (실제 구현에서는 시간표에 추가하는 로직 필요)
  const addCourse = (subject: Subject) => {
    console.log('Adding course:', subject);
    alert(`'${subject.name}' 과목이 시간표에 추가되었습니다.`);
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
            <FilterButton onClick={() => setFilterOpen(!filterOpen)}>
              <FiFilter size={16} />
              <span>필터</span>
              <FiChevronDown size={16} style={{ transform: filterOpen ? 'rotate(180deg)' : 'none' }} />
            </FilterButton>
            
            {filterOpen && (
              <FilterDropdown>
                <FilterSection>
                  <FilterTitle>개설학과</FilterTitle>
                  <FilterOptions>
                    {departments.map(dept => (
                      <FilterOption 
                        key={dept} 
                        selected={department === dept}
                        onClick={() => setDepartment(dept)}
                      >
                        {department === dept && <FiCheckCircle size={16} />}
                        <span>{dept}</span>
                      </FilterOption>
                    ))}
                  </FilterOptions>
                </FilterSection>
                
                <FilterDivider />
                
                <FilterSection>
                  <FilterTitle>과목구분</FilterTitle>
                  <FilterOptions>
                    {categories.map(cat => (
                      <FilterOption 
                        key={cat} 
                        selected={category === cat}
                        onClick={() => setCategory(cat)}
                      >
                        {category === cat && <FiCheckCircle size={16} />}
                        <span>{cat}</span>
                      </FilterOption>
                    ))}
                  </FilterOptions>
                </FilterSection>
                
                <FilterDivider />
                
                <FilterSection>
                  <FilterTitle>영어 강의</FilterTitle>
                  <FilterOptions>
                    <FilterOption 
                      selected={isEnglish === undefined}
                      onClick={() => setIsEnglish(undefined)}
                    >
                      {isEnglish === undefined && <FiCheckCircle size={16} />}
                      <span>전체</span>
                    </FilterOption>
                    <FilterOption 
                      selected={isEnglish === true}
                      onClick={() => setIsEnglish(true)}
                    >
                      {isEnglish === true && <FiCheckCircle size={16} />}
                      <span>영어 강의만</span>
                    </FilterOption>
                    <FilterOption 
                      selected={isEnglish === false}
                      onClick={() => setIsEnglish(false)}
                    >
                      {isEnglish === false && <FiCheckCircle size={16} />}
                      <span>한국어 강의만</span>
                    </FilterOption>
                  </FilterOptions>
                </FilterSection>
                
                <FilterActions>
                  <ResetButton onClick={resetFilters}>초기화</ResetButton>
                </FilterActions>
              </FilterDropdown>
            )}
          </FilterContainer>
        </SearchFilterSection>
        
        <ResultsInfo>
          총 <strong>{filteredSubjects.length}</strong>개 과목
          {department !== 'All' && <FilterTag>{department}</FilterTag>}
          {category !== 'All' && <FilterTag>{category}</FilterTag>}
          {isEnglish !== undefined && <FilterTag>{isEnglish ? '영어 강의' : '한국어 강의'}</FilterTag>}
        </ResultsInfo>
        
        <CoursesGrid>
          {filteredSubjects.length > 0 ? (
            filteredSubjects.map(subject => (
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
                  <AddButton onClick={() => addCourse(subject)}>
                    <FiPlus size={16} />
                    시간표에 추가
                  </AddButton>
                </CourseFooter>
              </CourseCard>
            ))
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
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
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

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background-color: ${props => props.theme.colors.white};
  border: 1px solid ${props => props.theme.colors.gray[200]};
  border-radius: 4px;
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  color: ${props => props.theme.colors.gray[600]};
  cursor: pointer;

  &:hover {
    background-color: ${props => props.theme.colors.gray[100]};
  }
`;

const FilterDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 10;
  width: 320px;
  background-color: ${props => props.theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-top: 8px;
  padding: 16px;
`;

const FilterSection = styled.div`
  margin-bottom: 16px;
`;

const FilterTitle = styled.div`
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  font-weight: 600;
  color: ${props => props.theme.colors.black};
  margin-bottom: 8px;
`;

const FilterOptions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const FilterOption = styled.div<{ selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  cursor: pointer;
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  color: ${props => props.selected ? props.theme.colors.primary : props.theme.colors.gray[600]};
  background-color: ${props => props.selected ? props.theme.colors.purple[100] : props.theme.colors.gray[100]};
  border-radius: 4px;

  &:hover {
    background-color: ${props => props.selected ? props.theme.colors.purple[100] : props.theme.colors.gray[200]};
  }
`;

const FilterDivider = styled.div`
  height: 1px;
  background-color: ${props => props.theme.colors.gray[200]};
  margin: 12px 0;
`;

const FilterActions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
`;

const ResetButton = styled.button`
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  background-color: ${props => props.theme.colors.white};
  color: ${props => props.theme.colors.primary};
  border: 1px solid ${props => props.theme.colors.primary};
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;

  &:hover {
    background-color: ${props => props.theme.colors.purple[100]};
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

const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
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

  &:hover {
    background-color: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.white};
  }
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

export default CoursesPage;