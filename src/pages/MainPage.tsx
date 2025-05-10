import React, { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import Sidebar from "@/components/layout/Sidebar";
import SubjectList from "@/components/subject/SubjectList";
import CreditSummary from "@/components/subject/CreditSummary";
import Timetable from "@/components/timetable/Timetable"; // ✅ 리디자인된 시간표
import { useTimetable } from "@/hooks/useTimetable";
import { useCredits } from "@/hooks/useCredits";

// 학기별 데이터 가져오기
import subjectsSpring from "@/mock/subjects_2025_1.json";
import subjectsSummer from "@/mock/subjects_2025_2.json";

const MainPage: React.FC = () => {
  const { selected, addSubject, removeSubject } = useTimetable();
  const totalCredit = useCredits(selected);
  const [semester, setSemester] = useState<"spring" | "summer">("spring");

  const subjects = semester === "spring" ? subjectsSpring : subjectsSummer;

  return (
    <MainLayout
      sidebar={
        <Sidebar>
          <div style={{ padding: "0 1rem 1rem" }}>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value as "spring" | "summer")}
            >
              <option value="spring">2025년 봄학기</option>
              <option value="summer">2025년 여름학기</option>
            </select>
          </div>
          <SubjectList subjects={subjects} onSelect={addSubject} />
        </Sidebar>
      }
    >
      {/* ✅ 새로 디자인된 시간표 컴포넌트 */}
      <Timetable subjects={selected} onRemove={removeSubject} />
      <CreditSummary total={totalCredit} />
    </MainLayout>
  );
};

export default MainPage;
