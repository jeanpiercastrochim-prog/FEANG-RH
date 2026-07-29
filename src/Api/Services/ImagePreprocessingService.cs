using System.IO;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.PixelFormats;

namespace DNIContractApi.Services
{
    public class ImagePreprocessingService
    {
        public byte[] Preprocess(byte[] inputImage)
        {
            using var image = Image.Load(inputImage);

            image.Mutate(ctx => ctx
                .AutoOrient()          // corregir orientación EXIF
                .Grayscale()           // escala de grises
                .Contrast(1.2f)        // aumentar contraste
                .Resize(800, 500)      // tamaño estándar para el modelo
            );

            using var ms = new MemoryStream();
            // Especificamos el formato PNG para guardar la imagen en el MemoryStream
            image.SaveAsPng(ms);
            return ms.ToArray();
        }
        public byte[] ProcessSignatureImage(byte[] inputImage)
        {
            using var image = Image.Load<Rgba32>(inputImage);

            image.Mutate(ctx => ctx
                .AutoOrient()
                .Resize(new ResizeOptions { Size = new Size(1000, 1000), Mode = ResizeMode.Max })
                .Grayscale()
                .Contrast(1.5f)    // Moderado para no perder detalles sutiles
                .Brightness(1.1f)  // Moderado
            );

            // 1. Convert brightness to alpha transparency
            image.ProcessPixelRows(accessor =>
            {
                for (int y = 0; y < accessor.Height; y++)
                {
                    Span<Rgba32> pixelRow = accessor.GetRowSpan(y);
                    for (int x = 0; x < pixelRow.Length; x++)
                    {
                        ref Rgba32 pixel = ref pixelRow[x];
                        
                        byte brightness = pixel.R;
                        byte alpha = (byte)Math.Max(0, 255 - brightness);
                        
                        // Eliminar solo sombras muy claras del papel
                        if (alpha < 40) alpha = 0;
                        // Mantenemos la opacidad original para los trazos más claros

                        pixel = new Rgba32(0, 0, 0, alpha); // Tinta negra con transparencia natural
                    }
                }
            });

            // 2. Auto-crop to bounding box of visible ink
            int minX = image.Width, minY = image.Height, maxX = 0, maxY = 0;
            image.ProcessPixelRows(accessor => {
                for (int y = 0; y < accessor.Height; y++) {
                    Span<Rgba32> row = accessor.GetRowSpan(y);
                    for (int x = 0; x < row.Length; x++) {
                        if (row[x].A > 0) {
                            if (x < minX) minX = x;
                            if (x > maxX) maxX = x;
                            if (y < minY) minY = y;
                            if (y > maxY) maxY = y;
                        }
                    }
                }
            });

            if (minX <= maxX && minY <= maxY)
            {
                int pad = 20; // 20px padding
                minX = Math.Max(0, minX - pad);
                minY = Math.Max(0, minY - pad);
                int cropWidth = Math.Min(image.Width - minX, (maxX - minX + 1) + pad * 2);
                int cropHeight = Math.Min(image.Height - minY, (maxY - minY + 1) + pad * 2);
                
                image.Mutate(ctx => ctx.Crop(new Rectangle(minX, minY, cropWidth, cropHeight)));
            }

            using var ms = new MemoryStream();
            image.SaveAsPng(ms);
            return ms.ToArray();
        }
    }
}
