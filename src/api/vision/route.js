import { NextApiRequest, NextApiResponse } from 'next';
import { NextResponse } from 'next/server';
import { VisionClient } from '@google-cloud/vision';
import formidable from 'formidable';
import fs from 'fs';

const visionClient = new VisionClient();

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req, res) {
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing form data:', err);
      return res.status(500).json({ error: 'Failed to parse form data' });
    }

    const file = files.file ? files.file[0] : null;
    if (!file) {
      console.error('No file received');
      return res.status(400).json({ error: 'No file received' });
    }

    const filePath = file.filepath;
    console.log('Received file path:', filePath);

    try {
      const [result] = await visionClient.labelDetection(filePath);
      const labels = result.labelAnnotations;
      const item = labels.length > 0 ? labels[0].description : 'Unknown';

      // Log detected item
      console.log('Detected item:', item);

      return res.status(200).json({ item });
    } catch (error) {
      console.error('Error with Vision API:', error);
      return res.status(500).json({ error: 'Failed to process image' });
    }
  });
}

// Method not allowed handler for non-POST requests
export default function handler(req, res) {
  if (req.method === 'POST') {
    return POST(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
