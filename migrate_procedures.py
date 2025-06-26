import csv
import os
from supabase import create_client, Client

# Supabase 클라이언트 초기화
url = "https://fohwspwyyujsthmxxifn.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvaHdzcHd5eXVqc3RobXh4aWZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MjA5MzAsImV4cCI6MjA2NjQ5NjkzMH0.PwRua7CV6On7Jo44GAqbmuRJuN-wcXKrKw1jKa-b5s4"
supabase: Client = create_client(url, key)

def parse_price(price_str):
    """가격 문자열을 숫자로 변환"""
    if not price_str:
        return 0
    # 쉼표와 따옴표 제거
    cleaned = price_str.replace(',', '').replace('"', '').strip()
    try:
        return float(cleaned)
    except ValueError:
        return 0

def calculate_margin(customer_price, material_cost):
    """마진 계산"""
    if customer_price <= 0:
        return 0, 0
    
    margin = customer_price - material_cost
    margin_percentage = (margin / customer_price) * 100
    return margin, margin_percentage

def main():
    print("🔄 시술 데이터 마이그레이션 시작...")
    
    # 카테고리 매핑 가져오기
    categories_response = supabase.table('categories').select('id, name').execute()
    category_map = {cat['name']: cat['id'] for cat in categories_response.data}
    print(f"✅ 카테고리 로드: {len(category_map)}개")
    
    # 재료 매핑 가져오기
    materials_response = supabase.table('materials').select('id, name, cost').execute()
    material_map = {mat['name']: {'id': mat['id'], 'cost': mat['cost']} for mat in materials_response.data}
    print(f"✅ 재료 로드: {len(material_map)}개")
    
    # 현재 DB의 시술 목록 가져오기 (name + category_id 조합으로)
    procedures_response = supabase.table('procedures').select('name, category_id').execute()
    existing_procedures = {(proc['name'], proc['category_id']) for proc in procedures_response.data}
    print(f"✅ 현재 DB 시술 수: {len(existing_procedures)}개")
    
    # CSV 파일 읽기
    csv_path = "docs/refe/원가계산기 - 시트6.csv"
    new_procedures = []
    skipped_count = 0
    
    with open(csv_path, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            category_name = row['분류'].strip()
            procedure_name = row['시술명'].strip()
            customer_price = parse_price(row['고객가'])
            
            # 카테고리 ID 찾기
            category_id = category_map.get(category_name)
            if not category_id:
                print(f"⚠️  카테고리 '{category_name}' 찾을 수 없음: {procedure_name}")
                skipped_count += 1
                continue
            
            # 중복 체크 (name + category_id 조합)
            if (procedure_name, category_id) in existing_procedures:
                skipped_count += 1
                continue
            
            # 재료 정보 수집 및 총 재료비 계산
            materials = []
            total_material_cost = 0
            missing_materials = []
            
            for i in range(1, 6):  # 재료1~재료5
                material_name = row.get(f'재료{i}', '').strip()
                if material_name:
                    if material_name in material_map:
                        material_info = material_map[material_name]
                        materials.append({
                            'name': material_name,
                            'id': material_info['id'],
                            'cost': material_info['cost']
                        })
                        total_material_cost += material_info['cost']
                    else:
                        missing_materials.append(material_name)
            
            # 누락된 재료가 있으면 경고 표시하지만 계속 진행
            if missing_materials:
                print(f"⚠️  재료 누락 '{', '.join(missing_materials)}': {procedure_name}")
            
            # 마진 계산
            margin, margin_percentage = calculate_margin(customer_price, total_material_cost)
            
            # 시술 데이터 생성
            procedure_data = {
                'name': procedure_name,
                'category_id': category_id,
                'customer_price': customer_price,
                'material_cost': total_material_cost,
                'margin': margin,
                'margin_percentage': margin_percentage
            }
            
            new_procedures.append({
                'data': procedure_data,
                'materials': materials
            })
    
    print(f"📊 CSV 총 시술 수: {len(existing_procedures) + len(new_procedures)}개")
    print(f"🆕 새로 추가할 시술 수: {len(new_procedures)}개")
    print(f"⏭️  중복으로 건너뛴 시술 수: {skipped_count}개")
    
    if new_procedures:
        # 시술 데이터 업로드
        procedures_to_insert = [proc['data'] for proc in new_procedures]
        
        try:
            # 배치로 나누어 업로드 (한 번에 20개씩 - 더 안전하게)
            batch_size = 20
            uploaded_procedures = []
            
            for i in range(0, len(procedures_to_insert), batch_size):
                batch = procedures_to_insert[i:i+batch_size]
                try:
                    response = supabase.table('procedures').insert(batch).execute()
                    uploaded_procedures.extend(response.data)
                    print(f"✅ 시술 배치 {i//batch_size + 1}: {len(batch)}개 업로드 완료")
                except Exception as e:
                    print(f"❌ 시술 배치 {i//batch_size + 1} 실패: {str(e)}")
                    # 실패한 배치는 건너뛰고 계속 진행
                    continue
            
            print(f"🎉 총 {len(uploaded_procedures)}개 시술 업로드 완료!")
            
            # 시술-재료 연결 데이터 생성
            if uploaded_procedures:
                procedure_materials_to_insert = []
                
                # 업로드된 시술 ID 매핑 생성
                procedure_id_map = {proc['name']: proc['id'] for proc in uploaded_procedures}
                
                for proc_info in new_procedures:
                    procedure_name = proc_info['data']['name']
                    procedure_id = procedure_id_map.get(procedure_name)
                    
                    if procedure_id:
                        for material in proc_info['materials']:
                            procedure_materials_to_insert.append({
                                'procedure_id': procedure_id,
                                'material_id': material['id'],
                                'quantity': 1.0,
                                'cost_per_unit': material['cost']
                            })
                
                # 시술-재료 연결 데이터 업로드
                if procedure_materials_to_insert:
                    for i in range(0, len(procedure_materials_to_insert), batch_size):
                        batch = procedure_materials_to_insert[i:i+batch_size]
                        try:
                            supabase.table('procedure_materials').insert(batch).execute()
                            print(f"✅ 시술-재료 연결 배치 {i//batch_size + 1}: {len(batch)}개 연결 완료")
                        except Exception as e:
                            print(f"❌ 시술-재료 연결 배치 {i//batch_size + 1} 실패: {str(e)}")
                            continue
                    
                    print(f"🎉 총 {len(procedure_materials_to_insert)}개 시술-재료 연결 완료!")
                else:
                    print("ℹ️  연결할 시술-재료 데이터가 없습니다.")
            
        except Exception as e:
            print(f"❌ 전체 시술 업로드 실패: {str(e)}")
    else:
        print("ℹ️  새로 추가할 시술이 없습니다.")

if __name__ == "__main__":
    main() 