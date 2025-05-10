import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { Subject } from '@/types';

interface Props {
  subjects: Subject[];
  onRemove?: (subject: Subject) => void;
}

const DAYS = ['월', '화', '수', '목', '금'];
const START_HOUR = 9;
const END_HOUR = 21;
const rowHeight = 40;

const TimetableWrapper = styled.div`
  width: 100%;
  overflow: hidden; // 모든 방향 오버플로우 숨김
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Container = styled.div`
  display: grid;
  grid-template-columns: 45px repeat(5, 1fr);
  grid-template-rows: 40px repeat(${END_HOUR - START_HOUR}, ${rowHeight}px);
  width: 100%;
  background: white;
  border: 1px solid #e0e0e0;
  position: relative;
`;

const Cell = styled.div`
  border: 1px solid #e0e0e0;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
`;

const HeaderCell = styled(Cell)`
  background-color: #f5f5f5;
  font-weight: bold;
  z-index: 10;
`;

const TimeCell = styled(Cell)`
  background-color: #f5f5f5;
  font-weight: 500;
  z-index: 5;
`;

// 수정된 SubjectBlock 스타일
const SubjectBlock = styled.div<{ top: number; left: number; width: number; height: number; color: string }>`
  position: absolute;
  top: ${({ top }) => top}px;
  left: ${({ left }) => left}px;
  height: ${({ height }) => height}px;
  width: ${({ width }) => width}px;
  background-color: ${({ color }) => color};
  color: white;
  border-radius: 4px;
  padding: 4px;
  font-size: 11px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  z-index: 1;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  overflow: hidden;
  box-sizing: border-box; // 중요: 패딩이 너비에 포함되도록 설정

  &:hover {
    filter: brightness(1.05);
    z-index: 20;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }
`;

const SubjectTitle = styled.div`
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
`;

const SubjectProf = styled.div`
  font-size: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.9;
`;

const getColorFromCode = (code: string) => {
  const colors = [
    '#E57373', '#9575CD', '#4FC3F7', '#81C784', '#FFF176', 
    '#FF8A65', '#F06292', '#7986CB', '#4DD0E1', '#AED581'
  ];
  const hash = Array.from(code).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const Timetable: React.FC<Props> = ({ subjects, onRemove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellDimensions, setCellDimensions] = useState({ width: 0, height: rowHeight });

  // 컨테이너 크기 측정 및 셀 크기 계산
  useEffect(() => {
    const calculateDimensions = () => {
      if (containerRef.current) {
        const totalWidth = containerRef.current.clientWidth;
        const columnWidth = (totalWidth - 45) / 5; // 5일 기준, 첫 번째 열(시간표시) 너비 제외
        setCellDimensions({ width: columnWidth, height: rowHeight });
      }
    };

    calculateDimensions();
    window.addEventListener('resize', calculateDimensions);
    return () => window.removeEventListener('resize', calculateDimensions);
  }, []);

  return (
    <TimetableWrapper>
      <Container ref={containerRef}>
        <HeaderCell>시간</HeaderCell>
        {DAYS.map((day) => (
          <HeaderCell key={day}>{day}</HeaderCell>
        ))}
        
        {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
          <React.Fragment key={`row-${i}`}>
            <TimeCell>{`${i + START_HOUR}:00`}</TimeCell>
            {DAYS.map((_, j) => (
              <Cell key={`cell-${i}-${j}`} />
            ))}
          </React.Fragment>
        ))}

        {subjects.map((subject, idx) =>
          subject.time.map((t, i) => {
            // 시간 범위 확인
            if (t.sh < START_HOUR || t.eh > END_HOUR) return null;
            
            const top = 40 + (t.sh - START_HOUR) * cellDimensions.height + (t.sm / 60) * cellDimensions.height;
            const height = (t.eh - t.sh) * cellDimensions.height + ((t.em - t.sm) / 60) * cellDimensions.height;
            
            // 중요: left와 width 계산 시 정확한 값 사용
            const left = 45 + t.date * cellDimensions.width;
            // 8px를 빼서 셀 내부에 딱 맞게 조정 (양쪽 4px 패딩)
            const width = cellDimensions.width;
            
            const color = getColorFromCode(subject.code);

            return (
              <SubjectBlock
                key={`${subject.code}-${subject.group || ""}-${i}`}
                top={top}
                left={left}
                width={width}
                height={height}
                color={color}
                onClick={() => onRemove?.(subject)}
              >
                <SubjectTitle>{subject.title}</SubjectTitle>
                <SubjectProf>{subject.prof.join(', ')}</SubjectProf>
              </SubjectBlock>
            );
          })
        )}
      </Container>
    </TimetableWrapper>
  );
};

export default Timetable;