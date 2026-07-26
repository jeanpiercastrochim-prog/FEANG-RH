import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Loader2, X, UploadCloud, Send, FileText, Eye, Download, MoreVertical, MessageCircle, Mail, FileSpreadsheet, Search, Trash2, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';
import { FcDocument, FcSearch, FcOk, FcClock, FcCalendar, FcViewDetails, FcDownload, FcMenu, FcShare, FcSms, FcFeedback, FcFile } from 'react-icons/fc';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as pdfjsLib from 'pdfjs-dist';
import './boletas.css';

// Set the worker from CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const getApiBaseUrl = () => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = hostname === 'localhost' || hostname === '127.0.0.1' ? '5051' : window.location.port;
  return `${protocol}//${hostname}:${port}/api`;
};

const getStaticBaseUrl = () => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = hostname === 'localhost' || hostname === '127.0.0.1' ? '5051' : window.location.port;
  return `${protocol}//${hostname}:${port}`;
};

const API_URL = getApiBaseUrl();

const BoletasDePago = () => {
  const [rawEmployees, setRawEmployees] = useState([]);
  const [rawPayslips, setRawPayslips] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [viewPayslip, setViewPayslip] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const [payslipToDelete, setPayslipToDelete] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  
  // Dashboard Stats
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalPayslips: 0,
    sentCount: 0,
    pendingCount: 0,
    readCount: 0,
    signedCount: 0,
    totalActiveEmployees: 0
  });
  // Nombramientos de carga
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [estimatedTimeMsg, setEstimatedTimeMsg] = useState('');
  const [uploadResults, setUploadResults] = useState(null);
  const [filePreviews, setFilePreviews] = useState([]);
  const [processingFiles, setProcessingFiles] = useState(false);
  const [resolvingDuplicate, setResolvingDuplicate] = useState(null);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [uploadMode, setUploadMode] = useState('bulk');
  const fileInputRef = useRef(null);
  const uploadMenuRef = useRef(null);

  // Estados del flujo UX de 2 pasos
  const [uploadStep, setUploadStep] = useState(1);

  // Estados de navegación tipo carpetas
  const [viewLevel, setViewLevel] = useState('years'); // 'years', 'months', 'payslips'
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);

  // Selecciones masivas
  const [selectedIds, setSelectedIds] = useState([]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickAnywhere = (event) => {
      setOpenDropdown(null);
      if (uploadMenuRef.current && !uploadMenuRef.current.contains(event.target)) {
        setShowUploadMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickAnywhere);
    return () => document.removeEventListener('mousedown', handleClickAnywhere);
  }, []);

  // Get current month name in Spanish
  const getCurrentMonthName = () => {
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                   "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return months[new Date().getMonth()];
  };
  
  const currentMonth = getCurrentMonthName();
  const currentYear = new Date().getFullYear();

  const fetchPayslips = async () => {
    setLoading(true);
    try {
      // Fetch both employees and existing payslips
      const [empRes, payslipRes] = await Promise.all([
        fetch(`${API_URL}/Employee`),
        fetch(`${API_URL}/Payslip`)
      ]);
      const employees = await empRes.json();
      const payslipsData = await payslipRes.json();

      setRawEmployees(employees);
      setRawPayslips(payslipsData);

    } catch (e) {
      console.error('Error fetching payslips', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/Payslip/stats?month=${currentMonth}&year=${currentYear}`);
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalAmount: data.totalAmount || data.TotalAmount || 0,
          totalPayslips: data.totalPayslips || data.TotalPayslips || 0,
          sentCount: data.sentCount || data.SentCount || 0,
          pendingCount: data.pendingCount || data.PendingCount || 0,
          readCount: data.readCount || data.ReadCount || 0,
          signedCount: data.signedCount || data.SignedCount || 0,
          totalActiveEmployees: data.totalActiveEmployees || data.TotalActiveEmployees || 0
        });
      }
    } catch (e) {
      console.error('Error fetching stats', e);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, []);

  // Calcular la data combinada solo cuando entramos a 'payslips'
  useEffect(() => {
    if (viewLevel === 'payslips' && selectedMonth && selectedYear) {
      const combinedData = rawEmployees.map(emp => {
        const empDni = emp.dni || emp.Dni;
        // Filtrar boletas especificamente para el mes y año seleccionado
        const empPayslip = rawPayslips.find(p => {
          const pDni = p.Dni || p.dni;
          const pMonth = p.Month || p.month;
          const pYear = p.Year || p.year;
          return pDni === empDni && pMonth === selectedMonth && pYear === selectedYear;
        });

        if (empPayslip) {
          return {
            ...empPayslip,
            id: empPayslip.id || empPayslip.Id,
            fullName: empPayslip.fullName || empPayslip.FullName || emp.fullName,
            dni: empPayslip.dni || empPayslip.Dni || empDni,
            position: empPayslip.position || empPayslip.Position || emp.position,
            hasAppAccount: empPayslip.hasAppAccount !== undefined ? empPayslip.hasAppAccount : emp.hasAppAccount,
            hasSignedContract: emp.hasSignedContract,
            phone: empPayslip.phone || emp.phone,
            email: empPayslip.email || emp.email
          };
        } else {
          return {
            id: null,
            fullName: emp.fullName,
            dni: empDni,
            position: emp.position || "",
            month: selectedMonth,
            year: selectedYear,
            amountPaid: null,
            status: "Faltante",
            generatedAt: null,
            hasAppAccount: emp.hasAppAccount,
            hasSignedContract: emp.hasSignedContract,
            phone: emp.phone,
            email: emp.email
          };
        }
      });
      setPayslips(combinedData);

      // Opcional: Actualizar las estadisticas para el periodo seleccionado
      fetchStatsForPeriod(selectedMonth, selectedYear);
    }
  }, [viewLevel, selectedMonth, selectedYear, rawEmployees, rawPayslips]);

  const fetchStatsForPeriod = async (month, year) => {
    try {
      const res = await fetch(`${API_URL}/Payslip/stats?month=${month}&year=${year}`);
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalAmount: data.totalAmount || data.TotalAmount || 0,
          totalPayslips: data.totalPayslips || data.TotalPayslips || 0,
          sentCount: data.sentCount || data.SentCount || 0,
          pendingCount: data.pendingCount || data.PendingCount || 0,
          readCount: data.readCount || data.ReadCount || 0,
          signedCount: data.signedCount || data.SignedCount || 0,
          totalActiveEmployees: data.totalActiveEmployees || data.TotalActiveEmployees || 0
        });
      }
    } catch (e) {
      console.error('Error fetching stats', e);
    }
  };

  // Function to extract text from PDF
  const extractTextFromPDF = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }
      
      return fullText;
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      return '';
    }
  };

  // Detect DNI from text (7 or 8 digits)
  const detectDNIFromText = (text) => {
    const dniMatch = text.match(/(?:DNI.*?|)(\b\d{7,8}\b)/i);
    return dniMatch ? dniMatch[1] : null;
  };
  
  // Detect name from PDF text (looking for "APELLIDOS Y NOMBRES")
  const detectNameFromText = (text) => {
    // First try the exact label from your example: "APELLIDOS Y NOMBRES"
    let nameMatch = text.match(/APELLIDOS\s*Y\s*NOMBRES\s*[;:]?\s*([^\n\r]+?)(?=\s*(?:DNI|SEXO|CARGO|$))/i);
    if (nameMatch) {
      return nameMatch[1].trim();
    }
    // Fallback 1: "APELLIDOS Y NOMBRES:" with colon
    nameMatch = text.match(/APELLIDOS\s*Y\s*NOMBRES\s*:\s*([^\n\r]+)/i);
    if (nameMatch) {
      return nameMatch[1].trim();
    }
    // Fallback 2: Just "NOMBRES"
    nameMatch = text.match(/NOMBRES\s*[;:]?\s*([^\n\r]+)/i);
    if (nameMatch) {
      return nameMatch[1].trim();
    }
    return null;
  };

  // Detect month and year from PDF text
  const detectMonthYearFromText = (text) => {
    // 1. Try to match "DEL MES DE [MES] -[AÑO]" or similar
    const monthMatch = text.match(/MES\s+DE\s+([A-Za-z]+)\s*[-]*\s*(\d{4})/i);
    if (monthMatch) {
      return {
        month: monthMatch[1].charAt(0).toUpperCase() + monthMatch[1].slice(1).toLowerCase(),
        year: parseInt(monthMatch[2], 10)
      };
    }
    
    // 2. Try to match date formats like "Periodo Del: 28/06/2026"
    const dateMatch = text.match(/Periodo\s+Del.*?\d{2}\/(\d{2})\/(\d{4})/i);
    if (dateMatch) {
      const monthNum = parseInt(dateMatch[1], 10);
      const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      if (monthNum >= 1 && monthNum <= 12) {
        return {
          month: months[monthNum - 1],
          year: parseInt(dateMatch[2], 10)
        };
      }
    }
    
    return null;
  };

  // Detect amount from PDF text
  const detectAmountFromText = (text) => {
    // Busca "NETO A PAGAR" y da un margen amplio de hasta 120 caracteres para saltar espacios en blanco
    const regex = /NETO\s+A\s+PAGAR[^\d]{0,120}?([\d.,]+)/gi;
    let match;
    let foundVals = [];
    while ((match = regex.exec(text)) !== null) {
      let rawNum = match[1];
      // Si tiene coma y no tiene punto, asumimos que la coma es decimal y la cambiamos a punto
      if (rawNum.includes(',') && !rawNum.includes('.')) {
         rawNum = rawNum.replace(',', '.');
      } else {
         // Si tiene punto (ej. 1,340.37), asumimos que la coma es de miles y la quitamos
         rawNum = rawNum.replace(/,/g, '');
      }
      
      const val = parseFloat(rawNum);
      if (!isNaN(val)) foundVals.push(val);
    }
    
    // Devolvemos el último encontrado que NO sea exactamente un año típico, para evitar accidentes
    for (let i = foundVals.length - 1; i >= 0; i--) {
       if (foundVals[i] !== 2024 && foundVals[i] !== 2025 && foundVals[i] !== 2026 && foundVals[i] !== 2027) {
           return foundVals[i];
       }
    }
    return foundVals.length > 0 ? foundVals[foundVals.length - 1] : null;
  };

  // Process files when "Continuar" is pressed
  const handleProceedToValidation = async () => {
    setUploadStep('loading_ia');
    const totalFiles = uploadFiles.length;
    const AVG_TIME_PER_FILE_SEC = 2.0; // 2 seconds per file average
    const CONCURRENCY = 3;
    
    // Initial estimation
    let initialEstSeconds = Math.ceil((totalFiles / CONCURRENCY) * AVG_TIME_PER_FILE_SEC);
    if (initialEstSeconds < 5 && totalFiles > 0) initialEstSeconds = 5;
    const initialMins = Math.floor(initialEstSeconds / 60);
    const initialSecs = initialEstSeconds % 60;
    const initialTimeStr = initialMins > 0 ? `${initialMins} min ${initialSecs} seg` : `${initialSecs} segundos`;
    
    setEstimatedTimeMsg(`⏳ Tiempo estimado restante: ${initialTimeStr}`);
    setLoadingMessage(`Iniciando el motor de Inteligencia Artificial...\nPreparando ${totalFiles} documento(s)`);
    
    if (totalFiles > 0) {
      setProcessingFiles(true);
      const previews = new Array(totalFiles);
      let completed = 0;

      const processFile = async (file, index) => {
        setLoadingMessage(`Extrayendo datos... procesando documento ${completed + 1} de ${totalFiles}`);
        const url = URL.createObjectURL(file);
        let dni = null;
        let name = null;
        let amount = null;
        let month = null;
        let year = null;
        
        try {
          // Extract text from PDF
          const text = await extractTextFromPDF(file);
          
          // Prioridad 1: Extracción determinista local (Regex)
          const localDni = detectDNIFromText(text);
          const localName = detectNameFromText(text);
          const localAmount = detectAmountFromText(text);
          const localDate = detectMonthYearFromText(text);
          
          dni = localDni;
          name = localName;
          amount = localAmount;
          if (localDate) {
            month = localDate.month;
            year = localDate.year;
          }
          
          // Prioridad 2: Usar Gemini OCR para rellenar lo que falte
          try {
            const formData = new FormData();
            formData.append('file', file);
            
            const ocrRes = await fetch(`${API_URL}/Ocr/extract-payslip-file`, {
              method: 'POST',
              body: formData
            });
            if (ocrRes.ok) {
              const ocrData = await ocrRes.json();
              if (ocrData.success) {
                // Dar prioridad a la IA sobre el modelo local, ya que es más precisa
                if (ocrData.dni) dni = ocrData.dni;
                if (ocrData.netAmount) amount = ocrData.netAmount;
                if (ocrData.month) month = ocrData.month;
                if (ocrData.year) year = ocrData.year;
              }
            } else {
              throw new Error(`HTTP Error: ${ocrRes.status}`);
            }
          } catch(e) {
            console.error('Error with Gemini OCR', e);
          }
          
          // Fallback if local/Gemini didn't find DNI
          if (!dni) {
            const fileNameMatch = file.name.match(/\d{7,8}/);
            dni = fileNameMatch ? fileNameMatch[0] : null;
          }
          
        } catch (error) {
          console.error("Error processing file", error);
        }
        
        let matchedEmployee = null;
        let hasAppAccount = false;
        if (dni) {
          // Match with rawEmployees state
          matchedEmployee = rawEmployees.find(emp => {
            const empDni = emp.dni || emp.Dni;
            return empDni === dni;
          });
          if (matchedEmployee) {
            hasAppAccount = matchedEmployee.hasAppAccount === true || matchedEmployee.HasAppAccount === true;
          }
        }

        let isValid = !!matchedEmployee && hasAppAccount;
        let errorReason = null;
        if (!matchedEmployee) errorReason = '⚠️ Empleado no registrado';
        else if (!hasAppAccount) errorReason = '⚠️ Empleado sin cuenta App';
        
        previews[index] = {
          file,
          url,
          name,
          dni,
          amount,
          month,
          year,
          matchedEmployee,
          hasAppAccount,
          isValid,
          errorReason
        };

        completed++;
        const remaining = totalFiles - completed;
        let estimatedSeconds = Math.ceil((remaining / CONCURRENCY) * AVG_TIME_PER_FILE_SEC);
        if (estimatedSeconds < 5 && remaining > 0) estimatedSeconds = 5;
        const mins = Math.floor(estimatedSeconds / 60);
        const secs = estimatedSeconds % 60;
        const timeStr = mins > 0 ? `${mins} min ${secs} seg` : `${secs} segundos`;
        
        if (remaining > 0) {
          setEstimatedTimeMsg(`⏳ Tiempo estimado restante: ${timeStr}`);
          setLoadingMessage(`Analizando con IA... completados ${completed} de ${totalFiles}`);
        } else {
          setEstimatedTimeMsg('✨ ¡Procesamiento completado!');
          setLoadingMessage('Generando tabla de resultados...');
        }
      };

      // Process in chunks (concurrency)
      for (let i = 0; i < uploadFiles.length; i += CONCURRENCY) {
        const chunk = uploadFiles.slice(i, i + CONCURRENCY);
        await Promise.all(chunk.map((file, idx) => processFile(file, i + idx)));
      }
      
      // Check for duplicates within batch and DB
      previews.forEach((preview, i) => {
        if (!preview.isValid) return; // already invalid

        const pMonth = preview.month || selectedMonth;
        const pYear = preview.year || selectedYear;

        // Check if duplicate in batch (appears earlier in the array)
        const isDuplicateInBatch = previews.some((other, j) => {
          if (j >= i || !other.isValid) return false;
          const otherMonth = other.month || selectedMonth;
          const otherYear = other.year || selectedYear;
          return other.dni === preview.dni && otherMonth === pMonth && otherYear === pYear;
        });

        // Check if duplicate in DB
        const isDuplicateInDb = rawPayslips.some(rp => {
          const rpDni = rp.Dni || rp.dni;
          const rpMonth = rp.Month || rp.month;
          const rpYear = rp.Year || rp.year;
          return rpDni === preview.dni && rpMonth === pMonth && rpYear === pYear;
        });

        if (isDuplicateInBatch || isDuplicateInDb) {
          preview.isValid = false;
          preview.errorReason = '⚠️ Boleta duplicada';
        }
      });

      setFilePreviews(previews);
      setProcessingFiles(false);
      setUploadStep(2);
    } else {
      setFilePreviews([]);
      setProcessingFiles(false);
    }
  };

  // Cleanup object urls
  useEffect(() => {
    return () => {
      filePreviews.forEach(p => URL.revokeObjectURL(p.url));
    };
  }, [filePreviews]);

  const handleSendAll = async () => {
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/Payslip/send-all`, { method: 'POST' });
      if (res.ok) {
        await fetchPayslips();
      }
    } catch (e) {
      setAlertMessage({ type: 'error', text: 'Error enviando boletas: ' + e.message });
    } finally {
      setSending(false);
    }
  };

  const handleSendIndividual = async (id) => {
    try {
      const res = await fetch(`${API_URL}/Payslip/send/${id}`, { method: 'POST' });
      if (res.ok) {
        await fetchPayslips();
      } else {
        setAlertMessage({ type: 'error', text: 'Error enviando la boleta.' });
      }
    } catch (e) {
      setAlertMessage({ type: 'error', text: 'Error enviando boleta: ' + e.message });
    }
  };

  const handleDeleteConfirm = async (id) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${API_URL}/Payslip/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchPayslips();
      } else {
        setAlertMessage({ type: 'error', text: 'Error al eliminar la boleta.' });
      }
    } catch (e) {
      setAlertMessage({ type: 'error', text: 'Error eliminando boleta: ' + e.message });
    } finally {
      setDeletingId(null);
    }
  };

  const handleResolveDuplicate = async (existingId, tempFileName, newAmount, action) => {
    try {
      const res = await fetch(`${API_URL}/Payslip/resolve-duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ existingId, tempFileName, newAmount, action })
      });
      if (res.ok) {
        setUploadResults(uploadResults.map(r => r.existingId === existingId ? { ...r, status: 'Resolved' } : r));
        setResolvingDuplicate(null);
        fetchPayslips();
      } else {
        setAlertMessage({ type: 'error', text: 'Error resolviendo duplicado.' });
      }
    } catch (e) {
      console.error(e);
      setAlertMessage({ type: 'error', text: 'Error de red.' });
    }
  };
  
  const removeFile = (index) => {
    const newFiles = [...uploadFiles];
    newFiles.splice(index, 1);
    setUploadFiles(newFiles);

    if (filePreviews.length > 0) {
      const newPreviews = [...filePreviews];
      newPreviews.splice(index, 1);
      
      // Reset duplicate errors
      newPreviews.forEach((preview) => {
        if (preview.errorReason === '⚠️ Boleta duplicada') {
           preview.isValid = !!preview.matchedEmployee && preview.hasAppAccount;
           preview.errorReason = null;
           if (!preview.matchedEmployee) preview.errorReason = '⚠️ Empleado no registrado';
           else if (!preview.hasAppAccount) preview.errorReason = '⚠️ Empleado sin cuenta App';
        }
      });
      
      // Re-apply duplicate logic
      newPreviews.forEach((preview, i) => {
        if (!preview.isValid) return; 

        const pMonth = preview.month || selectedMonth;
        const pYear = preview.year || selectedYear;

        const isDuplicateInBatch = newPreviews.some((other, j) => {
          if (j >= i || !other.isValid) return false;
          const otherMonth = other.month || selectedMonth;
          const otherYear = other.year || selectedYear;
          return other.dni === preview.dni && otherMonth === pMonth && otherYear === pYear;
        });

        const isDuplicateInDb = rawPayslips.some(rp => {
          const rpDni = rp.Dni || rp.dni;
          const rpMonth = rp.Month || rp.month;
          const rpYear = rp.Year || rp.year;
          return rpDni === preview.dni && rpMonth === pMonth && rpYear === pYear;
        });

        if (isDuplicateInBatch || isDuplicateInDb) {
          preview.isValid = false;
          preview.errorReason = '⚠️ Boleta duplicada';
        }
      });

      setFilePreviews(newPreviews);
      
      if (newPreviews.length === 0) {
        setUploadStep(1);
      }
    }
  };

  const formatAmount = (amount) => {
    if (amount == null) return '-';
    return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema RH';
    workbook.created = new Date();

    const addSheet = (sheetName, data, colorInfo) => {
      const sheet = workbook.addWorksheet(sheetName, { properties: { tabColor: { argb: colorInfo.tab } } });
      
      sheet.columns = [
        { header: 'DNI', key: 'dni', width: 15 },
        { header: 'Colaborador', key: 'fullName', width: 35 },
        { header: 'Cargo', key: 'position', width: 25 },
        { header: 'Mes/Año', key: 'period', width: 15 },
        { header: 'Neto a Pagar', key: 'amount', width: 15 },
        { header: 'Estado', key: 'status', width: 15 }
      ];

      // Cabecera con estilos
      sheet.getRow(1).font = { name: 'Arial', family: 4, size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorInfo.header } };
      sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
      
      data.forEach(p => {
        const row = sheet.addRow({
          dni: p.Dni || p.dni,
          fullName: p.fullName,
          position: p.position,
          period: `${p.month} ${p.year}`,
          amount: p.amountPaid,
          status: p.status
        });
        if (p.amountPaid != null) {
          row.getCell('amount').numFmt = '"S/" #,##0.00';
          row.getCell('amount').alignment = { horizontal: 'right' };
        }
        row.getCell('status').font = { color: { argb: p.status === 'Enviado' ? 'FF16A34A' : 'FFD97706' }, bold: true };
      });
      
      sheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
          };
        });
      });
    };

    if (!filterType || filterValue === '') {
      const enviados = filteredPayslips.filter(p => p.status === 'Enviado');
      const pendientes = filteredPayslips.filter(p => p.status === 'Pendiente');
      addSheet('Boletas Enviadas', enviados, { tab: 'FF10B981', header: 'FF10B981' });
      addSheet('Boletas Pendientes', pendientes, { tab: 'FFF59E0B', header: 'FFF59E0B' });
    } else {
      addSheet('Reporte Filtrado', filteredPayslips, { tab: 'FF3B82F6', header: 'FF3B82F6' });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Reporte_Boletas_${new Date().getTime()}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Page 1: Enviados & Pendientes
    const firstFiltered = filteredPayslips[0];
    doc.setFontSize(16);
    doc.text(`Reporte de Boletas - Nómina de ${firstFiltered?.month || ''} ${firstFiltered?.year || ''}`, 14, 20);
    
    const conBoleta = filteredPayslips.filter(p => p.status === 'Enviado' || p.status === 'Pendiente');
    doc.setFontSize(12);
    doc.text(`Colaboradores con boleta lista/enviada (${conBoleta.length})`, 14, 30);
    
    const formatData = (data) => data.map(p => [
      p.Dni || p.dni,
      p.fullName,
      p.position,
      p.status,
      formatAmount(p.amountPaid)
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['DNI', 'Colaborador', 'Cargo', 'Estado', 'Neto a Pagar']],
      body: formatData(conBoleta),
      headStyles: { fillColor: [16, 185, 129] },
    });

    // Page 2: Sin Boleta (Faltante)
    const sinBoleta = filteredPayslips.filter(p => p.status === 'Faltante');
    if (sinBoleta.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text(`Colaboradores SIN Boleta (${sinBoleta.length})`, 14, 20);
      
      autoTable(doc, {
        startY: 30,
        head: [['DNI', 'Colaborador', 'Cargo', 'Estado', 'Neto a Pagar']],
        body: formatData(sinBoleta),
        headStyles: { fillColor: [239, 68, 68] },
      });
    }

    doc.save(`Reporte_Boletas_${new Date().getTime()}.pdf`);
  };

  const safeSearch = searchTerm.trim().toLowerCase();
  const filteredPayslips = payslips.filter(p => {
    const fullName = p.fullName?.toLowerCase() || '';
    const dni = p.Dni || p.dni || '';
    const matchSearch = fullName.includes(safeSearch) || dni.includes(safeSearch);
    
    let matchFilter = true;
    if (filterType && filterValue) {
      if (filterType === 'month') matchFilter = p.month === filterValue;
      if (filterType === 'year') matchFilter = p.year.toString() === filterValue;
      if (filterType === 'position') matchFilter = p.position === filterValue;
      if (filterType === 'appState') {
        if (filterValue === 'withAccount') matchFilter = p.hasAppAccount === true;
        if (filterValue === 'withoutAccount') matchFilter = p.hasAppAccount === false;
      }
    }

    return matchSearch && matchFilter;
  });

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const availableYearsFromData = [...new Set(rawPayslips.map(p => p.Year || p.year).filter(y => !!y))];
  if (!availableYearsFromData.includes(new Date().getFullYear())) {
    availableYearsFromData.push(new Date().getFullYear());
  }
  const availableYears = availableYearsFromData.sort((a, b) => b - a);
  const availablePositions = [...new Set(payslips.map(p => p.position))];

  const totalEmployees = filteredPayslips.length;
  const sentPayslips = filteredPayslips.filter(p => p.status === 'Enviado').length;
  const totalAmount = filteredPayslips.reduce((sum, p) => sum + (p.amountPaid || 0), 0);

  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const selectableIds = filteredPayslips.filter(p => p.status !== 'Faltante' && p.id && p.hasSignedContract).map(p => p.id);
      setSelectedIds(selectableIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSendSelected = async () => {
    if (selectedIds.length === 0) return;
    setSending(true);
    try {
      for (const id of selectedIds) {
        await fetch(`${API_URL}/Payslip/send/${id}`, { method: 'POST' });
      }
      setAlertMessage({ type: 'success', text: `Se han enviado ${selectedIds.length} boletas exitosamente.` });
      setSelectedIds([]);
      await fetchPayslips();
      await fetchStats();
    } catch (e) {
      setAlertMessage({ type: 'error', text: 'Error enviando boletas.' });
    } finally {
      setSending(false);
    }
  };

  const handleCreateAppAccount = async (dni) => {
    try {
      const res = await fetch(`${API_URL}/Employee/${dni}/create-app-account`, { method: 'POST' });
      if (res.ok) {
        setAlertMessage({ type: 'success', text: `Cuenta de App creada para el colaborador.` });
        setPayslips(prev => prev.map(p => p.dni === dni ? { ...p, hasAppAccount: true } : p));
      } else {
        const errorData = await res.json();
        setAlertMessage({ type: 'error', text: errorData.message || 'Error creando cuenta.' });
      }
    } catch (e) {
      setAlertMessage({ type: 'error', text: 'Error de conexión creando cuenta.' });
    }
  };

  return (
    <div className="boletas-premium-wrapper">
      <div className="boletas-glass-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="boletas-title-glow">Boletas de Pago</h1>
          <p className="boletas-header-subtitle">Gestión y envío de nómina mensual</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative' }} ref={uploadMenuRef}>
            <button 
              className="boletas-primary-action" 
              style={{ background: 'white', color: 'black', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '8px' }}
              onClick={() => setShowUploadMenu(!showUploadMenu)}
            >
              <UploadCloud size={18} color="black" /> Subir Boletas <ChevronDown size={16} />
            </button>
            {showUploadMenu && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', zIndex: 50, overflow: 'hidden', minWidth: '220px' }}>
                <button 
                  style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', textAlign: 'left', color: '#334155', fontWeight: '500' }}
                  onClick={() => {
                    setUploadMode('single');
                    setUploadFiles([]);
                    setShowPreview(false);
                    setUploadResults(null);
                    setShowUploadMenu(false);
                    setUploadStep(1);
                    setShowUploadModal(true);
                  }}
                >
                  <FileText size={18} color="#3b82f6" />
                  <span>Subida Individual</span>
                </button>
                <button 
                  style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: '#334155', fontWeight: '500' }}
                  onClick={() => {
                    setUploadMode('bulk');
                    setUploadFiles([]);
                    setShowPreview(false);
                    setUploadResults(null);
                    setShowUploadMenu(false);
                    setUploadStep(1);
                    setShowUploadModal(true);
                  }}
                >
                  <UploadCloud size={18} color="#10b981" />
                  <span>Subida Masiva</span>
                </button>
              </div>
            )}
          </div>
          
          <button 
            className="boletas-primary-action" 
            onClick={handleSendAll} 
            disabled={sending || sentPayslips === totalEmployees || payslips.length === 0}
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={16} color="white" />}
            {sentPayslips === totalEmployees && payslips.length > 0 ? 'Todas Enviadas' : 'Enviar Masivamente'}
          </button>
        </div>
      </div>

      {/* Breadcrumbs Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '1rem', color: '#64748b', fontWeight: '500' }}>
        <span 
          style={{ cursor: 'pointer', color: viewLevel === 'years' ? '#0f172a' : '#3b82f6', fontWeight: viewLevel === 'years' ? '700' : '500' }}
          onClick={() => { setViewLevel('years'); setSelectedYear(null); setSelectedMonth(null); }}
        >
          Boletas
        </span>
        {selectedYear && (
          <>
            <span>/</span>
            <span 
              style={{ cursor: 'pointer', color: viewLevel === 'months' ? '#0f172a' : '#3b82f6', fontWeight: viewLevel === 'months' ? '700' : '500' }}
              onClick={() => { setViewLevel('months'); setSelectedMonth(null); }}
            >
              {selectedYear}
            </span>
          </>
        )}
        {selectedMonth && (
          <>
            <span>/</span>
            <span style={{ color: '#0f172a', fontWeight: '700' }}>{selectedMonth}</span>
          </>
        )}
      </div>

      {/* Vista de Años */}
      {viewLevel === 'years' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' }}>
          {availableYears.map(year => (
            <div 
              key={year}
              onClick={() => { setSelectedYear(year); setViewLevel('months'); }}
              style={{
                background: 'linear-gradient(145deg, #ffffff, #f1f5f9)',
                borderRadius: '16px',
                padding: '32px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                border: '1px solid #e2e8f0',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = '#93c5fd';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ fill: '#dbeafe' }}>
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b', fontWeight: '800' }}>Año {year}</h3>
            </div>
          ))}
        </div>
      )}

      {/* Vista de Meses */}
      {viewLevel === 'months' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' }}>
          {monthNames.map((month, index) => {
            // Check if there are any payslips for this month in rawPayslips
            const monthHasData = rawPayslips.some(p => {
              const pMonth = p.Month || p.month;
              const pYear = p.Year || p.year;
              return pMonth === month && pYear === selectedYear;
            });

            return (
              <div 
                key={month}
                onClick={() => { setSelectedMonth(month); setViewLevel('payslips'); }}
                style={{
                  background: 'linear-gradient(145deg, #ffffff, #f1f5f9)',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = '#a7f3d0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                {monthHasData && (
                  <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#10b981', width: '12px', height: '12px', borderRadius: '50%' }} title="Contiene boletas"></div>
                )}
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ fill: '#d1fae5' }}>
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -40%)', fontSize: '0.8rem', fontWeight: '800', color: '#047857' }}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b', fontWeight: '700' }}>{month}</h3>
              </div>
            );
          })}
        </div>
      )}

      {/* Vista de Tabla (Nivel Final) */}
      {viewLevel === 'payslips' && (
        <>

      {/* Mini-Dashboard de KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-15px', right: '-15px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', width: '80px', height: '80px', borderRadius: '50%', opacity: 0.1 }}></div>
          <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Procesado</p>
          <h3 style={{ color: '#0f172a', fontSize: '2rem', fontWeight: '800', margin: 0 }}>S/ {stats.totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits:2})}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px' }}>
            <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>{currentMonth} {currentYear}</span>
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-15px', right: '-15px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', width: '80px', height: '80px', borderRadius: '50%', opacity: 0.1 }}></div>
          <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Boletas Generadas</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <h3 style={{ color: '#0f172a', fontSize: '2rem', fontWeight: '800', margin: 0 }}>{stats.totalPayslips}</h3>
            <span style={{ color: '#64748b', fontSize: '1rem', fontWeight: '500' }}>/ {stats.totalActiveEmployees} emp.</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', marginTop: '16px', overflow: 'hidden' }}>
            <div style={{ width: `${stats.totalActiveEmployees > 0 ? (stats.totalPayslips / stats.totalActiveEmployees) * 100 : 0}%`, height: '100%', background: '#3b82f6', borderRadius: '3px' }}></div>
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-15px', right: '-15px', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', width: '80px', height: '80px', borderRadius: '50%', opacity: 0.1 }}></div>
          <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado de Envíos</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ color: '#0f172a', fontSize: '2rem', fontWeight: '800', margin: 0 }}>{stats.sentCount}</h3>
              <p style={{ color: '#16a34a', fontSize: '0.85rem', fontWeight: '600', margin: 0 }}>Enviadas</p>
            </div>
            <div style={{ width: '1px', height: '40px', background: '#e2e8f0' }}></div>
            <div>
              <h3 style={{ color: '#0f172a', fontSize: '2rem', fontWeight: '800', margin: 0 }}>{stats.pendingCount}</h3>
              <p style={{ color: '#f59e0b', fontSize: '0.85rem', fontWeight: '600', margin: 0 }}>Pendientes</p>
            </div>
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-15px', right: '-15px', background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', width: '80px', height: '80px', borderRadius: '50%', opacity: 0.1 }}></div>
          <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Firmas Digitales</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ color: '#0f172a', fontSize: '2rem', fontWeight: '800', margin: 0 }}>{stats.signedCount}</h3>
              <p style={{ color: '#e11d48', fontSize: '0.85rem', fontWeight: '600', margin: 0 }}>Firmadas</p>
            </div>
            <div style={{ width: '1px', height: '40px', background: '#e2e8f0' }}></div>
            <div>
              <h3 style={{ color: '#0f172a', fontSize: '2rem', fontWeight: '800', margin: 0 }}>{stats.totalPayslips > 0 ? ((stats.signedCount / stats.totalPayslips)*100).toFixed(0) : 0}%</h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '600', margin: 0 }}>Completado</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="boletas-glass-panel">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FcCalendar size={28} />
              <h2 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontSize: '20px', color: '#1e293b', fontWeight: '800' }}>
                Nómina {filteredPayslips.length > 0 ? `${filteredPayslips[0]?.month} ${filteredPayslips[0]?.year}` : ''}
              </h2>
              <span style={{ background: '#f3e8ff', color: '#a855f7', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>
                Período Actual
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <select 
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', minWidth: '140px', background: 'white', color: '#334155', fontWeight: '500', fontSize: '13px' }}
                  value={filterType} 
                  onChange={e => {
                    setFilterType(e.target.value);
                    setFilterValue('');
                  }}
                >
                  <option value="">Sin Filtro</option>
                  <option value="month">Por Mes</option>
                  <option value="year">Por Año</option>
                  <option value="position">Por Cargo</option>
                  <option value="appState">Por Estado App</option>
                </select>
              </div>

              {filterType && (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <select 
                    style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', minWidth: '140px', background: 'white', color: '#334155', fontWeight: '500', fontSize: '13px' }}
                    value={filterValue} 
                    onChange={e => setFilterValue(e.target.value)}
                  >
                    <option value="">Seleccione...</option>
                    {filterType === 'month' && monthNames.map(m => <option key={m} value={m}>{m}</option>)}
                    {filterType === 'year' && availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    {filterType === 'position' && availablePositions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                    {filterType === 'appState' && (
                      <>
                        <option value="withAccount">Con App Móvil (Enviables)</option>
                        <option value="withoutAccount">Sin App Móvil (No Enviables)</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              <button 
                className="boletas-primary-action" 
                style={{ background: '#f43f5e', color: 'white', border: 'none', width: 'fit-content', padding: '8px 16px', fontSize: '13px', borderRadius: '8px', gap: '6px' }}
                onClick={exportToPDF}
                disabled={payslips.length === 0}
              >
                <FileText size={16} color="white" /> Exportar PDF
              </button>
              <button 
                className="boletas-primary-action" 
                style={{ background: '#10b981', color: 'white', border: 'none', width: 'fit-content', padding: '8px 16px', fontSize: '13px', borderRadius: '8px', gap: '6px' }}
                onClick={exportToExcel}
                disabled={payslips.length === 0}
              >
                <FileSpreadsheet size={16} color="white" /> Exportar Excel
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                style={{ width: '100%', padding: '8px 16px 8px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#334155', fontWeight: '500', boxSizing: 'border-box', fontSize: '13px' }}
                placeholder="Buscar por nombre o DNI..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="b-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={selectedIds.length > 0 && selectedIds.length === filteredPayslips.filter(p => p.status !== 'Faltante' && p.id && p.hasSignedContract).length}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3b82f6' }}
                  />
                </th>
                <th style={{ textAlign: 'center' }}>App Móvil</th>
                <th>Colaborador</th>
                <th>Cargo</th>
                <th>DNI</th>
                <th>Neto a Pagar</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Skeleton Rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="skeleton-row">
                    <td>
                      <div className="b-employee-cell">
                        <div className="skeleton-avatar"></div>
                        <div style={{ flex: 1 }}>
                          <div className="skeleton-box" style={{ width: '60%', marginBottom: '6px' }}></div>
                          <div className="skeleton-box" style={{ width: '40%' }}></div>
                        </div>
                      </div>
                    </td>
                    <td><div className="skeleton-box" style={{ width: '70%' }}></div></td>
                    <td><div className="skeleton-box" style={{ width: '50%' }}></div></td>
                    <td><div className="skeleton-box" style={{ width: '60%' }}></div></td>
                    <td><div className="skeleton-box" style={{ width: '80%', borderRadius: '20px' }}></div></td>
                    <td><div className="skeleton-box" style={{ width: '40px', margin: '0 auto', borderRadius: '8px' }}></div></td>
                  </tr>
                ))
              ) : filteredPayslips.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No se encontraron resultados.
                  </td>
                </tr>
              ) : (
                filteredPayslips.map((p, i) => (
                  <tr key={i} style={{ backgroundColor: !p.hasSignedContract ? '#fef2f2' : (selectedIds.includes(p.id) ? '#eff6ff' : (p.status === 'Faltante' ? '#fcf8f8' : (p.status === 'Pendiente' ? '#f0fdf4' : 'transparent'))), transition: 'all 0.2s' }}>
                    <td style={{ textAlign: 'center' }}>
                      {p.status !== 'Faltante' && p.id && p.hasSignedContract && (
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(p.id)}
                          onChange={() => handleSelectRow(p.id)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3b82f6' }}
                        />
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {p.hasAppAccount ? (
                        <span style={{ color: '#10b981', display: 'flex', justifyContent: 'center' }} title="Cuenta Activa">
                          <CheckCircle2 size={20} />
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCreateAppAccount(p.dni)}
                          style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(59,130,246,0.3)' }}
                        >
                          Crear
                        </button>
                      )}
                    </td>
                    <td>
                      <div className="b-employee-cell">
                        <div className="b-avatar-circle">
                          {getInitials(p.fullName)}
                        </div>
                        <div>
                          <p className="b-name-text">{p.fullName}</p>
                          <p className="b-dni-text">ID: {p.dni}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#475569', fontSize: '14px', fontWeight: '500' }}>{p.position}</td>
                    <td style={{ color: '#475569', fontSize: '14px' }}>{p.dni}</td>
                    <td className="b-money-text">
                      {p.status !== 'Faltante' ? formatAmount(p.amountPaid) : '-'}
                    </td>
                    <td>
                      {!p.hasSignedContract ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '700', background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5' }}>
                          <X size={14} /> Sin Contrato
                        </span>
                      ) : p.status === 'Enviado' ? (
                        <span className="b-badge enviado">
                          <FcOk size={16} /> Enviado
                        </span>
                      ) : p.status === 'Pendiente' ? (
                        <span className="b-badge pendiente">
                          <FcClock size={16} /> Pendiente
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '700', background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' }}>
                          <X size={14} /> Sin Boleta
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {p.status !== 'Faltante' ? (
                          <>
                            <button
                              className="b-action-icon"
                              onClick={() => setViewPayslip(p)}
                              title="Ver Boleta"
                            >
                              <span style={{ display: 'block', width: '20px', height: '20px', flexShrink: 0 }}>
                                <Eye size={20} color="#000000" strokeWidth={2.5} />
                              </span>
                            </button>

                            <button
                              className="b-action-icon"
                              onClick={() => window.open(`${getStaticBaseUrl()}/payslips/${p.dni}_${p.month}_${p.year}.pdf`, '_blank')}
                              title="Descargar Boleta"
                            >
                              <span style={{ display: 'block', width: '18px', height: '18px', flexShrink: 0 }}>
                                <Download size={18} color="#000000" strokeWidth={2.5} />
                              </span>
                            </button>

                            {(p.status === 'Pendiente' || p.status === 'Enviado') && (
                              <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                                <button
                                  className="b-action-icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdown(openDropdown === (p.employeeId || p.id) ? null : (p.employeeId || p.id));
                                  }}
                                  title="Opciones de envío"
                                >
                                  <span style={{ display: 'block', width: '18px', height: '18px', flexShrink: 0 }}>
                                    <MoreVertical size={18} color="#000000" strokeWidth={2.5} />
                                  </span>
                                </button>

                                {openDropdown === (p.employeeId || p.id) && (
                                  <div style={{ position: 'absolute', right: '0', top: '100%', marginTop: '4px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', zIndex: 50, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: '180px', padding: '4px' }}>
                                    {p.hasAppAccount ? (
                                      <button onClick={() => { handleSendIndividual(p.id); setOpenDropdown(null); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', border: 'none', background: 'transparent', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: '#000000', fontWeight: '600' }}>
                                        <Send size={16} color="#000000" /> Enviar por App
                                      </button>
                                    ) : (
                                      <span style={{ padding: '8px 12px', fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', display: 'block' }}>Sin app móvil</span>
                                    )}

                                    {p.phone ? (
                                      <button onClick={() => { window.open(`https://wa.me/${p.phone}?text=Hola%20${encodeURIComponent(p.fullName)},%20tu%20boleta%20de%20pago%20est%C3%A1%20disponible%20en%20la%20plataforma.`, '_blank'); setOpenDropdown(null); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', border: 'none', background: 'transparent', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: '#000000', fontWeight: '600' }}>
                                        <MessageCircle size={16} color="#000000" /> Enviar por WhatsApp
                                      </button>
                                    ) : null}

                                    {p.email ? (
                                      <button onClick={() => { window.open(`mailto:${p.email}?subject=Boleta%20de%20Pago&body=Hola%20${encodeURIComponent(p.fullName)},%20tu%20boleta%20de%20pago%20est%C3%A1%20disponible%20en%20la%20plataforma.`, '_blank'); setOpenDropdown(null); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', border: 'none', background: 'transparent', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: '#000000', fontWeight: '600' }}>
                                        <Mail size={16} color="#000000" /> Enviar por Correo
                                      </button>
                                    ) : null}

                                    <button onClick={() => { setPayslipToDelete(p.id); setOpenDropdown(null); }} disabled={deletingId === p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', border: 'none', background: 'transparent', width: '100%', textAlign: 'left', cursor: deletingId === p.id ? 'not-allowed' : 'pointer', fontSize: '13px', color: '#ef4444', fontWeight: '600', opacity: deletingId === p.id ? 0.5 : 1 }}>
                                      {deletingId === p.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} color="#ef4444" />}
                                      {deletingId === p.id ? 'Eliminando...' : 'Eliminar Boleta'}
                                    </button>

                                    {!p.phone && !p.email && !p.hasAppAccount && (
                                      <span style={{ padding: '8px 12px', fontSize: '11px', color: '#ef4444', fontWeight: '600', display: 'block' }}>Sin medios de contacto</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <span style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>Falta generar</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal para ver Boleta */}
      {/* Modal para ver Boleta (Visor Avanzado Slide-over) */}
      {viewPayslip && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 9999, display: 'flex', justifyContent: 'flex-end', backdropFilter: 'blur(4px)' }} onClick={() => setViewPayslip(null)}>
          <div 
            style={{ 
              backgroundColor: 'white', width: '90%', maxWidth: '1200px', height: '100%', 
              boxShadow: '-20px 0 50px -12px rgba(0, 0, 0, 0.4)', 
              display: 'flex', flexDirection: 'column',
              animation: 'slideInRight 0.3s ease-out forwards'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Slide-over Header */}
            <div style={{ padding: '20px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <FileText size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: '800' }}>Visor de Boleta</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>{viewPayslip.month} {viewPayslip.year} - {viewPayslip.fullName}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => window.open(`${getStaticBaseUrl()}/payslips/${viewPayslip.dni}_${viewPayslip.month}_${viewPayslip.year}.pdf`, '_blank')}
                  style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white', color: '#334155', fontWeight: '600', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', transition: 'all 0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                >
                  <Download size={18} /> Descargar PDF
                </button>
                <button 
                  onClick={() => setViewPayslip(null)}
                  style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#f1f5f9', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: '#64748b', transition: 'background 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Slide-over Body (Split View) */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              
              {/* PDF Viewer (Left Side) */}
              <div style={{ flex: '1 1 65%', background: '#cbd5e1', position: 'relative' }}>
                <iframe 
                  src={`${getStaticBaseUrl()}/payslips/${viewPayslip.dni}_${viewPayslip.month}_${viewPayslip.year}.pdf#toolbar=0`} 
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="PDF Viewer"
                />
              </div>

              {/* Data Panel (Right Side) */}
              <div style={{ flex: '1 1 35%', padding: '32px', overflowY: 'auto', background: 'white' }}>
                <h4 style={{ margin: '0 0 24px 0', fontSize: '1.1rem', color: '#0f172a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Eye size={20} color="#3b82f6" />
                  Datos de Validación Inteligente
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Colaborador Detectado</p>
                    <p style={{ margin: '4px 0 0 0', fontWeight: '800', color: '#0f172a', fontSize: '1.1rem' }}>{viewPayslip.fullName}</p>
                    <p style={{ margin: '4px 0 0 0', fontWeight: '500', color: '#475569', fontSize: '0.95rem' }}>{viewPayslip.position}</p>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>DNI</p>
                      <p style={{ margin: '4px 0 0 0', fontWeight: '700', color: '#0f172a', fontSize: '1rem' }}>{viewPayslip.dni}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Período</p>
                      <p style={{ margin: '4px 0 0 0', fontWeight: '700', color: '#0f172a', fontSize: '1rem' }}>{viewPayslip.month} {viewPayslip.year}</p>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Neto a Pagar</p>
                    <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800', color: '#059669' }}>
                      {formatAmount(viewPayslip.amountPaid)}
                    </p>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '8px' }}>Estado Actual</p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '100px', fontWeight: '700', background: viewPayslip.status === 'Enviado' ? '#dcfce7' : '#fef3c7', color: viewPayslip.status === 'Enviado' ? '#166534' : '#b45309' }}>
                      {viewPayslip.status === 'Enviado' ? <FcOk size={18} /> : <FcClock size={18} />}
                      {viewPayslip.status}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px dashed #cbd5e1' }}>
                  {!viewPayslip.hasSignedContract ? (
                    <div style={{ background: '#fee2e2', color: '#ef4444', padding: '16px', borderRadius: '12px', border: '1px solid #fca5a5', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <AlertCircle size={24} />
                      <div>
                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>Contrato Pendiente de Firma</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.9 }}>Este colaborador no ha firmado su contrato digital. No es posible generar ni enviar el pago de su boleta.</p>
                      </div>
                    </div>
                  ) : viewPayslip.status === 'Pendiente' && (
                    <button 
                      onClick={() => {
                        handleSendIndividual(viewPayslip.id);
                        setViewPayslip({ ...viewPayslip, status: 'Enviado' }); 
                      }}
                      style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(37,99,235,0.2)' }}
                      onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(37,99,235,0.3)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(37,99,235,0.2)'; }}
                    >
                      <Send size={20} /> Enviar Boleta Oficialmente
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Upload Modal */}
      {showUploadModal && createPortal(
        <div className="boletas-upload-modal-overlay animate-fade" style={{ zIndex: 99999 }} onClick={() => {
          if (uploadStep === 1) setShowUploadModal(false);
        }}>
          <div key={uploadResults ? 'results' : 'steps'} className="boletas-upload-modal-container" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={async () => {
                setShowUploadModal(false);
                if (uploadResults) {
                  await fetchPayslips();
                }
              }}
              style={{ position: 'absolute', top: '16px', right: '16px', background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s', zIndex: 10 }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.querySelector('svg').style.color = '#0f172a'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.querySelector('svg').style.color = '#64748b'; }}
            >
              <X size={20} color="#64748b" style={{ transition: 'color 0.2s' }} />
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a', fontWeight: '800' }}>{uploadMode === 'single' ? 'Subir Boleta Individual' : 'Subir Boletas Masivamente'}</h3>
              {uploadStep === 2 && (
                <button onClick={() => setUploadStep(1)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.9rem' }}>Volver a Selección</button>
              )}
            </div>

            {!uploadResults ? (
              <div key="upload-steps">
                {uploadStep === 1 && (
                  <>
                    <div 
                      className={`boletas-drag-zone ${uploadFiles.length > 0 ? 'active' : ''}`}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setUploadFiles(Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf').slice(0, uploadMode === 'single' ? 1 : undefined));
                      }}
                      onClick={() => fileInputRef.current.click()}
                      style={{ cursor: 'pointer' }}
                    >
                      <UploadCloud size={56} color="#3b82f6" style={{ margin: '0 auto 16px auto', filter: 'drop-shadow(0 4px 6px rgba(59,130,246,0.2))' }} />
                      <p style={{ margin: '0 0 8px 0', color: '#1e293b', fontWeight: '700', fontSize: '1.2rem' }}>Arrastra {uploadMode === 'single' ? 'tu archivo PDF' : 'tus archivos PDF'} aquí</p>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>o haz clic para explorar en tu computadora</p>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        multiple={uploadMode === 'bulk'} 
                        accept=".pdf" 
                        style={{ display: 'none' }} 
                        onChange={(e) => {
                          setUploadFiles(Array.from(e.target.files).filter(f => f.type === 'application/pdf').slice(0, uploadMode === 'single' ? 1 : undefined));
                        }}
                      />
                    </div>

                    {uploadFiles.length > 0 && (
                      <div style={{ marginTop: '20px' }}>
                        <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>
                          {uploadFiles.length} archivo(s) seleccionado(s):
                        </p>
                        <div style={{ maxHeight: uploadMode === 'single' ? '450px' : '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {uploadFiles.map((f, i) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                                  <FileText size={18} color="#64748b" />
                                  <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: '500', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{f.name}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {uploadMode === 'single' && (
                                    <button 
                                      onClick={() => setShowPreview(!showPreview)} 
                                      style={{ background: showPreview ? '#3b82f6' : 'white', color: showPreview ? 'white' : '#3b82f6', border: '1px solid #3b82f6', borderRadius: '6px', padding: '6px 12px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s', boxShadow: showPreview ? '0 4px 6px rgba(59,130,246,0.2)' : 'none' }}
                                    >
                                      <Eye size={16} /> {showPreview ? 'Ocultar Previa' : 'Ver Vista Previa'}
                                    </button>
                                  )}
                                  <button onClick={() => removeFile(i)} style={{ background: '#fef2f2', border: '1px solid #fecaca', cursor: 'pointer', padding: '6px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.background = '#fee2e2' }} onMouseOut={(e) => { e.currentTarget.style.background = '#fef2f2' }}>
                                    <Trash2 color="#ef4444" size={18} />
                                  </button>
                                </div>
                              </div>
                              {uploadMode === 'single' && showPreview && (
                                <iframe 
                                  src={URL.createObjectURL(f)} 
                                  style={{ width: '100%', height: '400px', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: '#f8fafc', boxShadow: 'inset 0 4px 6px rgba(0,0,0,0.05)' }} 
                                  title={`Vista Previa ${f.name}`} 
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '24px' }}>
                      <button onClick={() => setShowUploadModal(false)} className="boletas-cancel-btn">Cancelar</button>
                      <button onClick={handleProceedToValidation} disabled={uploadFiles.length === 0} className="boletas-upload-btn" style={{ background: uploadFiles.length === 0 ? '#cbd5e1' : '#3b82f6' }}>
                        Continuar
                      </button>
                    </div>
                  </>
                )}

                {uploadStep === 'loading_ia' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', textAlign: 'center' }}>
                    <div style={{ position: 'relative', width: '80px', height: '80px', marginBottom: '24px' }}>
                      <div style={{ position: 'absolute', inset: 0, border: '4px solid #f1f5f9', borderRadius: '50%' }}></div>
                      <div style={{ position: 'absolute', inset: 0, border: '4px solid #10b981', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                      <UploadCloud size={32} color="#10b981" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                    </div>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '1.4rem', color: '#1e293b', fontWeight: '700' }}>Analizando con IA 🤖</h4>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '1rem', maxWidth: '300px', lineHeight: '1.5', whiteSpace: 'pre-line' }}>{loadingMessage}</p>
                    {estimatedTimeMsg && (
                      <div style={{ marginTop: '16px', background: '#dcfce7', color: '#166534', padding: '8px 16px', borderRadius: '100px', fontSize: '0.9rem', fontWeight: '600' }}>
                        {estimatedTimeMsg}
                      </div>
                    )}
                  </div>
                )}

                {uploadStep === 2 && uploadFiles.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    {(() => {
                      const monthNamesArray = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
                      const currentMonthIndex = new Date().getMonth();
                      const currentYearVal = new Date().getFullYear();
                      
                      let isPastPeriod = false;
                      if (selectedYear && selectedMonth) {
                        const selectedMonthIndex = monthNamesArray.indexOf(selectedMonth);
                        if (selectedYear < currentYearVal || (selectedYear === currentYearVal && selectedMonthIndex < currentMonthIndex)) {
                          isPastPeriod = true;
                        }
                      }
                      
                      return isPastPeriod ? (
                        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d', padding: '16px', borderRadius: '12px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <AlertCircle size={24} color="#f59e0b" style={{ flexShrink: 0 }} />
                          <div>
                            <p style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: '#92400e', fontWeight: '700' }}>Atención: Subida a un mes anterior</p>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#b45309' }}>
                              Estás intentando subir boletas a un periodo pasado ({selectedMonth} {selectedYear}). Si algún colaborador ya tiene una boleta para esta fecha, el comparador de duplicados saltará después de confirmar.
                            </p>
                          </div>
                        </div>
                      ) : null;
                    })()}
                    <p style={{ margin: '12px 0 0 0', fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>
                      {uploadFiles.length} archivos validados por Inteligencia Artificial:
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                      {filePreviews.map((preview, idx) => {
                        const fileName = preview.file.name;
                        const dni = preview.dni || 'DNI no detectado';
                        const name = (preview.matchedEmployee?.fullName || preview.matchedEmployee?.FullName) || preview.name || 'Nombre no detectado';
                        
                        return (
                          <div key={idx} className="boletas-file-card" style={{ border: preview.isValid ? '1px solid #bbf7d0' : '1px solid #fca5a5' }}>
                            <button
                              onClick={() => removeFile(idx)}
                              style={{
                                position: 'absolute', top: '12px', right: '12px', width: '32px', height: '32px',
                                borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', zIndex: 10, transition: 'all 0.3s'
                              }}
                              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.transform = 'scale(1)'; }}
                              title="Eliminar archivo"
                            >
                              <Trash2 color="#ef4444" size={20} />
                            </button>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '40px' }}>
                              <FileText size={16} color={preview.isValid ? '#16a34a' : '#ef4444'} />
                              <span style={{ fontSize: '0.85rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontWeight: '500' }}>
                                {fileName}
                              </span>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ 
                                width: '36px', 
                                height: '36px', 
                                borderRadius: '50%', 
                                backgroundColor: preview.isValid ? '#dcfce7' : '#fee2e2', 
                                color: preview.isValid ? '#16a34a' : '#ef4444',
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '12px'
                              }}>
                                {preview.isValid ? '✓' : '!'}
                              </div>
                              <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: preview.isValid ? '#0f172a' : '#ef4444' }}>
                                  {preview.isValid ? name : preview.errorReason}
                                </p>
                                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#475569', fontWeight: '500' }}>
                                  DNI: {dni}
                                </p>
                                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#475569', fontWeight: '500' }}>
                                  Boleta: {(preview.month && preview.year) ? `${preview.month} ${preview.year}` : (selectedMonth && selectedYear ? `${selectedMonth} ${selectedYear}` : 'Automático por sistema')}
                                </p>
                                {preview.isValid && (
                                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#16a34a', fontWeight: '700' }}>
                                    ✅ Listo para subir
                                  </p>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                              <button
                                onClick={() => window.open(preview.url, '_blank')}
                                style={{ 
                                  flex: 1,
                                  padding: '8px 12px', 
                                  backgroundColor: '#f1f5f9', 
                                  border: '1px solid #e2e8f0', 
                                  borderRadius: '8px', 
                                  fontSize: '0.75rem', 
                                  fontWeight: '600', 
                                  color: '#475569', 
                                  cursor: 'pointer'
                                }}
                              >
                                Ver PDF
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!processingFiles && uploadStep === 2 && filePreviews.some(p => !p.isValid) && (
                  <div style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fca5a5',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <AlertCircle size={20} color="#ef4444" />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#991b1b', fontWeight: '600' }}>
                        ⚠️ Hay archivos inválidos (duplicados, no registrados o sin cuenta)
                      </p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#b91c1c' }}>
                        Elimina estos archivos para poder continuar con la subida
                      </p>
                    </div>
                  </div>
                )}

                {uploadStep === 2 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '16px' }}>
                    <button 
                      onClick={() => setShowUploadModal(false)}
                      className="boletas-cancel-btn"
                    >
                      Cancelar
                    </button>
                      <button 
                        disabled={uploadFiles.length === 0 || filePreviews.some(p => !p.isValid) || uploading}
                        onClick={async () => {
                          setUploading(true);
                          
                          const formData = new FormData();
                          uploadFiles.forEach(file => formData.append('files', file));
                          
                          if (selectedMonth) formData.append('targetMonth', selectedMonth);
                          if (selectedYear) formData.append('targetYear', selectedYear);

                          // Send pre-extracted mappings to avoid double OCR
                          const mappings = filePreviews.map(p => ({
                            FileName: p.file.name,
                            Dni: p.dni,
                            Amount: p.amount || 0, // Fallback to 0 if totally unreadable
                            Month: p.month,
                            Year: p.year
                          }));
                          formData.append('mappingsJson', JSON.stringify(mappings));

                          try {
                            const res = await fetch(`${API_URL}/Payslip/upload-bulk`, {
                              method: 'POST',
                              body: formData
                            });
                            
                            const data = await res.json();
                            if (res.ok) {
                              setUploadResults(data);
                              const noRegistrados = data.filter(r => r.status === 'EmployeeNotFound');
                              const exitosos = data.filter(r => r.status === 'Success');
                              if (noRegistrados.length > 0) {
                                setAlertMessage({ 
                                  type: 'warning', 
                                  text: `ALERTA: Se ha detectado ${noRegistrados.length} archivo(s) de personal NO REGISTRADO en el sistema. No se procesarán ni guardarán. ${exitosos.length > 0 ? `Se procesaron exitosamente ${exitosos.length} boleta(s).` : ''}` 
                                });
                              }
                            } else {
                              setAlertMessage({ type: 'error', text: 'Error de conexión con el servidor.' });
                            }
                          } catch (error) {
                            setAlertMessage({ type: 'error', text: 'Error de conexión.' });
                          } finally {
                            setUploading(false);
                          }
                        }}
                        className="boletas-upload-btn"
                      >
                      {uploading ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
                      {uploading ? 'Enviando de inmediato...' : 'Confirmar y Enviar'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div key="upload-results">
                <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle2 size={24} color="#16a34a" />
                  <div>
                    <h4 style={{ margin: 0, color: '#166534', fontSize: '1.1rem' }}>Carga procesada</h4>
                    <p style={{ margin: 0, color: '#15803d', fontSize: '0.9rem' }}>Revisa el resultado de la asociación a continuación.</p>
                  </div>
                </div>

                <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '24px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr>
                        <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#64748b' }}>Archivo</th>
                        <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#64748b' }}>DNI Detectado</th>
                        <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#64748b' }}>Colaborador</th>
                        <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#64748b' }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadResults.map((res, i) => (
                        <tr key={i}>
                          <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem', color: '#475569' }}>{res.fileName}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem', color: '#475569', fontWeight: '500' }}>{res.dni}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem', color: '#0f172a', fontWeight: '500' }}>{res.employeeName}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
                            {res.status === 'Success' ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '20px', background: '#dcfce7', color: '#16a34a', fontSize: '0.8rem', fontWeight: '600' }}>
                                <CheckCircle2 size={12} /> Exitoso
                              </span>
                            ) : res.status === 'Duplicate' ? (
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '20px', background: '#fef08a', color: '#854d0e', fontSize: '0.8rem', fontWeight: '600' }}>
                                  <AlertCircle size={12} /> Duplicado
                                </span>
                                <button onClick={() => setResolvingDuplicate(res)} style={{ padding: '4px 10px', background: '#3b82f6', color: 'white', borderRadius: '6px', fontSize: '0.75rem', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Comparar</button>
                              </div>
                            ) : res.status === 'Resolved' ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '20px', background: '#dcfce7', color: '#16a34a', fontSize: '0.8rem', fontWeight: '600' }}>
                                <CheckCircle2 size={12} /> Resuelto
                              </span>
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '20px', background: '#fee2e2', color: '#ef4444', fontSize: '0.8rem', fontWeight: '600' }}>
                                <AlertCircle size={12} /> {res.status === 'EmployeeNotFound' ? 'Empleado No Encontrado' : 'Sin DNI'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={() => {
                      setShowUploadModal(false);
                      fetchPayslips();
                    }}
                    style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Finalizar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      , document.body)}

      {/* Modal para Confirmar Eliminación */}
      {payslipToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, backdropFilter: 'blur(4px)' }} onClick={(e) => {
          // Close modal when clicking the overlay, but don't propagate
          setPayslipToDelete(null);
        }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', width: '90%', maxWidth: '400px', padding: '32px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px auto' }}>
              <Trash2 size={32} color="#ef4444" />
            </div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.25rem', color: '#0f172a', fontWeight: 'bold' }}>Eliminar Boleta</h3>
            <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5' }}>
              ¿Estás seguro de eliminar permanentemente esta boleta? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyItems: 'stretch' }}>
              <button 
                onClick={() => setPayslipToDelete(null)}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseOut={(e) => e.currentTarget.style.background = 'white'}
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  handleDeleteConfirm(payslipToDelete);
                  setPayslipToDelete(null);
                }}
                disabled={deletingId === payslipToDelete}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#ef4444', color: 'white', fontWeight: '600', cursor: deletingId === payslipToDelete ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: deletingId === payslipToDelete ? 0.5 : 1 }}
                onMouseOver={(e) => { if (deletingId !== payslipToDelete) e.currentTarget.style.background = '#dc2626'; }}
                onMouseOut={(e) => { if (deletingId !== payslipToDelete) e.currentTarget.style.background = '#ef4444'; }}
              >
                {deletingId === payslipToDelete ? <><Loader2 size={16} className="animate-spin" /> Eliminando...</> : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {alertMessage && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10001, backdropFilter: 'blur(4px)' }} onClick={(e) => setAlertMessage(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', width: '90%', maxWidth: '420px', padding: '28px', position: 'relative', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                backgroundColor: alertMessage.type === 'error' ? '#fef2f2' : (alertMessage.type === 'warning' ? '#fffbeb' : '#f0fdf4'), 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                flexShrink: 0
              }}>
                {alertMessage.type === 'error' ? <X size={24} color="#ef4444" /> : 
                 alertMessage.type === 'warning' ? <AlertCircle size={24} color="#d97706" /> : 
                 <CheckCircle2 size={24} color="#16a34a" />}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.125rem', color: '#0f172a', fontWeight: '700' }}>
                  {alertMessage.type === 'error' ? 'Error' : (alertMessage.type === 'warning' ? 'Aviso' : 'Éxito')}
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5' }}>
                  {alertMessage.text}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setAlertMessage(null)}
                style={{ 
                  padding: '10px 24px', 
                  borderRadius: '10px', 
                  border: 'none', 
                  background: alertMessage.type === 'error' ? '#ef4444' : (alertMessage.type === 'warning' ? '#d97706' : '#16a34a'), 
                  color: 'white', 
                  fontWeight: '600', 
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = alertMessage.type === 'error' ? '#dc2626' : (alertMessage.type === 'warning' ? '#b45309' : '#15803d')}
                onMouseOut={(e) => e.currentTarget.style.background = alertMessage.type === 'error' ? '#ef4444' : (alertMessage.type === 'warning' ? '#d97706' : '#16a34a')}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {resolvingDuplicate && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100000, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '24px', width: '95%', maxWidth: '1100px', display: 'flex', flexDirection: 'column', gap: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <h2 style={{ margin: 0, color: '#0f172a' }}>Comparar Boleta Duplicada - {resolvingDuplicate.employeeName}</h2>
            <div style={{ display: 'flex', gap: '24px', height: '65vh' }}>
              <div style={{ flex: 1, border: '2px solid #e2e8f0', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 color="#64748b" /> Boleta Actual en Sistema</h3>
                  <p style={{ margin: '8px 0 0 0', fontWeight: '600', color: '#475569', fontSize: '1.1rem' }}>Monto Neto: {formatAmount(resolvingDuplicate.existingAmount)}</p>
                </div>
                <iframe src={`${getStaticBaseUrl()}/payslips/${resolvingDuplicate.dni}_${currentMonth}_${currentYear}.pdf`} style={{ flex: 1, width: '100%', border: 'none', borderRadius: '8px', backgroundColor: '#f1f5f9' }} title="Boleta Actual" />
                <button onClick={() => handleResolveDuplicate(resolvingDuplicate.existingId, resolvingDuplicate.tempFileName, resolvingDuplicate.newAmount, 'keep')} style={{ padding: '14px', background: '#64748b', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: 'background 0.2s' }}>Mantener Actual</button>
              </div>
              <div style={{ flex: 1, border: '2px solid #3b82f6', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#eff6ff' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle color="#3b82f6" /> Boleta Nueva (Por Subir)</h3>
                  <p style={{ margin: '8px 0 0 0', fontWeight: '600', color: '#1e3a8a', fontSize: '1.1rem' }}>Monto Neto: {formatAmount(resolvingDuplicate.newAmount)}</p>
                </div>
                <iframe src={`${getStaticBaseUrl()}/payslips/${resolvingDuplicate.tempFileName}`} style={{ flex: 1, width: '100%', border: 'none', borderRadius: '8px', backgroundColor: 'white' }} title="Boleta Nueva" />
                <button onClick={() => handleResolveDuplicate(resolvingDuplicate.existingId, resolvingDuplicate.tempFileName, resolvingDuplicate.newAmount, 'replace')} style={{ padding: '14px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)', transition: 'background 0.2s' }}>Reemplazar con Nueva</button>
              </div>
            </div>
            <button onClick={() => setResolvingDuplicate(null)} style={{ alignSelf: 'flex-end', padding: '10px 24px', background: 'transparent', border: '2px solid #cbd5e1', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', color: '#475569' }}>Cancelar</button>
          </div>
        </div>
      , document.body)}
      {/* Floating Action Bar for Selected Items */}
      {selectedIds.length > 0 && (
        <div style={{
          position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
          background: '#0f172a', padding: '12px 24px', borderRadius: '100px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2), 0 10px 10px -5px rgba(0,0,0,0.1)',
          display: 'flex', alignItems: 'center', gap: '20px', zIndex: 100,
          border: '1px solid #334155', backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: '#3b82f6', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' }}>
              {selectedIds.length}
            </span>
            <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>seleccionados</span>
          </div>
          <div style={{ width: '1px', height: '24px', background: '#334155' }}></div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={handleSendSelected}
              disabled={sending}
              style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
              onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} 
              Enviar Selección
            </button>
            <button 
              onClick={() => setSelectedIds([])}
              style={{ background: 'transparent', color: '#94a3b8', border: '1px solid #475569', padding: '8px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'white'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#475569'; }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default BoletasDePago;
