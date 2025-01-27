import React, { useState, useRef } from "react";
import "./App.css";

const App = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null); // Recorded audio blob
  const [transcribedText, setTranscribedText] = useState(""); // Transcribed text from backend
  const [llmResponse, setLlmResponse] = useState(""); // LLM response text from backend
  const [llmAudioUrl, setLlmAudioUrl] = useState(null); // LLM audio URL from backend
  const mediaRecorderRef = useRef(null); // Reference to MediaRecorder
  const audioChunksRef = useRef([]); // To store audio chunks

  const startRecording = async () => {
    try {
      // Request access to the microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = []; // Reset the audio chunks

      // Collect audio chunks during recording
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      // Handle recording stop
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);

        // Automatically play back the user's recording
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();

        // Send the audio to the backend for processing
        await handleSendAudioToBackend(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop(); // Stop the MediaRecorder
      setIsRecording(false);
    }
  };

  const handleSendAudioToBackend = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      // Send the recorded audio to the backend
      const response = await fetch("http://127.0.0.1:8000/process-audio/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setTranscribedText(data.transcribed_text); // Set the transcribed text
        setLlmResponse(data.llm_response); // Set the LLM response text
        setLlmAudioUrl(`http://127.0.0.1:8000/${data.audio_file_url}`); // Set the LLM audio URL

        // Automatically play the backend-generated audio
        playLlmAudio(`http://127.0.0.1:8000/${data.audio_file_url}`);
      } else {
        console.error("Backend error:", response.statusText);
      }
    } catch (error) {
      console.error("Error sending audio to backend:", error);
    }
  };

  const playLlmAudio = (url) => {
    if (url) {
      const audio = new Audio(url);
      audio.play();
      console.log("Playing LLM-generated audio...");
    }
  };

  return (
    <div className="app-container">
      <div className="content">
        <h1 className="title">Voice-to-Text App</h1>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`record-btn ${isRecording ? "stop-btn" : "start-btn"}`}
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </button>

        {audioBlob && (
          <p className="recording-message">Recording finished and playing back!</p>
        )}

        <div className="results">
          <div className="block">
            <h2 className="block-title">What You Said:</h2>
            <p className="block-content">{transcribedText || "Waiting for transcription..."}</p>
          </div>
          <div className="block">
            <h2 className="block-title">LLM Response:</h2>
            <p className="block-content">{llmResponse || "Waiting for LLM response..."}</p>
          </div>
          {llmAudioUrl && (
            <div className="block">
              <h2 className="block-title">LLM Audio:</h2>
              <p className="recording-message">LLM Audio is playing!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
