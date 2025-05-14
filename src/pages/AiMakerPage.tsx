// src/pages/AiMakerPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FiSend, FiRefreshCw, FiDownload, FiCpu, FiPlusCircle } from 'react-icons/fi';
import Layout from '../components/Layout';
import { MenuItemType } from '../components/Sidebar';
import { Subject } from '../types/subject';
import { useSemester } from '../contexts/SemesterContext';
import { useTimetable } from '../contexts/TimetableContext';
import { 
  processSubjectData, 
  filterSubjectsBySemester
} from '../utils/subjectUtils';

// 메시지 타입 정의
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// 추천 결과 타입 정의
interface RecommendationResult {
  subjects: Subject[];
  explanation: string;
}

const AiMakerPage: React.FC = () => {
  const [activeMenuItem, setActiveMenuItem] = useState<MenuItemType>('aiMaker');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: '안녕하세요! 저는 당신의 시간표 작성을 도와드릴 AI 어시스턴트입니다. 전공, 학년, 듣고 싶은 수업, 오전 수업 선호 여부, 영어 강의 여부, 필수 과목, 원하는 총 학점 등을 알려주시면 최적의 시간표를 추천해 드릴게요.'
    },
    {
      role: 'assistant',
      content: '안녕하세요! 저는 당신의 시간표 작성을 도와드릴 AI 어시스턴트입니다. 어떤 도움이 필요하신가요? 전공, 학년, 듣고 싶은 수업, 오전 수업 선호 여부, 영어 강의 여부, 필수 과목, 원하는 총 학점 등을 알려주시면 최적의 시간표를 추천해 드릴게요.'
    }
  ]);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [filteredSubjectsBySemester, setFilteredSubjectsBySemester] = useState<Subject[]>([]);
  const [recommendationResult, setRecommendationResult] = useState<RecommendationResult | null>(null);
  
  const { currentSemester } = useSemester();
  const { addSubject } = useTimetable();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // 모든 과목 데이터 로드
  useEffect(() => {
    try {
      const subjects = processSubjectData();
      setAllSubjects(subjects);
    } catch (error) {
      console.error('과목 데이터 로드 중 오류 발생:', error);
    }
  }, []);

  // 학기 변경 시 과목 필터링
  useEffect(() => {
    if (allSubjects.length > 0) {
      const semesterSubjects = filterSubjectsBySemester(allSubjects, currentSemester);
      setFilteredSubjectsBySemester(semesterSubjects);
      console.log(`${currentSemester} 과목 데이터 로드됨: ${semesterSubjects.length}개`);
    }
  }, [currentSemester, allSubjects]);
  
  // 채팅창 자동 스크롤
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // 메뉴 아이템 클릭 핸들러
  const handleMenuItemClick = (item: MenuItemType) => {
    setActiveMenuItem(item);
  };
  
  // 메시지 전송 핸들러
  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return;
    
    // 사용자 메시지 추가
    const userMessage: Message = {
      role: 'user',
      content: inputMessage
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // 메시지 배열에서 시스템 메시지를 제외한 메시지만 보내기
      const messagesToSend = [...messages.filter(msg => msg.role !== 'system'), userMessage];
      
      // 필수 정보만 포함하는 과목 데이터 생성
      const essentialSubjectData = filteredSubjectsBySemester.map(subject => ({
        id: subject.id,
        code: subject.code,
        name: subject.name,
        professor: subject.professor,
        credits: subject.credits,
        schedules: subject.schedules,
      }));
      
      console.log('Sending API request...');
      
      // 백엔드 서버로 요청 전송
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesToSend,
          subjects: essentialSubjectData,
          semester: currentSemester
        }),
      });
      
      if (!response.ok) {
        console.error('API 응답 에러:', response.status, response.statusText);
        throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API 응답 데이터:', data);
      
      // 응답 메시지 추가
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message
      }]);
      
      // 추천 결과 처리 - 서버에서 전달된 recommendation 객체가 있는지 확인
      if (data.recommendation && data.recommendation.subjects && data.recommendation.subjects.length > 0) {
        console.log('서버에서 추천 과목 찾음:', data.recommendation.subjects.length);
        setRecommendationResult(data.recommendation);
      } 
      // 서버에서 recommendation 객체가 없는 경우, 클라이언트에서 직접 파싱 시도
      else if (data.message.includes('추천 시간표') || data.message.includes('추천 과목')) {
        console.log('서버 추천 없음, 클라이언트에서 파싱 시도');
        
        // 메시지에서 과목 코드 추출
        const recommendedCodes = parseRecommendedCourses(data.message);
        console.log('클라이언트에서 추출한 과목 코드:', recommendedCodes);
        
        if (recommendedCodes.length > 0) {
          // 과목 코드와 일치하는 과목 찾기
          const recommendedSubjects = filteredSubjectsBySemester.filter(subject => 
            recommendedCodes.includes(subject.code)
          );
          
          console.log('클라이언트에서 찾은 추천 과목:', recommendedSubjects.length);
          
          if (recommendedSubjects.length > 0) {
            // 추천 결과 설정
            setRecommendationResult({
              subjects: recommendedSubjects,
              explanation: data.message
            });
          } else {
            console.warn('추천 과목을 찾았으나 실제 과목과 매칭되지 않음');
          }
        } else {
          console.warn('메시지에서 과목 코드를 추출할 수 없음');
        }
      } else {
        console.log('추천 시간표 관련 내용이 없는 응답');
      }
    } catch (error) {
      console.error('메시지 전송 중 오류 발생:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '죄송합니다. 요청을 처리하는 중에 오류가 발생했습니다. 다시 시도해 주세요.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 클라이언트 측 과목 코드 추출 함수
  function parseRecommendedCourses(message: string): string[] {
    // 굵은 텍스트 안에 있는 과목 코드 패턴 (예: **CS.12345**)
    const boldCodeRegex = /\*\*([A-Z]{2,3}\.[0-9]{5})\*\*/g;
    let boldMatches: string[] = [];
    let boldMatch: RegExpExecArray | null;
    
    // message를 복사하여 사용
    let msgCopy = message;
    
    while ((boldMatch = boldCodeRegex.exec(msgCopy)) !== null) {
      boldMatches.push(boldMatch[1]);
    }
    
    // 굵은 텍스트로 표시된 과목 코드가 있으면 우선 사용
    if (boldMatches.length > 0) {
      return boldMatches.filter((code, index) => boldMatches.indexOf(code) === index);
    }
    
    // 일반 과목 코드 패턴 (예: CS.12345)
    const strictCodeRegex = /([A-Z]{2,3}\.[0-9]{5})/g;
    const matches = message.match(strictCodeRegex);
    
    // 일반 패턴으로 찾은 경우
    if (matches && matches.length > 0) {
      return matches.filter((code, index) => matches.indexOf(code) === index);
    }
    
    // 추가 패턴 시도 (더 느슨한 패턴)
    const looseCodeRegex = /([A-Z]{2,3})[.\s-_]*([0-9]{5})/g;
    
    // 메시지 전체를 검색하며 모든 매치 찾기
    let looseMatches: string[] = [];
    let match: RegExpExecArray | null;
    let messageCopy = message;
    
    while ((match = looseCodeRegex.exec(messageCopy)) !== null) {
      // 매치된 그룹에서 과목 코드 형식으로 변환
      const codeFormat = `${match[1]}.${match[2]}`;
      looseMatches.push(codeFormat);
    }
    
    if (looseMatches.length > 0) {
      return looseMatches.filter((code, index) => looseMatches.indexOf(code) === index);
    }
    
    // 그래도 못 찾은 경우 빈 배열 반환
    return [];
  };
  
  // 과목 추가 핸들러
  const handleAddSubject = (subject: Subject) => {
    const result = addSubject(subject);
    alert(result.message);
  };
  
  // 대화 초기화 핸들러
  const handleResetChat = () => {
    setMessages([
      {
        role: 'system',
        content: '안녕하세요! 저는 당신의 시간표 작성을 도와드릴 AI 어시스턴트입니다. 전공, 학년, 듣고 싶은 수업, 오전 수업 선호 여부, 영어 강의 여부, 필수 과목, 원하는 총 학점 등을 알려주시면 최적의 시간표를 추천해 드릴게요.'
      },
      {
        role: 'assistant',
        content: '안녕하세요! 저는 당신의 시간표 작성을 도와드릴 AI 어시스턴트입니다. 어떤 도움이 필요하신가요? 전공, 학년, 듣고 싶은 수업, 오전 수업 선호 여부, 영어 강의 여부, 필수 과목, 원하는 총 학점 등을 알려주시면 최적의 시간표를 추천해 드릴게요.'
      }
    ]);
    setRecommendationResult(null);
  };
  
  // 시간표 다운로드 핸들러 (추후 구현)
  const handleDownloadTimetable = () => {
    alert('시간표 다운로드 기능은 개발 중입니다.');
  };

  const handleAddAllSubjects = () => {
    if (!recommendationResult || recommendationResult.subjects.length === 0) return;
    
    // 결과 변수 초기화
    let addedCount = 0;
    let failedCount = 0;
    let conflictingSubjects: string[] = [];
    
    // 모든 추천 과목을 순회하며 추가 시도
    recommendationResult.subjects.forEach(subject => {
      const result = addSubject(subject);
      
      if (result.success) {
        addedCount++;
      } else {
        failedCount++;
        conflictingSubjects.push(subject.name);
      }
    });
    
    // 결과 메시지 생성
    let resultMessage = '';
    if (addedCount > 0) {
      resultMessage += `${addedCount}개 과목이 시간표에 추가되었습니다.\n`;
    }
    
    if (failedCount > 0) {
      resultMessage += `${failedCount}개 과목은 추가할 수 없습니다.\n`;
      resultMessage += `(${conflictingSubjects.join(', ')})`;
    }
    
    // 결과 알림
    alert(resultMessage);
    
    // 추천 결과 유지 (시각적으로 계속 확인할 수 있게)
  };

  return (
    <Layout activeMenuItem={activeMenuItem} onMenuItemClick={handleMenuItemClick}>
      <PageContainer>
        <PageHeader>
          <h2>AI 시간표 추천</h2>
          <p>{currentSemester}에 대해 AI와 대화하며 최적의 시간표를 추천받으세요.</p>
        </PageHeader>
        
        <ChatSection>
          <ChatContainer ref={chatContainerRef}>
            {messages.filter(msg => msg.role !== 'system').map((message, index) => (
              <MessageBubble key={index} role={message.role}>
                <MessageContent>{message.content}</MessageContent>
              </MessageBubble>
            ))}
            {isLoading && (
              <LoadingBubble>
                <LoadingDots>
                  <span>.</span><span>.</span><span>.</span>
                </LoadingDots>
              </LoadingBubble>
            )}
          </ChatContainer>
          
          <InputContainer>
            <ChatInput
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="메시지를 입력하세요..."
              disabled={isLoading}
            />
            <SendButton onClick={handleSendMessage} disabled={isLoading || inputMessage.trim() === ''}>
              <FiSend size={20} />
            </SendButton>
          </InputContainer>
          
          <ChatActions>
            <ActionButton onClick={handleResetChat} title="대화 초기화">
              <FiRefreshCw size={18} />
              <span>대화 초기화</span>
            </ActionButton>
            {recommendationResult && (
              <ActionButton onClick={handleDownloadTimetable} title="시간표 다운로드">
                <FiDownload size={18} />
                <span>시간표 다운로드</span>
              </ActionButton>
            )}
          </ChatActions>
        </ChatSection>
        
        {recommendationResult && (
          <RecommendationSection>
            <SectionTitle>
              <FiCpu size={20} color="#107F4F" />
              AI 추천 시간표
            </SectionTitle>
            
            <RecommendationDescription>
              {recommendationResult.explanation}
            </RecommendationDescription>
            
            <SubjectList>
              {recommendationResult.subjects.map(subject => (
                <SubjectCard key={subject.id}>
                  <SubjectHeader>
                    <SubjectCode>{subject.code}</SubjectCode>
                    <SubjectCredits>{subject.credits}학점</SubjectCredits>
                  </SubjectHeader>
                  <SubjectName>{subject.name}</SubjectName>
                  <SubjectInfo>
                    <InfoItem>교수: {subject.professor}</InfoItem>
                    <InfoItem>시간: {subject.schedules.map(s => 
                      `${['월', '화', '수', '목', '금'][s.day]}(${Math.floor(s.startTime/60)}:${s.startTime%60 || '00'}-${Math.floor(s.endTime/60)}:${s.endTime%60 || '00'})`
                    ).join(', ')}</InfoItem>
                  </SubjectInfo>
                  <AddButton onClick={() => handleAddSubject(subject)}>
                    시간표에 추가
                  </AddButton>
                </SubjectCard>
              ))}
            </SubjectList>
            
            {/* 새로 추가: 모든 과목 시간표에 추가 버튼 */}
            <ActionButtonsContainer>
              <AddAllButton onClick={handleAddAllSubjects}>
                <FiPlusCircle size={18} />
                모든 과목 시간표에 추가
              </AddAllButton>
            </ActionButtonsContainer>
          </RecommendationSection>
        )}
      </PageContainer>
    </Layout>
  );
};

// 스타일 컴포넌트
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
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

const ChatSection = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${props => props.theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
  overflow: hidden;
  flex: 1;
  min-height: 400px;
`;

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  min-height: 350px;
  max-height: 500px;
`;

const MessageBubble = styled.div<{ role: string }>`
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 18px;
  margin-bottom: 12px;
  align-self: ${props => props.role === 'user' ? 'flex-end' : 'flex-start'};
  background-color: ${props => props.role === 'user' ? props.theme.colors.primary : props.theme.colors.gray[100]};
  color: ${props => props.role === 'user' ? props.theme.colors.white : props.theme.colors.black};
`;

const MessageContent = styled.div`
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  line-height: 1.5;
  white-space: pre-wrap;
`;

const LoadingBubble = styled.div`
  align-self: flex-start;
  padding: 12px 16px;
  border-radius: 18px;
  margin-bottom: 12px;
  background-color: ${props => props.theme.colors.gray[100]};
`;

const LoadingDots = styled.div`
  display: flex;
  
  span {
    animation: loadingDots 1.4s infinite ease-in-out both;
    font-size: 24px;
    
    &:nth-child(1) {
      animation-delay: 0s;
    }
    
    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
  
  @keyframes loadingDots {
    0%, 80%, 100% {
      opacity: 0.2;
    }
    40% {
      opacity: 1;
    }
  }
`;

const InputContainer = styled.div`
  display: flex;
  padding: 12px 16px;
  border-top: 1px solid ${props => props.theme.colors.gray[200]};
`;

const ChatInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 1px solid ${props => props.theme.colors.gray[300]};
  border-radius: 24px;
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  outline: none;
  
  &:focus {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.purple[100]};
  }
  
  &:disabled {
    background-color: ${props => props.theme.colors.gray[100]};
    cursor: not-allowed;
  }
`;

const SendButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  margin-left: 8px;
  background-color: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #8A2BD9;
  }
  
  &:disabled {
    background-color: ${props => props.theme.colors.gray[300]};
    cursor: not-allowed;
  }
`;

const ChatActions = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid ${props => props.theme.colors.gray[200]};
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  background-color: transparent;
  color: ${props => props.theme.colors.gray[600]};
  border: 1px solid ${props => props.theme.colors.gray[300]};
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.theme.colors.gray[100]};
  }
`;

const RecommendationSection = styled.div`
  background-color: ${props => props.theme.colors.white};
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  margin-bottom: 32px;
`;

const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: ${props => props.theme.typography.T4.fontFamily};
  font-size: ${props => props.theme.typography.T4.fontSize};
  font-weight: ${props => props.theme.typography.T4.fontWeight};
  color: ${props => props.theme.colors.black};
  margin: 0 0 16px 0;
`;

const RecommendationDescription = styled.div`
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  color: ${props => props.theme.colors.gray[600]};
  margin-bottom: 20px;
  line-height: 1.6;
`;

const SubjectList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
`;

const SubjectCard = styled.div`
  background-color: ${props => props.theme.colors.white};
  border: 1px solid ${props => props.theme.colors.gray[200]};
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const SubjectHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const SubjectCode = styled.div`
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
`;

const SubjectCredits = styled.div`
  font-family: ${props => props.theme.typography.T7.fontFamily};
  font-size: ${props => props.theme.typography.T7.fontSize};
  color: ${props => props.theme.colors.gray[600]};
  background-color: ${props => props.theme.colors.gray[100]};
  padding: 2px 8px;
  border-radius: 4px;
`;

const SubjectName = styled.div`
  font-family: ${props => props.theme.typography.T5.fontFamily};
  font-size: ${props => props.theme.typography.T5.fontSize};
  font-weight: 600;
  color: ${props => props.theme.colors.black};
  margin-bottom: 12px;
`;

const SubjectInfo = styled.div`
  margin-bottom: 16px;
`;

const InfoItem = styled.div`
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  color: ${props => props.theme.colors.gray[600]};
  margin-bottom: 4px;
`;

const AddButton = styled.button`
  width: 100%;
  padding: 8px 0;
  background-color: ${props => props.theme.colors.purple[100]};
  color: ${props => props.theme.colors.primary};
  border: 1px solid ${props => props.theme.colors.primary};
  border-radius: 4px;
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.white};
  }
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 24px;
`;

const AddAllButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  background-color: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: 4px;
  font-family: ${props => props.theme.typography.T5.fontFamily};
  font-size: ${props => props.theme.typography.T5.fontSize};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #8A2BD9;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

export default AiMakerPage;
