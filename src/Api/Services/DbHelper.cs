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

        public static async Task EnsureDefinicionExists(AppDbContext context, string codigo, string nombre)
        {
            var def = await context.Set<Definicion>().FirstOrDefaultAsync(d => d.Codigo == codigo);
            if (def == null)
            {
                def = new Definicion { Codigo = codigo, Nombre = nombre };
                context.Set<Definicion>().Add(def);
                await context.SaveChangesAsync();
            }
        }

        public static async Task ResolveRelationsAsync(AppDbContext context, Employee e)
        {
            await EnsureDefinicionExists(context, "GENERO", "Género");
            await EnsureDefinicionExists(context, "ESTADO_CIVIL", "Estado Civil");
            await EnsureDefinicionExists(context, "ESTADO_EMPLEADO", "Estado del Empleado");
            await EnsureDefinicionExists(context, "TIPO_CONTRATO", "Tipo de Contrato");
            await EnsureDefinicionExists(context, "NIVEL_EDUCACION", "Nivel de Educación");

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
            if (!string.IsNullOrEmpty(dep) || !string.IsNullOrEmpty(prov) || !string.IsNullOrEmpty(dist))
            {
                var ubigeo = await context.Set<Ubigeo>().FirstOrDefaultAsync(u =>
                    u.Departamento == dep && u.Provincia == prov && u.Distrito == dist);
                if (ubigeo == null)
                {
                    ubigeo = new Ubigeo { Departamento = dep, Provincia = prov, Distrito = dist };
                    context.Set<Ubigeo>().Add(ubigeo);
                    await context.SaveChangesAsync();
                }
                e.UbigeoId = ubigeo.Id;
            }
            else
            {
                e.UbigeoId = null;
            }

            // 3. Resolve Genero (DefinicionDetalle)
            if (!string.IsNullOrEmpty(e.Sexo))
            {
                var sex = e.Sexo.Trim();
                var genero = await context.Set<DefinicionDetalle>().FirstOrDefaultAsync(dd =>
                    dd.DefinicionCodigo == "GENERO" && 
                    (dd.Codigo == sex || dd.Nombre.StartsWith(sex)));
                
                if (genero == null)
                {
                    genero = new DefinicionDetalle { DefinicionCodigo = "GENERO", Codigo = sex.Substring(0, 1).ToUpper(), Nombre = sex };
                    context.Set<DefinicionDetalle>().Add(genero);
                    await context.SaveChangesAsync();
                }
                e.GeneroId = genero.Id;
                e.GeneroDefinicionCodigo = "GENERO";
            }
            else
            {
                e.GeneroId = null;
            }

            // 4. Resolve EstadoCivil
            if (!string.IsNullOrEmpty(e.EstadoCivil))
            {
                var estCivil = e.EstadoCivil.Trim().ToUpper();
                var ec = await context.Set<DefinicionDetalle>().FirstOrDefaultAsync(dd =>
                    dd.DefinicionCodigo == "ESTADO_CIVIL" && 
                    (dd.Codigo == estCivil || dd.Nombre.StartsWith(estCivil)));
                
                if (ec == null)
                {
                    ec = new DefinicionDetalle { DefinicionCodigo = "ESTADO_CIVIL", Codigo = estCivil, Nombre = e.EstadoCivil.Trim() };
                    context.Set<DefinicionDetalle>().Add(ec);
                    await context.SaveChangesAsync();
                }
                e.EstadoCivilId = ec.Id;
                e.EstadoCivilDefinicionCodigo = "ESTADO_CIVIL";
            }
            else
            {
                e.EstadoCivilId = null;
            }

            // 5. Default EstadoEmpleado if not set
            var estadoEmp = await context.Set<DefinicionDetalle>().FirstOrDefaultAsync(dd =>
                dd.DefinicionCodigo == "ESTADO_EMPLEADO" && dd.Codigo == "ACTIVO");
            if (estadoEmp == null)
            {
                estadoEmp = new DefinicionDetalle { DefinicionCodigo = "ESTADO_EMPLEADO", Codigo = "ACTIVO", Nombre = "Activo" };
                context.Set<DefinicionDetalle>().Add(estadoEmp);
                await context.SaveChangesAsync();
            }
            if (estadoEmp != null)
            {
                e.EstadoEmpleadoId = estadoEmp.Id;
                e.EstadoEmpleadoDefinicionCodigo = "ESTADO_EMPLEADO";
            }

            // 6. Default TipoContrato if not set
            var tipoContrato = await context.Set<DefinicionDetalle>().FirstOrDefaultAsync(dd =>
                dd.DefinicionCodigo == "TIPO_CONTRATO" && dd.Codigo == "PLAZO_FIJO");
            if (tipoContrato == null)
            {
                tipoContrato = new DefinicionDetalle { DefinicionCodigo = "TIPO_CONTRATO", Codigo = "PLAZO_FIJO", Nombre = "Plazo Fijo" };
                context.Set<DefinicionDetalle>().Add(tipoContrato);
                await context.SaveChangesAsync();
            }
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
                        Estado = "Concluido",
                        FechaFin = int.TryParse(e.PrimaryYear, out var py) ? new DateTime(py, 12, 31) : null
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
                        Estado = "Concluido",
                        FechaFin = int.TryParse(e.SecondaryYear, out var sy) ? new DateTime(sy, 12, 31) : null
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
                        Estado = "Concluido",
                        FechaFin = int.TryParse(e.HigherEducationYear, out var hy) ? new DateTime(hy, 12, 31) : null
                    });
                }
            }
        }
    }
}
