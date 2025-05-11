// components/Timetable.tsx
import React from 'react';
import styled from 'styled-components';
import { FiX } from 'react-icons/fi';

interface Course {
  id: string;
  code: string;
  name: string;
  professor: string;
  schedule: {
    day: number; // 0: Monday, 1: Tuesday, etc.
    startTime: number; // in minutes from 9:00
    endTime: number; // in minutes from 9:00
  }[];
  color: string;
}

interface TimetableProps {
  courses: Course[];
  onRemoveCourse: (courseId: string) => void;
}

const Timetable: React.FC<TimetableProps> = ({ courses, onRemoveCourse }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const hours = Array.from({ length: 12 }, (_, i) => 9 + i); // 9AM to 8PM

  const getPositionStyle = (schedule: Course['schedule'][0]) => {
    const topPosition = ((schedule.startTime) / 60) * 60;
    const height = ((schedule.endTime - schedule.startTime) / 60) * 60;
    
    return {
      gridColumn: `${schedule.day + 2}`,
      gridRow: `${Math.floor(topPosition / 30) + 2} / span ${Math.ceil(height / 30)}`,
    };
  };

  return (
    <TimetableContainer>
      <TimetableHeader>
        <h2>My Timetable</h2>
        <ActionsRow>
          <TimetableButton>Save</TimetableButton>
          <TimetableButton>Export</TimetableButton>
        </ActionsRow>
      </TimetableHeader>
      
      <TimetableGrid>
        <TimeHeader>Time</TimeHeader>
        {days.map(day => (
          <DayHeader key={day}>{day}</DayHeader>
        ))}
        
        {hours.map(hour => (
          <React.Fragment key={hour}>
            <TimeCell>{`${hour}:00`}</TimeCell>
            <GridCell gridColumn="2 / span 5" />
            <TimeCell>{`${hour}:30`}</TimeCell>
            <GridCell gridColumn="2 / span 5" />
          </React.Fragment>
        ))}

        {courses.map(course => (
          course.schedule.map((slot, index) => (
            <CourseBlock 
              key={`${course.id}-${index}`} 
              style={getPositionStyle(slot)} 
              color={course.color}
            >
              <CourseCode>{course.code}</CourseCode>
              <CourseName>{course.name}</CourseName>
              <CourseProfessor>{course.professor}</CourseProfessor>
              <RemoveButton onClick={() => onRemoveCourse(course.id)}>
                <FiX size={14} />
              </RemoveButton>
            </CourseBlock>
          ))
        ))}
      </TimetableGrid>
    </TimetableContainer>
  );
};

const TimetableContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const TimetableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    font-family: ${props => props.theme.typography.T3.fontFamily};
    font-size: ${props => props.theme.typography.T3.fontSize};
    font-weight: ${props => props.theme.typography.T3.fontWeight};
    color: ${props => props.theme.colors.black};
    margin: 0;
  }
`;

const ActionsRow = styled.div`
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

const TimetableGrid = styled.div`
  display: grid;
  grid-template-columns: 60px repeat(5, 1fr);
  grid-auto-rows: 30px;
  gap: 1px;
  background-color: ${props => props.theme.colors.gray[200]};
  border: 1px solid ${props => props.theme.colors.gray[200]};
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  flex: 1;
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
`;

const GridCell = styled.div<{ gridColumn?: string }>`
  background-color: ${props => props.theme.colors.white};
  grid-column: ${props => props.gridColumn || 'auto'};
`;

const CourseBlock = styled.div<{ color: string }>`
  background-color: ${props => props.color || props.theme.colors.purple[100]};
  border-left: 3px solid ${props => props.theme.colors.primary};
  border-radius: 4px;
  padding: 8px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
    transform: scale(1.01);
    z-index: 10;
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

export default Timetable;