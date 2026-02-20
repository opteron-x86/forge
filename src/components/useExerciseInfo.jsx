// ═══════════════════════ useExerciseInfo ═══════════════════════
// Lightweight hook for triggering the ExerciseInfoModal.
//
// Usage in any component:
//   const { showInfo, infoModal } = useExerciseInfo();
//
//   // Trigger it:
//   <span onClick={() => showInfo("Bench Press")}>ℹ</span>
//
//   // Render (once, at component root):
//   {infoModal}
//
// With swap callback (for active workout):
//   const { showInfo, infoModal } = useExerciseInfo({
//     onSwap: (oldName, newName) => replaceExercise(oldName, newName)
//   });

import { useState, useCallback } from "react";
import ExerciseInfoModal from "./ExerciseInfoModal";

export default function useExerciseInfo(opts = {}) {
  const [infoName, setInfoName] = useState(null);

  const showInfo = useCallback((name) => {
    setInfoName(name);
  }, []);

  const hideInfo = useCallback(() => {
    setInfoName(null);
  }, []);

  const handleSwap = opts.onSwap
    ? (newName) => {
        opts.onSwap(infoName, newName);
        setInfoName(null);
      }
    : undefined;

  const infoModal = infoName ? (
    <ExerciseInfoModal
      name={infoName}
      onClose={hideInfo}
      onSwap={handleSwap}
    />
  ) : null;

  return { showInfo, hideInfo, infoName, infoModal };
}
