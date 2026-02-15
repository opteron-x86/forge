// ═══════════════════════ PROGRAMS PAGE ═══════════════════════
// Extracted from App.jsx — ProgramsPage function
//
// Features: Program list, program editor (create/edit), day management,
// exercise management per day, collapsible days, exercise picker integration,
// custom exercise creation, program sharing toggle, save/delete

import { useState } from "react";
import { useTalos } from "../context/TalosContext";
import ExercisePicker from "../components/ExercisePicker";
import { genId } from "../lib/helpers";
import S from "../lib/styles";

export default function ProgramsPage() {
  const {
    user, programs, saveProgram, deleteProgram,
    customExercises, addCustomExercise,
    editingProgram: editing, setEditingProgram: setEditing,
  } = useTalos();

  const [showPicker, setShowPicker] = useState(false);
  const [pickerDayIdx, setPickerDayIdx] = useState(null);
  const [replacingExIdx, setReplacingExIdx] = useState(null);
  const [collapsedDays, setCollapsedDays] = useState(new Set());
  const [newExName, setNewExName] = useState("");
  const [newExMuscle, setNewExMuscle] = useState("chest");
  const [newExEquip, setNewExEquip] = useState("barbell");

  function toggleDayCollapse(dayId) {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayId)) next.delete(dayId);
      else next.add(dayId);
      return next;
    });
  }

  // MIGRATION NOTE: Copy from App.jsx ProgramsPage:
  // - All program editing functions (addDay, removeDay, addExercise, etc.)
  // - Custom exercise creation handler
  // - The full return JSX (program list, editor, day cards, exercise rows)

  return (
    <div className="fade-in">
      {showPicker && (
        <ExercisePicker
          customExercises={customExercises}
          onSelect={(ex) => {
            // TODO: Copy add/replace logic from App.jsx
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
      {/* TODO: Copy JSX from App.jsx ProgramsPage */}
      <div style={{ ...S.card, textAlign: "center", color: "#525252" }}>
        ProgramsPage — paste JSX from App.jsx
      </div>
    </div>
  );
}
