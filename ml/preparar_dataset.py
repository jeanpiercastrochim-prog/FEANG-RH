import os
import random
import argparse

def main(input_file, train_ratio=0.75):
    if not os.path.exists(input_file):
        print(f"Error: No se encontró el archivo {input_file}")
        print("Asegúrate de haber extraído el ZIP de Label Studio en la ruta correcta.")
        return

    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Si está vacío, salir
    if len(lines) == 0:
        print("Error: El archivo Label.txt está vacío.")
        return

    # Opcional: Desordenar las líneas para que el entrenamiento no dependa del orden
    random.seed(42) # Semilla fija para reproducibilidad
    random.shuffle(lines)

    # Calcular cuántos van a train y cuántos a val
    train_count = max(1, int(len(lines) * train_ratio))
    
    train_lines = lines[:train_count]
    val_lines = lines[train_count:]

    # En caso de tener muy poquitas fotos (ej. 4), nos aseguramos de que haya al menos 1 en val
    if len(val_lines) == 0 and len(lines) > 1:
        train_lines = lines[:-1]
        val_lines = lines[-1:]

    train_file = os.path.join(os.path.dirname(input_file), 'train.txt')
    val_file = os.path.join(os.path.dirname(input_file), 'val.txt')

    with open(train_file, 'w', encoding='utf-8') as f:
        f.writelines(train_lines)

    with open(val_file, 'w', encoding='utf-8') as f:
        f.writelines(val_lines)

    print(f"¡Dataset dividido con éxito!")
    print(f"- Total de fotos etiquetadas: {len(lines)}")
    print(f"- Para Entrenamiento (train.txt): {len(train_lines)} fotos")
    print(f"- Para Validación (val.txt): {len(val_lines)} fotos")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Divide Label.txt en train.txt y val.txt")
    parser.add_argument('--input', default='data/dataset_paddle/Label.txt', help='Ruta al archivo Label.txt')
    args = parser.parse_args()
    main(args.input)
