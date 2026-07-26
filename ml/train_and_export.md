# Guía de Entrenamiento OCR - Fase 2

Esta guía contiene los pasos exactos para preparar tus datos, entrenar el modelo de IA y exportarlo al formato final para C#.

## 1. Instalación del Entorno
Desde tu terminal en la carpeta `ml`, asegúrate de tener Python 3.11+ instalado y corre:
```bash
pip install -r requirements.txt
```

## 2. Etiquetado con Label Studio
Label Studio es una herramienta visual en el navegador para decirle a la IA "aquí está el nombre", "aquí está el DNI".

1. **Iniciar Label Studio:**
   ```bash
   label-studio start
   ```
2. **Crear Proyecto:**
   - En el navegador (normalmente `http://localhost:8080`), crea un proyecto llamado "DNI OCR".
   - En *Data Import*, sube las imágenes que tienes en la carpeta `ml/data/augmented`.
   - En *Labeling Setup*, selecciona *Computer Vision* -> *Optical Character Recognition*.
3. **Etiquetar:**
   - Para cada imagen, debes dibujar un rectángulo sobre cada dato (ej. el número de DNI) y escribir exactamente el texto que contiene.
   - Trata de ajustar el rectángulo al borde del texto para mejor precisión.
4. **Exportar:**
   - Al terminar de etiquetar todas las fotos, ve al botón **Export**.
   - **IMPORTANTE:** Selecciona el formato **PaddleOCR**.
   - Extrae el ZIP descargado en la carpeta `ml/data/dataset_paddle/`. Obtendrás un archivo de texto (`Label.txt`) y una carpeta con las imágenes cortadas.

## 3. Preparando la carpeta de Entrenamiento
Debes dividir ese `Label.txt` (que trae el 100% de tus datos) en dos archivos:
- `train.txt` (70% de las fotos, para aprender)
- `val.txt` (30% de las fotos, para que el modelo se examine y sepamos si aprendió).

Crea la estructura dentro de `ml/data/`:
```
dataset_paddle/
├── train_images/
├── val_images/
├── train.txt
└── val.txt
```

## 4. Descargar Modelo Pre-entrenado (Fine-tuning)
No entrenaremos desde cero. Usaremos el modelo PP-OCRv4 de Paddle (que ya sabe leer español).
```bash
# Entra a ml/training (crea la carpeta si no existe)
mkdir pretrain_models
cd pretrain_models

# Descargar modelo de reconocimiento de texto multi-lenguaje (Latino)
wget https://paddleocr.bj.bcebos.com/PP-OCRv4/Multilingual/latin_PP-OCRv4_rec_train.tar
tar xf latin_PP-OCRv4_rec_train.tar
```

## 5. Entrenamiento (Fine-tuning)
Abre la consola de Anaconda/Python en la carpeta donde clonaste el repo base de PaddleOCR (recomendamos clonar `https://github.com/PaddlePaddle/PaddleOCR`).

Ejecuta el entrenamiento apuntando a tus datos:
```bash
python tools/train.py -c configs/rec/PP-OCRv4/latin_PP-OCRv4_rec.yml \
   -o Global.pretrained_model=pretrain_models/latin_PP-OCRv4_rec_train/best_accuracy \
   Global.epoch_num=100 \
   Train.dataset.data_dir=../ml/data/dataset_paddle/ \
   Train.dataset.label_file_list=[../ml/data/dataset_paddle/train.txt] \
   Eval.dataset.data_dir=../ml/data/dataset_paddle/ \
   Eval.dataset.label_file_list=[../ml/data/dataset_paddle/val.txt]
```
> Si ves que la precisión sube de 90%, ¡estamos listos!

## 6. Exportación a ONNX
Cuando termine, tendrás una carpeta `output/rec/best_accuracy`. Ese es tu modelo final en formato Paddle. Ahora lo convertimos a ONNX (el formato universal que lee C#):

```bash
paddle2onnx \
  --model_dir ./output/rec/best_accuracy \
  --model_filename inference.pdmodel \
  --params_filename inference.pdiparams \
  --save_file ../models/dni_rec.onnx \
  --opset_version 11 \
  --enable_onnx_checker True
```

¡Listo! Toma ese archivo `dni_rec.onnx` (y haz lo mismo para el modelo de detección `dni_det.onnx`) y pégalos en la carpeta `src/Api/Models/` de tu backend.
