using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DNIContractApi.Models.Entities
{
    // AlmacenUbicacion: Representa una zona o contenedor físico en el almacén
    [Table("Almacen_Ubicacion")]
    public class AlmacenUbicacion
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Zona { get; set; } = string.Empty; // Ej. "A", "B"

        [Required]
        [StringLength(50)]
        public string Rack { get; set; } = string.Empty; // Ej. "1", "2"

        [StringLength(50)]
        public string Nivel { get; set; } = string.Empty; // Ej. "1", "2"

        [StringLength(50)]
        public string Posicion { get; set; } = string.Empty; // Ej. "1", "2"

        public int CapacidadMaxima { get; set; } = 100;

        [StringLength(20)]
        public string Estado { get; set; } = "Libre"; // Libre, Ocupado, Bloqueado

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    // AlmacenProducto: Representa el catálogo de productos manejados
    [Table("Almacen_Producto")]
    public class AlmacenProducto
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Codigo { get; set; } = string.Empty; // Ej. PROD-001

        [Required]
        [StringLength(255)]
        public string Nombre { get; set; } = string.Empty;

        [StringLength(50)]
        public string UnidadMedida { get; set; } = "Unidades"; // Cajas, Kg, Litros

        public int StockMinimo { get; set; } = 5;
        
        public bool ControlaVencimiento { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    // AlmacenInventario: Relaciona Productos con Ubicaciones y el Stock actual
    [Table("Almacen_Inventario")]
    public class AlmacenInventario
    {
        [Key]
        public int Id { get; set; }

        public int ProductoId { get; set; }
        [ForeignKey("ProductoId")]
        public AlmacenProducto? Producto { get; set; }

        public int UbicacionId { get; set; }
        [ForeignKey("UbicacionId")]
        public AlmacenUbicacion? Ubicacion { get; set; }

        [StringLength(50)]
        public string Lote { get; set; } = string.Empty;

        public DateTime? FechaVencimiento { get; set; }

        public int CantidadDisponible { get; set; } = 0;

        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }

    // AlmacenMovimiento: Registra Ingresos (Recepciones) y Salidas (Despachos)
    [Table("Almacen_Movimiento")]
    public class AlmacenMovimiento
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(20)]
        public string TipoMovimiento { get; set; } = string.Empty; // INGRESO o SALIDA

        public int InventarioId { get; set; }
        [ForeignKey("InventarioId")]
        public AlmacenInventario? Inventario { get; set; }

        public int Cantidad { get; set; }

        [StringLength(100)]
        public string DocumentoReferencia { get; set; } = string.Empty; // Ej. Guia Nro, Codigo QR, Requerimiento Nro

        [StringLength(255)]
        public string Responsable { get; set; } = string.Empty; // Almacenero que registró

        [StringLength(255)]
        public string Solicitante { get; set; } = string.Empty; // Quien retira (Para salidas) / Proveedor (Para ingresos)

        [StringLength(500)]
        public string MotivoObservacion { get; set; } = string.Empty;

        public DateTime FechaMovimiento { get; set; } = DateTime.UtcNow;
    }
}
