// components/AiSuggestion.tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { FiCpu, FiCheckCircle, FiAlertCircle, FiBook, FiClock, FiUser, FiPlus } from 'react-icons/fi';

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

interface AiSuggestionProps {
  onAddCourse: (course: Course) => void;
}

const AiSuggestion: React.FC<AiSuggestionProps> = ({ onAddCourse }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Course[]>([]);
  const [preferences, setPreferences] = useState({
    major: 'Computer Science',
    year: '2',
    preferredDays: ['Monday', 'Wednesday', 'Friday'],
    preferNoMorning: true,
    totalCredits: '18'
  });
  
  // Mock data for AI suggested courses
  const mockSuggestedCourses: Course[] = [
    {
      id: '101',
      code: 'CS230',
      name: 'Systems Programming',
      professor: 'Prof. Kim',
      credits: 4,
      schedule: [{ day: 0, startTime: 180, endTime: 270 }, { day: 2, startTime: 180, endTime: 270 }],
      color: '#F2E3FF'
    },
    {
      id: '102',
      code: 'CS300',
      name: 'Introduction to Algorithms',
      professor: 'Prof. Lee',
      credits: 3,
      schedule: [{ day: 1, startTime: 300, endTime: 390 }, { day: 3, startTime: 300, endTime: 390 }],
      color: '#E5E2FD'
    },
    {
      id: '103',
      code: 'CS320',
      name: 'Programming Language',
      professor: 'Prof. Park',
      credits: 3,
      schedule: [{ day: 2, startTime: 420, endTime: 510 }, { day: 4, startTime: 420, endTime: 510 }],
      color: '#FDE2E2'
    },
  ];

  const handleGenerateSuggestions = () => {
    setIsGenerating(true);
    
    // Simulate API call to AI service
    setTimeout(() => {
      setAiSuggestions(mockSuggestedCourses);
      setIsGenerating(false);
    }, 2000);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPreferences({
      ...preferences,
      [name]: value
    });
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setPreferences({
      ...preferences,
      [name]: checked
    });
  };
  
  const handleDaySelect = (day: string) => {
    if (preferences.preferredDays.includes(day)) {
      setPreferences({
        ...preferences,
        preferredDays: preferences.preferredDays.filter(d => d !== day)
      });
    } else {
      setPreferences({
        ...preferences,
        preferredDays: [...preferences.preferredDays, day]
      });
    }
  };
  
  return (
    <AiContainer>
      <AiHeader>
        <h2>AI Course Recommendation</h2>
        <AiSubtitle>Let our AI find the perfect schedule for you</AiSubtitle>
      </AiHeader>
      
      <PreferencesSection>
        <PreferencesTitle>Your Preferences</PreferencesTitle>
        
        <PreferenceGroup>
          <PreferenceLabel>Major</PreferenceLabel>
          <Select 
            name="major" 
            value={preferences.major}
            onChange={handleInputChange}
          >
            <option value="Computer Science">Computer Science</option>
            <option value="Electrical Engineering">Electrical Engineering</option>
            <option value="Mechanical Engineering">Mechanical Engineering</option>
            <option value="Industrial Design">Industrial Design</option>
            <option value="Business">Business</option>
          </Select>
        </PreferenceGroup>
        
        <PreferenceGroup>
          <PreferenceLabel>Year</PreferenceLabel>
          <Select 
            name="year" 
            value={preferences.year}
            onChange={handleInputChange}
          >
            <option value="1">1st year</option>
            <option value="2">2nd year</option>
            <option value="3">3rd year</option>
            <option value="4">4th year</option>
          </Select>
        </PreferenceGroup>
        
        <PreferenceGroup>
          <PreferenceLabel>Preferred Days</PreferenceLabel>
          <DaysSelector>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
              <DayButton 
                key={day} 
                selected={preferences.preferredDays.includes(day)}
                onClick={() => handleDaySelect(day)}
              >
                {day.substring(0, 3)}
              </DayButton>
            ))}
          </DaysSelector>
        </PreferenceGroup>
        
        <PreferenceGroup>
          <PreferenceLabel>Total Credits</PreferenceLabel>
          <Input 
            type="number" 
            name="totalCredits" 
            value={preferences.totalCredits}
            onChange={handleInputChange}
            min="1"
            max="24"
          />
        </PreferenceGroup>
        
        <PreferenceGroup>
          <CheckboxLabel>
            <Checkbox 
              type="checkbox" 
              name="preferNoMorning" 
              checked={preferences.preferNoMorning}
              onChange={handleCheckboxChange}
            />
            <span>Avoid morning classes (before 10:30 AM)</span>
          </CheckboxLabel>
        </PreferenceGroup>
      </PreferencesSection>
      
      <GenerateButton onClick={handleGenerateSuggestions} disabled={isGenerating}>
        {isGenerating ? (
          <>
            <SpinnerIcon />
            Generating Recommendations...
          </>
        ) : (
          <>
            <FiCpu size={18} />
            Generate AI Recommendations
          </>
        )}
      </GenerateButton>
      
      {aiSuggestions.length > 0 && (
        <SuggestionsSection>
          <SuggestionsTitle>
            <FiCheckCircle size={20} color="#107F4F" />
            AI Recommended Courses
          </SuggestionsTitle>
          
          {aiSuggestions.map(course => (
            <SuggestionItem key={course.id}>
              <SuggestionInfo>
                <CourseCode>{course.code}</CourseCode>
                <CourseName>{course.name}</CourseName>
                <CourseDetails>
                  <DetailItem>
                    <FiUser size={14} />
                    <span>{course.professor}</span>
                  </DetailItem>
                  <DetailItem>
                    <FiBook size={14} />
                    <span>{course.credits} credits</span>
                  </DetailItem>
                  <DetailItem>
                    <FiClock size={14} />
                    <span>MW 13:00-14:30</span>
                  </DetailItem>
                </CourseDetails>
                <SuggestionReason>
                  <FiAlertCircle size={14} />
                  <span>Recommended because it matches your major and schedule preferences</span>
                </SuggestionReason>
              </SuggestionInfo>
              <AddButton onClick={() => onAddCourse(course)}>
                <FiPlus size={18} />
              </AddButton>
            </SuggestionItem>
          ))}
        </SuggestionsSection>
      )}
    </AiContainer>
  );
};

const AiContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
`;

const AiHeader = styled.div`
  margin-bottom: 24px;

  h2 {
    font-family: ${props => props.theme.typography.T3.fontFamily};
    font-size: ${props => props.theme.typography.T3.fontSize};
    font-weight: ${props => props.theme.typography.T3.fontWeight};
    color: ${props => props.theme.colors.black};
    margin: 0 0 8px 0;
  }
`;

const AiSubtitle = styled.p`
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  color: ${props => props.theme.colors.gray[600]};
  margin: 0;
`;

const PreferencesSection = styled.div`
  background-color: ${props => props.theme.colors.white};
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const PreferencesTitle = styled.h3`
  font-family: ${props => props.theme.typography.T4.fontFamily};
  font-size: ${props => props.theme.typography.T4.fontSize};
  font-weight: ${props => props.theme.typography.T4.fontWeight};
  color: ${props => props.theme.colors.black};
  margin: 0 0 20px 0;
`;

const PreferenceGroup = styled.div`
  margin-bottom: 16px;
`;

const PreferenceLabel = styled.div`
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  font-weight: 600;
  color: ${props => props.theme.colors.black};
  margin-bottom: 8px;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px;
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  border: 1px solid ${props => props.theme.colors.gray[200]};
  border-radius: 4px;
  background-color: ${props => props.theme.colors.white};
  outline: none;

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.purple[100]};
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
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

const DaysSelector = styled.div`
  display: flex;
  gap: 8px;
`;

const DayButton = styled.button<{ selected: boolean }>`
  padding: 8px 12px;
  border-radius: 4px;
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  font-weight: 500;
  border: 1px solid ${props => props.selected ? props.theme.colors.primary : props.theme.colors.gray[200]};
  background-color: ${props => props.selected ? props.theme.colors.purple[100] : props.theme.colors.white};
  color: ${props => props.selected ? props.theme.colors.primary : props.theme.colors.gray[600]};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.selected ? props.theme.colors.purple[100] : props.theme.colors.gray[100]};
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  color: ${props => props.theme.colors.black};

  span {
    margin-left: 8px;
  }
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: ${props => props.theme.colors.primary};
`;

const GenerateButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background-color: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.white};
  border: none;
  border-radius: 4px;
  font-family: ${props => props.theme.typography.T5.fontFamily};
  font-size: ${props => props.theme.typography.T5.fontSize};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 24px;

  &:hover {
    background-color: #8A2BD9;
  }

  &:disabled {
    background-color: ${props => props.theme.colors.gray[300]};
    cursor: not-allowed;
  }
`;

const SpinnerIcon = styled(FiCpu)`
  animation: spin 1.5s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const SuggestionsSection = styled.div`
  background-color: ${props => props.theme.colors.white};
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const SuggestionsTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: ${props => props.theme.typography.T4.fontFamily};
  font-size: ${props => props.theme.typography.T4.fontSize};
  font-weight: ${props => props.theme.typography.T4.fontWeight};
  color: ${props => props.theme.colors.black};
  margin: 0 0 20px 0;
`;

const SuggestionItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: ${props => props.theme.colors.gray[100]};
  border-radius: 8px;
  margin-bottom: 12px;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  }
`;

const SuggestionInfo = styled.div`
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
  margin-bottom: 8px;
`;

const CourseDetails = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: ${props => props.theme.typography.T7.fontFamily};
  font-size: ${props => props.theme.typography.T7.fontSize};
  color: ${props => props.theme.colors.gray[600]};
`;

const SuggestionReason = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: ${props => props.theme.typography.T7.fontFamily};
  font-size: ${props => props.theme.typography.T7.fontSize};
  color: ${props => props.theme.colors.green[600]};
  font-style: italic;
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

export default AiSuggestion;