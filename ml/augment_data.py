
import cv2
import os
import numpy as np
from pathlib import Path

# Configuración
INPUT_DIR = r"c:\Users\Lenovo\Desktop\solucion_RH\proyecto\fotos_dni"
OUTPUT_DIR = r"c:\Users\Lenovo\Desktop\solucion_RH\proyecto\ml\data\augmented"

def augment_image(img_path, output_dir, idx):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    img = cv2.imread(img_path)
    if img is None:
        print(f"Error cargando imagen: {img_path}")
        return

    base_name = Path(img_path).stem
    
    # 1. Original
    cv2.imwrite(os.path.join(output_dir, f"{base_name}_0_orig.jpg"), img)
    
    # 2. Rotaciones leves (+5, -5 grados)
    rows, cols = img.shape[:2]
    for angle in [5, -5]:
        M = cv2.getRotationMatrix2D((cols/2, rows/2), angle, 1)
        rotated = cv2.warpAffine(img, M, (cols, rows))
        cv2.imwrite(os.path.join(output_dir, f"{base_name}_1_rot{angle}.jpg"), rotated)
        
    # 3. Brillo y Contraste
    alpha_beta_pairs = [(1.2, 10), (0.8, -10)] # (contraste, brillo)
    for i, (alpha, beta) in enumerate(alpha_beta_pairs):
        adjusted = cv2.convertScaleAbs(img, alpha=alpha, beta=beta)
        cv2.imwrite(os.path.join(output_dir, f"{base_name}_2_adj{i}.jpg"), adjusted)
        
    # 4. Blur leve
    blurred = cv2.GaussianBlur(img, (5, 5), 0)
    cv2.imwrite(os.path.join(output_dir, f"{base_name}_3_blur.jpg"), blurred)
    
    # 5. Escala de grises
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    cv2.imwrite(os.path.join(output_dir, f"{base_name}_4_gray.jpg"), gray)

def main():
    if not os.path.exists(INPUT_DIR):
        print(f"Directorio de entrada no existe: {INPUT_DIR}")
        return
        
    files = [f for f in os.listdir(INPUT_DIR) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.avif'))]
    print(f"Encontradas {len(files)} imagenes para augmentar.")
    
    for idx, f in enumerate(files):
        img_path = os.path.join(INPUT_DIR, f)
        print(f"Procesando: {f}")
        augment_image(img_path, OUTPUT_DIR, idx)
        
    print(f"Proceso completado. Revisa {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
