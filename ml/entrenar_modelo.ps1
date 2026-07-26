# Script para iniciar el entrenamiento (Fase Beta POC)
# Asegúrate de ejecutar esto desde la carpeta "ml"

cd PaddleOCR

Write-Host "Iniciando el entrenamiento de PaddleOCR..." -ForegroundColor Green
Write-Host "Modelo Base: PP-OCRv4 Detection" -ForegroundColor Cyan
Write-Host "Datos: 3 fotos de entrenamiento, 2 de validación" -ForegroundColor Cyan

# Ejecutar el script de entrenamiento de Paddle
# Usamos el modelo student de PP-OCRv4 que es más rápido y ligero
python tools/train.py -c configs/det/PP-OCRv4/PP-OCRv4_mobile_det.yml `
    -o Global.pretrained_model=./pretrain_models/ch_PP-OCRv4_det_train/best_accuracy `
    Global.save_model_dir=../output/dni_det/ `
    Train.dataset.name=SimpleDataSet `
    Train.dataset.data_dir=../../ `
    Train.dataset.label_file_list=["../data/dataset_paddle/train.txt"] `
    Eval.dataset.name=SimpleDataSet `
    Eval.dataset.data_dir=../../ `
    Eval.dataset.label_file_list=["../data/dataset_paddle/val.txt"] `
    Global.use_gpu=False `
    Global.epoch_num=100

Write-Host "¡Entrenamiento finalizado!" -ForegroundColor Green
Write-Host "Los mejores pesos se han guardado en la carpeta output/dni_det/" -ForegroundColor Yellow
