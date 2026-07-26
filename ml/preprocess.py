import cv2
import numpy as np
import os
from pathlib import Path

def preprocess_dni(image_path, output_path=None):
    """
    Toma una imagen cruda de un DNI y la prepara para OCR.
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"No se pudo cargar la imagen: {image_path}")

    # 1. Escala de grises
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 2. Normalización de contraste usando CLAHE (ayuda muchísimo con luces y sombras del plástico)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    enhanced = clahe.apply(gray)

    # 3. Binarización Adaptativa (Suaviza el fondo que suele tener texturas en el DNI)
    # Usamos Gaussian para mantener limpios los bordes de las letras
    binary = cv2.adaptiveThreshold(
        enhanced, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 11, 2
    )

    # 4. Redimensionar a una proporción estándar (800x500)
    resized = cv2.resize(binary, (800, 500))

    if output_path:
        cv2.imwrite(output_path, resized)

    return resized

if __name__ == "__main__":
    # Test rápido de preprocesamiento
    input_dir = r"c:\Users\Usuario\Downloads\solucion_RH\proyecto\ml\data\augmented"
    output_dir = r"c:\Users\Usuario\Downloads\solucion_RH\proyecto\ml\data\preprocessed"
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    print("Iniciando preprocesamiento de prueba...")
    if os.path.exists(input_dir):
        for f in os.listdir(input_dir):
            if f.lower().endswith(('.png', '.jpg', '.jpeg')):
                in_path = os.path.join(input_dir, f)
                out_path = os.path.join(output_dir, f"prep_{f}")
                preprocess_dni(in_path, out_path)
                print(f"Preprocesado: {f}")
        print(f"Completado. Imágenes listas en {output_dir}")
    else:
        print(f"No se encontró el directorio: {input_dir}. ¡Asegúrate de correr augment_data.py primero!")
