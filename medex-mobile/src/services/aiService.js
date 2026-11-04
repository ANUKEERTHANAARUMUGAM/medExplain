import { storageService } from './storageService';
import { Platform } from 'react-native';

const REPORT_SYSTEM_PROMPT = `
You are MedExplain, an expert AI medical lab report interpreter.
Analyze the provided medical laboratory or diagnostic report text and output a strictly valid JSON object.
Explain the results in clear, compassionate language accessible to a patient, providing both English and Tamil (தமிழ்) fields.

Schema:
{
  "title": "Short title of report e.g. Complete Blood Count (CBC)",
  "summary_en": "Patient-friendly summary in English",
  "summary_ta": "Patient-friendly summary in Tamil (தமிழ்)",
  "urgency": "LOW" | "MODERATE" | "ATTENTION_NEEDED" | "CRITICAL",
  "urgency_ta": "குறைவு" | "மிதமான கவனம்" | "கவனம் தேவை" | "அவசர கவனம்",
  "urgency_reason": "Reason for urgency level",
  "metrics": [
    {
      "name": "Test name e.g. Hemoglobin",
      "value": "11.2",
      "unit": "g/dL",
      "range": "13.0 - 17.0 g/dL",
      "status": "NORMAL" | "HIGH" | "LOW" | "CRITICAL",
      "explanation_en": "Simple English explanation of what this test measures and what this value means",
      "explanation_ta": "Simple Tamil explanation (தமிழ்)"
    }
  ],
  "abnormal_findings": [
    {
      "finding_en": "Description in English",
      "finding_ta": "விளக்கம் தமிழில்"
    }
  ],
  "terms": [
    {
      "term": "Medical term",
      "tamil_term": "தமிழில் சொல்",
      "transliteration": "Tamil phonetic transliteration in English letters",
      "definition_en": "Simple definition in English",
      "definition_ta": "எளிய தமிழ் விளக்கம்"
    }
  ],
  "significance_en": "What these findings mean overall for health in English",
  "significance_ta": "இந்த முடிவுகள் ஆரோக்கியத்திற்கு என்ன பொருளைத் தருகின்றன தமிழில்",
  "recommendations_en": ["Actionable lifestyle/diet suggestion 1", "Suggestion 2"],
  "recommendations_ta": ["பரிந்துரை 1", "பரிந்துரை 2"],
  "doctor_questions_en": ["Specific question to ask the doctor 1", "Question 2"],
  "doctor_questions_ta": ["மருத்துவரிடம் கேட்க வேண்டிய கேள்வி 1", "கேள்வி 2"]
}

Return ONLY valid JSON.
`;

const PRESCRIPTION_SYSTEM_PROMPT = `
You are an expert clinical pharmacologist and prescription transcription AI.
Extract all doctor details, clinic details, date, prescribed medicines, dosages, frequencies, and doctor check-up instructions from the medical prescription text.

Return strictly valid JSON:
{
  "doctorName": "Doctor's name if identified e.g. Dr. K. Rajesh, M.D.",
  "clinicOrHospital": "Clinic or hospital name e.g. City Health Clinic",
  "prescriptionDate": "YYYY-MM-DD or today",
  "patientName": "Patient name or null",
  "medicines": [
    {
      "name": "Medicine name with strength e.g. Amoxicillin 500mg",
      "dosage": "1 capsule / 1 tablet",
      "frequencyNotation": "1-0-1 or BD or TDS",
      "timings": {
        "breakfast": true,
        "lunch": false,
        "dinner": true
      },
      "foodTiming": "before_food" | "after_food" | "with_food",
      "durationDays": 5,
      "specialInstructions": "Special intake direction e.g. With plenty of water"
    }
  ],
  "doctorCheckup": {
    "mentioned": true,
    "followUpInDays": 5,
    "suggestedDate": "YYYY-MM-DD",
    "instructions": "Follow up instructions"
  }
}

Return ONLY valid JSON.
`;

export const aiService = {
  async explainReportFile(file, preferredLanguage = 'both') {
    const preferences = await storageService.getUserPreferences();
    if (!preferences.allowCloudAI) {
      throw new Error('Cloud AI processing is turned off. You can still view the built-in sample reports.');
    }
    const settings = await storageService.getSettings();
    const backendUrl = Platform.OS === 'web'
      ? (settings.backendUrl && settings.backendUrl !== 'http://10.0.2.2:3000' ? settings.backendUrl : 'http://localhost:3000')
      : (settings.backendUrl || 'http://10.0.2.2:3000');
    const formData = new FormData();
    if (Platform.OS === 'web' && file.file) {
      formData.append('report', file.file, file.name || 'lab-report.pdf');
    } else {
      formData.append('report', {
        uri: file.uri,
        name: file.name || 'lab-report.pdf',
        type: file.mimeType || 'application/pdf'
      });
    }
    formData.append('language', preferredLanguage);
    const response = await fetch(`${backendUrl}/api/v1/reports/explain`, { method: 'POST', body: formData });
    const result = await response.json();
    if (!response.ok || !result.success || !result.data) {
      throw new Error(result.error?.message || 'Report analysis failed. Check the MedEx API and AI provider settings.');
    }
    const data = result.data;
    const biling = value => value || {};
    const urgency = ({ routine: 'LOW', prompt_medical_review: 'MODERATE', urgent: 'CRITICAL', undetermined: 'MODERATE' })[data.urgency?.level] || 'MODERATE';
    return {
      id: `rep-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      title: file.name || 'Medical Lab Report',
      aiTransparency: {
        kind: 'ai',
        source: 'Uploaded PDF',
        provider: result.provider || 'Configured MedEx provider',
        model: result.model || null,
        remoteProcessing: true,
        createdAt: new Date().toISOString()
      },
      urgency,
      urgency_reason: data.urgency?.reason?.en || '',
      summary_en: biling(data.report_summary).en || '',
      summary_ta: biling(data.report_summary).ta || '',
      metrics: (data.test_results || []).map(item => ({
        name: item.test_name,
        value: item.value,
        unit: item.unit,
        range: item.reference_range,
        status: ({ normal: 'NORMAL', low: 'LOW', high: 'HIGH', critical: 'CRITICAL', not_provided: 'NOT PROVIDED', uncertain: 'UNCERTAIN' })[item.status] || 'UNCERTAIN',
        explanation_en: item.explanation?.en || '',
        explanation_ta: item.explanation?.ta || ''
      })),
      abnormal_findings: (data.abnormal_findings || []).map(item => ({ finding_en: item.explanation?.en || item.finding, finding_ta: item.explanation?.ta || '' })),
      terms: (data.medical_terms || []).map(item => ({ term: item.term, definition_en: item.meaning?.en || '', definition_ta: item.meaning?.ta || '' })),
      significance_en: (data.possible_significance || []).map(item => item.en).filter(Boolean).join(' '),
      significance_ta: (data.possible_significance || []).map(item => item.ta).filter(Boolean).join(' '),
      recommendations_en: (data.recommended_follow_up || []).map(item => item.en),
      recommendations_ta: (data.recommended_follow_up || []).map(item => item.ta),
      doctor_questions_en: (data.doctor_questions || []).map(item => item.en),
      doctor_questions_ta: (data.doctor_questions || []).map(item => item.ta),
      limitations_en: data.limitations?.en || '',
      limitations_ta: data.limitations?.ta || ''
    };
  },
  /**
   * Explain a Medical Lab Report
   */
  async explainReport(reportText, preferredLanguage = 'both') {
    const preferences = await storageService.getUserPreferences();
    if (!preferences.allowCloudAI) {
      throw new Error('Cloud AI processing is turned off. You can still view the built-in sample reports.');
    }
    const settings = await storageService.getSettings();
    const apiKey = settings.groqApiKey;

    if (!apiKey) {
      throw new Error('Add a Groq API key in Settings to analyze pasted report text, or choose a built-in sample.');
    }

    let dataSentToAI = false;
    try {
      dataSentToAI = true;
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: settings.groqModel || 'openai/gpt-oss-20b',
          messages: [
            { role: 'system', content: REPORT_SYSTEM_PROMPT },
            { 
              role: 'user', 
              content: `Please analyze this medical lab report text and explain it in detail for the patient (Language preference: ${preferredLanguage}):\n\n${reportText}` 
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Groq API error:', response.status, errText);
        throw new Error(`Groq API responded with status ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Empty AI response');

      const parsed = JSON.parse(content);
      parsed.id = 'rep-' + Date.now();
      parsed.date = new Date().toISOString().split('T')[0];
      parsed.aiTransparency = {
        kind: 'ai',
        source: 'Pasted report text',
        provider: 'Groq',
        model: settings.groqModel || 'openai/gpt-oss-20b',
        remoteProcessing: true,
        createdAt: new Date().toISOString()
      };
      return parsed;
    } catch (error) {
      console.warn('AI analysis failed:', error.message);
      if (!dataSentToAI) throw error;
      throw new Error(`No AI explanation was generated. ${error.message}`);
    }
  },

  /**
   * Parse a Prescription Document into Structured Doses
   */
  async parsePrescription(prescriptionText) {
    const preferences = await storageService.getUserPreferences();
    if (!preferences.allowCloudAI) {
      throw new Error('Cloud AI processing is turned off. Enable it in Privacy & AI settings to parse a prescription.');
    }
    const settings = await storageService.getSettings();
    const apiKey = settings.groqApiKey;

    if (!apiKey || !prescriptionText || prescriptionText.trim().length === 0) {
      throw new Error('Prescription text is empty or no Groq API key is configured.');
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: settings.groqModel || 'openai/gpt-oss-20b',
          messages: [
            { role: 'system', content: PRESCRIPTION_SYSTEM_PROMPT },
            { 
              role: 'user', 
              content: `Extract medicines, dosages, meal relations, frequencies, and follow-up from this prescription text:\n\n${prescriptionText}` 
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`Groq Prescription API failed with status ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      const parsed = JSON.parse(content);

      return {
        id: 'rx-' + Date.now(),
        ...parsed,
        medicines: (parsed.medicines || []).map((m, idx) => ({
          id: `med-${Date.now()}-${idx}`,
          ...m
        }))
      };
    } catch (error) {
      console.warn('Prescription parsing failed:', error.message);
      throw new Error(`No prescription was parsed. ${error.message}`);
    }
  }
};
