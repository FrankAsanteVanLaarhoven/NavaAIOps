import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import OpenAI from 'openai';

/**
 * Voice Notes API
 * Handles async voice note recording, transcription, and storage
 */
export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 500 }
    );
  }
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const threadId = formData.get('threadId') as string;
    const userId = formData.get('userId') as string;
    const channelId = formData.get('channelId') as string;

    if (!audioFile || !threadId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: audio, threadId, userId' },
        { status: 400 }
      );
    }

    // Convert File to buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a File-like object for OpenAI Whisper
    const whisperFile = new File([buffer], audioFile.name, { type: audioFile.type });

    // Transcribe with OpenAI Whisper (async)
    const transcription = await openai.audio.transcriptions.create({
      file: whisperFile,
      model: 'whisper-1',
      language: 'en',
      response_format: 'verbose_json',
    });

    // Store voice note in database
    const voiceNote = await db.message.create({
      data: {
        threadId,
        userId,
        content: JSON.stringify({
          type: 'voice_note',
          text: transcription.text,
          segments: transcription.segments || [],
          language: transcription.language,
          duration: transcription.duration,
          audioUrl: null, // In production, upload to blob storage
        }),
        type: 'voice_note',
        metadata: {
          audioSize: audioFile.size,
          audioType: audioFile.type,
          transcribedAt: new Date().toISOString(),
        },
      },
    });

    // Broadcast via WebSocket
    const { getIO } = await import('@/lib/websocket-server');
    const io = getIO();
    io.to(`thread:${threadId}`).emit('voice-note-received', {
      threadId,
      message: voiceNote,
      transcription: transcription.text,
    });

    return NextResponse.json({
      success: true,
      messageId: voiceNote.id,
      transcription: transcription.text,
      segments: transcription.segments,
      language: transcription.language,
      duration: transcription.duration,
    });
  } catch (error: any) {
    console.error('Voice note transcription error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process voice note' },
      { status: 500 }
    );
  }
}

/**
 * Get voice notes for a thread
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get('threadId');

    if (!threadId) {
      return NextResponse.json(
        { error: 'threadId is required' },
        { status: 400 }
      );
    }

    const voiceNotes = await db.message.findMany({
      where: {
        threadId,
        type: 'voice_note',
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(voiceNotes);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch voice notes' },
      { status: 500 }
    );
  }
}
