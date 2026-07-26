using System;

namespace DNIContractApi.Models.Entities
{
    public class TransUbicacion
    {
        public int Id { get; set; }
        public int ViajeId { get; set; }
        public TransViaje? Viaje { get; set; }
        
        public double Latitud { get; set; }
        public double Longitud { get; set; }
        public double Velocidad { get; set; } // km/h
        public double Bateria { get; set; } // porcentaje
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
