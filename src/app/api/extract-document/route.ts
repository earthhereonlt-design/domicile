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

    const prompt = `You are a professional document processing system. Analyze the uploaded document image (which is a certificate, typically a General Domicile Certificate or Residence Certificate issued in India).
Extract the details from it and return a structured JSON response matching the provided schema.
For fields:
- "name": Extract the candidate's full name (extract the English name if bilingual, e.g., Himanshu Kumar from Himanshu Kumar / हिमांशु कुमार).
- "fatherName": Extract the father's name.
- "motherName": Extract the mother's name (if present).
- "dateOfBirth": Extract the date of birth (usually formatted as DD/MM/YYYY). If not present or if it contains a typo/address text instead of a date, return null.
- "houseNo": Extract the house/building number (if not found or is '00', return '00').
- "streetLocality": Extract the street, post, or locality.
- "village": Extract the village, town, or city.
- "thana": Extract the police station/thana (e.g. पलिया कलां).
- "tehsil": Extract the Tehsil (e.g. पलिया).
- "district": Extract the District (e.g. खीरी).
- "state": Extract the State (e.g. उत्तर प्रदेश).
- "pinCode": Extract the 6-digit PIN code (if present).

For each extracted field, assign a confidence score between 0.0 (not found/uncertain) and 1.0 (highly confident/clear text).
CRITICAL RULES:
1. Never fabricate or guess missing information. If a field is not present in the document, set its value to null and its confidence score to 0.0.
2. If the text is illegible, set its value to null.`;

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
