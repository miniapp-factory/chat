"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";

export default function Recording() {
  const [recording, setRecording] = useState(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (recording) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          const mrec = new MediaRecorder(stream);
          setRecorder(mrec);
          mrec.start();
          setAudioChunks([]);
          mrec.ondataavailable = (e) => {
            if (e.data.size > 0) {
              setAudioChunks((prev) => [...prev, e.data]);
            }
          };
          mrec.onstop = () => {
            const blob = new Blob(audioChunks, { type: "audio/webm" });
            const url = URL.createObjectURL(blob);
            setAudioUrls((prev) => [...prev, url]);
            stream.getTracks().forEach((t) => t.stop());
          };
        })
        .catch((err) => {
          setError("Microphone access denied or not available.");
          console.error(err);
        });
    } else {
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }
    }
    // Cleanup on unmount
    return () => {
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }
    };
  }, [recording]);

  const toggleRecording = () => {
    setRecording((prev) => !prev);
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <Label className="text-lg font-semibold">Audio Recorder</Label>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error && <p className="text-destructive">{error}</p>}
        <Button
          variant={recording ? "destructive" : "default"}
          onClick={toggleRecording}
          className="w-full"
        >
          {recording ? "Stop Recording" : "Start Recording"}
        </Button>
        {audioUrls.length > 0 && (
          <div className="space-y-2">
            {audioUrls.map((url, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <audio controls src={url} className="flex-1" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newUrls = [...audioUrls];
                    newUrls.splice(idx, 1);
                    setAudioUrls(newUrls);
                  }}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          variant="secondary"
          onClick={() => {
            setAudioUrls([]);
            setAudioChunks([]);
          }}
          disabled={audioUrls.length === 0}
        >
          Clear All
        </Button>
      </CardFooter>
    </Card>
  );
}
