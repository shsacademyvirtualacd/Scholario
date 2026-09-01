import { supabase } from './supabase';

export interface AudioRecordingResult {
  blob: Blob;
  durationSeconds: number;
  mimeType: string;
  extension: string;
}

/**
 * Checks whether the current browser supports audio recording via MediaRecorder and getUserMedia.
 */
export function isVoiceRecordingSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function' &&
    typeof window.MediaRecorder === 'function'
  );
}

/**
 * Detects the best supported audio mime-type and extension for the current browser.
 */
export function getSupportedAudioMimeType(): { mimeType: string; extension: string } {
  if (typeof window === 'undefined' || typeof window.MediaRecorder === 'undefined') {
    return { mimeType: 'audio/webm', extension: 'webm' };
  }

  const candidateTypes = [
    { mimeType: 'audio/webm;codecs=opus', extension: 'webm' },
    { mimeType: 'audio/webm', extension: 'webm' },
    { mimeType: 'audio/mp4;codecs=mp4a.40.2', extension: 'mp4' },
    { mimeType: 'audio/mp4', extension: 'mp4' },
    { mimeType: 'audio/ogg;codecs=opus', extension: 'ogg' },
    { mimeType: 'audio/wav', extension: 'wav' },
  ];

  for (const candidate of candidateTypes) {
    try {
      if (window.MediaRecorder.isTypeSupported(candidate.mimeType)) {
        return candidate;
      }
    } catch {
      // Continue to next candidate
    }
  }

  return { mimeType: 'audio/webm', extension: 'webm' };
}

/**
 * Formats seconds into M:SS display (e.g. 0:05, 1:23).
 */
export function formatAudioDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Uploads a recorded audio blob to Supabase Storage ('voice-messages' bucket) organized by threadId.
 * Falls back to the backend API endpoint if client direct upload encounters an error.
 */
export async function uploadVoiceMessageAudio(
  blob: Blob,
  threadId: string,
  mimeType: string,
  extension: string
): Promise<{ audioUrl: string; durationSeconds: number }> {
  if (!blob || blob.size === 0) {
    throw new Error('Recorded voice note is empty or invalid.');
  }

  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const fileName = `${timestamp}_${randomSuffix}.${extension}`;
  const filePath = `${threadId}/${fileName}`;

  // 1. Try direct Supabase storage upload
  try {
    const { data, error } = await supabase.storage
      .from('voice-messages')
      .upload(filePath, blob, {
        contentType: mimeType,
        cacheControl: '31536000',
        upsert: false,
      });

    if (!error && data) {
      const { data: publicUrlData } = supabase.storage
        .from('voice-messages')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        return {
          audioUrl: publicUrlData.publicUrl,
          durationSeconds: 0, // Duration will be calculated by caller
        };
      }
    } else if (error) {
      console.warn('[voiceRecordingService] Direct Supabase storage upload warning:', error);
    }
  } catch (directErr) {
    console.warn('[voiceRecordingService] Direct Supabase storage upload exception:', directErr);
  }

  // 2. Fallback to server endpoint
  try {
    const formData = new FormData();
    const file = new File([blob], fileName, { type: mimeType });
    formData.append('file', file);
    formData.append('thread_id', threadId);

    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const res = await fetch('/api/chat/voice/upload', {
      method: 'POST',
      headers,
      body: formData,
    });

    if (res.ok) {
      const json: any = await res.json();
      if (json.audio_url || json.url) {
        return {
          audioUrl: json.audio_url || json.url,
          durationSeconds: 0,
        };
      }
    }
  } catch (serverErr) {
    console.warn('[voiceRecordingService] Server upload fallback error:', serverErr);
  }

  // 3. Fallback: Local object URL or base64 data URL if offline/sandboxed
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve({
          audioUrl: reader.result,
          durationSeconds: 0,
        });
      } else {
        reject(new Error('Failed to encode voice message.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read voice message data.'));
    reader.readAsDataURL(blob);
  });
}
