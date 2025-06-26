import csv
import os
from supabase import create_client, Client

# Supabase 클라이언트 초기화
url = "https://fohwspwyyujsthmxxifn.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvaHdzcHd5eXVqc3RobXh4aWZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MjA5MzAsImV4cCI6MjA2NjQ5NjkzMH0.PwRua7CV6On7Jo44GAqbmuRJuN-wcXKrKw1jKa-b5s4"
supabase: Client = create_client(url, key)

def parse_cost(cost_str):
    """가격 문자열을 숫자로 변환"""
    if not cost_str:
        return 0
    # 쉼표와 따옴표 제거
    cleaned = cost_str.replace(',', '').replace('"', '').strip()
    try:
        return float(cleaned)
    except ValueError:
        return 0

def main():
    print("🔄 재료 데이터 마이그레이션 시작...")
    
    # 현재 DB의 재료 목록 가져오기
    response = supabase.table('materials').select('name').execute()
    existing_materials = {item['name'] for item in response.data}
    print(f"✅ 현재 DB 재료 수: {len(existing_materials)}개")
    
    # CSV 파일 읽기
    new_materials = []
    csv_path = "docs/refe/원가계산기 - 재료.csv"
    
    with open(csv_path, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            name = row['재료이름'].strip()
            cost = parse_cost(row['원가'])
            
            # 중복 체크
            if name not in existing_materials:
                new_materials.append({
                    'name': name,
                    'cost': cost,
                    'unit': 'ea'  # 기본값
                })
    
    print(f"📊 CSV 총 재료 수: {len(existing_materials) + len(new_materials)}개")
    print(f"🆕 새로 추가할 재료 수: {len(new_materials)}개")
    
    if new_materials:
        # 배치로 나누어 업로드 (한 번에 100개씩)
        batch_size = 100
        total_uploaded = 0
        
        for i in range(0, len(new_materials), batch_size):
            batch = new_materials[i:i+batch_size]
            try:
                response = supabase.table('materials').insert(batch).execute()
                total_uploaded += len(batch)
                print(f"✅ 배치 {i//batch_size + 1}: {len(batch)}개 업로드 완료")
            except Exception as e:
                print(f"❌ 배치 {i//batch_size + 1} 업로드 실패: {str(e)}")
                continue
        
        print(f"🎉 총 {total_uploaded}개 재료 업로드 완료!")
    else:
        print("ℹ️  새로 추가할 재료가 없습니다.")

if __name__ == "__main__":
    main() 