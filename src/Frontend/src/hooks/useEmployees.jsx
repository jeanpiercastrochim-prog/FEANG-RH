import { useState, useEffect, useCallback } from 'react';

// Caché en memoria para evitar llamadas innecesarias al servidor
const employeeCache = new Map();

export function useEmployees(apiUrl, page = 1, pageSize = 10, search = '') {
  const [data, setData] = useState({
    items: [],
    totalItems: 0,
    totalPages: 0,
    currentPage: 1
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEmployees = useCallback(async (forceRefresh = false) => {
    const cacheKey = `${page}-${pageSize}-${search}`;
    
    if (!forceRefresh && employeeCache.has(cacheKey)) {
      setData(employeeCache.get(cacheKey));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/Employee/paged?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error('Error al cargar empleados');
      
      const result = await res.json();
      
      employeeCache.set(cacheKey, result);
      
      // Limpiar caché viejo si crece mucho para no saturar memoria
      if (employeeCache.size > 20) {
        const firstKey = employeeCache.keys().next().value;
        employeeCache.delete(firstKey);
      }
      
      setData(result);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, page, pageSize, search]);

  // Debounce para la búsqueda (evita llamar al API en cada letra tipeada inmediatamente)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchEmployees();
    }, search ? 300 : 0); // 300ms de retraso solo si hay búsqueda

    return () => clearTimeout(timeoutId);
  }, [fetchEmployees, search]);

  const mutate = () => {
    employeeCache.clear(); // Limpiamos toda la caché en mutaciones (crear, editar, eliminar)
    fetchEmployees(true);
  };

  return { ...data, loading, error, mutate };
}
