import { Mic, MicOff } from "lucide-react";
import { useSpeechToText } from "../hooks/useSpeechToText";

export function VoiceInputButton({
  onTranscript,
  lang = "zh-CN",
}: {
  onTranscript: (text: string) => void;
  lang?: string;
}) {
  const { isSupported, isListening, error, start, stop } = useSpeechToText();

  if (!isSupported) {
    return (
      <button type="button" className="icon-button" disabled aria-label="浏览器不支持语音输入" title="浏览器不支持语音输入">
        <MicOff size={16} />
      </button>
    );
  }

  const handleClick = () => {
    if (isListening) {
      stop();
    } else {
      start(lang, (text, isFinal) => {
        if (isFinal) onTranscript(text);
      });
    }
  };

  return (
    <>
      <button
        type="button"
        className={`icon-button${isListening ? " active" : ""}`}
        onClick={handleClick}
        aria-label={isListening ? "停止录音" : "开始语音输入"}
        title={isListening ? "停止录音" : "开始语音输入"}
        aria-pressed={isListening}
      >
        {isListening ? <MicOff size={16} /> : <Mic size={16} />}
      </button>
      {error && <span className="voice-input-error" role="alert">{error}</span>}
    </>
  );
}
