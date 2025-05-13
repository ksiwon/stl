from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, ElementNotInteractableException, StaleElementReferenceException
from selenium.webdriver.common.action_chains import ActionChains
import json
import time
import os

class OTLScraper:
    def __init__(self):
        # Chrome 웹드라이버 설정
        chrome_options = Options()
        # 헤드리스 모드로 실행하려면 아래 주석을 해제하세요
        # chrome_options.add_argument("--headless")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        
        # Chrome 드라이버의 새 인스턴스 생성
        self.driver = webdriver.Chrome(options=chrome_options)
        self.wait = WebDriverWait(self.driver, 15)  # 대기 시간 증가
        self.review_data = []  # 리뷰 데이터를 저장할 리스트
        
    def navigate_to_otl(self):
        """OTL 웹사이트로 이동"""
        self.driver.get("https://otl.sparcs.org/dictionary")
        # 페이지가 완전히 로드될 때까지 기다림
        time.sleep(5)
        
        # 페이지 로드 확인
        try:
            self.wait.until(EC.presence_of_element_located((By.CLASS_NAME, "_tabs__elem_zjyzb_333")))
            print("OTL 웹사이트에 성공적으로 접속했습니다.")
        except Exception as e:
            print(f"웹사이트 로딩 중 오류: {e}")
            self.driver.save_screenshot(os.path.join(os.getcwd(), "otl_crawl", "page_load_error.png"))
        
    def select_filters(self, course_types, departments):
        """
        원하는 강의 유형과 학과를 선택
        
        매개변수:
            course_types (list): 선택할 강의 유형 목록 (예: ["기필", "기선", "전필"])
            departments (list): 선택할 학과 목록 (예: ["전산"])
        """
        try:
            # 검색 탭이 선택되어 있는지 확인
            search_tab = self.wait.until(
                EC.element_to_be_clickable((By.XPATH, "//div[contains(@class, '_tabs__elem_zjyzb_333') and .//span[text()='검색']]"))
            )
            if "selected" not in search_tab.get_attribute("class"):
                self.driver.execute_script("arguments[0].click();", search_tab)
                time.sleep(2)
            
            # 검색 영역이 보이는지 확인하고, 보이지 않으면 탭을 클릭
            try:
                search_area = self.driver.find_element(By.CLASS_NAME, "_search-area_zjyzb_2290")
                if "hidden" in search_area.get_attribute("class"):
                    print("검색 영역이 숨겨져 있습니다. 검색 탭을 다시 클릭합니다.")
                    self.driver.execute_script("arguments[0].click();", search_tab)
                    time.sleep(2)
            except NoSuchElementException:
                print("검색 영역 요소를 찾을 수 없습니다.")
            
            # 강의 유형 필터 설정
            print("강의 유형 필터 설정 중...")
            # 전체 체크박스 상태 확인 및 조정
            type_all_checkbox = self.wait.until(
                EC.presence_of_element_located((By.ID, "type-ALL"))
            )
            
            if type_all_checkbox.is_selected():
                # 전체 체크박스가 선택되어 있으면 클릭하여 해제
                try:
                    type_all_label = self.driver.find_element(By.XPATH, "//label[@for='type-ALL']")
                    self.driver.execute_script("arguments[0].click();", type_all_label)
                    print("전체 강의 유형 체크박스를 해제했습니다.")
                    time.sleep(2)
                except Exception as e:
                    print(f"전체 강의 유형 체크박스 해제 중 오류: {e}")
            
            # 지정된 강의 유형 선택
            type_mapping = {
                "기필": "type-BR",
                "기선": "type-BE",
                "전필": "type-MR",
                "전선": "type-ME",
                "공통": "type-GR",
                "석박": "type-EG",
                "교필": "type-MGC",
                "인선": "type-HSE",
                "자선": "type-OE",
                "기타": "type-ETC"
            }
            
            for course_type in course_types:
                if course_type in type_mapping:
                    element_id = type_mapping[course_type]
                    try:
                        checkbox = self.driver.find_element(By.ID, element_id)
                        label = self.driver.find_element(By.XPATH, f"//label[@for='{element_id}']")
                        
                        if not checkbox.is_selected():
                            self.driver.execute_script("arguments[0].click();", label)
                            print(f"강의 유형 선택: {course_type}")
                            time.sleep(0.5)
                        else:
                            print(f"강의 유형 {course_type}은(는) 이미 선택되어 있습니다.")
                    except Exception as e:
                        print(f"강의 유형 '{course_type}' 선택 중 오류: {e}")
            
            # 학과 필터 설정
            print("학과 필터 설정 중...")
            # 전체 체크박스 상태 확인 및 조정
            dept_all_checkbox = self.wait.until(
                EC.presence_of_element_located((By.ID, "department-ALL"))
            )
            
            if dept_all_checkbox.is_selected():
                # 전체 체크박스가 선택되어 있으면 클릭하여 해제
                try:
                    dept_all_label = self.driver.find_element(By.XPATH, "//label[@for='department-ALL']")
                    self.driver.execute_script("arguments[0].click();", dept_all_label)
                    print("전체 학과 체크박스를 해제했습니다.")
                    time.sleep(2)
                except Exception as e:
                    print(f"전체 학과 체크박스 해제 중 오류: {e}")
            
            # 지정된 학과 선택
            dept_mapping = {
                "인문": "department-HSS",
                "건환": "department-CE",
                "기경": "department-BTM",
                "기계": "department-ME",
                "뇌인지": "department-BCS",
                "물리": "department-PH",
                "바공": "department-BiS",
                "반시공": "department-SS",
                "산공": "department-IE",
                "산디": "department-ID",
                "생명": "department-BS",
                "생화공": "department-CBE",
                "수리": "department-MAS",
                "신소재": "department-MS",
                "원양": "department-NQE",
                "융인": "department-TS",
                "전산": "department-CS",
                "전자": "department-EE",
                "항공": "department-AE",
                "화학": "department-CH",
                "기타": "department-ETC"
            }
            
            for department in departments:
                if department in dept_mapping:
                    element_id = dept_mapping[department]
                    try:
                        checkbox = self.driver.find_element(By.ID, element_id)
                        label = self.driver.find_element(By.XPATH, f"//label[@for='{element_id}']")
                        
                        if not checkbox.is_selected():
                            self.driver.execute_script("arguments[0].click();", label)
                            print(f"학과 선택: {department}")
                            time.sleep(0.5)
                        else:
                            print(f"학과 {department}은(는) 이미 선택되어 있습니다.")
                    except Exception as e:
                        print(f"학과 '{department}' 선택 중 오류: {e}")
            
            # 검색 버튼 클릭하여 필터 적용
            search_button = self.driver.find_element(By.XPATH, "//button[@type='submit' and text()='검색']")
            self.driver.execute_script("arguments[0].click();", search_button)
            print("검색 버튼을 클릭하였습니다")
            time.sleep(5)  # 검색 결과 로딩을 위한 대기 시간
            
            # 결과가 있는지 확인
            try:
                no_results = self.driver.find_elements(By.CLASS_NAME, "_list-placeholder_zjyzb_2887")
                if no_results and "결과 없음" in no_results[0].text:
                    print("검색 결과가 없습니다. 다른 필터를 시도해보세요.")
                    return False
                return True
            except Exception as e:
                print(f"결과 확인 중 오류: {e}")
                return True  # 오류 시에도 계속 진행
                
        except Exception as e:
            print(f"필터 선택 중 오류 발생: {e}")
            # 디버깅을 위한 스크린샷 저장
            self.driver.save_screenshot(os.path.join(os.getcwd(), "otl_crawl", "filter_error.png"))
            return False
        
    def scrape_courses(self, save_interval=5, filename="reviewData.json"):
        """
        선택한 필터에 따라 모든 강의 스크래핑
        
        매개변수:
            save_interval (int): 몇 개의 강의마다 JSON 파일에 저장할지 지정
            filename (str): 저장할 JSON 파일 이름
        """
        try:
            # 기존 파일이 있으면 데이터 로드
            otl_crawl_path = os.path.join(os.getcwd(), "otl_crawl")
            full_path = os.path.join(otl_crawl_path, filename)
            
            if os.path.exists(full_path):
                try:
                    with open(full_path, 'r', encoding='utf-8') as f:
                        self.review_data = json.load(f)
                    print(f"기존 파일에서 {len(self.review_data)}개의 리뷰를 로드했습니다.")
                except Exception as e:
                    print(f"기존 파일 로드 중 오류: {e}")
                    self.review_data = []
            
            # 이미 수집한 강의 목록 생성 (강의명+코드 조합)
            crawled_courses = set()
            for review in self.review_data:
                course_key = f"{review['강의명']}_{review['강의코드']}"
                crawled_courses.add(course_key)
            
            print(f"이미 {len(crawled_courses)}개의 강의에 대한 리뷰를 수집했습니다.")
            
            # 페이지가 완전히 로드될 때까지 기다림
            time.sleep(5)
            
            # 모든 강의 블록 찾기
            course_blocks = self.driver.find_elements(By.CLASS_NAME, "_block--course_zjyzb_1737")
            if not course_blocks:
                print("강의를 찾을 수 없습니다. 필터를 확인하세요.")
                return
                    
            print(f"총 {len(course_blocks)}개의 강의를 찾았습니다")
            
            # 마지막 저장 이후 처리한 강의 수 카운터
            courses_since_last_save = 0
            
            for i, course_block in enumerate(course_blocks):
                try:
                    print(f"강의 처리 중 {i+1}/{len(course_blocks)}")
                    
                    # 스크롤하여 요소를 화면에 표시
                    self.driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", course_block)
                    time.sleep(1)  # 스크롤 완료 대기
                    
                    # 강의 제목과 코드 미리 가져오기 (디버깅 목적)
                    try:
                        title_elem = course_block.find_element(By.CLASS_NAME, "_block--course__title_zjyzb_1743")
                        course_pre_title = title_elem.text.strip()
                        print(f"클릭할 강의: {course_pre_title}")
                    except Exception:
                        course_pre_title = "알 수 없음"
                    
                    # JavaScript를 사용하여 강의를 클릭하여 상세 정보 보기
                    self.driver.execute_script("arguments[0].click();", course_block)
                    time.sleep(3)  # 강의 상세 정보 로딩을 위한 대기 시간
                    
                    # 강의 정보 추출
                    try:
                        # 상세 정보 창이 로드되었는지 확인
                        detail_section = self.wait.until(
                            EC.presence_of_element_located((By.CLASS_NAME, "_section--course-detail_zjyzb_637"))
                        )
                        
                        # 강의명과 코드만 추출
                        course_title_elem = detail_section.find_element(By.CLASS_NAME, "_title_zjyzb_1296")
                        course_title = course_title_elem.text.strip()
                        
                        course_code_elem = detail_section.find_element(By.CLASS_NAME, "_subtitle_zjyzb_2133")
                        course_code = course_code_elem.text.strip()
                        
                        print(f"강의명: {course_title}, 코드: {course_code}")
                        
                        # 이미 크롤링한 강의인지 확인
                        course_key = f"{course_title}_{course_code}"
                        if course_key in crawled_courses:
                            print(f"이미 수집한 강의입니다: {course_title} ({course_code}). 건너뜁니다.")
                        else:
                            print(f"새로운 강의입니다: {course_title} ({course_code}). 리뷰를 수집합니다.")
                            # 이제 이 강의에 대한 모든 리뷰 가져오기
                            self.scrape_reviews(course_title, course_code)
                            
                            # 처리한 강의 수 증가
                            courses_since_last_save += 1
                            
                            # 크롤링한 강의 목록에 추가
                            crawled_courses.add(course_key)
                            
                            # 지정된 간격마다 JSON 파일에 저장
                            if courses_since_last_save >= save_interval:
                                self.save_to_json(filename)
                                print(f"{save_interval}개 강의 처리 후 데이터 저장 완료. 총 {len(self.review_data)}개 리뷰 저장됨.")
                                courses_since_last_save = 0
                        
                        # ESC 키를 사용하여 모달 닫기
                        try:
                            ActionChains(self.driver).send_keys(u'\ue00c').perform()
                            time.sleep(2)  # 창이 닫히는 것을 기다림
                        except Exception as e:
                            print(f"ESC 키 사용 중 오류: {e}")
                        
                    except Exception as e:
                        print(f"강의 정보 추출 중 오류: {e}")
                        # ESC 키를 눌러 모달 닫기 시도
                        try:
                            ActionChains(self.driver).send_keys(u'\ue00c').perform()
                            time.sleep(2)
                        except:
                            print("ESC 키를 사용한 창 닫기 실패")
                    
                    # 강의 블록 목록 갱신
                    course_blocks = self.driver.find_elements(By.CLASS_NAME, "_block--course_zjyzb_1737")
                    
                except StaleElementReferenceException:
                    print("요소가 오래되었습니다. 강의 목록을 다시 가져옵니다.")
                    course_blocks = self.driver.find_elements(By.CLASS_NAME, "_block--course_zjyzb_1737")
                except Exception as e:
                    print(f"강의 처리 중 오류 발생: {e}")
                    # 디버깅을 위한 스크린샷 저장
                    otl_crawl_path = os.path.join(os.getcwd(), "otl_crawl")
                    if not os.path.exists(otl_crawl_path):
                        os.makedirs(otl_crawl_path)
                    self.driver.save_screenshot(os.path.join(otl_crawl_path, f"course_error_{i}.png"))
                    
                    # 오류 발생 시 페이지 상태 복구 시도
                    try:
                        # ESC 키를 눌러 모달 닫기 시도
                        ActionChains(self.driver).send_keys(u'\ue00c').perform()
                        time.sleep(2)
                        
                        # 강의 목록 다시 가져오기
                        course_blocks = self.driver.find_elements(By.CLASS_NAME, "_block--course_zjyzb_1737")
                    except:
                        print("페이지 상태 복구 실패")
            
            # 마지막 저장 후 처리된 강의가 있으면 저장
            if courses_since_last_save > 0:
                self.save_to_json(filename)
                print(f"남은 {courses_since_last_save}개 강의 처리 후 데이터 저장 완료. 총 {len(self.review_data)}개 리뷰 저장됨.")
        
        except Exception as e:
            print(f"강의 스크래핑 중 오류 발생: {e}")
            # 디버깅을 위한 스크린샷 저장
            otl_crawl_path = os.path.join(os.getcwd(), "otl_crawl")
            if not os.path.exists(otl_crawl_path):
                os.makedirs(otl_crawl_path)
            self.driver.save_screenshot(os.path.join(otl_crawl_path, "scrape_courses_error.png"))
            
            # 오류 발생해도 지금까지 수집한 데이터 저장
            if self.review_data:
                self.save_to_json(filename)
                print(f"오류 발생으로 중단. 현재까지 수집된 {len(self.review_data)}개 리뷰 저장됨.")
    
    def scrape_reviews(self, course_title, course_code):
        """강의에 대한 모든 리뷰 스크래핑"""
        try:
            # 페이지 로딩 대기
            time.sleep(2)
            
            # 모든 리뷰 블록 찾기
            review_blocks = self.driver.find_elements(By.CLASS_NAME, "block--review")
            print(f"{course_title}에 대한 {len(review_blocks)}개의 리뷰를 찾았습니다")
            
            for review_block in review_blocks:
                try:
                    # 리뷰 정보 추출
                    review_title_elem = review_block.find_element(By.CLASS_NAME, "_block--review__title_zjyzb_1807")
                    
                    # 교수명과 학기 추출 - HTML 구조에 따라 정확하게 추출
                    try:
                        # 교수명은 첫 번째 span 태그에 있음
                        professor_span = review_title_elem.find_element(By.XPATH, "./span[1]")
                        professor_name = professor_span.text.strip()
                        
                        # 학기는 두 번째 span 태그에 있음
                        semester_span = review_title_elem.find_element(By.XPATH, "./span[2]")
                        semester = semester_span.text.strip()
                    except Exception as e:
                        print(f"교수명/학기 추출 중 오류: {e}")
                        professor_name = "알 수 없음"
                        semester = "알 수 없음"
                    
                    review_content_elem = review_block.find_element(By.CLASS_NAME, "_block--review__content_zjyzb_1814")
                    review_content = review_content_elem.text.strip()
                    
                    # 평점 추출
                    ratings = {}
                    rating_elements = review_block.find_elements(By.CLASS_NAME, "_block--review__menus__score_zjyzb_1834")
                    
                    for rating_element in rating_elements:
                        rating_text = rating_element.text.strip()
                        if "추천" in rating_text:
                            ratings["recommendation"] = rating_text.split()[-1]
                        elif "성적" in rating_text:
                            ratings["grade"] = rating_text.split()[-1]
                        elif "널널" in rating_text:
                            ratings["workload"] = rating_text.split()[-1]
                        elif "강의" in rating_text:
                            ratings["teaching"] = rating_text.split()[-1]
                    
                    # 리뷰 객체 생성
                    review_data = {
                        "강의명": course_title,
                        "강의코드": course_code,
                        "교수명": professor_name,
                        "학기": semester,
                        "리뷰내용": review_content,
                        "평점": ratings
                    }
                    
                    self.review_data.append(review_data)
                    print(f"리뷰 추출 완료: {professor_name}, {semester}")
                    
                except Exception as e:
                    print(f"리뷰 처리 중 오류 발생: {e}")
            
        except Exception as e:
            print(f"리뷰 스크래핑 중 오류 발생: {e}")
    
    def save_to_json(self, filename="reviewData.json"):
        """수집한 데이터를 JSON 파일로 저장"""
        try:
            # otl_crawl 폴더에 저장
            otl_crawl_path = os.path.join(os.getcwd(), "otl_crawl")
            
            # otl_crawl 폴더가 없으면 생성
            if not os.path.exists(otl_crawl_path):
                os.makedirs(otl_crawl_path)
                print(f"otl_crawl 폴더를 생성했습니다: {otl_crawl_path}")
            
            full_path = os.path.join(otl_crawl_path, filename)
            
            with open(full_path, 'w', encoding='utf-8') as f:
                json.dump(self.review_data, f, ensure_ascii=False, indent=4)
            print(f"데이터가 {full_path}에 저장되었습니다. 총 {len(self.review_data)}개의 리뷰가 저장되었습니다.")
        except Exception as e:
            print(f"JSON 저장 중 오류 발생: {e}")
    
    def close(self):
        """웹드라이버 종료"""
        self.driver.quit()

def main():
    scraper = OTLScraper()
    
    try:
        # OTL 웹사이트로 이동
        scraper.navigate_to_otl()
        
        # 필터 설정
        course_types = ["인선"]
        departments = ["전체"]
        
        print(f"스크래핑할 강의 유형: {', '.join(course_types)}")
        print(f"스크래핑할 학과: {', '.join(departments)}")
        
        # 필터 적용
        results_exist = scraper.select_filters(course_types, departments)
        
        if results_exist:
            # 강의 스크래핑 (5개 강의마다 저장)
            scraper.scrape_courses(save_interval=5, filename="reviewData.json")
            
            # 최종 데이터가 저장되었으므로 추가 저장 필요 없음
        else:
            print("검색 결과가 없어 스크래핑을 중단합니다.")
        
    except Exception as e:
        print(f"오류 발생: {e}")
        # 디버깅을 위한 스크린샷 저장
        try:
            # otl_crawl 폴더에 스크린샷 저장
            otl_crawl_path = os.path.join(os.getcwd(), "otl_crawl")
            if not os.path.exists(otl_crawl_path):
                os.makedirs(otl_crawl_path)
            scraper.driver.save_screenshot(os.path.join(otl_crawl_path, "error.png"))
        except:
            pass
    
    finally:
        scraper.close()

if __name__ == "__main__":
    main()