// components/Sidebar.tsx
import React from 'react';
import styled from 'styled-components';
import { FiCalendar, FiList, FiBookOpen, FiBarChart2, FiStar } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export type MenuItemType = 'timetable' | 'courses' | 'Suggest' | 'aiMaker' | 'saved';

interface SidebarProps {
  activeItem: MenuItemType;
  onMenuItemClick?: (item: MenuItemType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, onMenuItemClick }) => {
  const navigate = useNavigate();

  const handleItemClick = (item: MenuItemType) => {
    if (onMenuItemClick) {
      onMenuItemClick(item);
    }
    
    // 페이지 전환을 위한 라우팅 처리
    switch (item) {
      case 'timetable':
        navigate('/timetable');
        break;
      case 'courses':
        navigate('/courses');
        break;
      case 'Suggest':
        navigate('/suggest');
        break;
      case 'aiMaker':
        navigate('/aiMaker');
        break;
      case 'saved':
        navigate('/saved');
        break;
    }
  };

  return (
    <SidebarContainer>
      <MenuItems>
        <MenuItem 
          active={activeItem === 'timetable'} 
          onClick={() => handleItemClick('timetable')}
        >
          <FiCalendar size={18} />
          <span>Timetable</span>
        </MenuItem>
        <MenuItem 
          active={activeItem === 'aiMaker'} 
          onClick={() => handleItemClick('aiMaker')}
        >
          <FiBarChart2 size={18} />
          <span>⭐AI Maker</span>
        </MenuItem>
        <MenuItem 
          active={activeItem === 'courses'} 
          onClick={() => handleItemClick('courses')}
        >
          <FiList size={18} />
          <span>Courses</span>
        </MenuItem>
        <MenuItem 
          style={{color: 'lightgray'}}
          active={activeItem === 'Suggest'} 
          onClick={() => handleItemClick('Suggest')}
        >
          <FiBookOpen size={18} />
          <span>Suggest</span>
        </MenuItem>
        <MenuItem 
          style={{color: 'lightgray'}}
          active={activeItem === 'saved'} 
          onClick={() => handleItemClick('saved')}
        >
          <FiStar size={18} />
          <span>Saved</span>
        </MenuItem>
      </MenuItems>
    </SidebarContainer>
  );
};

const SidebarContainer = styled.div`
  width: 160px;
  background-color: ${props => props.theme.colors.white};
  border-right: 1px solid ${props => props.theme.colors.gray[200]};
`;

const MenuItems = styled.ul`
  list-style: none;
  padding: 12px 0;
  margin: 0;
`;

const MenuItem = styled.li<{ active?: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  font-family: ${props => props.theme.typography.T5.fontFamily};
  font-size: ${props => props.theme.typography.T5.fontSize};
  font-weight: ${props => props.active ? 600 : 500};
  color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.gray[600]};
  cursor: pointer;
  border-left: 3px solid ${props => props.active ? props.theme.colors.primary : 'transparent'};
  background-color: ${props => props.active ? props.theme.colors.purple[100] : 'transparent'};

  &:hover {
    background-color: ${props => props.active ? props.theme.colors.purple[100] : props.theme.colors.gray[100]};
  }

  span {
    margin-left: 12px;
  }
`;

export default Sidebar;