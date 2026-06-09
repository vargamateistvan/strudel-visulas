import { useCallback, useEffect, useRef, useState } from "react";
import type { RecordingMode } from "../components/Header";
import type { StrudelStatus } from "./useStrudel";
import { buildMidiFromCode } from "../utils/midiExport";
import { convertWebmToMp3, type Mp3QualityPreset } from "../utils/mp3Export";
import {
  MP3_QUALITY_KEY,
  RECORDING_MODE_KEY,
  errorMessage,
  isMp3Quality,
} from "../components/audio/audioVisualizerSettings";

type UseRecordingExportParams = {
  status: StrudelStatus;
  code: string;
  getRecordingStream: () => Promise<MediaStream>;
};

export function useRecordingExport({
  status,
  code,
  getRecordingStream,
}: UseRecordingExportParams) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingMode, setRecordingMode] = useState<RecordingMode>(() => {
    const saved = localStorage.getItem(RECORDING_MODE_KEY);
    return saved === "video" || saved === "midi" ? saved : "audio";
  });
  const [mp3Quality, setMp3Quality] = useState<Mp3QualityPreset>(() => {
    const saved = localStorage.getItem(MP3_QUALITY_KEY);
    return saved && isMp3Quality(saved) ? saved : "good";
  });
  const [isExportingMp3, setIsExportingMp3] = useState(false);
  const [mp3Progress, setMp3Progress] = useState(0);
  const [mp3Status, setMp3Status] = useState("");
  const [mp3Speed, setMp3Speed] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const displayStreamRef = useRef<MediaStream | null>(null);

  const clearRecordingTimer = useCallback(() => {}, []);

  const pickAudioMimeType = useCallback((): string | undefined => {
    if (typeof MediaRecorder === "undefined") return undefined;
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
    ];
    return candidates.find((c) => MediaRecorder.isTypeSupported(c));
  }, []);

  const stopAudioRecording = useCallback(() => {
    clearRecordingTimer();
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    } else {
      setIsRecording(false);
    }
    if (displayStreamRef.current) {
      displayStreamRef.current.getTracks().forEach((t) => t.stop());
      displayStreamRef.current = null;
    }
  }, [clearRecordingTimer]);

  const startAudioRecording = useCallback(async () => {
    try {
      if (status !== "playing") return;
      if (isRecording) return;
      if (isExportingMp3) return;
      if (typeof MediaRecorder === "undefined") {
        window.alert("MediaRecorder is not supported in this browser.");
        return;
      }

      const stream = await getRecordingStream();
      const mimeType = pickAudioMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onerror = () => {
        setIsRecording(false);
        clearRecordingTimer();
      };
      recorder.onstop = async () => {
        const blobType = recorder.mimeType || mimeType || "audio/webm";
        clearRecordingTimer();
        setIsRecording(false);

        const blob = new Blob(chunksRef.current, { type: blobType });
        const ts = new Date().toISOString().replace(/[:.]/g, "-");

        try {
          setIsExportingMp3(true);
          setMp3Progress(0);
          setMp3Status("Preparing MP3 export...");

          const mp3Blob = await convertWebmToMp3(blob, {
            quality: mp3Quality,
            onProgress: (p) => setMp3Progress(p),
            onStatus: (s) => setMp3Status(s),
            onSpeed: (speed) => setMp3Speed(speed),
          });

          const url = URL.createObjectURL(mp3Blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `strudel-recording-${ts}.mp3`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (e: unknown) {
          const ext = blobType.includes("ogg") ? "ogg" : "webm";
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `strudel-recording-${ts}.${ext}`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          window.alert(
            `MP3 conversion failed, downloaded original ${ext.toUpperCase()} instead. ${errorMessage(e)}`,
          );
        } finally {
          setIsExportingMp3(false);
          setMp3Status("");
          setMp3Progress(0);
          setMp3Speed("");
        }
      };

      recorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);
    } catch (e: unknown) {
      window.alert(errorMessage(e) || "Failed to start recording.");
    }
  }, [
    clearRecordingTimer,
    getRecordingStream,
    isExportingMp3,
    isRecording,
    mp3Quality,
    pickAudioMimeType,
    status,
  ]);

  const startVideoRecording = useCallback(async () => {
    try {
      if (status !== "playing") return;
      if (isRecording) return;
      if (!navigator.mediaDevices?.getDisplayMedia) {
        window.alert("Display capture is not supported in this browser.");
        return;
      }
      if (typeof MediaRecorder === "undefined") {
        window.alert("MediaRecorder is not supported in this browser.");
        return;
      }

      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 60 },
        audio: false,
      });
      displayStreamRef.current = displayStream;

      const audioStream = await getRecordingStream();
      const combined = new MediaStream();
      displayStream.getVideoTracks().forEach((t) => combined.addTrack(t));
      audioStream.getAudioTracks().forEach((t) => combined.addTrack(t));

      const candidates = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
      ];
      const mimeType = candidates.find((c) => MediaRecorder.isTypeSupported(c));
      const recorder = mimeType
        ? new MediaRecorder(combined, { mimeType })
        : new MediaRecorder(combined);

      displayStream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          if (recorder.state !== "inactive") {
            recorder.stop();
          }
        };
      });

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        clearRecordingTimer();
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "video/webm",
        });
        const ts = new Date().toISOString().replace(/[:.]/g, "-");
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `strudel-video-${ts}.webm`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        displayStream.getTracks().forEach((t) => t.stop());
        displayStreamRef.current = null;
        setIsRecording(false);
      };
      recorder.onerror = () => {
        clearRecordingTimer();
        setIsRecording(false);
        displayStream.getTracks().forEach((t) => t.stop());
        displayStreamRef.current = null;
      };

      recorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);
    } catch {
      clearRecordingTimer();
      setIsRecording(false);
      if (displayStreamRef.current) {
        displayStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      displayStreamRef.current = null;
    }
  }, [clearRecordingTimer, getRecordingStream, isRecording, status]);

  const exportMidi = useCallback(() => {
    const blob = buildMidiFromCode(code);
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `strudel-pattern-${ts}.mid`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [code]);

  const startRecording = useCallback(() => {
    if (isExportingMp3) return;
    if (recordingMode === "audio") {
      startAudioRecording();
      return;
    }
    if (recordingMode === "video") {
      startVideoRecording();
      return;
    }
    exportMidi();
  }, [
    exportMidi,
    isExportingMp3,
    recordingMode,
    startAudioRecording,
    startVideoRecording,
  ]);

  useEffect(() => {
    localStorage.setItem(RECORDING_MODE_KEY, recordingMode);
  }, [recordingMode]);

  useEffect(() => {
    localStorage.setItem(MP3_QUALITY_KEY, mp3Quality);
  }, [mp3Quality]);

  useEffect(() => {
    return () => {
      clearRecordingTimer();
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      if (displayStreamRef.current) {
        displayStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [clearRecordingTimer]);

  useEffect(() => {
    if (status !== "playing" && isRecording) {
      stopAudioRecording();
    }
  }, [isRecording, status, stopAudioRecording]);

  return {
    isRecording,
    recordingMode,
    setRecordingMode,
    mp3Quality,
    setMp3Quality,
    isExportingMp3,
    mp3Progress,
    mp3Status,
    mp3Speed,
    startRecording,
    stopAudioRecording,
  };
}
