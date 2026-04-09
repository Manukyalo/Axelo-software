import React, { useState, useRef } from 'react';
import { 
  Upload, 
  X, 
  Check, 
  AlertCircle, 
  FileText, 
  ChevronRight,
  Database,
  Table as TableIcon,
  ArrowRight,
  Sparkles,
  Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import Anthropic from '@anthropic-ai/sdk';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { validateString, validateEmail, validateNumber } from '../../utils/validation';
import toast from 'react-hot-toast';

const EXPECTED_FIELDS = [
  { key: 'clientName', label: 'Client Name*', required: true },
  { key: 'clientEmail', label: 'Client Email*', required: true },
  { key: 'date', label: 'Trip Date*', required: true },
  { key: 'packageName', label: 'Tour Package', required: false },
  { key: 'adults', label: 'Adults', required: false, default: 1 },
  { key: 'children', label: 'Children', required: false, default: 0 },
  { key: 'destinations', label: 'Destinations', required: false },
  { key: 'durationText', label: 'Duration', required: false },
  { key: 'totalAmount', label: 'Total Amount', required: false, default: 0 },
  { key: 'paidAmount', label: 'Paid Amount', required: false, default: 0 },
];

export const ImportModal = ({ isOpen, onClose }) => {
  const { state, dispatch } = useData();
  const { user } = useAuth();
  const [step, setStep] = useState('upload'); // upload, mapping, preview
  const [fileData, setFileData] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [parsedBookings, setParsedBookings] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const fileInputRef = useRef(null);

  const reset = () => {
    setStep('upload');
    setFileData(null);
    setHeaders([]);
    setMapping({});
    setParsedBookings([]);
    setExtractedText('');
    setIsProcessing(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const arrayBuffer = evt.target.result;
        try {
          const result = await mammoth.extractRawText({ arrayBuffer });
          const text = result.value;
          setExtractedText(text);
          setStep('ai_processing');
          await handleSmartExtract(text);
        } catch (err) {
          toast.error('Failed to read Word document. Ensure it is a valid .docx file.');
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      if (data.length < 2) {
        toast.error('The file appears to be empty or missing headers.');
        return;
      }

      const fileHeaders = data[0];
      const fileRows = data.slice(1);

      setHeaders(fileHeaders);
      setFileData(fileRows);
      
      // Auto-mapping logic
      const initialMapping = {};
      EXPECTED_FIELDS.forEach(field => {
        const match = fileHeaders.find(h => 
          h.toLowerCase().includes(field.key.toLowerCase()) || 
          field.label.toLowerCase().includes(h.toLowerCase())
        );
        if (match) initialMapping[field.key] = match;
      });

      setMapping(initialMapping);
      setStep('mapping');
    };
    reader.readAsBinaryString(file);
  };

  const handleSmartExtract = async (text) => {
    setIsProcessing(true);
    try {
      const anthropic = new Anthropic({
        apiKey: import.meta.env.VITE_CLAUDE_API_KEY,
        dangerouslyAllowBrowser: true
      });

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 4000,
        messages: [{
          role: "user",
          content: `You are a Safari Operations Data Assistant. Extract safari bookings from the following text and return them as a valid JSON array of objects.
          
          Guidelines:
          1. Only return the JSON array. No preamble or explanation.
          2. Fields to extract:
             - clientName (string)
             - clientEmail (string)
             - date (string, format YYYY-MM-DD)
             - packageName (string)
             - adults (number)
             - children (number)
             - destinations (string, comma separated parks)
             - durationText (string, e.g. "7 Days")
             - totalAmount (number)
             - paidAmount (number)
          3. If information is missing, use null or empty string.
          4. Clean the names and emails.
          
          TEXT TO PARSE:
          ${text}`
        }]
      });

      const content = response.content[0].text;
      const jsonStart = content.indexOf('[');
      const jsonEnd = content.lastIndexOf(']') + 1;
      const jsonStr = content.substring(jsonStart, jsonEnd);
      
      const results = JSON.parse(jsonStr);
      setParsedBookings(results);
      setStep('preview');
      toast.success(`AI identified ${results.length} bookings!`, { icon: '✨' });
    } catch (err) {
      console.error('AI Extraction Error:', err);
      toast.error('AI failed to parse the document. Please use Excel/CSV for strict formatting.');
      reset();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMappingChange = (fieldKey, headerValue) => {
    setMapping(prev => ({ ...prev, [fieldKey]: headerValue }));
  };

  const proceedToPreview = () => {
    const missingRequired = EXPECTED_FIELDS.filter(f => f.required && !mapping[f.key]);
    if (missingRequired.length > 0) {
      toast.error(`Please map required fields: ${missingRequired.map(f => f.label).join(', ')}`);
      return;
    }

    const preview = fileData.map((row, index) => {
      const item = {};
      EXPECTED_FIELDS.forEach(field => {
        const headerIndex = headers.indexOf(mapping[field.key]);
        let val = headerIndex !== -1 ? row[headerIndex] : (field.default || '');
        
        // Handle Excel numeric dates
        if (field.key === 'date' && typeof val === 'number') {
           const date = XLSX.SSF.parse_date_code(val);
           val = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
        }

        item[field.key] = val;
      });
      return { ...item, importIndex: index };
    });

    setParsedBookings(preview);
    setStep('preview');
  };

  const handleImport = async () => {
    setIsProcessing(true);
    try {
      const validBookings = [];
      const duplicates = [];
      const errors = [];

      parsedBookings.forEach(booking => {
        try {
          // 1. Basic Validation
          const clientName = validateString(booking.clientName, 150, 'Client Name');
          const clientEmail = validateEmail(booking.clientEmail);
          const date = validateString(booking.date, 30, 'Date');
          const totalAmount = validateNumber(booking.totalAmount, 0, 'Total Amount', false);
          const paidAmount = validateNumber(booking.paidAmount, 0, 'Paid Amount', false);
          const adults = validateNumber(booking.adults, 1, 'Adults', false);
          const children = validateNumber(booking.children, 0, 'Children', false);

          // 2. Conflict Check (Name + Date)
          const isDuplicate = state.bookings.some(b => 
            b.clientName.toLowerCase().trim() === clientName.toLowerCase().trim() && 
            b.date === date
          );

          if (isDuplicate) {
            duplicates.push(booking);
            return;
          }

          // 3. Prepare for state
          let paymentStatus = 'Unpaid';
          if (paidAmount >= totalAmount && totalAmount > 0) paymentStatus = 'Fully Paid';
          else if (paidAmount > 0) paymentStatus = 'Partially Paid';

          validBookings.push({
            clientName,
            clientEmail,
            date,
            totalAmount,
            paidAmount,
            type: 'Safari',
            status: 'Pending',
            paymentStatus,
            pax: { adults, children, infants: 0 },
            packageName: booking.packageName || 'Custom Safari',
            destinations: booking.destinations || '',
            durationText: booking.durationText || '',
            createdById: user?.username || 'system_import',
            paymentLog: paidAmount > 0 ? [{
              amount: paidAmount,
              method: 'Bulk Import',
              date: new Date().toISOString(),
              recordedBy: 'System'
            }] : []
          });
        } catch (err) {
          errors.push({ booking, error: err.message });
        }
      });

      if (validBookings.length > 0) {
        await dispatch({ type: 'BATCH_ADD_BOOKINGS', payload: validBookings });
        toast.success(`Successfully imported ${validBookings.length} bookings!`, { duration: 5000 });
      }

      if (duplicates.length > 0) {
        toast.error(`Skipped ${duplicates.length} duplicate bookings.`, { icon: '⚠️' });
      }

      if (errors.length > 0) {
        toast.error(`${errors.length} bookings failed validation and were skipped.`);
        console.error('Import Errors:', errors);
      }

      reset();
      onClose();
    } catch (err) {
      toast.error('Import failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Booking Migration" maxWidth="max-w-4xl">
      <div className="space-y-6">
        {/* Progress Header */}
        <div className="flex items-center justify-between px-8 py-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
           <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-safari-gold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${step === 'upload' ? 'border-safari-gold' : 'border-gray-200'}`}>1</div>
              <span className="text-sm font-bold">Upload</span>
           </div>
           <ChevronRight size={20} className="text-gray-200" />
           <div className={`flex items-center gap-2 ${step === 'mapping' ? 'text-safari-gold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${step === 'mapping' ? 'border-safari-gold' : 'border-gray-200'}`}>2</div>
              <span className="text-sm font-bold">Map Pillars</span>
           </div>
           <ChevronRight size={20} className="text-gray-200" />
           <div className={`flex items-center gap-2 ${step === 'preview' ? 'text-safari-gold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${step === 'preview' ? 'border-safari-gold' : 'border-gray-200'}`}>3</div>
              <span className="text-sm font-bold">Review</span>
           </div>
        </div>

        {step === 'upload' && (
          <div 
            onClick={() => fileInputRef.current.click()}
            className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-3xl p-16 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-safari-gold/50 hover:bg-safari-gold/5 transition-all group"
          >
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv,.xlsx,.xls,.doc,.docx" className="hidden" />
            <div className="w-20 h-20 bg-safari-gold/10 text-safari-gold rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload size={32} />
            </div>
            <div className="text-center">
              <h4 className="font-playfair font-bold text-xl mb-1">Upload Booking Manifest</h4>
              <p className="text-sm text-gray-400">Drag and drop your Excel, CSV or Word manifest here</p>
            </div>
          </div>
        )}

        {step === 'ai_processing' && (
          <div className="flex flex-col items-center justify-center py-20 gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-safari-gold/20 rounded-full blur-2xl animate-pulse" />
              <div className="relative w-20 h-20 bg-white dark:bg-dark-card rounded-full shadow-xl flex items-center justify-center text-safari-gold border border-safari-gold/20">
                <Loader2 size={40} className="animate-spin" />
              </div>
            </div>
            <div className="text-center">
              <h4 className="font-playfair font-bold text-2xl mb-2 flex items-center gap-2 justify-center">
                <Sparkles size={24} className="text-safari-gold" /> AI Smart Extraction
              </h4>
              <p className="text-gray-400 max-w-xs mx-auto">
                Claude is analyzing your document to identify passengers, itineraries, and dates...
              </p>
            </div>
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-4">
            <div className="p-4 bg-safari-gold/10 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-safari-gold shrink-0" size={20} />
              <p className="text-sm text-safari-primary dark:text-gray-300">
                Ensure the file columns match the system data points correctly. <strong>Required fields are marked with (*).</strong>
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {EXPECTED_FIELDS.map(field => (
                <div key={field.key} className="p-4 rounded-2xl border border-gray-100 dark:border-white/5 bg-white dark:bg-white/[0.02]">
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                    {field.label}
                  </label>
                  <select 
                    value={mapping[field.key] || ''}
                    onChange={(e) => handleMappingChange(field.key, e.target.value)}
                    className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-safari-gold/20"
                  >
                    <option value="">-- Ignore / No Match --</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-100 dark:border-white/10">
              <Button variant="ghost" onClick={reset}>Clear & Restart</Button>
              <Button onClick={proceedToPreview} className="gap-2">
                Analyze Data <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-lg">Data Evaluation</h4>
                <p className="text-sm text-gray-400">Found {parsedBookings.length} bookings ready for synchronization.</p>
              </div>
              <Badge variant="gold" className="px-4 py-1.5">{parsedBookings.length} Potential Imports</Badge>
            </div>

            <div className="max-h-[400px] overflow-auto rounded-2xl border border-gray-100 dark:border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-gray-50 dark:bg-dark-surface font-bold">
                  <tr>
                    <th className="p-3">Client</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Package</th>
                    <th className="p-3">PAX</th>
                    <th className="p-3">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                  {parsedBookings.map((b, i) => (
                    <tr key={i} className="hover:bg-safari-gold/5">
                      <td className="p-3">
                        <div className="font-bold">{b.clientName}</div>
                        <div className="text-[10px] text-gray-400">{b.clientEmail}</div>
                      </td>
                      <td className="p-3 font-jetbrains">{b.date}</td>
                      <td className="p-3 truncate max-w-[150px]">{b.packageName}</td>
                      <td className="p-3">{b.adults}A, {b.children}C</td>
                      <td className="p-3 font-bold text-safari-gold">${b.totalAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-100 dark:border-white/10">
              <Button variant="ghost" onClick={() => setStep('mapping')}>Back to Mapping</Button>
              <Button onClick={handleImport} isLoading={isProcessing} className="gap-2">
                 Commit Bulk Upload <Check size={18} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
