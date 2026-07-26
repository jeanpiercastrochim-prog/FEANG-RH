using DNIContractApi.Models.Entities;
using DNIContractApi.Models.DTOs;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace DNIContractApi.Services
{
    public class ContractService
    {
        public byte[] GenerateContract(ContractData data)
        {
            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(11));

                    page.Header().Element(ComposeHeader);
                    
                    page.Content().Column(col => 
                    {
                        for (int i = 0; i < 4; i++)
                        {
                            col.Item().Element(c => ComposeContent(c, data));
                            if (i < 3) 
                            {
                                col.Item().PageBreak();
                            }
                        }
                    });

                    page.Footer().AlignCenter().Text(x =>
                    {
                        x.Span("Página ");
                        x.CurrentPageNumber();
                        x.Span(" de ");
                        x.TotalPages();
                    });
                });
            }).GeneratePdf();
        }

        void ComposeHeader(IContainer container)
        {
            container.Row(row =>
            {
                row.RelativeItem().Column(column =>
                {
                    column.Item().AlignCenter().Text("CONTRATO INDIVIDUAL DE TRABAJO").FontSize(16).SemiBold().FontColor(Colors.Blue.Darken2);
                    column.Item().AlignCenter().Text("A PLAZO INDETERMINADO").FontSize(14);
                });
            });
        }

        void ComposeContent(IContainer container, ContractData data)
        {
            container.PaddingVertical(1, Unit.Centimetre).Column(column =>
            {
                column.Spacing(10);
                
                // Texto Introductorio
                column.Item().Text(text =>
                {
                    text.Span("Conste por el presente documento, el Contrato Individual de Trabajo a Plazo Indeterminado que celebran de una parte LA EMPRESA DEMO S.A.C., y de la otra parte el trabajador ");
                    text.Span($"{data.NombreCompleto}").SemiBold();
                    text.Span(", identificado con DNI N° ");
                    text.Span($"{data.NumeroDni}").SemiBold();
                    text.Span($", de sexo {data.Sexo}, con fecha de nacimiento {data.FechaNacimiento}, con domicilio en ");
                    text.Span($"{data.Direccion}").SemiBold();
                    text.Span($", a quien en adelante se le denominará EL TRABAJADOR.");
                });

                column.Item().PaddingTop(10).Text("CLÁUSULA PRIMERA: DE LA PRESTACIÓN DE SERVICIOS").SemiBold();
                column.Item().Text($"EL TRABAJADOR prestará sus servicios a LA EMPRESA como {data.Cargo} en el área de {data.Area}. Su fecha de inicio de labores será el {data.FechaInicio}. El nivel educativo declarado es {data.NivelEducativo}.");

                column.Item().PaddingTop(10).Text("CLÁUSULA SEGUNDA: DE LA JORNADA").SemiBold();
                column.Item().Text("EL TRABAJADOR cumplirá una jornada de trabajo ordinaria estipulada por la ley peruana, pudiendo LA EMPRESA modificar los horarios según sus necesidades operativas.");

                column.Item().PaddingTop(10).Text("CLÁUSULA TERCERA: DE LA REMUNERACIÓN").SemiBold();
                column.Item().Text("Por la prestación de los servicios, EL TRABAJADOR percibirá la remuneración básica pactada, la misma que será abonada mediante depósito en cuenta.");

                if (!string.IsNullOrEmpty(data.SistemaPensionario))
                {
                    column.Item().PaddingTop(10).Text("CLÁUSULA CUARTA: RÉGIMEN PENSIONARIO").SemiBold();
                    column.Item().Text($"EL TRABAJADOR declara estar afiliado al sistema pensionario: {data.SistemaPensionario}.");
                }

                // Firmas y Huella
                column.Item().PaddingTop(70).Row(row =>
                {
                    row.RelativeItem().AlignCenter().Column(col => 
                    {
                        col.Item().LineHorizontal(1).LineColor(Colors.Black);
                        col.Item().AlignCenter().Text("LA EMPRESA").SemiBold();
                    });
                    
                    row.ConstantItem(40);
                    
                    row.RelativeItem().AlignCenter().Column(col => 
                    {
                        if (!string.IsNullOrEmpty(data.SignatureImagePath))
                        {
                            var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", data.SignatureImagePath.TrimStart('/'));
                            if (System.IO.File.Exists(fullPath))
                            {
                                col.Item().Height(60).Image(fullPath).FitArea();
                            }
                            else
                            {
                                col.Item().Height(60);
                            }
                        }
                        else 
                        {
                            col.Item().Height(60);
                        }
                        col.Item().LineHorizontal(1).LineColor(Colors.Black);
                        col.Item().AlignCenter().Text("EL TRABAJADOR").SemiBold();
                        col.Item().AlignCenter().Text($"DNI: {data.NumeroDni}");
                        if (data.HasBiometrics) {
                            col.Item().AlignCenter().Text($"Firma validada por {data.Nombres} con biometría en dispositivo móvil").FontSize(8).FontColor(Colors.Green.Darken2);
                        }
                    });
                    
                    row.ConstantItem(40);
                    
                    row.RelativeItem().AlignCenter().Column(col => 
                    {
                        col.Item().Height(80).Border(1).BorderColor(Colors.Black);
                        col.Item().PaddingTop(5).AlignCenter().Text("HUELLA DACTILAR").SemiBold();
                    });
                });
            });
        }
    }
}
