# AI Studio - AI Interview Simulator

AI Studio is an AI interview simulator consisting of a **React Native (Expo)** mobile frontend and a **FastAPI** Python backend. The platform provides real-time vocal analysis, role-specific question generation, and automated feedback using Large Language Models (LLMs) and local speech-to-text models.

## 🚀 Features

* **Dynamic Question Generation**: Leverages an LLM to generate interview questions based on standard behavioral banks or specialized technical roles.
* **Audio Analysis**: Analyzes audio responses for metrics like silence ratio, pitch variability (YIN algorithm), jitter, and speaking pace to calculate confidence and nervousness scores.
* **Local AI Processing**: Uses OpenAI's **Whisper** model for local speech-to-text transcription and **Ollama** (Qwen 2.5) for candidate evaluation.
* **Modern Mobile UI**: A React Native application featuring dark/light modes, audio metering visualizations, and structured feedback reports.

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed on your machine:
* **Python 3.8+**
* **Node.js 18+** & npm/yarn
* **FFmpeg**: Required by `pydub` and `librosa` for audio manipulation.
* **Ollama**: Required to run the local LLM evaluator. 
  * Download from [ollama.com](https://ollama.com/)
  * Pull the required model: `ollama pull qwen2.5:7b-instruct-q4_K_M`

---

## 💻 Backend Setup (FastAPI)

The backend handles audio processing, transcription, and LLM evaluation.

### 1. Install Required Packages
Navigate to your backend directory and install the following pip packages:

```bash
pip install fastapi uvicorn pydantic python-multipart openai-whisper torch librosa soundfile noisereduce scipy pydub requests
```
*(Note: If you have an NVIDIA GPU, ensure you install the CUDA-enabled version of PyTorch for faster Whisper transcription).*

### 2. Start the Local LLM Server
Ensure Ollama is running in the background with the correct model:
```bash
ollama serve
# Verify the model is available
ollama run qwen2.5:7b-instruct-q4_K_M
```

### 3. Run the Backend Server
Start the FastAPI server using Uvicorn. The `--host 0.0.0.0` flag ensures the server is accessible from your mobile device/emulator on the same local network.

```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API will be available at `http://localhost:8000`.

---

## 📱 Frontend Setup (React Native / Expo)

The frontend is an Expo-managed React Native application.

### 1. Install Required Packages
Navigate to your frontend directory and install the necessary npm dependencies:

```bash
# Core Expo and React Native
npm install expo react-native

# Navigation
npm install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context

# Expo Hardware/UI libraries
npm install expo-av expo-camera expo-status-bar @expo/vector-icons

# Utils
npm install react-native-uuid
```

### 2. Configure Environment Variables
Create a `.env` file in the root of your frontend directory and add your backend's local IP address. Do not use `localhost` if you are testing on a physical device; use your computer's local IPv4 address (e.g., `192.168.1.X`).

```env
EXPO_PUBLIC_SERVER_URL=[http://192.168.1.](http://192.168.1.)X:8000
```

### 3. Run the Application
Start the Expo development server:

```bash
npx expo start
```
* Press `a` to run on an Android emulator.
* Press `i` to run on an iOS simulator.
* Scan the QR code with the Expo Go app on your physical device.

---

## 📂 Project Structure Overview

* **Backend (`/services`)**:
  * `main.py`: FastAPI entry point and routes (`/questions`, `/upload`).
  * `audio_processor.py`: Cleans audio files, extracts acoustic metrics (jitter, pitch, confidence).
  * `whisper_service.py` & `transcription.py`: Manages the Whisper speech-to-text pipeline.
  * `llm_evaluator.py`: Constructs LLM prompts and parses JSON evaluation data.
  * `questions_service.py`: Context-aware prompt generation for dynamic questioning.
* **Frontend (`/screens` & `/utils`)**:
  * `WelcomeScreen.js`, `NoteScreen.js`, `PreferencesScreen.js`: User onboarding and session configuration.
  * `InterviewScreen.js`: Core recording UI with live audio metering and animations.
  * `ResponseScreen.js` & `uploadAudio.js`: Batch processing and multipart form-data uploading.
  * `FeedbackScreen.js`: Renders the AI's final assessment and metric breakdowns.
  * `ThemeContext.js` & `theme.js`: Global dark/light theme state and styling constants.
