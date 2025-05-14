import json
import os

def merge_json_files_to_jsonl(json_paths, output_path):
    with open(output_path, 'w', encoding='utf-8') as outfile:
        for path in json_paths:
            with open(path, 'r', encoding='utf-8') as infile:
                try:
                    data = json.load(infile)
                    if isinstance(data, list):
                        for entry in data:
                            outfile.write(json.dumps(entry, ensure_ascii=False) + '\n')
                    elif isinstance(data, dict):
                        outfile.write(json.dumps(data, ensure_ascii=False) + '\n')
                except json.JSONDecodeError as e:
                    print(f"JSON 파싱 실패: {path}\n{e}")

    print(f"모든 파일 병합 완료: {output_path}")

def merge_json_files_by_type(json_file_list, output_path):
    if len(json_file_list) != 3:
        raise ValueError("json_file_list에는 정확히 3개의 경로(courses, reviews, subjects)를 포함해야 합니다.")

    with open(json_file_list[0], 'r', encoding='utf-8') as f:
        courses = json.load(f)
    with open(json_file_list[1], 'r', encoding='utf-8') as f:
        reviews = json.load(f)
    with open(json_file_list[2], 'r', encoding='utf-8') as f:
        subjects = json.load(f)

    merged = {
        "courses": courses,
        "reviews": reviews,
        "subjects": subjects
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)

    print(f"✅ 병합 완료: {output_path}")

def convert_merged_to_vectorstore_format(input_path, output_path):
    with open(input_path, 'r', encoding='utf-8') as f:
        merged = json.load(f)

    vs_data = []

    for category, items in merged.items():
        for item in items:
            # 내용 압축: 전부 문자열로 풀어내기
            flat_text = " | ".join([f"{k}: {v}" for k, v in item.items() if isinstance(v, str)])
            vs_data.append({
                "text": flat_text,
                "metadata": {"source": category}
            })

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(vs_data, f, ensure_ascii=False, indent=2)

    print(f"✅ Vector Store용 변환 완료: {output_path}")

def split_json_file_in_half(input_path, output_path1, output_path2):
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if not isinstance(data, list):
        raise ValueError("입력 파일은 JSON 배열이어야 합니다.")

    mid = len(data) // 2
    part1 = data[:mid]
    part2 = data[mid:]

    with open(output_path1, 'w', encoding='utf-8') as f1:
        json.dump(part1, f1, ensure_ascii=False, indent=2)

    with open(output_path2, 'w', encoding='utf-8') as f2:
        json.dump(part2, f2, ensure_ascii=False, indent=2)

    print(f"✅ 분할 완료:\n- {output_path1} ({len(part1)} 항목)\n- {output_path2} ({len(part2)} 항목)")


# otl_crawl 폴더 기준 상대경로 사용
json_file_list = [
    './otl_crawl/coursesData.json',
    './otl_crawl/subjectData.json',
    './otl_crawl/reviewData.json'
]

# merge_json_files_to_jsonl(json_file_list, './otl_crawl/file-OtlData.jsonl')
# merge_json_files_by_type(json_file_list, './otl_crawl/merged_OtlData.json')
"""
convert_merged_to_vectorstore_format(
    'otl_crawl/merged_OtlData.json',
    'otl_crawl/vectorstore_OtlData.json'
)
"""

split_json_file_in_half(
    './otl_crawl/reviewData.json',
    './otl_crawl/reviewData_part1.json',
    './otl_crawl/reviewData_part2.json'
)