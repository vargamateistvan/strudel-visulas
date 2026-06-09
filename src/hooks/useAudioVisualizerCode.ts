import { useCallback, useState } from "react";

type UseAudioVisualizerCodeArgs = {
  loadDraft: () => string | null;
  defaultCode: string;
};

export function useAudioVisualizerCode({
  loadDraft,
  defaultCode,
}: UseAudioVisualizerCodeArgs) {
  const [code, setCode] = useState(() => loadDraft() ?? defaultCode);

  const onCodeChange = useCallback((nextCode: string) => {
    setCode(nextCode);
  }, []);

  return {
    code,
    setCode,
    onCodeChange,
  };
}
