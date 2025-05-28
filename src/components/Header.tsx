// components/Header.tsx
import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FiUser, FiChevronDown, FiInfo, FiTrello } from 'react-icons/fi';
import { useSemester } from '../contexts/SemesterContext';

const Header: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { currentSemester, setCurrentSemester } = useSemester();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 학기 목록
  const semesters = [
    'Spring 2025',
    'Summer 2025'
  ];

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 학기 선택 핸들러
  const handleSemesterSelect = (semester: string) => {
    setCurrentSemester(semester);
    setIsDropdownOpen(false);
  };

  const handleProfile = () => {
    alert('아직 DB가 구현되지 않아 로그인 기능이 없습니다... ㅠㅠ\n\n시간표 저장 및 복사는 가능하니, 따로 저장해주시길 바랍니다!');
  };

  return (
    <HeaderContainer>
      <LogoSection>
        <Logo>STL</Logo>
        <LogoSubtitle>Siwon's Timetable Linker</LogoSubtitle>
      </LogoSection>
      <MenuSection>
        <SemesterDropdown ref={dropdownRef}>
          <SemesterButton onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            {currentSemester}
            <FiChevronDown style={{ marginLeft: '8px' }} />
          </SemesterButton>
          {isDropdownOpen && (
            <DropdownMenu>
              {semesters.map((semester) => (
                <DropdownItem 
                  key={semester} 
                  onClick={() => handleSemesterSelect(semester)}
                  active={semester === currentSemester}
                >
                  {semester}
                </DropdownItem>
              ))}
            </DropdownMenu>
          )}
        </SemesterDropdown>
        <Divider />
        <ActionButton onClick={() => window.open('https://forms.gle/6nN4QEw9mA4hx2jR7', '_blank')}>
          <FiTrello size={18} />
        </ActionButton>
        <ActionButton onClick={() => window.open('https://www.siwon.site', '_blank')}>
          <FiInfo size={18} />
        </ActionButton>
        <ActionButton onClick={handleProfile}>
          <FiUser size={18} />
        </ActionButton>
      </MenuSection>
    </HeaderContainer>
  );
};

const HeaderContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  background-color: ${props => props.theme.colors.white};
  border-bottom: 1px solid ${props => props.theme.colors.gray[200]};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
`;

const Logo = styled.h1`
  font-family: ${props => props.theme.typography.T2.fontFamily};
  font-size: ${props => props.theme.typography.T2.fontSize};
  font-weight: ${props => props.theme.typography.T2.fontWeight};
  color: ${props => props.theme.colors.primary};
  margin: 0;
  margin-right: 10px;
`;

const LogoSubtitle = styled.span`
  font-family: ${props => props.theme.typography.T7.fontFamily};
  font-size: ${props => props.theme.typography.T7.fontSize};
  font-weight: ${props => props.theme.typography.T7.fontWeight};
  color: ${props => props.theme.colors.gray[600]};
`;

const MenuSection = styled.div`
  display: flex;
  align-items: center;
`;

const SemesterDropdown = styled.div`
  position: relative;
`;

const SemesterButton = styled.button`
  display: flex;
  align-items: center;
  font-family: ${props => props.theme.typography.T5.fontFamily};
  font-size: ${props => props.theme.typography.T5.fontSize};
  font-weight: ${props => props.theme.typography.T5.fontWeight};
  background: none;
  border: none;
  color: ${props => props.theme.colors.black};
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;

  &:hover {
    background-color: ${props => props.theme.colors.gray[100]};
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: ${props => props.theme.colors.white};
  border: 1px solid ${props => props.theme.colors.gray[200]};
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
  margin-top: 4px;
  overflow: hidden;
`;

const DropdownItem = styled.div<{ active: boolean }>`
  padding: 10px 12px;
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.black};
  background-color: ${props => props.active ? props.theme.colors.purple[100] : 'transparent'};
  cursor: pointer;

  &:hover {
    background-color: ${props => props.active ? props.theme.colors.purple[100] : props.theme.colors.gray[100]};
  }
`;

const Divider = styled.div`
  width: 1px;
  height: 24px;
  background-color: ${props => props.theme.colors.gray[200]};
  margin: 0 16px;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: none;
  border: none;
  color: ${props => props.theme.colors.gray[600]};
  cursor: pointer;
  margin-left: 8px;

  &:hover {
    background-color: ${props => props.theme.colors.gray[100]};
    color: ${props => props.theme.colors.primary};
  }
`;

export default Header;