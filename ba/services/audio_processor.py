import os
import numpy as np
import librosa
import soundfile as sf
import noisereduce as nr
from scipy.signal import medfilt
from pydub import AudioSegment


def process_audio(file_path):
    temp_wav = None
    clean_path = None
    def normalize(value, min_val, max_val):
        if max_val == min_val:
            return 0.0
        return max(0.0, min(1.0, (value - min_val) / (max_val - min_val)))

    try:
        if file_path.lower().endswith(".m4a"):
            temp_wav = file_path.replace(".m4a", ".wav")
            audio = AudioSegment.from_file(file_path)
            audio.export(temp_wav, format="wav")
            file_path = temp_wav

        y_raw, sr = librosa.load(file_path, sr=None, mono=True)
        y_raw = librosa.util.normalize(y_raw)

        y, _ = librosa.effects.trim(y_raw, top_db=30)

        duration = librosa.get_duration(y=y, sr=sr)
        if duration < 0.5:
            duration = 0.5

        if len(y) > sr * 0.5:
            intervals_noise = librosa.effects.split(y, top_db=35)

            if len(intervals_noise) > 0 and intervals_noise[0][0] > sr * 0.15:
                noise_sample = y[: intervals_noise[0][0]]
            else:
                noise_sample = y[: int(sr * 0.1)]

            y_clean = nr.reduce_noise(
                y=y,
                y_noise=noise_sample,
                sr=sr,
                prop_decrease=0.6
            )
        else:
            y_clean = y

        clean_path = file_path.replace(".wav", "_clean.wav")
        sf.write(clean_path, y_clean, sr)

        intervals = librosa.effects.split(y_clean, top_db=30)

        total_speech = sum((end - start) for start, end in intervals) / sr
        silence_ratio = max(0.0, (duration - total_speech) / duration)
        pause_segments = max(0, len(intervals) - 1)

        rms = librosa.feature.rms(y=y_clean)[0]

        if len(rms) > 0:
            min_rms = np.min(rms)
            max_rms = np.max(rms)

            if max_rms > min_rms:
                rms_norm = (rms - min_rms) / (max_rms - min_rms)
            elif max_rms > 0:
                rms_norm = np.ones_like(rms)
            else:
                rms_norm = rms

            energy_var = float(np.std(rms_norm))
        else:
            energy_var = 0.0

        f0 = librosa.yin(
            y_clean,
            fmin=65,
            fmax=350,
            sr=sr,
            frame_length=2048,
            hop_length=256
        )

        f0 = f0[~np.isnan(f0)]

        if len(f0) > 0:
            if len(f0) >= 5:
                f0_smooth = medfilt(f0, kernel_size=5)
            else:
                f0_smooth = f0

            pitch_mean = float(np.mean(f0_smooth))
            pitch_std = float(np.std(f0_smooth))

            jitter = 0.0
            if len(f0_smooth) > 2 and pitch_mean > 0:
                periods = 1.0 / f0_smooth
                period_diff = np.abs(np.diff(periods))
                jitter = float(np.mean(period_diff) / np.mean(periods))
        else:
            pitch_mean, pitch_std, jitter = 0.0, 0.0, 0.0


        if silence_ratio < 0.20:
            silence_score = 1.0
        else:
            silence_score = 1.0 - normalize(silence_ratio, 0.20, 0.50)

        if pitch_std < 2.0:
            pitch_score = 0.4
        elif pitch_std > 110.0:
            pitch_score = 0.5
        else:
            if 10.0 <= pitch_std <= 90.0:
                pitch_score = 1.0
            elif pitch_std < 10.0:
                pitch_score = 0.8 + (0.2 * (pitch_std / 10))
            else:
                pitch_score = 1.0 - normalize(pitch_std, 90, 120)

        if jitter <= 0.025:
            jitter_score = 1.0
        else:
            jitter_score = 1.0 - normalize(jitter, 0.025, 0.08)

        if energy_var < 0.02:
            energy_score = 0.8
        elif energy_var > 0.25:
            energy_score = 0.7
        else:
            energy_score = 1.0

        pauses_per_sec = pause_segments / duration
        if pauses_per_sec < 1.0:
            pacing_score = 1.0
        else:
            pacing_score = max(0.5, 1.0 - (pauses_per_sec - 1.0))

        confidence_raw = (
            0.30 * jitter_score +
            0.25 * pitch_score +
            0.20 * silence_score +
            0.15 * energy_score +
            0.10 * pacing_score
        )

        confidence_score = round(confidence_raw * 10, 1)
        nervous_score = round((1.0 - confidence_raw) * 10, 1)

        return clean_path, {
            "durationSeconds": round(duration, 2),
            "silenceRatio": round(silence_ratio, 2),
            "pitchVariability": round(pitch_std, 2),
            "jitter": round(jitter, 4),
            "confidenceScore": confidence_score,
            "nervousnessScore": nervous_score
        }

    finally:
        if temp_wav and os.path.exists(temp_wav):
            os.remove(temp_wav)