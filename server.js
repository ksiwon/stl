// server.js - 과목 정보 정확도 향상 버전
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5001;

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 벡터 스토어 ID 설정
const VECTOR_STORE_ID = 'vs_6824bad0eee88191a83e8489e1577351';

// CORS 설정
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// 요청 크기 제한 늘리기
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 채팅 API 엔드포인트
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, subjects, semester } = req.body;

    console.log('Request received:', { 
      messageCount: messages?.length,
      subjectCount: subjects?.length,
      semester
    });

    // 현재 학기에 존재하는 과목 코드 목록 및 정보 생성
    const availableCourses = subjects ? subjects.map(subject => ({
      code: subject.code,
      name: subject.name,
      credits: subject.credits,
      professor: subject.professor,
      schedules: subject.schedules.map(s => 
        `${['월', '화', '수', '목', '금'][s.day]}(${Math.floor(s.startTime/60)}:${s.startTime%60 || '00'}-${Math.floor(s.endTime/60)}:${s.endTime%60 || '00'})`
      ).join(', '),
      // 권장 학년 추출
      yearRecommended: subject.code.match(/\.(\d)/)?.[1] || '?'
    })) : [];

    // 현재 학기 과목 코드만 리스트
    const availableCourseCodes = availableCourses.map(course => course.code);
    
    // 시스템 메시지 생성
    const systemMessage = {
      role: "system",
      content: `당신은 대학생의 시간표 작성을 도와주는 AI 어시스턴트입니다.
현재 학기는 ${semester}입니다.
사용자의 전공, 학년, 듣고 싶은 수업, 오전 수업 선호 여부, 영어 강의 여부, 원하는 총 학점 등을 파악하고 최적의 시간표를 추천해주세요.

중요: 벡터 스토어 ID: ${VECTOR_STORE_ID}에 저장된 과목 정보, 과목 리뷰, 강의 평가 정보를 참고하세요.
중요: 시간표 추천 시 반드시 실제 정확한 과목 정보만 사용해야 합니다.

다음 규칙을 철저히 지켜주세요:
1. 현재 학기에 실제로 개설된 과목만 추천해야 합니다.
2. 과목 코드는 "알파벳.숫자" 형식이며, 숫자의 첫 자리는 해당 과목이 권장되는 학년을 의미합니다.
   예: CS.10001은 1학년, CS.20001은 2학년, CS.30001은 3학년, CS.40001은 4학년에게 권장되는 과목입니다.
3. 학생의 전공이 ${VECTOR_STORE_ID}에 저장된 과목 정보 중 개설학과와 일치하는 과목을 우선적으로 추천하세요.
3. 학생의 학년에 맞는 과목을 우선적으로 추천하세요.
4. 과목 코드를 대괄호로 묶어서 표시하세요. 예: [CS.20004]
5. 절대로 존재하지 않는 과목 정보를 만들어내지 마세요. 반드시 ${VECTOR_STORE_ID}에 저장된 과목 정보 중 ${semester}에 개설된 과목만 사용해야 합니다.
6. 아래 제공된 정확한 정보만 사용해야 합니다.


최종 답변을 제시할 때는 반드시 다음 형식으로 작성하세요:

추천 시간표:
1. [CS.10001] 프로그래밍 기초 (3학점) - 월, 수 10:00-11:15
2. [MAS.10001] 미적분학 1 (3학점) - 화, 목 13:00-14:15
3. [HSS.30101] 대학영어 (2학점) - 금 9:00-10:50

이렇게 과목 코드를 정확히 대괄호로 표시하고, 각 과목의 학점과 시간을 명확히 명시해주세요.
`
    };

    // 현재 학기 과목 목록 상세 정보 추가 (중요!)
    if (subjects && subjects.length > 0) {
      systemMessage.content += `\n\n현재 학기(${semester})에 개설된 과목 목록과 정확한 정보입니다. 반드시 이 정보대로 추천해주세요:\n\n`;
      
      // 가능한 모든 과목 정보를 포함 (최대 제한 고려)
      const displayCourses = availableCourses;
      
      displayCourses.forEach(course => {
        systemMessage.content += `- [${course.code}] ${course.name} (${course.credits}학점, ${course.yearRecommended}학년 권장, 교수: ${course.professor}) - ${course.schedules}\n`;
      });
    }

    // 최종 메시지 배열 생성
    const finalMessages = [systemMessage, ...messages];
    
    console.log('Calling OpenAI API...');
    
    // OpenAI API 호출
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: finalMessages,
      temperature: 0.7,
    });

    // 응답 메시지 파싱
    const assistantMessage = completion.choices[0].message.content || '';
    let recommendedSubjects = [];
    
    // 클라이언트가 과목 정보를 보낸 경우에만 과목 파싱 수행
    if (subjects && subjects.length > 0) {
      try {
        if (assistantMessage.includes('추천 시간표') || assistantMessage.includes('시간표:')) {
          // 사용 가능한 과목 목록에서 추천된 과목 코드 찾기
          const recommendedCodes = parseRecommendedCourses(assistantMessage);
          console.log('추출된 과목 코드:', recommendedCodes);
          
          if (recommendedCodes.length > 0) {
            // 실제 존재하는 과목 코드만 필터링
            const validCodes = recommendedCodes.filter(code => 
              availableCourseCodes.includes(code)
            );
            console.log('유효한 과목 코드:', validCodes);
            
            // 유효한 과목 코드에 해당하는 과목만 추천
            recommendedSubjects = subjects.filter(subject => 
              validCodes.includes(subject.code)
            );
            console.log('최종 추천 과목 수:', recommendedSubjects.length);
            
            // 유효하지 않은 과목 코드가 있다면 로그에 기록
            const invalidCodes = recommendedCodes.filter(code => 
              !availableCourseCodes.includes(code)
            );
            if (invalidCodes.length > 0) {
              console.warn('유효하지 않은 과목 코드가 포함되어 있습니다:', invalidCodes);
            }
          }
        }
      } catch (error) {
        console.error('추천 과목 파싱 오류:', error);
      }
    }

    // 응답 반환
    return res.status(200).json({
      message: assistantMessage,
      recommendation: recommendedSubjects.length > 0 ? {
        subjects: recommendedSubjects,
        explanation: assistantMessage
      } : null
    });
  } catch (error) {
    console.error('API 요청 오류:', error);
    // 에러 세부 정보 로깅
    if (error.response) {
      console.error('OpenAI API 응답 에러:', error.response.status, error.response.data);
    }
    return res.status(500).json({ error: '내부 서버 오류', details: error.message });
  }
});

// 추천 과목 코드를 추출하는 함수 - 다양한 패턴 지원 (대괄호 패턴 추가)
function parseRecommendedCourses(message) {
  // 디버깅을 위한 로그
  console.log('메시지에서 과목 코드 추출 시도...');
  
  // 대괄호로 둘러싸인 과목 코드 패턴 (예: [CS.12345])
  const bracketCodeRegex = /\[([A-Z]{2,3}\.[0-9]{5})\]/g;
  let bracketMatches = [];
  let bracketMatch;
  
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
  let boldMatches = [];
  let boldMatch;
  
  while ((boldMatch = boldCodeRegex.exec(message)) !== null) {
    boldMatches.push(boldMatch[1]);
  }
  
  // 굵은 텍스트로 표시된 과목 코드가 있으면 사용
  if (boldMatches.length > 0) {
    console.log('굵은 텍스트로 표시된 과목 코드:', boldMatches);
    return boldMatches.filter((code, index) => boldMatches.indexOf(code) === index);
  }
  
  // 일반 과목 코드 패턴 (예: CS.12345)
  const strictCodeRegex = /([A-Z]{2,3}\.[0-9]{5})/g;
  let matches = message.match(strictCodeRegex);
  
  // 일반 패턴으로 찾은 경우
  if (matches && matches.length > 0) {
    console.log('일반 패턴으로 찾은 과목 코드:', matches);
    return matches.filter((code, index) => matches.indexOf(code) === index);
  }
  
  // 추가 패턴 시도 (더 느슨한 패턴)
  console.log('정확한 패턴 실패, 느슨한 패턴으로 시도...');
  const looseCodeRegex = /([A-Z]{2,3})[.\s-_]*([0-9]{5})/g;
  
  // 메시지 전체를 검색하며 모든 매치 찾기
  let looseMatches = [];
  let match;
  
  while ((match = looseCodeRegex.exec(message)) !== null) {
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

// 서버 시작
app.listen(port, () => {
  console.log(`서버가 포트 ${port}에서 실행 중입니다.`);
  console.log(`벡터 스토어 ID: ${VECTOR_STORE_ID} (시스템 메시지에 포함됨)`);
});