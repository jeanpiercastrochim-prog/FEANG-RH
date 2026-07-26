using System.IO;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

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
    }
}
