// src/pages/AiMakerPage.tsx - 백엔드 서버 없이 OpenAI 직접 호출
import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FiSend, FiRefreshCw, FiDownload, FiCpu, FiUser, FiBook, FiClock, FiMapPin, FiInfo, FiStar, FiActivity, FiBookOpen, FiPlus, FiX, FiCheckCircle } from 'react-icons/fi';
import Layout from '../components/Layout';
import { MenuItemType } from '../components/Sidebar';
import { Subject } from '../types/subject';
import { useSemester } from '../contexts/SemesterContext';
import { useTimetable } from '../contexts/TimetableContext';
import { 
  processSubjectData, 
  filterSubjectsBySemester,
  formatScheduleString,
  getCourseDescription,
  calculateSubjectRating,
  getRatingColor,
  getSubjectReviews
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

// OpenAI API 설정
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const VECTOR_STORE_ID = process.env.REACT_APP_VECTOR_STORE_ID;

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
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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

  // 완전히 일치하는 과목인지 확인 (코드, 교수, 시간 모두 일치)
  const isPerfectMatch = (subject: Subject): boolean => {
    if (!recommendationResult) return false;
    
    const recommendedSubject = recommendationResult.subjects.find(rec => 
      rec.code === subject.code && 
      rec.professor === subject.professor &&
      // 일정 비교 (시간표 문자열이 정확히 같은지)
      JSON.stringify(rec.schedules) === JSON.stringify(subject.schedules)
    );
    
    return !!recommendedSubject;
  };

  const openSubjectModal = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSubject(null);
  };

  // 메뉴 아이템 클릭 핸들러
  const handleMenuItemClick = (item: MenuItemType) => {
    setActiveMenuItem(item);
  };

  // OpenAI API 직접 호출 함수
  const callOpenAI = async (messages: Message[], subjects: Subject[], semester: string) => {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API 키가 설정되지 않았습니다. .env 파일에 REACT_APP_OPENAI_API_KEY를 설정해주세요.');
    }

    // 현재 학기에 존재하는 과목 코드 목록 및 정보 생성
    const availableCourses = subjects.map(subject => ({
      code: subject.code,
      name: subject.name,
      credits: subject.credits,
      professor: subject.professor,
      schedules: subject.schedules.map(s => 
        `${['월', '화', '수', '목', '금'][s.day]}(${Math.floor(s.startTime/60)}:${s.startTime%60 || '00'}-${Math.floor(s.endTime/60)}:${s.endTime%60 || '00'})`
      ).join(', '),
      // 권장 학년 추출
      yearRecommended: subject.code.match(/\.(\d)/)?.[1] || '?'
    }));

    // 시스템 메시지 생성
    const systemMessage = {
      role: "system" as const,
      content: `당신은 대학생의 시간표 작성을 도와주는 AI 어시스턴트입니다.
현재 학기는 ${semester}입니다.

사용자의 전공, 학년, 듣고 싶은 수업, 오전 수업 선호 여부, 영어 강의 여부, 원하는 총 학점 등을 파악하고 시작하세요.
당신은 기본적으로는 시간표를 추천해주는 AI Agent이며, 사용자가 시간표 추천이 아닌, 수업 추천을 요청할 경우, ${VECTOR_STORE_ID}에 기반하여 USER의 정보 및 요청에 알맞는 과목 추천을 제공해야 합니다.
수업 추천을 마쳤다면 자연스럽게 시간표 추천으로 넘어가야 합니다.

중요: 벡터 스토어 ID: ${VECTOR_STORE_ID}에 저장된 과목 정보, 과목 리뷰, 강의 평가 정보를 참고하여 사용자에 대한 맞춤형 추천을 제공해야 합니다.
중요: 시간표 추천 시 반드시 실제 정확한 과목 정보만 사용해야 합니다.

만약 이해가 되지 않는 단어가 있다면, ${VECTOR_STORE_ID}에 저장된 과목 정보와 과목 리뷰를 참고하여 해당 단어의 의미를 파악하고 답변하세요.
학과에 대한 약어가 발견된다면, 전체 학과 명단을 참고하여 약어의 글자가 학과 이름에 전부 들어가있는 곳을 찾아 해당 학과로 인지하세요. ex) 산디 = 산업디자인학과
과목 구분에 대한 약어가 발견된다면, 전체 과목 구분 명단을 참고하여 약어의 글자가 과목 구분 이름에 전부 들어가있는 곳을 찾아 해당 과목 구분으로 인지하세요. ex) 전선 = 전공선택
한 학년은 두 학기로 구성되어 있습니다. ex) 5학기 = 3학년 1학기

시간표를 제작할 때, 다음 규칙을 철저히 지켜주세요:
1. 현재 학기에 실제로 개설된 과목만 추천해야 합니다.
2. 과목 코드는 "알파벳.숫자" 형식이며, 숫자의 첫 자리는 해당 과목이 권장되는 학년을 의미합니다.
   예: CS.10001은 1학년, CS.20001은 2학년, CS.30001은 3학년, CS.40001은 4학년에게 권장되는 과목입니다.
   학생의 학년에 맞는 과목을 우선적으로 추천하세요.
3. 학생의 전공이 ${VECTOR_STORE_ID}에 저장된 과목 정보 중 개설학과와 일치하는 과목을 우선적으로 추천하세요.
4. 과목 코드를 대괄호로 묶어서 표시하세요. 예: [CS.20004]
5. 절대로 존재하지 않는 과목 정보를 만들어내지 마세요. 반드시 ${VECTOR_STORE_ID}에 저장된 과목 정보 중 ${semester}에 개설된 과목만 사용해야 합니다.
6. 아래 제공된 정확한 정보만 사용해야 합니다.
7. 최종적으로 시간표를 다 작성했다면, **수업 시간이 겹치지 않는지 확인**하고, 겹치는 시간이 있다면 겹치지 않을 때까지 다시 시간표를 구성하세요.
8. 만약 한 과목에 대해 여러 교수님이 계시다면, ${VECTOR_STORE_ID}에 저장된 각 교수님 별 리뷰 내용과 grade, workload, teaching을 고려하여 추천하세요.

최종 답변을 제시할 때는 반드시 다음 형식으로 작성하세요:

추천 시간표:
1. [CS.10001] 프로그래밍 기초 (3학점) - 월, 수 10:00-11:15 (교수: 홍길동)
2. [MAS.10001] 미적분학 1 (3학점) - 화, 목 13:00-14:15 (교수: 이순신)
3. [HSS.30101] 대학영어 (2학점) - 금 9:00-10:50 (교수: 강감찬)

이렇게 과목 코드를 정확히 대괄호로 표시하고, 각 과목의 학점과 시간을 명확히 명시해주세요.
그리고 가장 마지막으로 확정된 **최종적인 추천 시간표 하나**만 제시하세요.

현재 학기(${semester})에 개설된 과목 목록과 정확한 정보입니다. 반드시 이 정보대로 추천해주세요:

${availableCourses.map(course => 
  `- [${course.code}] ${course.name} (${course.credits}학점, ${course.yearRecommended}학년 권장, 교수: ${course.professor}) - ${course.schedules}`
).join('\n')}
`
    };

    // 최종 메시지 배열 생성
    const finalMessages = [systemMessage, ...messages];

    console.log('Calling OpenAI API directly...');
    
    // OpenAI API 직접 호출
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: finalMessages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API 요청 실패: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content || '';
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
      
      console.log('Sending OpenAI API request...');
      
      // OpenAI API 직접 호출
      const assistantMessage = await callOpenAI(messagesToSend, filteredSubjectsBySemester, currentSemester);
      
      console.log('OpenAI 응답 데이터:', assistantMessage);
      
      // 응답 메시지 추가
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: assistantMessage
      }]);
      
      // 추천 결과 처리 - 메시지에서 과목 코드 추출
      if (assistantMessage.includes('추천 시간표') || assistantMessage.includes('추천 과목')) {
        console.log('추천 시간표 관련 응답, 과목 코드 추출 시도');
        
        // 메시지에서 과목 코드 추출
        const recommendedCodes = parseRecommendedCourses(assistantMessage);
        console.log('추출한 과목 코드:', recommendedCodes);
        
        if (recommendedCodes.length > 0) {
          // 과목 코드와 일치하는 과목 찾기
          const recommendedSubjects = filteredSubjectsBySemester.filter(subject => 
            recommendedCodes.includes(subject.code)
          );
          
          console.log('찾은 추천 과목:', recommendedSubjects.length);
          
          if (recommendedSubjects.length > 0) {
            // 추천 결과 설정
            setRecommendationResult({
              subjects: recommendedSubjects,
              explanation: assistantMessage
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
        content: `죄송합니다. 요청을 처리하는 중에 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 클라이언트 측 과목 코드 추출 함수
  function parseRecommendedCourses(message: string): string[] {
    console.log('메시지에서 과목 코드 추출 시도...');
    
    // 대괄호로 둘러싸인 과목 코드 패턴 (예: [CS.12345])
    const bracketCodeRegex = /\[([A-Z]{2,3}\.[0-9]{5})\]/g;
    let bracketMatches: string[] = [];
    let bracketMatch: RegExpExecArray | null;
    
    while ((bracketMatch = bracketCodeRegex.exec(message)) !== null) {
      bracketMatches.push(bracketMatch[1]);
    }
    
    // 대괄호로 둘러싸인 과목 코드가 있으면 우선 사용
    if (bracketMatches.length > 0) {
      console.log('대괄호로 표시된 과목 코드:', bracketMatches);
      return bracketMatches.filter((code, index) => bracketMatches.indexOf(code) === index);
    }
    
    // 굵은 텍스트 안에 있는 과목 코드 패턴 (예: **CS.12345**)
    const boldCodeRegex = /\*\*([A-Z]{2,3}\.[0-9]{5})\*\*/g;
    let boldMatches: string[] = [];
    let boldMatch: RegExpExecArray | null;
    
    // message를 복사하여 사용
    let msgCopy = message;
    
    while ((boldMatch = boldCodeRegex.exec(msgCopy)) !== null) {
      boldMatches.push(boldMatch[1]);
    }
    
    // 굵은 텍스트로 표시된 과목 코드가 있으면 사용
    if (boldMatches.length > 0) {
      console.log('굵은 텍스트로 표시된 과목 코드:', boldMatches);
      return boldMatches.filter((code, index) => boldMatches.indexOf(code) === index);
    }
    
    // 일반 과목 코드 패턴 (예: CS.12345)
    const strictCodeRegex = /([A-Z]{2,3}\.[0-9]{5})/g;
    const matches = message.match(strictCodeRegex);
    
    // 일반 패턴으로 찾은 경우
    if (matches && matches.length > 0) {
      console.log('일반 패턴으로 찾은 과목 코드:', matches);
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
      console.log('느슨한 패턴으로 찾은 과목 코드:', looseMatches);
      return looseMatches.filter((code, index) => looseMatches.indexOf(code) === index);
    }
    
    // 그래도 못 찾은 경우 빈 배열 반환
    console.log('과목 코드를 찾을 수 없음');
    return [];
  }
  
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

  // 모든 Perfect Match 과목만 추가하는 핸들러
  const handleAddPerfectMatchSubjects = () => {
    if (!recommendationResult || recommendationResult.subjects.length === 0) return;
    
    // Perfect Match 과목만 필터링
    const perfectMatchSubjects = recommendationResult.subjects.filter(subject => isPerfectMatch(subject));
    
    if (perfectMatchSubjects.length === 0) {
      alert('완벽하게 일치하는 추천 과목이 없습니다.');
      return;
    }
    
    // 결과 변수 초기화
    let addedCount = 0;
    let failedCount = 0;
    let conflictingSubjects: string[] = [];
    
    // 모든 Perfect Match 과목을 순회하며 추가 시도
    perfectMatchSubjects.forEach(subject => {
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
      resultMessage += `${addedCount}개 AI 추천 과목이 시간표에 추가되었습니다.\n`;
    }
    
    if (failedCount > 0) {
      resultMessage += `${failedCount}개 과목은 추가할 수 없습니다.\n`;
      resultMessage += `(${conflictingSubjects.join(', ')})`;
    }
    
    // 결과 알림
    alert(resultMessage);
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
            <SectionHeader>
              <SectionTitle>
                <FiCpu size={20} color="#107F4F" />
                AI 추천 시간표
              </SectionTitle>
              
              {/* 완벽히 일치하는 추천 과목만 추가하는 버튼 */}
              <PerfectMatchButton onClick={handleAddPerfectMatchSubjects}>
                <FiCheckCircle size={18} />
                <span>AI 추천 과목만 추가</span>
              </PerfectMatchButton>
            </SectionHeader>
            
            <RecommendationDescription>
              {recommendationResult.explanation}
            </RecommendationDescription>
            
            <SubjectList>
              {recommendationResult.subjects.map(subject => {
                // 리뷰 평점 데이터 가져오기
                const rating = calculateSubjectRating(subject);
                // 추천 일치 수준 확인 (코드, 교수, 시간 모두 일치인지)
                const isPerfectlyMatched = isPerfectMatch(subject);
                
                return (
                  <CourseCard key={subject.id}>
                    <CourseHeader>
                      <CourseCode>{subject.code}</CourseCode>
                      {isPerfectlyMatched ? (
                        <CourseBadge color="#E2FDEA">
                          <FiCheckCircle size={12} style={{ marginRight: '4px' }} />
                          AI 추천
                        </CourseBadge>
                      ) : (
                        <CourseBadge color="#F0F0F0">코스 매치</CourseBadge>
                      )}
                    </CourseHeader>
                    <CourseBody>
                      <CourseName>{subject.name}</CourseName>
                      <CourseDetail>
                        <FiUser size={14} />
                        <span>{subject.professor}</span>
                      </CourseDetail>
                      <CourseDetail>
                        <FiBook size={14} />
                        <span>{subject.credits} 학점</span>
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
                    </CourseBody>
                    <CourseFooter>
                      <ButtonGroup>
                        <MoreButton onClick={() => openSubjectModal(subject)}>
                          <FiInfo size={16} />
                          리뷰 상세
                        </MoreButton>
                        <AddButton onClick={() => handleAddSubject(subject)}>
                          <FiPlus size={16} />
                          시간표에 추가
                        </AddButton>
                      </ButtonGroup>
                    </CourseFooter>
                  </CourseCard>
                );
              })}
            </SubjectList>
          </RecommendationSection>
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
                      <CourseInfoValue>{selectedSubject.category || '전공'}</CourseInfoValue>
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

// 스타일 컴포넌트들 (이전과 동일)
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

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: ${props => props.theme.typography.T4.fontFamily};
  font-size: ${props => props.theme.typography.T4.fontSize};
  font-weight: ${props => props.theme.typography.T4.fontWeight};
  color: ${props => props.theme.colors.black};
  margin: 0;
`;

const PerfectMatchButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background-color: ${props => props.theme.colors.green[300]};
  color: ${props => props.theme.colors.green[600]};
  border: 1px solid ${props => props.theme.colors.green[300]};
  border-radius: 4px;
  font-family: ${props => props.theme.typography.T6.fontFamily};
  font-size: ${props => props.theme.typography.T6.fontSize};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.theme.colors.green[300]};
    transform: translateY(-2px);
  }
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

const CourseBadge = styled.div<{ color: string }>`
  display: flex;
  align-items: center;
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

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
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

export default AiMakerPage;