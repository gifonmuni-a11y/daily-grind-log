import React, { useState } from 'react';
import { Target, Plus, Check, Trash2, Activity, Zap, ArrowRight, Crosshair, Flame } from 'lucide-react';

export default function QuestBoard({ onFinalizeBattle }) {
  // State untuk melacak latihan (quests)
  const [exercises, setExercises] = useState([
    {
      id: 1,
      name: 'Bench Press',
      sets: [
        { id: 1, weight: '', reps: '', completed: false },
        { id: 2, weight: '', reps: '', completed: false }
      ]
    }
  ]);

  const addExercise = () => {
    const newEx = {
      id: Date.now(),
      name: '',
      sets: [{ id: Date.now() + 1, weight: '', reps: '', completed: false }]
    };
    setExercises([...exercises, newEx]);
  };

  const addSet = (exId) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === exId) {
        // Copy nilai dari set sebelumnya untuk mempermudah user
        const lastSet = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [...ex.sets, { 
            id: Date.now(), 
            weight: lastSet ? lastSet.weight : '', 
            reps: lastSet ? lastSet.reps : '', 
            completed: false 
          }]
        };
      }
      return ex;
    }));
  };

  const updateSet = (exId, setId, field, value) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === exId) {
        return {
          ...ex,
          sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s)
        };
      }
      return ex;
    }));
  };

  const toggleSetComplete = (exId, setId) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === exId) {
        return {
          ...ex,
          sets: ex.sets.map(s => s.id === setId ? { ...s, completed: !s.completed } : s)
        };
      }
      return ex;
    }));
  };

  const deleteExercise = (exId) => {
    setExercises(prev => prev.filter(ex => ex.id !== exId));
  };

  // Kalkulasi Progress Visual
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSets = exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0);
  const syncPercentage = totalSets === 0 ? 0 : Math.round((completedSets / totalSets) * 100);

  // Generate Teks Latihan untuk dikirim ke LogModal
  const handleEvaluasi = () => {
    let generatedNote = '🔥 [SYSTEM BATTLE LOG]\n\n';
    
    exercises.forEach(ex => {
      const exName = ex.name.trim() || 'Latihan Tak Dikenal';
      const validSets = ex.sets.filter(s => s.completed);
      
      if (validSets.length > 0) {
        generatedNote += `⚔️ ${exName.toUpperCase()}\n`;
        validSets.forEach((s, idx) => {
          generatedNote += `  • Set ${idx + 1}: ${s.weight || 0}kg x ${s.reps || 0} reps\n`;
        });
        generatedNote += '\n';
      }
    });

    generatedNote += `Progress Sinkronisasi: ${syncPercentage}%\n`;

    // Lempar data ke Home.jsx
    onFinalizeBattle({
      title: 'Physical Training',
      note: generatedNote.trim()
    });
  };

  return (
    <div className="flex flex-col gap-5 font-mono animate-in fade-in duration-200 mt-2">
      
      {/* SYSTEM PROGRESS HEADER */}
      <div className="bg-[#100E16] border border-[#211D2C] p-4 rounded-xl shadow-lg relative flex flex-col gap-3">
        <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t-2 border-l-2 border-[#7C5CFF] z-40" />
        <div className="absolute -top-[1px] -right-[1px] w-3 h-3 border-t-2 border-r-2 border-[#7C5CFF] z-40" />
        <div className="absolute -bottom-[1px] -left-[1px] w-3 h-3 border-b-2 border-l-2 border-[#7C5CFF] z-40" />
        <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b-2 border-r-2 border-[#7C5CFF] z-40" />

        <div className="flex justify-between items-end border-b border-[#211D2C]/60 pb-2">
          <div className="flex flex-col">
            <span className="text-[#7C5CFF] font-bold text-[10px] tracking-widest uppercase">Target Quest</span>
            <span className="font-display font-black text-lg text-white uppercase">BATTLE LOGGER</span>
          </div>
          <Activity size={24} className="text-[#7C5CFF] opacity-50" />
        </div>

        <div className="flex flex-col gap-1.5 mt-1">
          <div className="flex justify-between text-[9px] uppercase font-bold text-[#EDEAF6]/70">
            <span>Sinkronisasi Otot</span>
            <span className={syncPercentage === 100 ? "text-emerald-400" : "text-[#7C5CFF]"}>{syncPercentage}%</span>
          </div>
          <div className="w-full bg-[#211D2C] h-2.5 rounded-full overflow-hidden shadow-inner relative">
            <div 
              className={`h-full transition-all duration-500 ease-out relative ${syncPercentage === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#5B39C7] to-[#7C5CFF]'}`}
              style={{ width: `${syncPercentage}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_ease-in-out_infinite]" />
            </div>
          </div>
        </div>
      </div>

      {/* EXERCISE LIST */}
      <div className="flex flex-col gap-4">
        {exercises.map((ex, exIdx) => (
          <div key={ex.id} className="bg-[#100E16] border border-[#211D2C] rounded-xl flex flex-col relative overflow-hidden shadow-md">
            
            {/* Header Latihan */}
            <div className="bg-[#14121C] border-b border-[#211D2C] p-3 flex justify-between items-center gap-2">
              <div className="flex items-center gap-2 flex-1">
                <Crosshair size={14} className="text-[#7C5CFF]" />
                <input 
                  type="text" 
                  placeholder="Nama Latihan (misal: Squat)"
                  value={ex.name}
                  onChange={(e) => setExercises(prev => prev.map(q => q.id === ex.id ? { ...q, name: e.target.value } : q))}
                  className="bg-transparent text-white font-bold text-xs outline-none focus:border-b border-[#7C5CFF] w-full"
                />
              </div>
              <button onClick={() => deleteExercise(ex.id)} className="text-[#EDEAF6]/30 hover:text-red-400 transition-colors p-1">
                <Trash2 size={14} />
              </button>
            </div>

            {/* Set Tracking */}
            <div className="p-3 flex flex-col gap-2">
              {ex.sets.map((set, sIdx) => (
                <div key={set.id} className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${set.completed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-black/50 border-[#211D2C]'}`}>
                  <div className={`w-6 text-center text-[10px] font-bold ${set.completed ? 'text-emerald-400' : 'text-[#EDEAF6]/50'}`}>
                    S{sIdx + 1}
                  </div>
                  
                  <div className="flex-1 flex gap-2">
                    <div className={`flex-1 border rounded flex items-center px-2 transition-colors ${set.completed ? 'bg-[#100E16]/50 border-emerald-500/30' : 'bg-[#100E16] border-[#312C42]'}`}>
                      <input 
                        type="number" 
                        value={set.weight} 
                        onChange={(e) => updateSet(ex.id, set.id, 'weight', e.target.value)}
                        disabled={set.completed}
                        className="w-full bg-transparent text-white text-xs py-2 text-center outline-none disabled:text-[#EDEAF6]/40"
                        placeholder="0"
                      />
                      <span className="text-[9px] text-[#EDEAF6]/40">kg</span>
                    </div>
                    <div className={`flex-1 border rounded flex items-center px-2 transition-colors ${set.completed ? 'bg-[#100E16]/50 border-emerald-500/30' : 'bg-[#100E16] border-[#312C42]'}`}>
                      <input 
                        type="number" 
                        value={set.reps} 
                        onChange={(e) => updateSet(ex.id, set.id, 'reps', e.target.value)}
                        disabled={set.completed}
                        className="w-full bg-transparent text-white text-xs py-2 text-center outline-none disabled:text-[#EDEAF6]/40"
                        placeholder="0"
                      />
                      <span className="text-[9px] text-[#EDEAF6]/40">reps</span>
                    </div>
                  </div>

                  <button 
                    type="button" 
                    onClick={() => toggleSetComplete(ex.id, set.id)}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all active:scale-90 ${set.completed ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-[#211D2C] text-[#EDEAF6]/40 border-[#312C42]'}`}
                  >
                    <Check size={16} strokeWidth={set.completed ? 4 : 2} />
                  </button>
                </div>
              ))}
              
              <button 
                type="button" 
                onClick={() => addSet(ex.id)}
                className="w-full mt-1 py-2 border border-dashed border-[#312C42] text-[#EDEAF6]/50 text-[10px] uppercase font-bold rounded-lg flex items-center justify-center gap-1 hover:bg-[#211D2C] hover:text-white transition-all"
              >
                <Plus size={12} /> Tambah Set
              </button>
            </div>
          </div>
        ))}
      </div>

      <button 
        type="button"
        onClick={addExercise}
        className="w-full py-4 border border-dashed border-[#7C5CFF]/50 text-[#7C5CFF] font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-[#7C5CFF]/10 active:scale-95 transition-all"
      >
        <Flame size={14} /> 
        Target Latihan Baru
      </button>

      {/* EVALUATION BRIDGE BUTTON */}
      <button 
        type="button"
        onClick={handleEvaluasi}
        disabled={completedSets === 0}
        className={`w-full py-4 font-display font-black text-sm uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all mt-4 mb-8 ${
          completedSets > 0 
            ? 'bg-[#7C5CFF] text-white shadow-[0_0_20px_rgba(124,92,255,0.4)] active:scale-95' 
            : 'bg-[#211D2C] text-[#EDEAF6]/30 cursor-not-allowed'
        }`}
      >
        Evaluasi Battle <ArrowRight size={16} />
      </button>

    </div>
  );
}
