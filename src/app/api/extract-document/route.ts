import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Initialize the Google Gen AI SDK
// It will look for process.env.GEMINI_API_KEY automatically or we can pass it
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

// JSON Schema for Gemini response
const extractionSchema = {
  type: "OBJECT",
  properties: {
    name: { type: "STRING" },
    fatherName: { type: "STRING" },
    motherName: { type: "STRING" },
    dateOfBirth: { type: "STRING" },
    houseNo: { type: "STRING" },
    streetLocality: { type: "STRING" },
    village: { type: "STRING" },
    thana: { type: "STRING" },
    tehsil: { type: "STRING" },
    district: { type: "STRING" },
    state: { type: "STRING" },
    pinCode: { type: "STRING" },
    confidence: {
      type: "OBJECT",
      properties: {
        name: { type: "NUMBER" },
        fatherName: { type: "NUMBER" },
        motherName: { type: "NUMBER" },
        dateOfBirth: { type: "NUMBER" },
        houseNo: { type: "NUMBER" },
        streetLocality: { type: "NUMBER" },
        village: { type: "NUMBER" },
        thana: { type: "NUMBER" },
        tehsil: { type: "NUMBER" },
        district: { type: "NUMBER" },
        state: { type: "NUMBER" },
        pinCode: { type: "NUMBER" },
      },
      required: [
        "name",
        "fatherName",
        "motherName",
        "dateOfBirth",
        "houseNo",
        "streetLocality",
        "village",
        "thana",
        "tehsil",
        "district",
        "state",
        "pinCode",
      ],
    },
  },
  required: [
    "name",
    "fatherName",
    "motherName",
    "dateOfBirth",
    "houseNo",
    "streetLocality",
    "village",
    "thana",
    "tehsil",
    "district",
    "state",
    "pinCode",
    "confidence",
  ],
};

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured on the server. Please add GEMINI_API_KEY to your .env.local file.' },
        { status: 500 }
      );
    }

    // Parse base64 from data URI
    const match = image.match(/^data:([^;]+);base64,(.+)$/);
    let mimeType = 'image/jpeg';
    let base64Data = image;

    if (match) {
      mimeType = match[1];
      base64Data = match[2];
    }

    const prompt = `You are a professional document processing system. Analyze the uploaded image of an Indian government certificate (typically a General Domicile / Residence Certificate).

Extract the following fields and return them as structured JSON. For EVERY field:
- If the field is CLEARLY VISIBLE and READABLE in the document, extract it exactly as written.
- If the field is NOT PRESENT, NOT VISIBLE, ILLEGIBLE, or UNCLEAR, return an EMPTY STRING "" for that field and set its confidence score to 0.0.
- NEVER fabricate, guess, or invent any data.
- NEVER use placeholder text — only return what is actually printed on the document.

Fields to extract:
- "name": Full name of the applicant (prefer English if bilingual, e.g. "Himanshu Kumar").
- "fatherName": Father's full name.
- "motherName": Mother's full name (if present, else "").
- "dateOfBirth": Date of birth in DD/MM/YYYY format (if present, else "").
- "houseNo": House or building number (if not found or shown as '00', return "00").
- "streetLocality": Street, post, or locality description (if not found, return "").
- "village": Village, town, or city name.
- "thana": Police station / Thana name.
- "tehsil": Tehsil name.
- "district": District name.
- "state": State name.
- "pinCode": 6-digit PIN code (if present, else "").

For each field, also provide a confidence score from 0.0 (not found / uncertain) to 1.0 (clearly readable).`;


    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: extractionSchema,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      return NextResponse.json({ error: 'Failed to get text response from Gemini' }, { status: 500 });
    }

    const data = JSON.parse(responseText);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Extraction error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to extract document information' },
      { status: 500 }
    );
  }
}
