// components/CourseList.tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { FiSearch, FiPlus } from 'react-icons/fi';

interface Course {
  id: string;
  code: string;
  name: string;
  professor: string;
  credits: number;
  schedule: {
    day: number;
    startTime: number;
    endTime: number;
  }[];
  color: string;
}

interface CourseListProps {
  onAddCourse: (course: Course) => void;
}

const CourseList: React.FC<CourseListProps> = ({ onAddCourse }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock data for demonstration
  const courses: Course[] = [
    {
      id: '1',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      professor: 'Prof. Kim',
      credits: 3,
      schedule: [{ day: 0, startTime: 60, endTime: 150 }, { day: 2, startTime: 60, endTime: 150 }],
      color: '#F2E3FF'
    },
    {
      id: '2',
      code: 'MATH101',
      name: 'Calculus I',
      professor: 'Prof. Lee',
      credits: 3,
      schedule: [{ day: 1, startTime: 180, endTime: 270 }, { day: 3, startTime: 180, endTime: 270 }],
      color: '#E5E2FD'
    },
    {
      id: '3',
      code: 'PHYS101',
      name: 'Physics I',
      professor: 'Prof. Park',
      credits: 4,
      schedule: [{ day: 0, startTime: 300, endTime: 390 }, { day: 2, startTime: 300, endTime: 390 }, { day: 4, startTime: 300, endTime: 390 }],
      color: '#FDE2E2'
    },
  ];

  const filteredCourses = courses.filter(course => 
    course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.professor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <CourseListContainer>
      <CourseListHeader>
        <h2>Available Courses</h2>
      </CourseListHeader>
      
      <SearchContainer>
        <SearchIcon>
          <FiSearch size={16} />
        </SearchIcon>
        <SearchInput
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </SearchContainer>
      
      <CourseListItems>
        {filteredCourses.map(course => (
          <CourseItem key={course.id}>
            <CourseInfo>
              <CourseCode>{course.code}</CourseCode>
              <CourseName>{course.name}</CourseName>
              <CourseDetails>
                <span>{course.professor}</span>
                <span>•</span>
                <span>{course.credits} credits</span>
              </CourseDetails>
            </CourseInfo>
            <AddButton onClick={() => onAddCourse(course)}>
              <FiPlus size={18} />
            </AddButton>
          </CourseItem>
        ))}
      </CourseListItems>
    </CourseListContainer>
  );
};

const CourseListContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const CourseListHeader = styled.div`
  margin-bottom: 20px;

  h2 {
    font-family: ${props => props.theme.typography.T3.fontFamily};
    font-size: ${props => props.theme.typography.T3.fontSize};
    font-weight: ${props => props.theme.typography.T3.fontWeight};
    color: ${props => props.theme.colors.black};
    margin: 0;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 16px;
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

const CourseListItems = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const CourseItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: ${props => props.theme.colors.white};
  border-radius: 8px;
  margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  }
`;

const CourseInfo = styled.div`
  flex: 1;
`;

const CourseCode = styled.div`
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 4px;
`;

const CourseName = styled.div`
  font-family: ${props => props.theme.typography.T5.fontFamily};
  font-size: ${props => props.theme.typography.T5.fontSize};
  font-weight: 500;
  color: ${props => props.theme.colors.black};
  margin-bottom: 4px;
`;

const CourseDetails = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: ${props => props.theme.typography.T7.fontFamily};
  font-size: ${props => props.theme.typography.T7.fontSize};
  color: ${props => props.theme.colors.gray[600]};
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

  &:hover {
    background-color: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.white};
    transform: scale(1.1);
  }
`;

export default CourseList;