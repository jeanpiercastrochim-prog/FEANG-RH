using System;
using System.Collections.Generic;

namespace DNIContractApi.Services
{
    public static class UbigeoDictionary
    {
        public static readonly string[] Departamentos = new string[]
        {
            "AMAZONAS", "ANCASH", "APURIMAC", "AREQUIPA", "AYACUCHO", "CAJAMARCA", "CALLAO", 
            "CUSCO", "HUANCAVELICA", "HUANUCO", "ICA", "JUNIN", "LA LIBERTAD", "LAMBAYEQUE", 
            "LIMA", "LORETO", "MADRE DE DIOS", "MOQUEGUA", "PASCO", "PIURA", "PUNO", 
            "SAN MARTIN", "TACNA", "TUMBES"
        };

        public static readonly string[] Provincias = new string[]
        {
            // ANCASH
            "SANTA", "CASMA", "HUARMEY", "HUARAZ", "CARHUAZ", "YUNGAY", "HUAYLAS", "RECUAY", "BOLOGNESI", "PALLASCA", "CORONGO", "SIHUAS", "POMABAMBA", "MARISCAL LUZURIAGA", "FITZCARRALD", "ASUNCION", "ANTONIO RAIMONDI", "HUARI", "OCROS", "AIJA", 
            // LIMA
            "LIMA", "HUAURA", "HUARAL", "BARRANCA", "CAÑETE", "HUAROCHIRI", "YAUYOS", "CANTA", "OYON", "CAJATAMBO",
            // LA LIBERTAD
            "TRUJILLO", "ASCOPE", "PACASMAYO", "CHEPEN", "VIRU", "OTUZCO", "JULCAN", "SANTIAGO DE CHUCO", "SANCHEZ CARRION", "PATAZ", "BOLIVAR", "GRAN CHIMU"
        };

        public static readonly string[] Distritos = new string[]
        {
            // SANTA
            "CHIMBOTE", "NUEVO CHIMBOTE", "COISHCO", "SANTA", "NEPEÑA", "SAMANCO", "MORO", "MACATE", "CACERES DEL PERU",
            // CASMA
            "CASMA", "BUENA VISTA ALTA", "COMANDANTE NOEL", "YAUTAN",
            // HUARMEY
            "HUARMEY", "COCHAPETI", "CULEBRAS", "HUAYAN", "MALVAS",
            // LIMA CENTRO/NORTE/SUR
            "LIMA", "ANCON", "ATE", "BARRANCO", "BREÑA", "CARABAYLLO", "CHACLACAYO", "CHORRILLOS", "CIENEGUILLA", "COMAS", "EL AGUSTINO", "INDEPENDENCIA", "JESUS MARIA", "LA MOLINA", "LA VICTORIA", "LINCE", "LOS OLIVOS", "LURIGANCHO", "LURIN", "MAGDALENA DEL MAR", "MIRAFLORES", "PACHACAMAC", "PUCUSANA", "PUEBLO LIBRE", "PUENTE PIEDRA", "PUNTA HERMOSA", "PUNTA NEGRA", "RIMAC", "SAN BARTOLO", "SAN BORJA", "SAN ISIDRO", "SAN JUAN DE LURIGANCHO", "SAN JUAN DE MIRAFLORES", "SAN LUIS", "SAN MARTIN DE PORRES", "SAN MIGUEL", "SANTA ANITA", "SANTA MARIA DEL MAR", "SANTA ROSA", "SANTIAGO DE SURCO", "SURQUILLO", "VILLA EL SALVADOR", "VILLA MARIA DEL TRIUNFO",
            // TRUJILLO
            "TRUJILLO", "EL PORVENIR", "FLORENCIA DE MORA", "HUANCHACO", "LA ESPERANZA", "LAREDO", "MOCHE", "POROTO", "SALAVERRY", "SIMBAL", "VICTOR LARCO HERRERA",
            // VIRU
            "VIRU", "CHAO", "GUADALUPITO"
        };
    }
}
