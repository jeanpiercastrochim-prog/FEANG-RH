using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using DNIContractApi.Data;
using DNIContractApi.Models.Entities;

namespace DNIContractApi.Services
{
    public static class DbHelper
    {
        public static void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt)
        {
            using var hmac = new HMACSHA512();
            passwordSalt = hmac.Key;
            passwordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
        }

        public static bool VerifyPasswordHash(string password, byte[] passwordHash, byte[] passwordSalt)
        {
            using var hmac = new HMACSHA512(passwordSalt);
            var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
            return computedHash.SequenceEqual(passwordHash);
        }

        public static void PopulateNotMapped(Employee e)
        {
            if (e == null) return;

            e.Sexo = e.Genero?.Nombre ?? (e.GeneroId != 0 ? e.GeneroId.ToString() : "");
            e.EstadoCivil = e.EstadoCivilDetalle?.Nombre ?? (e.EstadoCivilId != 0 ? e.EstadoCivilId.ToString() : "");
            e.Departamento = e.Ubigeo?.Departamento ?? "";
            e.Provincia = e.Ubigeo?.Provincia ?? "";
            e.Distrito = e.Ubigeo?.Distrito ?? "";
            e.Position = e.Cargo?.Nombre ?? "";
            e.Email = e.User?.Email ?? "";

            // Populate academic fields from Educations collection
            if (e.Educations != null)
            {
                foreach (var edu in e.Educations)
                {
                    var nivel = edu.NivelEducacion?.Codigo ?? edu.NivelEducacionId.ToString();
                    if (nivel.Contains("PRIMARIA") || edu.NivelEducacionId == 50 || edu.NivelEducacionId == 1) // PRIMARIA
                    {
                        e.HasPrimary = true;
                        e.PrimarySchool = edu.Institucion;
                    }
                    else if (nivel.Contains("SECUNDARIA") || edu.NivelEducacionId == 51 || edu.NivelEducacionId == 2) // SECUNDARIA
                    {
                        e.HasSecondary = true;
                        e.SecondarySchool = edu.Institucion;
                    }
                    else if (nivel.Contains("SUPERIOR") || nivel.Contains("TECNICA") || nivel.Contains("POSTGRADO") || edu.NivelEducacionId > 2)
                    {
                        e.HasHigherEducation = true;
                        e.HigherEducationInstitution = edu.Institucion;
                    }
                }
            }
        }

        public static async Task ResolveRelationsAsync(AppDbContext context, Employee e)
        {
            // 1. Resolve Cargo
            var cargoName = string.IsNullOrEmpty(e.Position) ? "Personal de Campo" : e.Position;
            var cargo = await context.Set<Cargo>().FirstOrDefaultAsync(c => c.Nombre == cargoName);
            if (cargo == null)
            {
                cargo = new Cargo { Nombre = cargoName, Descripcion = cargoName, Estado = "Activo", AreaDefinicionCodigo = "AREA", NivelDefinicionCodigo = "NIVEL" };
                context.Set<Cargo>().Add(cargo);
                await context.SaveChangesAsync();
            }
            e.CargoId = cargo.Id;

            // 2. Resolve Ubigeo
            var dep = string.IsNullOrEmpty(e.Departamento) ? "" : e.Departamento.ToUpper();
            var prov = string.IsNullOrEmpty(e.Provincia) ? "" : e.Provincia.ToUpper();
            var dist = string.IsNullOrEmpty(e.Distrito) ? "" : e.Distrito.ToUpper();
            var ubigeo = await context.Set<Ubigeo>().FirstOrDefaultAsync(u =>
                u.Departamento == dep && u.Provincia == prov && u.Distrito == dist);
            if (ubigeo == null)
            {
                ubigeo = new Ubigeo { Departamento = dep, Provincia = prov, Distrito = dist };
                context.Set<Ubigeo>().Add(ubigeo);
                await context.SaveChangesAsync();
            }
            e.UbigeoId = ubigeo.Id;

            // 3. Resolve Genero (DefinicionDetalle)
            var sex = string.IsNullOrEmpty(e.Sexo) ? "M" : e.Sexo.Trim();
            var genero = await context.Set<DefinicionDetalle>().FirstOrDefaultAsync(dd =>
                dd.DefinicionCodigo == "GENERO" && 
                (dd.Codigo == sex || dd.Nombre.StartsWith(sex)));
            if (genero == null)
            {
                genero = await context.Set<DefinicionDetalle>().FirstOrDefaultAsync(dd => dd.DefinicionCodigo == "GENERO");
            }
            if (genero != null)
            {
                e.GeneroId = genero.Id;
                e.GeneroDefinicionCodigo = "GENERO";
            }

            // 4. Resolve EstadoCivil
            var estCivil = string.IsNullOrEmpty(e.EstadoCivil) ? "SOLTERO" : e.EstadoCivil.Trim().ToUpper();
            var ec = await context.Set<DefinicionDetalle>().FirstOrDefaultAsync(dd =>
                dd.DefinicionCodigo == "ESTADO_CIVIL" && 
                (dd.Codigo == estCivil || dd.Nombre.StartsWith(estCivil)));
            if (ec == null)
            {
                ec = await context.Set<DefinicionDetalle>().FirstOrDefaultAsync(dd => dd.DefinicionCodigo == "ESTADO_CIVIL");
            }
            if (ec != null)
            {
                e.EstadoCivilId = ec.Id;
                e.EstadoCivilDefinicionCodigo = "ESTADO_CIVIL";
            }

            // 5. Default EstadoEmpleado if not set
            var estadoEmp = await context.Set<DefinicionDetalle>().FirstOrDefaultAsync(dd =>
                dd.DefinicionCodigo == "ESTADO_EMPLEADO" && dd.Codigo == "ACTIVO");
            if (estadoEmp != null)
            {
                e.EstadoEmpleadoId = estadoEmp.Id;
                e.EstadoEmpleadoDefinicionCodigo = "ESTADO_EMPLEADO";
            }

            // 6. Default TipoContrato if not set
            var tipoContrato = await context.Set<DefinicionDetalle>().FirstOrDefaultAsync(dd =>
                dd.DefinicionCodigo == "TIPO_CONTRATO" && dd.Codigo == "PLAZO_FIJO");
            if (tipoContrato != null)
            {
                e.TipoContratoId = tipoContrato.Id;
                e.TipoContratoDefinicionCodigo = "TIPO_CONTRATO";
            }

            // 7. Resolve User & Password
            if (!string.IsNullOrEmpty(e.Dni))
            {
                var user = await context.Set<User>().FirstOrDefaultAsync(u => u.Dni == e.Dni);
                var rol = (cargoName.Equals("Recursos Humanos", StringComparison.OrdinalIgnoreCase) || 
                           cargoName.Equals("Administrador", StringComparison.OrdinalIgnoreCase)) ? "RRHH" : "Colaborador";
                var email = string.IsNullOrEmpty(e.Email) ? $"{e.Dni}@chavin.com" : e.Email;
                var password = string.IsNullOrEmpty(e.Password) ? e.Dni : e.Password;

                if (user == null)
                {
                    user = new User
                    {
                        Dni = e.Dni,
                        Email = email,
                        Rol = rol,
                        IsActive = false // Deactivated by default, until HR approves
                    };
                    CreatePasswordHash(password, out var hash, out var salt);
                    user.PasswordHash = hash;
                    user.PasswordSalt = salt;
                    context.Set<User>().Add(user);
                }
                else
                {
                    user.Email = email;
                    user.Rol = rol;
                    if (!string.IsNullOrEmpty(e.Password))
                    {
                        CreatePasswordHash(password, out var hash, out var salt);
                        user.PasswordHash = hash;
                        user.PasswordSalt = salt;
                    }
                    context.Entry(user).State = EntityState.Modified;
                }
                await context.SaveChangesAsync();
                e.UserId = user.Id;
            }

            // 8. Resolve Education entries (Remove old and recreate to keep in sync)
            var oldEducations = context.Set<EmployeeEducation>().Where(ee => ee.EmployeeId == e.Id);
            context.Set<EmployeeEducation>().RemoveRange(oldEducations);

            if (e.HasPrimary && !string.IsNullOrEmpty(e.PrimarySchool))
            {
                var primaryDet = await context.Set<DefinicionDetalle>().FirstOrDefaultAsync(dd =>
                    dd.DefinicionCodigo == "NIVEL_EDUCACION" && dd.Codigo == "PRIMARIA");
                if (primaryDet != null)
                {
                    e.Educations.Add(new EmployeeEducation
                    {
                        NivelEducacionId = primaryDet.Id,
                        NivelEducacionDefinicionCodigo = "NIVEL_EDUCACION",
                        Institucion = e.PrimarySchool,
                        Estado = "Concluido"
                    });
                }
            }
            if (e.HasSecondary && !string.IsNullOrEmpty(e.SecondarySchool))
            {
                var secondaryDet = await context.Set<DefinicionDetalle>().FirstOrDefaultAsync(dd =>
                    dd.DefinicionCodigo == "NIVEL_EDUCACION" && dd.Codigo == "SECUNDARIA");
                if (secondaryDet != null)
                {
                    e.Educations.Add(new EmployeeEducation
                    {
                        NivelEducacionId = secondaryDet.Id,
                        NivelEducacionDefinicionCodigo = "NIVEL_EDUCACION",
                        Institucion = e.SecondarySchool,
                        Estado = "Concluido"
                    });
                }
            }
            if (e.HasHigherEducation && !string.IsNullOrEmpty(e.HigherEducationInstitution))
            {
                var higherDet = await context.Set<DefinicionDetalle>().FirstOrDefaultAsync(dd =>
                    dd.DefinicionCodigo == "NIVEL_EDUCACION" && dd.Codigo == "SUPERIOR");
                if (higherDet != null)
                {
                    e.Educations.Add(new EmployeeEducation
                    {
                        NivelEducacionId = higherDet.Id,
                        NivelEducacionDefinicionCodigo = "NIVEL_EDUCACION",
                        Institucion = e.HigherEducationInstitution,
                        Estado = "Concluido"
                    });
                }
            }
        }
    }
}
