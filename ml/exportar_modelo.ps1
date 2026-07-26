# Script para exportar el modelo entrenado a un formato ultrarrápido (Inference)
# Asegúrate de ejecutar esto desde la carpeta "ml"

cd PaddleOCR

Write-Host "Iniciando la exportación del modelo..." -ForegroundColor Green

python tools/export_model.py -c configs/det/PP-OCRv4/PP-OCRv4_mobile_det.yml `
    -o Global.pretrained_model=../output/dni_det/latest `
    Global.save_inference_dir=../output/dni_det_inference/

Write-Host "¡Exportación finalizada!" -ForegroundColor Green
Write-Host "Tu modelo final listo para producción (C#) está en la carpeta: output/dni_det_inference/" -ForegroundColor Yellow
