import cv2
import json
import os
import argparse

def get_coordinates(image_path):
    print(f"Abriendo {image_path}...")
    img = cv2.imread(image_path)
    if img is None:
        print(f"Error al leer la imagen: {image_path}. (Si es webp, intenta convertirla a jpg/png primero).")
        return

    # Redimensionar si es muy grande para la pantalla
    max_height = 800
    scale = 1.0
    if img.shape[0] > max_height:
        scale = max_height / img.shape[0]
        img = cv2.resize(img, (int(img.shape[1] * scale), max_height))

    campos = [
        "numero_dni",
        "apellido_paterno",
        "apellido_materno",
        "nombres",
        "fecha_nacimiento"
    ]

    coordenadas = {}

    print("\n--- INSTRUCCIONES ---")
    print("1. Usa el mouse para dibujar un rectángulo sobre el campo.")
    print("2. Presiona ENTER o ESPACIO para confirmar la selección.")
    print("3. Presiona 'c' para cancelar la selección actual e intentar de nuevo.")
    print("---------------------\n")

    for campo in campos:
        window_name = f"Selecciona el area de: {campo}"
        # selectROI devuelve (x, y, ancho, alto)
        r = cv2.selectROI(window_name, img, showCrosshair=True, fromCenter=False)
        cv2.destroyWindow(window_name)

        if r == (0, 0, 0, 0):
            print(f"Saltando campo {campo}...")
            continue

        # Ajustamos las coordenadas a la escala original de la imagen
        real_r = {
            "x": int(r[0] / scale),
            "y": int(r[1] / scale),
            "w": int(r[2] / scale),
            "h": int(r[3] / scale)
        }
        coordenadas[campo] = real_r
        print(f"Guardado '{campo}': {real_r}")

    # Guardar en archivo JSON
    base_name = os.path.splitext(os.path.basename(image_path))[0]
    out_file = f"coordenadas_{base_name}.json"
    
    with open(out_file, "w") as f:
        json.dump(coordenadas, f, indent=4)
        
    print(f"\n¡Listo! Coordenadas guardadas en el archivo: {out_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Herramienta visual para mapear coordenadas de DNI")
    parser.add_argument("imagen", help="Ruta a la imagen del DNI (ej: fotos_dni/foto.jpg)")
    args = parser.parse_args()
    get_coordinates(args.imagen)
