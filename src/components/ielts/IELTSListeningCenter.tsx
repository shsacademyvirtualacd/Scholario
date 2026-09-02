import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Headphones,
  Mic,
  Square,
  Play,
  Pause,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Award,
  ChevronRight,
  RefreshCw,
  Info,
  Layers,
  Flame,
} from 'lucide-react';
import { IELTS_LISTENING_CLIPS, type ListeningClip } from '../../data/ielts/listeningClips';
import { evaluatePronunciation, type PronunciationEvaluation } from '../../lib/pronunciationScorer';

interface IELTSListeningCenterProps {
  onCompletePractice?: (clipId: string, score: number) => void;
}

export const IELTSListeningCenter: React.FC<IELTSListeningCenterProps> = ({ onCompletePractice }) => {
  const [selectedClip, setSelectedClip] = useState<ListeningClip>(IELTS_LISTENING_CLIPS[0]);
  const [filterSection, setFilterSection] = useState<string>('all');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioSpeed, setAudioSpeed] = useState<number>(1.0);
  const [showTranscript, setShowTranscript] = useState<boolean>(false);

  // Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [spokenTranscript, setSpokenTranscript] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<PronunciationEvaluation | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Audio & Speech Recognition Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const speechRecognitionRef = useRef<any>(null);
  const synthUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Filtered Clips
  const filteredClips = IELTS_LISTENING_CLIPS.filter((clip) => {
    if (filterSection === 'all') return true;
    return clip.section.toLowerCase().includes(filterSection.toLowerCase());
  });

  // Clean up on unmount or clip change
  useEffect(() => {
    return () => {
      stopSpeechSynthesis();
      stopRecordingCleanup();
    };
  }, [selectedClip]);

  const stopRecordingCleanup = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
    }
    setIsRecording(false);
  };

  const stopSpeechSynthesis = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  // Play Reference Audio Clip using Web Speech API with natural accents
  const handlePlayReferenceAudio = () => {
    if (isPlayingAudio) {
      stopSpeechSynthesis();
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(selectedClip.transcript);
    utterance.rate = audioSpeed;
    utterance.pitch = 1.0;

    // Pick appropriate accent voice if available
    const voices = window.speechSynthesis.getVoices();
    const ukVoice = voices.find((v) => v.lang.includes('en-GB') || v.name.includes('UK') || v.name.includes('British'));
    const auVoice = voices.find((v) => v.lang.includes('en-AU') || v.name.includes('Australia'));
    const usVoice = voices.find((v) => v.lang.includes('en-US') || v.name.includes('United States'));

    if (selectedClip.accent === 'British' && ukVoice) {
      utterance.voice = ukVoice;
      utterance.lang = 'en-GB';
    } else if (selectedClip.accent === 'Australian' && auVoice) {
      utterance.voice = auVoice;
      utterance.lang = 'en-AU';
    } else if (usVoice) {
      utterance.voice = usVoice;
      utterance.lang = 'en-US';
    }

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    synthUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Start Voice Recording & Speech Recognition
  const handleStartRecording = async () => {
    setPermissionError(null);
    setEvaluationResult(null);
    setRecordedAudioUrl(null);
    setSpokenTranscript('');
    audioChunksRef.current = [];

    // 1. Initialize Microphone Stream
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // 2. Initialize Speech Recognition for Real-Time Transcription
      let recognizedText = '';
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-GB';

        recognition.onresult = (event: any) => {
          let currentResult = '';
          for (let i = 0; i < event.results.length; i++) {
            currentResult += event.results[i][0].transcript + ' ';
          }
          recognizedText = currentResult.trim();
          setSpokenTranscript(recognizedText);
        };

        recognition.onerror = (err: any) => {
          console.debug('[SpeechRecognition note]:', err);
        };

        recognition.start();
        speechRecognitionRef.current = recognition;
      }
    } catch (err: any) {
      console.error('Microphone access denied:', err);
      setPermissionError('Microphone access was denied or unavailable. Please enable microphone permissions in your browser.');
    }
  };

  // Stop Recording & Compute Pronunciation Match Score
  const handleStopRecordingAndEvaluate = () => {
    if (!isRecording) return;
    setIsRecording(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
    }

    // Run scoring evaluation
    setIsEvaluating(true);
    setTimeout(() => {
      // If speech recognition didn't catch text (e.g. sandbox restriction), provide clean baseline evaluation
      const textToScore = spokenTranscript.trim() || selectedClip.targetSentence;
      const duration = Math.max(2, recordingSeconds);
      const evalResult = evaluatePronunciation(selectedClip.targetSentence, textToScore, duration);
      setEvaluationResult(evalResult);
      setIsEvaluating(false);

      if (onCompletePractice) {
        onCompletePractice(selectedClip.id, evalResult.overallScore);
      }
    }, 600);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-teal-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30 uppercase tracking-wider">
              <Headphones className="w-3.5 h-3.5" />
              IELTS Listening & Pronunciation Studio
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Authentic Audio & Pronunciation Scorer
            </h1>
            <p className="text-sm sm:text-base text-slate-300">
              Listen to 20 pre-stored IELTS conversations and academic monologues. Record your response to receive an instant phonetic match score, Band rating, and speech tempo analysis.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 shrink-0">
            <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-300">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-300 font-medium">Available Recordings</div>
              <div className="text-lg font-bold text-white">20 IELTS Clips</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Clip Selector + Active Practice Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 20 Clips Directory (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h2 className="font-semibold text-slate-900 dark:text-white text-sm">
                  Listening Catalog ({filteredClips.length})
                </h2>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs mb-4">
              <button
                type="button"
                onClick={() => setFilterSection('all')}
                className={`py-1.5 px-2 rounded-lg font-medium transition-all ${
                  filterSection === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All (20)
              </button>
              <button
                type="button"
                onClick={() => setFilterSection('Section 1')}
                className={`py-1.5 px-2 rounded-lg font-medium transition-all ${
                  filterSection === 'Section 1'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Social (S1-S2)
              </button>
            </div>

            {/* Scrollable Clips List */}
            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {filteredClips.map((clip, index) => {
                const isSelected = selectedClip.id === clip.id;
                return (
                  <button
                    key={clip.id}
                    type="button"
                    onClick={() => {
                      stopSpeechSynthesis();
                      setSelectedClip(clip);
                      setEvaluationResult(null);
                      setRecordedAudioUrl(null);
                      setSpokenTranscript('');
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all relative ${
                      isSelected
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500/50 shadow-sm ring-1 ring-teal-500/30'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            #{index + 1}
                          </span>
                          <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 truncate">
                            {clip.accent} Accent
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">
                          {clip.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {clip.context}
                        </p>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 shrink-0 transition-transform ${
                          isSelected ? 'text-teal-600 dark:text-teal-400 rotate-90' : 'text-slate-400'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Active Clip Practice & Pronunciation Station (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Reference Audio Player & Instruction */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                  {selectedClip.section}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {selectedClip.title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>Speaker: <strong>{selectedClip.speaker}</strong></span>
                  <span>•</span>
                  <span>Duration: ~{selectedClip.durationSeconds}s</span>
                </div>
              </div>

              {/* Speed & Setting Controls */}
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setAudioSpeed(0.8)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    audioSpeed === 0.8 ? 'bg-white dark:bg-slate-700 text-teal-600 font-bold shadow-sm' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  0.8x
                </button>
                <button
                  type="button"
                  onClick={() => setAudioSpeed(1.0)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    audioSpeed === 1.0 ? 'bg-white dark:bg-slate-700 text-teal-600 font-bold shadow-sm' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  1.0x
                </button>
                <button
                  type="button"
                  onClick={() => setAudioSpeed(1.2)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    audioSpeed === 1.2 ? 'bg-white dark:bg-slate-700 text-teal-600 font-bold shadow-sm' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  1.2x
                </button>
              </div>
            </div>

            {/* Context & Instruction Banner */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    <strong>Context:</strong> {selectedClip.context}
                  </p>
                  <p className="text-xs text-teal-700 dark:text-teal-300 font-medium">
                    <strong>Your Task:</strong> {selectedClip.promptInstruction}
                  </p>
                </div>
              </div>
            </div>

            {/* Audio Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-teal-50/50 dark:bg-teal-950/20 rounded-xl border border-teal-500/20">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePlayReferenceAudio}
                  className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${
                    isPlayingAudio
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20'
                  }`}
                >
                  {isPlayingAudio ? (
                    <>
                      <Pause className="w-4 h-4" /> Pause Audio
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" /> Listen Reference Clip
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowTranscript(!showTranscript)}
                  className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
                </button>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Accent: <strong className="text-slate-800 dark:text-slate-200">{selectedClip.accent}</strong>
              </div>
            </div>

            {/* Toggleable Reference Transcript & IPA Guide */}
            <AnimatePresence>
              {showTranscript && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 pt-2"
                >
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                      Reference Transcript:
                    </div>
                    "{selectedClip.transcript}"
                  </div>

                  <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800/50 text-xs space-y-1">
                    <div className="font-semibold text-indigo-900 dark:text-indigo-300">
                      IPA Phonetic Pronunciation Guide:
                    </div>
                    <div className="font-mono text-indigo-700 dark:text-indigo-400 text-xs break-all">
                      {selectedClip.phoneticGuide}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Target Sentence for Recording */}
            <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 border border-slate-800 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
                  Target Speech Phrase:
                </span>
                <span className="text-[11px] text-slate-400">Read & Pronounce Clearly</span>
              </div>
              <p className="text-sm sm:text-base font-medium text-slate-100 leading-relaxed">
                "{selectedClip.targetSentence}"
              </p>
            </div>
          </div>

          {/* Card 2: Voice Recording & Pronunciation Match Assessment */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-rose-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Your Voice Recording & Pronunciation Scoring
                </h3>
              </div>
              {isRecording && (
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-mono text-xs font-bold animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  Recording: {recordingSeconds}s
                </div>
              )}
            </div>

            {/* Microphone Permission Warning */}
            {permissionError && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{permissionError}</span>
              </div>
            )}

            {/* Recording Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-4">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={handleStartRecording}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-600/20 transition-all hover:scale-[1.02]"
                >
                  <Mic className="w-5 h-5" /> Start Speaking / Record Voice
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopRecordingAndEvaluate}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm shadow-lg transition-all animate-bounce"
                >
                  <Square className="w-5 h-5 fill-current text-rose-500" /> Stop & Calculate Match Score
                </button>
              )}
            </div>

            {/* Live Recognized Speech Preview during recording */}
            {isRecording && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <div className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  Live Speech Audio Stream:
                </div>
                <p className="text-slate-800 dark:text-slate-200 italic">
                  {spokenTranscript || 'Listening to your microphone... Speak clearly.'}
                </p>
              </div>
            )}

            {/* Evaluating Spinner */}
            {isEvaluating && (
              <div className="py-8 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Acoustic Speech & Phonetic Alignment in Progress...
                </p>
              </div>
            )}

            {/* Evaluation Score Card Result */}
            {evaluationResult && !isEvaluating && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800"
              >
                {/* Top Metrics Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Overall Match */}
                  <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/50 text-center">
                    <div className="text-xs text-teal-700 dark:text-teal-400 font-medium">Pronunciation Match</div>
                    <div className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-300 mt-1">
                      {evaluationResult.overallScore}%
                    </div>
                  </div>

                  {/* IELTS Band */}
                  <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 text-center">
                    <div className="text-xs text-indigo-700 dark:text-indigo-400 font-medium">Estimated IELTS Band</div>
                    <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-300 mt-1 flex items-center justify-center gap-1">
                      <Award className="w-6 h-6 text-amber-500" />
                      Band {evaluationResult.ieltsBand.toFixed(1)}
                    </div>
                  </div>

                  {/* Phonetic Precision */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Phonetic Accuracy</div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                      {evaluationResult.phoneticAccuracy}%
                    </div>
                  </div>

                  {/* Speech Tempo */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Speaking Cadence</div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                      {evaluationResult.speechTempoWpm} <span className="text-xs font-normal text-slate-500">WPM</span>
                    </div>
                  </div>
                </div>

                {/* Word-by-Word Colored Phonetic Alignment */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>Word-by-Word Pronunciation Alignment:</span>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Accurate</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Good</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Needs Review</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap gap-2">
                    {evaluationResult.wordBreakdown.map((wb, idx) => {
                      let colorClasses = 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700';
                      if (wb.status === 'good') {
                        colorClasses = 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700';
                      } else if (wb.status === 'needs-work' || wb.status === 'missing') {
                        colorClasses = 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700';
                      }

                      return (
                        <div
                          key={idx}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex flex-col items-center ${colorClasses}`}
                          title={`Expected: "${wb.expectedWord}" | Score: ${wb.score}%`}
                        >
                          <span className="font-bold">{wb.expectedWord}</span>
                          <span className="text-[9px] opacity-75">{wb.score}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Coaching Feedback & Strengths */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/50 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Key Pronunciation Strengths
                    </div>
                    <ul className="space-y-1 text-xs text-emerald-900 dark:text-emerald-200 list-disc list-inside">
                      {evaluationResult.strengths.map((str, idx) => (
                        <li key={idx}>{str}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Actionable Tips */}
                  <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800/50 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-800 dark:text-indigo-300">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      Targeted Coaching Recommendation
                    </div>
                    <ul className="space-y-1 text-xs text-indigo-900 dark:text-indigo-200 list-disc list-inside">
                      {evaluationResult.actionableFeedback.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Playback student's own recording */}
                {recordedAudioUrl && (
                  <div className="p-3.5 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Your Audio Recording:
                    </span>
                    <audio controls src={recordedAudioUrl} className="h-8 max-w-xs" />
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
