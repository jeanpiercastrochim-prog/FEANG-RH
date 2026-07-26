using System;
using System.IO;
using System.Threading.Tasks;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using DNIContractApi.Models.Entities;
using DNIContractApi.Models.DTOs;
using Tesseract;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Bmp;

namespace DNIContractApi.Services
{
    public class OcrService : IOcrService
    {
        private readonly ILogger<OcrService> _logger;
        private readonly string _apiKey;
        private readonly HttpClient _httpClient;

        public OcrService(IConfiguration config, ILogger<OcrService> logger)
        {
            _logger = logger;
            _apiKey = config["GeminiApiKey"] ?? "";
            _httpClient = new HttpClient();
        }

        public async Task<OcrResult> ExtractAsync(byte[] frontImageBytes, byte[] backImageBytes, string mode = "IA")
        {
            if (mode == "LOCAL")
            {
                _logger.LogInformation("Usuario solicitó procesamiento con Modelo Local (Tesseract Multi-Pass).");
                return ProcessWithTesseract(frontImageBytes, backImageBytes);
            }

            if (string.IsNullOrEmpty(_apiKey) || _apiKey == "PEGA_TU_API_KEY_AQUI")
            {
                return new OcrResult { Success = false, ErrorMessage = "Por favor, configura tu GeminiApiKey en appsettings.json." };
            }

            try
            {
                var frontBase64 = Convert.ToBase64String(frontImageBytes);
                var backBase64 = Convert.ToBase64String(backImageBytes);

                var prompt = @"Analiza detalladamente las dos imágenes del Documento Nacional de Identidad (DNI) de Perú que se te han proporcionado (Anverso y Reverso).
Extrae la información y devuélvela estrictamente en formato JSON válido, sin bloques de código markdown (sin ```json ni ```), utilizando exactamente la siguiente estructura de llaves:

{
  ""nombres"": ""extraer del anverso, bajo la etiqueta 'Prenombres'"",
  ""apellidoPaterno"": ""primer apellido del campo 'Apellidos' en el anverso"",
  ""apellidoMaterno"": ""segundo apellido del campo 'Apellidos' en el anverso"",
  ""numeroDni"": ""número de 8 dígitos del DNI. Se encuentra en el anverso arriba a la derecha bajo la etiqueta 'CUI' o en rojo, o impreso verticalmente al lado izquierdo de la foto. También se puede corroborar en el reverso dentro del código de barras o lectura mecánica inferior (ej. PER12345678)"",
  ""fechaNacimiento"": ""fecha de nacimiento en formato DD/MM/YYYY"",
  ""sexo"": ""MASCULINO o FEMENINO (si dice 'M' es MASCULINO, si dice 'F' es FEMENINO)"",
  ""estadoCivil"": ""estado civil impreso en el DNI (ej: SOLTERO, CASADO, DIVORCIADO, VIUDO)"",
  ""direccion"": ""dirección completa del domicilio impresa en el reverso al lado o debajo de la etiqueta 'Dirección' (ej: 'CALLE LOS DIAMANTES C - 16 URB. CALIFORNIA')"",
  ""departamento"": ""departamento del domicilio, extraído de la sección 'Departamento/Provincia/Distrito' en el reverso"",
  ""provincia"": ""provincia del domicilio, extraído de la sección 'Departamento/Provincia/Distrito' en el reverso"",
  ""distrito"": ""distrito del domicilio, extraído de la sección 'Departamento/Provincia/Distrito' en el reverso"",
  ""wasSwapped"": true // o false. Pon true si la primera imagen proporcionada es en realidad el Reverso del DNI y la segunda imagen es el Anverso. Si están en el orden correcto (Anverso, Reverso), pon false.
}

Es fundamental ser extremadamente preciso y riguroso. No inventes información. Si no encuentras algún dato, devuélvelo como cadena vacía. Devuelve exclusivamente la cadena JSON formateada.";

                string GetMimeType(byte[] bytes)
                {
                    if (bytes.Length > 4 && bytes[0] == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47)
                        return "image/png";
                    if (bytes.Length > 4 && bytes[0] == 0x52 && bytes[1] == 0x49 && bytes[2] == 0x46 && bytes[3] == 0x46)
                        return "image/webp";
                    if (bytes.Length > 12 && bytes[4] == 0x66 && bytes[5] == 0x74 && bytes[6] == 0x79 && bytes[7] == 0x70 &&
                        bytes[8] == 0x68 && bytes[9] == 0x65 && bytes[10] == 0x69 && bytes[11] == 0x63)
                        return "image/heic";
                    return "image/jpeg";
                }

                var payload = new
                {
                    contents = new[]
                    {
                        new
                        {
                            parts = new object[]
                            {
                                new { text = prompt },
                                new { inlineData = new { mimeType = GetMimeType(frontImageBytes), data = frontBase64 } },
                                new { inlineData = new { mimeType = GetMimeType(backImageBytes), data = backBase64 } }
                            }
                        }
                    },
                    generationConfig = new
                    {
                        temperature = 0.0,
                        responseMimeType = "application/json"
                    }
                };

                var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={_apiKey}";
                var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

                HttpResponseMessage response = null;
                string responseString = string.Empty;
                int maxRetries = 3;

                for (int i = 0; i < maxRetries; i++)
                {
                    response = await _httpClient.PostAsync(url, content);
                    responseString = await response.Content.ReadAsStringAsync();

                    if (response.IsSuccessStatusCode)
                    {
                        break;
                    }

                    _logger.LogWarning($"Intento {i + 1} de Gemini falló: {responseString}");
                    if (i < maxRetries - 1)
                    {
                        await Task.Delay(2000);
                    }
                }

                if (response == null || !response.IsSuccessStatusCode)
                {
                    _logger.LogWarning($"Error de Gemini (Saturación/Falla). Activando fallback de Tesseract local. Detalles: {responseString}");
                    
                    return ProcessWithTesseract(frontImageBytes, backImageBytes);
                }

                using var jsonDoc = JsonDocument.Parse(responseString);
                var root = jsonDoc.RootElement;
                
                var candidates = root.GetProperty("candidates");
                if (candidates.GetArrayLength() == 0)
                {
                    return new OcrResult { Success = false, ErrorMessage = "La IA no devolvió ningún texto." };
                }

                var extractedText = candidates[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString();

                if (string.IsNullOrWhiteSpace(extractedText))
                {
                    return new OcrResult { Success = false, ErrorMessage = "La IA devolvió texto vacío." };
                }

                extractedText = extractedText.Replace("```json", "").Replace("```", "").Trim();

                var options = new JsonSerializerOptions 
                { 
                    PropertyNameCaseInsensitive = true,
                    AllowTrailingCommas = true,
                    ReadCommentHandling = JsonCommentHandling.Skip
                };

                DniData dniData;
                try
                {
                    // Intentar extraer solo el bloque JSON si hay texto adicional
                    int startIndex = extractedText.IndexOf('{');
                    int endIndex = extractedText.LastIndexOf('}');
                    if (startIndex >= 0 && endIndex >= startIndex)
                    {
                        extractedText = extractedText.Substring(startIndex, endIndex - startIndex + 1);
                    }
                    else if (startIndex >= 0 && endIndex == -1)
                    {
                        // JSON truncado, forzar cierre
                        extractedText = extractedText.Substring(startIndex) + "\n}";
                    }

                    dniData = JsonSerializer.Deserialize<DniData>(extractedText, options);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"Error parseando JSON de Gemini. Raw: {extractedText}. Ex: {ex.Message}. Fallback a Tesseract.");
                    return ProcessWithTesseract(frontImageBytes, backImageBytes);
                }
                return new OcrResult 
                { 
                    Success = true, 
                    Confidence = 0.99f, 
                    Data = dniData 
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error en ExtractAsync (Gemini): {ex.Message}");
                return new OcrResult { Success = false, ErrorMessage = "Error interno procesando las imágenes con Gemini." };
            }
        }


        // ══════════════════════════════════════════════════════════════════════
        //  MOTOR OCR LOCAL MEJORADO - PREMIUM (OSD, ICAO, Ubigeo)
        // ══════════════════════════════════════════════════════════════════════

        private OcrResult ProcessWithTesseract(byte[] frontImageBytes, byte[] backImageBytes)
        {
            try
            {
                string tessDataPath = Path.Combine(Directory.GetCurrentDirectory(), "tessdata");

                // ═══ PASO 0: AUTO-ROTACIÓN HEURÍSTICA ═══
                _logger.LogInformation("=== INICIANDO AUTO-ROTACIÓN HEURÍSTICA ===");
                frontImageBytes = FixImageOrientation(frontImageBytes, tessDataPath, "FRONT");
                backImageBytes = FixImageOrientation(backImageBytes, tessDataPath, "BACK");

                // ═══ PASO 1: OCR MULTI-PASS (4 preprocesados por imagen) ═══
                _logger.LogInformation("=== INICIANDO OCR MULTI-PASS MEJORADO ===");

                var frontTexts = MultiPassOcr(tessDataPath, frontImageBytes, "FRONT");
                var backTexts = MultiPassOcr(tessDataPath, backImageBytes, "BACK");

                string frontAll = string.Join("\n", frontTexts);
                string backAll = string.Join("\n", backTexts);

                // DEBUG: Loguear TODO el texto crudo para diagnóstico
                _logger.LogInformation($"=== RAW FRONT TEXT ===\n{frontAll.Substring(0, Math.Min(frontAll.Length, 2000))}");
                _logger.LogInformation($"=== RAW BACK TEXT ===\n{backAll.Substring(0, Math.Min(backAll.Length, 2000))}");

                // ═══ PASO 2: AUTO-SWAP INTELIGENTE ═══
                bool wasSwapped = false;
                bool frontHasFaceOrName = HasFaceOrNameIndicators(frontAll);
                bool backHasFaceOrName = HasFaceOrNameIndicators(backAll);
                bool frontHasAddress = HasAddressIndicators(frontAll);
                bool backHasAddress = HasAddressIndicators(backAll);

                if (backHasFaceOrName && !frontHasFaceOrName)
                {
                    _logger.LogInformation("AUTO-SWAP: Rostro/Nombres detectados en 'back'. Invirtiendo imágenes.");
                    (frontAll, backAll) = (backAll, frontAll);
                    (frontTexts, backTexts) = (backTexts, frontTexts);
                    wasSwapped = true;
                }
                else if (!frontHasFaceOrName && !backHasFaceOrName && frontHasAddress && !backHasAddress)
                {
                    _logger.LogInformation("AUTO-SWAP: Dirección detectada en 'front'. Invirtiendo imágenes.");
                    (frontAll, backAll) = (backAll, frontAll);
                    (frontTexts, backTexts) = (backTexts, frontTexts);
                    wasSwapped = true;
                }

                string allTextCombined = frontAll + "\n" + backAll;

                // ═══ PASO 3: EXTRAER DATOS DEL MRZ (ICAO Validado) ═══
                var mrzData = ParseMRZ(allTextCombined);
                _logger.LogInformation($"MRZ → DNI:{mrzData.dni} | Nombres:{mrzData.nombres} | Paterno:{mrzData.paterno} | Materno:{mrzData.materno} | FechaNac:{mrzData.fechaNac} | Sexo:{mrzData.sexo}");

                // ═══ PASO 4: EXTRAER DATOS VISUALES DEL ANVERSO ═══
                var visualData = ParseVisualFront(frontAll);
                _logger.LogInformation($"VISUAL → DNI:{visualData.dni} | Nombres:{visualData.nombres} | Paterno:{visualData.paterno} | Materno:{visualData.materno} | FechaNac:{visualData.fechaNac} | Sexo:{visualData.sexo} | EstCivil:{visualData.estadoCivil}");

                // ═══ PASO 5: EXTRAER DATOS DEL REVERSO (Con Ubigeo Corrector) ═══
                var backData = ParseBack(backAll);
                _logger.LogInformation($"BACK → Dir:{backData.direccion} | Dpto:{backData.departamento} | Prov:{backData.provincia} | Dist:{backData.distrito}");

                // ═══ PASO 6: COMBINAR RESULTADOS ═══
                string nombres = PickBest(mrzData.nombres, visualData.nombres, "NOMBRE_A_REVISAR");
                string paterno = PickBest(mrzData.paterno, visualData.paterno, "PATERNO_A_REVISAR");
                string materno = PickBest(mrzData.materno, visualData.materno, "MATERNO_A_REVISAR");
                string dni = PickBest(mrzData.dni, visualData.dni, "NO DETECTADO");
                string fechaNac = PickBest(mrzData.fechaNac, visualData.fechaNac, "NO DETECTADO");
                string sexo = PickBest(mrzData.sexo, visualData.sexo, "NO DETECTADO");
                string estadoCivil = !string.IsNullOrEmpty(visualData.estadoCivil) ? visualData.estadoCivil : "NO DETECTADO";

                // ═══ PASO 6b: FALLBACK - Buscar estado civil en TODO el texto ═══
                if (estadoCivil == "NO DETECTADO")
                {
                    estadoCivil = ScanForEstadoCivil(allTextCombined);
                    if (!string.IsNullOrEmpty(estadoCivil))
                        _logger.LogInformation($"FALLBACK EstadoCivil encontrado en texto combinado: {estadoCivil}");
                    else
                        estadoCivil = "NO DETECTADO";
                }

                // ═══ PASO 6c: FALLBACK - Buscar dirección por patrones de calle ═══
                if (backData.direccion == "REVISAR DIRECCIÓN EN REVERSO")
                {
                    string dirFallback = ScanForDireccion(backAll);
                    if (!string.IsNullOrEmpty(dirFallback))
                    {
                        backData = (dirFallback, backData.departamento, backData.provincia, backData.distrito);
                        _logger.LogInformation($"FALLBACK Dirección encontrada por patrón de calle: {dirFallback}");
                    }
                }

                _logger.LogInformation($"FINAL → DNI:{dni} | {paterno} {materno}, {nombres} | FechaNac:{fechaNac} | Sexo:{sexo} | EstCivil:{estadoCivil}");

                var extractedData = new DniData
                {
                    NumeroDni = dni,
                    FechaNacimiento = fechaNac,
                    Sexo = sexo,
                    EstadoCivil = estadoCivil,
                    Nombres = nombres,
                    ApellidoPaterno = paterno,
                    ApellidoMaterno = materno,
                    Direccion = backData.direccion,
                    Departamento = !string.IsNullOrEmpty(backData.departamento) ? backData.departamento : "",
                    Provincia = !string.IsNullOrEmpty(backData.provincia) ? backData.provincia : "",
                    Distrito = !string.IsNullOrEmpty(backData.distrito) ? backData.distrito : "",
                    WasSwapped = wasSwapped
                };

                // Si el MRZ fue validado por ICAO, la confianza es del 100%
                float confidence = 0.6f;
                if (mrzData.isValidIcao) confidence = 1.00f;
                else if (!string.IsNullOrEmpty(mrzData.dni)) confidence = 0.95f;
                else if (dni != "NO DETECTADO") confidence = 0.85f;

                return new OcrResult
                {
                    Success = true,
                    Confidence = confidence,
                    Data = extractedData
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error en ProcessWithTesseract: {ex.Message}\n{ex.StackTrace}");
                return new OcrResult { Success = false, ErrorMessage = $"Tesseract falló: {ex.Message}" };
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        //  AUTO-ROTACIÓN OSD
        // ──────────────────────────────────────────────────────────────────────

        private byte[] FixImageOrientation(byte[] imageBytes, string tessDataPath, string label)
        {
            try
            {
                int bestDegrees = 0;
                int maxScore = 0;

                for (int degrees = 0; degrees < 360; degrees += 90)
                {
                    using var image = Image.Load(imageBytes);
                    if (degrees == 90) image.Mutate(x => x.Rotate(RotateMode.Rotate90));
                    else if (degrees == 180) image.Mutate(x => x.Rotate(RotateMode.Rotate180));
                    else if (degrees == 270) image.Mutate(x => x.Rotate(RotateMode.Rotate270));

                    using var ms = new MemoryStream();
                    // Escala menor para que sea ultra rápido el análisis
                    image.Mutate(x => x.Resize(image.Width / 2, image.Height / 2).Grayscale());
                    image.SaveAsJpeg(ms);
                    
                    using var engine = new TesseractEngine(tessDataPath, "spa", EngineMode.Default);
                    using var pix = Pix.LoadFromMemory(ms.ToArray());
                    using var page = engine.Process(pix);
                    string text = page.GetText();
                    
                    int score = 0;
                    if (Regex.IsMatch(text, @"PERU|REPUBLICA|NACIONAL|DNI|APELLIDO|NOMBRES|NACIMIENTO", RegexOptions.IgnoreCase)) score += 500;
                    if (Regex.IsMatch(text, @"DIRECCI[O0]N|DOMICILIO|DEPARTAMENTO|PROVINCIA|DISTRITO", RegexOptions.IgnoreCase)) score += 500;
                    if (Regex.IsMatch(text, @"HUELLA|DACTILAR|DONACION|ORGANOS|ESTADO\s*CIVIL", RegexOptions.IgnoreCase)) score += 500;
                    
                    score += Regex.Matches(text, @"\b[A-ZÑÁÉÍÓÚ]{4,}\b").Count * 10;
                        
                    if (score > maxScore)
                    {
                        maxScore = score;
                        bestDegrees = degrees;
                    }
                }

                if (bestDegrees > 0)
                {
                    _logger.LogInformation($"[{label}] Auto-rotando imagen {bestDegrees} grados heurísticamente (Score: {maxScore}).");
                    using var image = Image.Load(imageBytes);
                    if (bestDegrees == 90) image.Mutate(x => x.Rotate(RotateMode.Rotate90));
                    else if (bestDegrees == 180) image.Mutate(x => x.Rotate(RotateMode.Rotate180));
                    else if (bestDegrees == 270) image.Mutate(x => x.Rotate(RotateMode.Rotate270));
                    
                    using var msOut = new MemoryStream();
                    image.Save(msOut, new SixLabors.ImageSharp.Formats.Jpeg.JpegEncoder { Quality = 100 });
                    return msOut.ToArray();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"[{label}] Auto-rotación heurística falló: {ex.Message}");
            }
            return imageBytes;
        }

        // ──────────────────────────────────────────────────────────────────────
        //  MULTI-PASS OCR
        // ──────────────────────────────────────────────────────────────────────

        private List<string> MultiPassOcr(string tessDataPath, byte[] imageBytes, string label)
        {
            var results = new List<string>();

            try
            {
                using var engine = new TesseractEngine(tessDataPath, "spa", EngineMode.Default);
                engine.SetVariable("tessedit_pageseg_mode", "6");

                using (var pix = PreprocessStandard(imageBytes)) { using (var page = engine.Process(pix)) { results.Add(page.GetText()); } }
                using (var pix = PreprocessHighContrast(imageBytes)) { using (var page = engine.Process(pix)) { results.Add(page.GetText()); } }
                using (var pix = PreprocessBinary(imageBytes, 0.35f)) { using (var page = engine.Process(pix)) { results.Add(page.GetText()); } }
                using (var pix = PreprocessBinary(imageBytes, 0.65f)) { using (var page = engine.Process(pix)) { results.Add(page.GetText()); } }
            }
            catch (Exception ex) { _logger.LogWarning($"[{label}] MultiPass falló: {ex.Message}"); }

            return results;
        }

        private Pix PreprocessStandard(byte[] imageBytes)
        {
            using var image = Image.Load(imageBytes);
            using var ms = new MemoryStream();
            image.Mutate(x => x.Resize(image.Width * 2, image.Height * 2).Grayscale().Contrast(1.2f));
            image.Save(ms, new BmpEncoder());
            return Pix.LoadFromMemory(ms.ToArray());
        }

        private Pix PreprocessHighContrast(byte[] imageBytes)
        {
            using var image = Image.Load(imageBytes);
            using var ms = new MemoryStream();
            image.Mutate(x => x.Resize(image.Width * 2, image.Height * 2).Grayscale().Contrast(2.5f).GaussianSharpen(1.5f));
            image.Save(ms, new BmpEncoder());
            return Pix.LoadFromMemory(ms.ToArray());
        }

        private Pix PreprocessBinary(byte[] imageBytes, float threshold)
        {
            using var image = Image.Load(imageBytes);
            using var ms = new MemoryStream();
            image.Mutate(x => x.Resize(image.Width * 2, image.Height * 2).Grayscale().GaussianSharpen(1.0f).BinaryThreshold(threshold));
            image.Save(ms, new BmpEncoder());
            return Pix.LoadFromMemory(ms.ToArray());
        }

        private bool HasFaceOrNameIndicators(string text)
        {
            return Regex.IsMatch(text.ToUpper(), @"APELL|PRENOMB|NOMB|NACIM|SEXO|ESTADO|CIVIL|FOTO|HUELLA", RegexOptions.IgnoreCase);
        }

        private bool HasAddressIndicators(string text)
        {
            return Regex.IsMatch(text.ToUpper(), @"DIRECC|DOMICIL|DEPART|PROVINC|DISTRIT|UBIGE|VOTACI", RegexOptions.IgnoreCase);
        }

        // ──────────────────────────────────────────────────────────────────────
        //  PARSERS & ICAO VALIDATION
        // ──────────────────────────────────────────────────────────────────────

        private bool ValidateIcaoCheckDigit(string number, string checkDigitStr)
        {
            if (number.Length != 8 || string.IsNullOrEmpty(checkDigitStr)) return false;
            
            int[] weights = { 7, 3, 1 };
            int sum = 0;
            
            for (int i = 0; i < 8; i++)
            {
                char c = number[i];
                int val = (c >= '0' && c <= '9') ? (c - '0') : (c >= 'A' && c <= 'Z') ? (c - 'A' + 10) : 0;
                if (c == '<') val = 0;
                sum += val * weights[i % 3];
            }
            
            int expectedCheck = sum % 10;
            if (checkDigitStr[0] >= '0' && checkDigitStr[0] <= '9')
            {
                int actualCheck = checkDigitStr[0] - '0';
                return expectedCheck == actualCheck;
            }
            return false;
        }

        private (string dni, string nombres, string paterno, string materno, string fechaNac, string sexo, bool isValidIcao) ParseMRZ(string text)
        {
            string dni = "", nombres = "", paterno = "", materno = "", fechaNac = "", sexo = "";
            bool isValidIcao = false;
            var upper = text.ToUpper().Replace(" ", "").Replace("\r", "");

            // DNI con dígito verificador
            var m1 = Regex.Match(upper, @"[I1lC][<]?PER([0-9OIlZSB]{8})([0-9OIlZSB])?");
            if (m1.Success)
            {
                dni = CleanFuzzyDni(m1.Groups[1].Value);
                if (m1.Groups[2].Success)
                {
                    string checkDigit = CleanFuzzyDni(m1.Groups[2].Value);
                    if (ValidateIcaoCheckDigit(dni, checkDigit))
                    {
                        isValidIcao = true;
                        _logger.LogInformation($"ICAO Check Exitoso para DNI {dni}");
                    }
                }
            }
            
            if (string.IsNullOrEmpty(dni))
            {
                var m1alt = Regex.Match(upper, @"PER([0-9OIlZSB]{8})([0-9OIlZSB])?");
                if (m1alt.Success)
                {
                    dni = CleanFuzzyDni(m1alt.Groups[1].Value);
                    if (m1alt.Groups[2].Success && ValidateIcaoCheckDigit(dni, CleanFuzzyDni(m1alt.Groups[2].Value)))
                        isValidIcao = true;
                }
            }

            var m2 = Regex.Match(upper, @"([0-9OIlZSB]{6})[0-9OIlZSB]([MF])[0-9OIlZSB]{6}");
            if (m2.Success)
            {
                var dobRaw = CleanFuzzyDni(m2.Groups[1].Value);
                if (dobRaw.Length == 6)
                {
                    int yy = int.Parse(dobRaw.Substring(0, 2));
                    string mm = dobRaw.Substring(2, 2);
                    string dd = dobRaw.Substring(4, 2);
                    int fullYear = yy > 30 ? 1900 + yy : 2000 + yy;
                    fechaNac = $"{dd}/{mm}/{fullYear}";
                }
                sexo = m2.Groups[2].Value == "M" ? "MASCULINO" : "FEMENINO";
            }

            var m3 = Regex.Match(upper, @"([A-ZÑ]{2,}(?:<[A-ZÑ]+)*)<<([A-ZÑ]{2,}(?:<[A-ZÑ]+)*)");
            if (m3.Success)
            {
                var apellidosArr = m3.Groups[1].Value.Split(new[] { '<' }, StringSplitOptions.RemoveEmptyEntries);
                var nombresArr = m3.Groups[2].Value.Split(new[] { '<' }, StringSplitOptions.RemoveEmptyEntries);

                if (apellidosArr.Length >= 1) paterno = CleanName(apellidosArr[0]);
                if (apellidosArr.Length >= 2) materno = CleanName(string.Join(" ", apellidosArr.Skip(1)));
                if (nombresArr.Length >= 1) nombres = CleanName(string.Join(" ", nombresArr));
            }

            return (dni, nombres, paterno, materno, fechaNac, sexo, isValidIcao);
        }

        private (string dni, string nombres, string paterno, string materno, string fechaNac, string sexo, string estadoCivil) ParseVisualFront(string text)
        {
            string nombres = "", paterno = "", materno = "", dni = "", fechaNac = "", sexo = "", estadoCivil = "";
            var lines = text.Split(new[] { '\n' }, StringSplitOptions.RemoveEmptyEntries).Select(l => l.Trim().ToUpper()).ToList();

            var dniMatches = Regex.Matches(text.ToUpper(), @"\b([0-9OIlZSB]{8})\b");
            foreach (Match m in dniMatches)
            {
                var candidate = CleanFuzzyDni(m.Groups[1].Value);
                if (candidate.Length == 8 && !Regex.IsMatch(candidate, @"^(19|20)\d{2}") && !Regex.IsMatch(candidate, @"\d{4}(19|20)\d{2}$"))
                {
                    dni = candidate;
                    break;
                }
            }

            for (int i = 0; i < lines.Count; i++)
            {
                var line = lines[i];

                if (FuzzyMatch(line, "APELLIDOS"))
                {
                    var val = line.Substring(line.IndexOf(FuzzyMatchKey(line, "APELLIDOS")) + "APELLIDOS".Length).Trim(new[] { ':', ' ', '-' });
                    if (string.IsNullOrEmpty(val) && i + 1 < lines.Count) val = lines[i + 1];
                    var words = CleanString(val).Split(' ', StringSplitOptions.RemoveEmptyEntries);
                    if (words.Length >= 1 && string.IsNullOrEmpty(paterno)) paterno = words[0];
                    if (words.Length >= 2 && string.IsNullOrEmpty(materno)) materno = string.Join(" ", words.Skip(1));
                }
                
                if ((FuzzyMatch(line, "PRIMER APELLIDO") || (line.Contains("PATERNO") && !line.Contains("MATERNO"))) && i + 1 < lines.Count)
                    if (string.IsNullOrEmpty(paterno)) paterno = CleanString(lines[i + 1]);
                
                if ((FuzzyMatch(line, "SEGUNDO APELLIDO") || (line.Contains("MATERNO") && !line.Contains("PATERNO"))) && i + 1 < lines.Count)
                    if (string.IsNullOrEmpty(materno)) materno = CleanString(lines[i + 1]);

                if (FuzzyMatch(line, "PRENOMBRES") || FuzzyMatch(line, "NOMBRES"))
                {
                    var val = line.Substring(line.IndexOf(FuzzyMatchKey(line, "NOMBRES")) + "NOMBRES".Length).Trim(new[] { ':', ' ', '-' });
                    if (string.IsNullOrEmpty(val) && i + 1 < lines.Count) val = lines[i + 1];
                    if (string.IsNullOrEmpty(nombres)) nombres = CleanString(val);
                }

                if (FuzzyMatch(line, "NACIMIENTO") || FuzzyMatch(line, "FECHA NAC"))
                {
                    var d = ExtractFuzzyDate(line);
                    if (string.IsNullOrEmpty(d) && i + 1 < lines.Count) d = ExtractFuzzyDate(lines[i + 1]);
                    if (!string.IsNullOrEmpty(d)) fechaNac = d;
                }

                if (FuzzyMatch(line, "SEXO"))
                {
                    if (line.Contains("MASC") || Regex.IsMatch(line, @"\bM\b")) sexo = "MASCULINO";
                    else if (line.Contains("FEM") || Regex.IsMatch(line, @"\bF\b")) sexo = "FEMENINO";
                    else if (i + 1 < lines.Count)
                    {
                        if (lines[i+1].Contains("MASC") || Regex.IsMatch(lines[i+1], @"\bM\b")) sexo = "MASCULINO";
                        else if (lines[i+1].Contains("FEM") || Regex.IsMatch(lines[i+1], @"\bF\b")) sexo = "FEMENINO";
                    }
                }

                if (FuzzyMatch(line, "ESTADO CIVIL") || FuzzyMatch(line, "CIVIL"))
                {
                    string ec = NormalizeEstadoCivil(line);
                    if (string.IsNullOrEmpty(ec) && i + 1 < lines.Count) ec = NormalizeEstadoCivil(lines[i + 1]);
                    if (!string.IsNullOrEmpty(ec)) estadoCivil = ec;
                }
            }

            // FALLBACK: buscar estado civil directamente en TODAS las líneas
            if (string.IsNullOrEmpty(estadoCivil))
            {
                estadoCivil = ScanForEstadoCivil(text);
            }

            if (string.IsNullOrEmpty(fechaNac))
            {
                var dateMatches = Regex.Matches(text, @"\b(\d{2})[/\.\-]+(\d{2})[/\.\-]+(\d{4})\b");
                int minYear = 9999;
                foreach (Match m in dateMatches)
                {
                    if (int.TryParse(m.Groups[3].Value, out int year) && year >= 1940 && year <= 2010)
                        if (year < minYear) { minYear = year; fechaNac = $"{m.Groups[1].Value}/{m.Groups[2].Value}/{m.Groups[3].Value}"; }
                }
            }

            return (dni, nombres, paterno, materno, fechaNac, sexo, estadoCivil);
        }

        private (string direccion, string departamento, string provincia, string distrito) ParseBack(string text)
        {
            string direccion = "REVISAR DIRECCIÓN EN REVERSO";
            string departamento = "", provincia = "", distrito = "";

            var lines = text.Split(new[] { '\n' }, StringSplitOptions.RemoveEmptyEntries).Select(l => l.Trim().ToUpper()).ToList();

            // 1. Extraer Dirección
            for (int i = 0; i < lines.Count; i++)
            {
                if (FuzzyMatch(lines[i], "DIRECCI") || FuzzyMatch(lines[i], "DOMICIL"))
                {
                    var key = FuzzyMatchKey(lines[i], "DIRECCI") ?? FuzzyMatchKey(lines[i], "DOMICIL");
                    string val = lines[i].Substring(lines[i].IndexOf(key) + key.Length).Trim(new[] { ':', ' ', 'O', 'N' });
                    val = CleanDireccion(val);
                    string potential = val.Length > 5 ? val : "";

                    for (int k = i + 1; k < Math.Min(i + 4, lines.Count); k++)
                    {
                        if (FuzzyMatch(lines[k], "DEPART") || FuzzyMatch(lines[k], "PROV") || FuzzyMatch(lines[k], "DISTR") || lines[k].Contains("ORGANOS") || lines[k].Contains("GRUPO")) break;
                        string nextLine = CleanDireccion(lines[k]);
                        if (nextLine.Length > 2) potential = string.IsNullOrEmpty(potential) ? nextLine : potential + " " + nextLine;
                    }
                    if (potential.Length > 5) { direccion = potential.Trim(); break; }
                }
            }

            if (direccion == "REVISAR DIRECCIÓN EN REVERSO")
            {
                var fallbackDir = ScanForDireccion(text);
                if (!string.IsNullOrEmpty(fallbackDir)) direccion = fallbackDir;
                else
                {
                    var candidate = lines.Where(l => !l.Contains("<") && !l.Contains("/") && !l.Contains("ORGANOS") && !Regex.IsMatch(l, @"\d{8}") && l.Length > 10).OrderByDescending(l => l.Length).FirstOrDefault();
                    if (candidate != null) direccion = CleanDireccion(candidate);
                }
            }

            // 2. Extraer Ubigeo
            bool foundUbigeo = false;
            
            // INTENTO A: Buscar patrón con separadores (DNI Electrónico / DNI Azul con slashes)
            var ubigeoRegex = new Regex(@"([A-ZÑ\s]{3,})\s*[/\|-]\s*([A-ZÑ\s]{3,})\s*[/\|-]\s*([A-ZÑ\s]{3,})");
            foreach (var line in lines)
            {
                if (line.Contains("DEPART") && line.Contains("PROV") && line.Contains("DISTR") && !line.Contains("/")) 
                    continue; 
                
                var m = ubigeoRegex.Match(CleanDireccion(line));
                if (m.Success && !m.Value.Contains("DEPART") && !m.Value.Contains("PROV"))
                {
                    departamento = CleanString(m.Groups[1].Value);
                    provincia = CleanString(m.Groups[2].Value);
                    distrito = CleanString(m.Groups[3].Value);
                    foundUbigeo = true;
                    break;
                }
            }

            // INTENTO B: DNI Azul sin separadores evidentes (ej: LIMA LIMA MAGDALENA DEL MAR)
            if (!foundUbigeo)
            {
                for (int i = 0; i < lines.Count; i++)
                {
                    if (FuzzyMatch(lines[i], "DEPART") && FuzzyMatch(lines[i], "PROV"))
                    {
                        string uLine = "";
                        if (i + 1 < lines.Count) uLine = CleanString(lines[i + 1]);
                        
                        // Si el OCR repitió la cabecera por accidente, saltamos una línea más
                        if (uLine.Contains("DEPART") && uLine.Contains("PROV") && i + 2 < lines.Count)
                            uLine = CleanString(lines[i + 2]);

                        if (uLine.Length > 6 && !uLine.Contains("DEPART"))
                        {
                            string[] deptos = { "AMAZONAS", "ANCASH", "APURIMAC", "AREQUIPA", "AYACUCHO", "CAJAMARCA", "CALLAO", "CUSCO", "HUANCAVELICA", "HUANUCO", "ICA", "JUNIN", "LA LIBERTAD", "LAMBAYEQUE", "LIMA", "LORETO", "MADRE DE DIOS", "MOQUEGUA", "PASCO", "PIURA", "PUNO", "SAN MARTIN", "TACNA", "TUMBES" };
                            
                            string dptoEncontrado = "";
                            foreach(var d in deptos) {
                                if (uLine.StartsWith(d)) {
                                    dptoEncontrado = d;
                                    uLine = uLine.Substring(d.Length).Trim();
                                    break;
                                }
                            }
                            if (string.IsNullOrEmpty(dptoEncontrado)) {
                                var w = uLine.Split(' ');
                                if (w.Length > 0) { dptoEncontrado = w[0]; uLine = string.Join(" ", w.Skip(1)); }
                            }

                            string provEncontrada = "";
                            var words = uLine.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                            if (words.Length > 0)
                            {
                                if (words.Length > 1 && (words[0] == "LA" || words[0] == "EL" || words[0] == "LOS" || words[0] == "SAN" || words[0] == "SANTA" || words[0] == "MARISCAL" || words[0] == "CARLOS" || words[0] == "GRAN" || words[0] == "ALTO"))
                                {
                                    provEncontrada = words[0] + " " + words[1];
                                    distrito = string.Join(" ", words.Skip(2));
                                }
                                else
                                {
                                    provEncontrada = words[0];
                                    distrito = string.Join(" ", words.Skip(1));
                                }
                            }
                            
                            departamento = dptoEncontrado;
                            provincia = provEncontrada;
                            foundUbigeo = true;
                        }
                        break;
                    }
                }
            }

            // INTENTO C: En la misma línea o con etiquetas separadas
            if (!foundUbigeo)
            {
                string textClean = CleanString(string.Join(" ", lines));
                var m = Regex.Match(textClean, @"DEPARTAMENTO\s+([A-ZÑ\s]+?)\s+PROVINCIA\s+([A-ZÑ\s]+?)\s+DISTRITO\s+([A-ZÑ\s]+)");
                if (m.Success)
                {
                    departamento = m.Groups[1].Value.Trim();
                    provincia = m.Groups[2].Value.Trim();
                    distrito = m.Groups[3].Value.Trim();
                    foundUbigeo = true;
                }
            }

            // Limpiar si por error se capturó la etiqueta misma como valor
            if (departamento.Contains("DEPART") || provincia.Contains("PROV") || distrito.Contains("DISTR"))
            {
                departamento = ""; provincia = ""; distrito = ""; foundUbigeo = false;
            }

            // CORRECCIÓN CON DICCIONARIO UBIGEO
            if (!string.IsNullOrEmpty(departamento)) { var corrected = CorrectUbigeo(departamento, UbigeoDictionary.Departamentos); if (corrected != null) departamento = corrected; }
            if (!string.IsNullOrEmpty(provincia)) { var corrected = CorrectUbigeo(provincia, UbigeoDictionary.Provincias); if (corrected != null) provincia = corrected; }
            if (!string.IsNullOrEmpty(distrito)) { var corrected = CorrectUbigeo(distrito, UbigeoDictionary.Distritos); if (corrected != null) distrito = corrected; }

            return (direccion, departamento, provincia, distrito);
        }

        // ──────────────────────────────────────────────────────────────────────
        //  UTILIDADES FUZZY & LIMPIEZA
        // ──────────────────────────────────────────────────────────────────────

        private string FindValidUbigeo(string text, string[] dictionary)
        {
            var words = CleanString(text).Split(' ', StringSplitOptions.RemoveEmptyEntries);
            for (int len = Math.Min(4, words.Length); len >= 1; len--)
            {
                for (int start = 0; start <= words.Length - len; start++)
                {
                    string candidate = string.Join(" ", words.Skip(start).Take(len));
                    string match = CorrectUbigeo(candidate, dictionary);
                    if (match != null) return match;
                }
            }
            return null;
        }

        private string CorrectUbigeo(string input, string[] dictionary)
        {
            if (string.IsNullOrEmpty(input)) return null;
            string bestMatch = null;
            int minDistance = 3; // Máximo 2 errores tolerados

            foreach (var item in dictionary)
            {
                int dist = ComputeLevenshteinDistance(input, item);
                if (dist < minDistance)
                {
                    minDistance = dist;
                    bestMatch = item;
                    if (dist == 0) break;
                }
            }
            return bestMatch; // Retornará null si no hay ninguna coincidencia válida
        }

        private int ComputeLevenshteinDistance(string s, string t)
        {
            int n = s.Length, m = t.Length;
            int[,] d = new int[n + 1, m + 1];
            if (n == 0) return m;
            if (m == 0) return n;
            for (int i = 0; i <= n; d[i, 0] = i++) ;
            for (int j = 0; j <= m; d[0, j] = j++) ;
            for (int i = 1; i <= n; i++)
                for (int j = 1; j <= m; j++)
                {
                    int cost = (t[j - 1] == s[i - 1]) ? 0 : 1;
                    d[i, j] = Math.Min(Math.Min(d[i - 1, j] + 1, d[i, j - 1] + 1), d[i - 1, j - 1] + cost);
                }
            return d[n, m];
        }

        private string ExtractAfterLabel(List<string> lines, int index, string label)
        {
            var line = lines[index];
            var key = FuzzyMatchKey(line, label);
            var val = line.Substring(line.IndexOf(key) + key.Length).Trim(new[] { ':', ' ', '-' });
            val = CleanString(val);
            if (val.Length > 2) return val;
            if (index + 1 < lines.Count) return CleanString(lines[index + 1]);
            return "";
        }

        private bool FuzzyMatch(string input, string target)
        {
            return FuzzyMatchKey(input, target) != null;
        }

        private string FuzzyMatchKey(string input, string target)
        {
            if (input.Contains(target)) return target;
            string replaced = input.Replace("0", "O").Replace("1", "I").Replace("5", "S").Replace("8", "B");
            if (replaced.Contains(target)) return target;
            
            if (target == "APELLIDOS" && Regex.IsMatch(input, @"APEL[L1I][I1l]D[O0]S")) return Regex.Match(input, @"APEL[L1I][I1l]D[O0]S").Value;
            if (target == "PRENOMBRES" && Regex.IsMatch(input, @"PREN[O0]MBR[E3]S")) return Regex.Match(input, @"PREN[O0]MBR[E3]S").Value;
            if (target == "NOMBRES" && Regex.IsMatch(input, @"N[O0]MBR[E3]S")) return Regex.Match(input, @"N[O0]MBR[E3]S").Value;
            if (target == "DIRECCI" && Regex.IsMatch(input, @"[DO0]?[I1l|]RECC[I1l|]")) return Regex.Match(input, @"[DO0]?[I1l|]RECC[I1l|]").Value;
            if (target == "DOMICIL" && Regex.IsMatch(input, @"D[O0]M[I1l|]C[I1l|]L[I1l|]")) return Regex.Match(input, @"D[O0]M[I1l|]C[I1l|]L[I1l|]").Value;

            return null;
        }

        private string ExtractFuzzyDate(string input)
        {
            var match = Regex.Match(input, @"([0-9OIlZSB]{2})[/\s\.\-]+([0-9OIlZSB]{2})[/\s\.\-]+([0-9OIlZSB]{4})");
            if (match.Success) return $"{CleanFuzzyDni(match.Groups[1].Value)}/{CleanFuzzyDni(match.Groups[2].Value)}/{CleanFuzzyDni(match.Groups[3].Value)}";
            return "";
        }

        private string CleanFuzzyDni(string input)
        {
            if (string.IsNullOrEmpty(input)) return "";
            return input.Replace("O", "0").Replace("o", "0").Replace("I", "1").Replace("l", "1").Replace("S", "5").Replace("B", "8").Replace("Z", "2");
        }

        private string PickBest(string mrzValue, string visualValue, string defaultValue)
        {
            if (!string.IsNullOrWhiteSpace(mrzValue) && mrzValue.Length > 1) return mrzValue;
            if (!string.IsNullOrWhiteSpace(visualValue) && visualValue.Length > 1) return visualValue;
            return defaultValue;
        }

        private string NormalizeEstadoCivil(string input)
        {
            var clean = input.Trim().ToUpper();
            var val = clean;
            
            if (clean.Contains("CIVIL")) 
            {
                int idx = clean.IndexOf("CIVIL") + 5;
                if (idx < clean.Length) val = clean.Substring(idx).Trim(new[] { ':', ' ', '-' });
            }
            if (string.IsNullOrEmpty(val)) val = clean;

            if (val.Contains("SOLTER") || val.StartsWith("S") || val.Equals("S")) return "SOLTERO";
            if (val.Contains("CASAD") || val.StartsWith("C") || val.Equals("C")) return "CASADO";
            if (val.Contains("DIVORC") || val.StartsWith("D") || val.Equals("D")) return "DIVORCIADO";
            if (val.Contains("VIUD") || val.StartsWith("V") || val.Equals("V")) return "VIUDO";
            if (val.Contains("CONVIV") || val.StartsWith("CO")) return "CONVIVIENTE";
            
            return "";
        }

        /// <summary>
        /// Escanea TODO el texto en busca de palabras de estado civil sin necesidad de etiqueta.
        /// </summary>
        private string ScanForEstadoCivil(string text)
        {
            var upper = text.ToUpper();
            // Buscar la palabra completa directamente en cualquier parte del texto
            if (Regex.IsMatch(upper, @"\bSOLTER[OA]?\b")) return "SOLTERO";
            if (Regex.IsMatch(upper, @"\bCASAD[OA]?\b")) return "CASADO";
            if (Regex.IsMatch(upper, @"\bDIVORCIAD[OA]?\b")) return "DIVORCIADO";
            if (Regex.IsMatch(upper, @"\bVIUD[OA]?\b")) return "VIUDO";
            if (Regex.IsMatch(upper, @"\bCONVIVIENTE\b")) return "CONVIVIENTE";
            return "";
        }

        /// <summary>
        /// Escanea el texto del reverso buscando patrones típicos de dirección peruana.
        /// </summary>
        private string ScanForDireccion(string text)
        {
            var lines = text.Split(new[] { '\n' }, StringSplitOptions.RemoveEmptyEntries)
                           .Select(l => l.Trim().ToUpper()).ToList();

            var streetPatterns = new[] { @"\bJR\b", @"\bJR\.", @"\bJIRON\b", @"\bAV\b", @"\bAV\.", @"\bAVDA\b", @"\bAVENIDA\b", @"\bCALLE\b", @"\bPSJE\b", @"\bPASAJE\b", 
                                         @"\bURB\b", @"\bURB\.", @"\bURBANIZACION\b", @"\bMZ\b", @"\bMZ\.", @"\bMANZANA\b", @"\bLT\b", @"\bLT\.", @"\bLOTE\b",
                                         @"\bPROL\b", @"\bPROLONGACION\b", @"\bBLQ\b", @"\bBLOCK\b", @"\bINT\b", @"\bDPTO\b", @"\bPJ\b", @"\bPJ\.", @"\bPUEBLO JOVEN\b",
                                         @"\bAA\.HH\b", @"\bAAHH\b", @"\bASENT\b", @"\bSECTOR\b", @"\bZONA\b", @"\bKM\b", @"\bCARRETERA\b" };

            foreach (var line in lines)
            {
                if (line.Contains("<") || line.Length < 8) continue;
                if (Regex.IsMatch(line, @"^(DEPARTAMENTO|PROVINCIA|DISTRITO|UBIGEO|ORGANOS|GRUPO|DONACION|FECHA|LUGAR)")) continue;
                
                foreach (var pattern in streetPatterns)
                {
                    if (Regex.IsMatch(line, pattern))
                    {
                        return CleanDireccion(line);
                    }
                }
            }

            return "";
        }

        private string CleanDireccion(string input)
        {
            return Regex.Replace(input, @"[^A-Z0-9\sÑÁÉÍÓÚ\-\.#,/]", "").Trim();
        }

        private string CleanString(string input)
        {
            return Regex.Replace(input, @"[^A-Z\sÑÁÉÍÓÚ]", "").Trim();
        }

        private string CleanName(string input)
        {
            return Regex.Replace(input, @"[^A-ZÑÁÉÍÓÚ]", "").Trim();
        }

        public async Task<PayslipExtractResult> ExtractPayslipDataAsync(string rawText)
        {
            if (string.IsNullOrEmpty(_apiKey) || _apiKey == "PEGA_TU_API_KEY_AQUI")
            {
                return new PayslipExtractResult { Success = false, ErrorMessage = "Por favor, configura tu GeminiApiKey en appsettings.json." };
            }

            try
            {
                var prompt = @"Eres un sistema experto en extracción de datos de boletas de pago peruanas.
Analiza el siguiente texto extraído de una boleta y extrae EXACTAMENTE los datos solicitados.
Si un dato no se encuentra, devuelve null.

REGLAS CRÍTICAS:
1. 'netAmount': Busca estrictamente la frase 'NETO A PAGAR S/:' o 'NETO A PAGAR'. El monto es el número final que aparece a su lado o debajo (ej. 1340.37). IGNORA por completo los valores de 'T. INGRESOS', 'T. RETENCIONES' y 'T. APORTACION' (ej. 197.70, 53.33, 9.15). Solo debes devolver el monto neto a pagar al trabajador. NO omitas ceros ni decimales. Si ves '1340.37', extrae 1340.37.
2. 'dni': Busca el DNI del trabajador (exactamente 8 dígitos, puede estar junto a 'D N I' o 'DNI').
3. 'month': Busca el mes de la boleta (ej. Enero, Febrero, Junio). Escríbelo con la primera letra mayúscula.
4. 'year': Busca el año de la boleta (ej. 2024, 2025, 2026).

Devuelve ÚNICAMENTE un objeto JSON válido, sin bloques de código markdown, con esta estructura exacta:
{
  ""dni"": ""8 dígitos o null"",
  ""netAmount"": numero_decimal o null,
  ""month"": ""Mes o null"",
  ""year"": numero_entero o null
}

Texto extraído de la boleta:
" + rawText;

                var payload = new
                {
                    contents = new[]
                    {
                        new
                        {
                            parts = new object[]
                            {
                                new { text = prompt }
                            }
                        }
                    },
                    generationConfig = new
                    {
                        temperature = 0.0,
                        responseMimeType = "application/json"
                    }
                };

                var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={_apiKey}";
                var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

                HttpResponseMessage response = null;
                string responseString = string.Empty;
                int maxRetries = 3;

                for (int i = 0; i < maxRetries; i++)
                {
                    response = await _httpClient.PostAsync(url, content);
                    responseString = await response.Content.ReadAsStringAsync();

                    if (response.IsSuccessStatusCode)
                    {
                        break;
                    }

                    _logger.LogWarning($"Intento {i + 1} de Gemini (Boleta) falló: {responseString}");
                    if (i < maxRetries - 1)
                    {
                        await Task.Delay(2000);
                    }
                }

                if (response == null || !response.IsSuccessStatusCode)
                {
                    return new PayslipExtractResult { Success = false, ErrorMessage = "Error comunicando con Gemini API." };
                }

                using var jsonDoc = JsonDocument.Parse(responseString);
                var root = jsonDoc.RootElement;
                
                var candidates = root.GetProperty("candidates");
                if (candidates.GetArrayLength() == 0)
                {
                    return new PayslipExtractResult { Success = false, ErrorMessage = "La IA no devolvió ningún texto." };
                }

                var extractedText = candidates[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString();

                if (string.IsNullOrWhiteSpace(extractedText))
                {
                    return new PayslipExtractResult { Success = false, ErrorMessage = "La IA devolvió texto vacío." };
                }

                extractedText = extractedText.Replace("```json", "").Replace("```", "").Trim();

                var options = new JsonSerializerOptions 
                { 
                    PropertyNameCaseInsensitive = true,
                    AllowTrailingCommas = true,
                    ReadCommentHandling = JsonCommentHandling.Skip
                };

                int startIndex = extractedText.IndexOf('{');
                int endIndex = extractedText.LastIndexOf('}');
                
                if (startIndex != -1 && endIndex != -1 && endIndex > startIndex)
                {
                    extractedText = extractedText.Substring(startIndex, endIndex - startIndex + 1);
                }

                var resultDto = JsonSerializer.Deserialize<PayslipExtractResult>(extractedText, options);
                
                if (resultDto == null)
                {
                    return new PayslipExtractResult { Success = false, ErrorMessage = "No se pudo parsear el JSON de la IA." };
                }

                resultDto.Success = true;
                return resultDto;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error en ExtractPayslipDataAsync (Gemini): {ex.Message}");
                return new PayslipExtractResult { Success = false, ErrorMessage = "Error interno procesando la boleta con Gemini." };
            }
        }
        
        public async Task<PayslipExtractResult> ExtractPayslipDataFromFileAsync(byte[] fileBytes, string mimeType)
        {
            if (string.IsNullOrEmpty(_apiKey) || _apiKey == "PEGA_TU_API_KEY_AQUI")
            {
                return new PayslipExtractResult { Success = false, ErrorMessage = "Por favor, configura tu GeminiApiKey en appsettings.json." };
            }

            try
            {
                var prompt = @"Eres un sistema experto en extracción de datos de boletas de pago peruanas.
Analiza la imagen o documento proporcionado de una boleta y extrae EXACTAMENTE los datos solicitados.
Si un dato no se encuentra, devuelve null.

REGLAS CRÍTICAS:
1. 'netAmount': Busca estrictamente la frase 'NETO A PAGAR S/:' o 'NETO A PAGAR'. El monto es el número final que aparece a su lado o debajo (ej. 1340.37). IGNORA por completo los valores de 'T. INGRESOS', 'T. RETENCIONES' y 'T. APORTACION' (ej. 197.70, 53.33, 9.15). Solo debes devolver el monto neto a pagar al trabajador. NO omitas ceros ni decimales. Si ves '1340.37', extrae 1340.37.
2. 'dni': Busca el DNI del trabajador (exactamente 8 dígitos, puede estar junto a 'D N I' o 'DNI').
3. 'month': Busca el mes de la boleta (ej. Enero, Febrero, Junio). Escríbelo con la primera letra mayúscula.
4. 'year': Busca el año de la boleta (ej. 2024, 2025, 2026).

Devuelve ÚNICAMENTE un objeto JSON válido, sin bloques de código markdown, con esta estructura exacta:
{
  ""dni"": ""8 dígitos o null"",
  ""netAmount"": numero_decimal o null,
  ""month"": ""Mes o null"",
  ""year"": numero_entero o null
}";

                string base64Data = Convert.ToBase64String(fileBytes);

                var payload = new
                {
                    contents = new[]
                    {
                        new
                        {
                            parts = new object[]
                            {
                                new { text = prompt },
                                new { inlineData = new { mimeType = mimeType, data = base64Data } }
                            }
                        }
                    },
                    generationConfig = new
                    {
                        temperature = 0.0,
                        responseMimeType = "application/json"
                    }
                };

                var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={_apiKey}";
                var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

                HttpResponseMessage response = null;
                string responseString = string.Empty;
                int maxRetries = 3;

                for (int i = 0; i < maxRetries; i++)
                {
                    response = await _httpClient.PostAsync(url, content);
                    responseString = await response.Content.ReadAsStringAsync();

                    if (response.IsSuccessStatusCode)
                    {
                        break;
                    }

                    _logger.LogWarning($"Intento {i + 1} de Gemini (Boleta Archivo) falló: {responseString}");
                    if (i < maxRetries - 1)
                    {
                        await Task.Delay(2000);
                    }
                }

                if (response == null || !response.IsSuccessStatusCode)
                {
                    return new PayslipExtractResult { Success = false, ErrorMessage = "Error comunicando con Gemini API." };
                }

                var jsonDoc = JsonDocument.Parse(responseString);
                var root = jsonDoc.RootElement;
                var candidates = root.GetProperty("candidates");
                var extractedText = candidates[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString();

                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };

                extractedText = extractedText.Trim();
                if (extractedText.StartsWith("```json"))
                {
                    extractedText = extractedText.Substring(7);
                    if (extractedText.EndsWith("```"))
                    {
                        extractedText = extractedText.Substring(0, extractedText.Length - 3);
                    }
                }
                
                int startIndex = extractedText.IndexOf('{');
                int endIndex = extractedText.LastIndexOf('}');
                
                if (startIndex != -1 && endIndex != -1 && endIndex > startIndex)
                {
                    extractedText = extractedText.Substring(startIndex, endIndex - startIndex + 1);
                }

                var resultDto = JsonSerializer.Deserialize<PayslipExtractResult>(extractedText, options);
                
                if (resultDto == null)
                {
                    return new PayslipExtractResult { Success = false, ErrorMessage = "No se pudo parsear el JSON de la IA." };
                }

                resultDto.Success = true;
                return resultDto;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error en ExtractPayslipDataFromFileAsync (Gemini): {ex.Message}");
                return new PayslipExtractResult { Success = false, ErrorMessage = "Error interno procesando la boleta con Gemini." };
            }
        }
    }
}

