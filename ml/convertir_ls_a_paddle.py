import json
import os
import argparse

def convert_ls_to_paddle(ls_json_path, output_dir):
    with open(ls_json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    os.makedirs(output_dir, exist_ok=True)
    out_file = os.path.join(output_dir, 'Label.txt')
    
    lines = []
    
    for item in data:
        filename_in_ls = item.get('file_upload', '')
        
        # Label Studio a veces agrega un hash al inicio, por ejemplo "8ee79d3f-dni_adulto_azul3.webp"
        if '-' in filename_in_ls:
            real_filename = filename_in_ls.split('-', 1)[1]
        else:
            real_filename = filename_in_ls
            
        # La ruta que verá PaddleOCR. Usaremos 'fotos_dni/' asumiendo que data_dir es la raíz del proyecto
        image_path = f"fotos_dni/{real_filename}"
        
        annotations = item.get('annotations', [])
        if not annotations:
            continue
        
        # Ignorar si fue cancelada (skip)
        if annotations[0].get('was_cancelled', False):
            continue
            
        results = annotations[0].get('result', [])
        
        # Agrupar las anotaciones por su ID (para unir el rectángulo con su texto)
        regions = {}
        for r in results:
            rid = r.get('id')
            if not rid: continue
            if rid not in regions:
                regions[rid] = {'bbox': None, 'text': ''}
            
            if r.get('type') == 'rectangle':
                regions[rid]['bbox'] = r
            elif r.get('type') == 'textarea':
                val = r.get('value', {}).get('text', [])
                if val:
                    regions[rid]['text'] = val[0]
                    
        paddle_labels = []
        for rid, reg in regions.items():
            if not reg['bbox']: continue
            
            b = reg['bbox']
            val = b.get('value', {})
            orig_w = b.get('original_width', 100)
            orig_h = b.get('original_height', 100)
            
            # Label Studio da porcentajes, convertir a píxeles
            x_pct = val.get('x', 0)
            y_pct = val.get('y', 0)
            w_pct = val.get('width', 0)
            h_pct = val.get('height', 0)
            
            x = (x_pct / 100.0) * orig_w
            y = (y_pct / 100.0) * orig_h
            w = (w_pct / 100.0) * orig_w
            h = (h_pct / 100.0) * orig_h
            
            # PaddleOCR necesita los 4 puntos (esquinas) del polígono
            x1, y1 = x, y
            x2, y2 = x + w, y
            x3, y3 = x + w, y + h
            x4, y4 = x, y + h
            
            points = [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
            text = reg['text']
            
            paddle_labels.append({
                "transcription": text,
                "points": points
            })
            
        # Si la imagen tiene etiquetas, la agregamos al archivo
        if paddle_labels:
            paddle_str = json.dumps(paddle_labels, ensure_ascii=False)
            line = f"{image_path}\t{paddle_str}\n"
            lines.append(line)
        
    with open(out_file, 'w', encoding='utf-8') as f:
        f.writelines(lines)
        
    print(f"Exportado exitosamente {len(lines)} imágenes a {out_file}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True)
    parser.add_argument('--output_dir', default='data/dataset_paddle')
    args = parser.parse_args()
    convert_ls_to_paddle(args.input, args.output_dir)
