import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  getRaceParticipants, 
  savePreRaceChecks, 
  transitionRaceState,
  getRaceResultEntries,
  submitRaceResults,
  submitViolation,
  submitRefereeReport,
  ParticipantVerification,
  ParticipantResultEntry,
  ViolationEntry
} from "../../api/refereeApi";

type RaceDetails = {
  id: number;
  name: string;
  code: string;
  distanceMeters: number;
  status: string;
};

const STEPS = ["SCHEDULED", "PRE_CHECKING", "READY", "ONGOING", "FINISHED", "RESULT_SUBMITTED"];

export function RefereeOfficiatePage() {
  const { id } = useParams<{ id: string }>();
  const raceId = Number(id);

  const [race, setRace] = useState<RaceDetails>({
    id: raceId,
    name: "Dubai World Cup - Final Derby",
    code: "R-2026-002",
    distanceMeters: 2400,
    status: "PRE_CHECKING"
  });

  const [participants, setParticipants] = useState<ParticipantVerification[]>([]);
  const [results, setResults] = useState<ParticipantResultEntry[]>([]);
  const [violations, setViolations] = useState<ViolationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // AI Speech-to-Text States
  const [aiActive, setAiActive] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [reportSummary, setReportSummary] = useState("");
  
  // Active states for interactive panel
  const [activeInfractionPopover, setActiveInfractionPopover] = useState<number | null>(null);
  const [stopwatchTime, setStopwatchTime] = useState("00:00.000");
  const [ongoingProgress, setOngoingProgress] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Load participants
  useEffect(() => {
    getRaceParticipants(raceId)
      .then(setParticipants)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [raceId]);

  // Load results if finished or submitted
  useEffect(() => {
    if (race.status === "FINISHED" || race.status === "RESULT_SUBMITTED") {
      getRaceResultEntries(raceId)
        .then(data => {
          if (data && data.length > 0) {
            setResults(data);
          } else {
            generateFallbackResults();
          }
        })
        .catch(() => {
          generateFallbackResults();
        });
    }
  }, [race.status, raceId, participants]);

  const generateFallbackResults = () => {
    const fallback = participants.map(p => ({
      participantId: p.participantId,
      horseName: p.horseName,
      jockeyName: p.jockeyName,
      position: "" as number | "",
      finishTimeSeconds: "" as number | "",
      status: (p.status === "PASSED" ? "FINISHED" : "WITHDRAWN") as "FINISHED" | "WITHDRAWN"
    }));
    setResults(fallback);
  };

  // Simulated stopwatch and progress track in ONGOING status
  useEffect(() => {
    if (race.status !== "ONGOING") {
      setOngoingProgress(0);
      return;
    }
    
    const startTime = Date.now();
    const stopwatchInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const ms = elapsed % 1000;
      const sec = Math.floor(elapsed / 1000) % 60;
      const min = Math.floor(elapsed / 60000);
      setStopwatchTime(
        `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(ms).padStart(3, "0")}`
      );
    }, 47);

    // Track progression visualizer
    const progressInterval = setInterval(() => {
      setOngoingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 800);

    return () => {
      clearInterval(stopwatchInterval);
      clearInterval(progressInterval);
    };
  }, [race.status]);

  // Checkbox state triggers
  const handleCheckboxChange = (index: number, field: "gearOk" | "healthOk") => {
    const updated = [...participants];
    const entry = { ...updated[index], [field]: !updated[index][field] };
    
    // Auto-Pass Guard
    if (entry.gearOk && entry.healthOk) {
      entry.status = "PASSED";
    } else {
      entry.status = "PENDING";
    }
    
    updated[index] = entry;
    setParticipants(updated);
    savePreRaceChecks(raceId, updated).catch(() => {});
  };

  const handleStatusChange = (index: number, status: "PASSED" | "FAILED" | "PENDING") => {
    const updated = [...participants];
    updated[index] = { ...updated[index], status };
    
    // Auto-update gear/health checkboxes to match status
    if (status === "PASSED") {
      updated[index].gearOk = true;
      updated[index].healthOk = true;
    } else if (status === "FAILED") {
      updated[index].gearOk = false;
      updated[index].healthOk = false;
    }
    
    setParticipants(updated);
    savePreRaceChecks(raceId, updated).catch(() => {});
  };

  // Standings Order Validation Rule
  const checkStandingsError = (entries: ParticipantResultEntry[]): string | null => {
    const activeEntries = entries.filter(e => e.status === "FINISHED");
    
    const hasEmptyFields = activeEntries.some(e => e.position === "" || e.finishTimeSeconds === "");
    if (hasEmptyFields) {
      return "All active runners must have a valid finish position (rank) and timing.";
    }

    const positions = activeEntries.map(e => Number(e.position));
    const uniquePositions = new Set(positions);
    if (uniquePositions.size !== positions.length) {
      return "Duplicate positions detected. Every active runner must hold a unique ranking.";
    }

    const sortedPositions = [...positions].sort((a, b) => a - b);
    for (let i = 0; i < sortedPositions.length; i++) {
      if (sortedPositions[i] !== i + 1) {
        return `Ranks must be a continuous sequence starting from 1 (e.g. 1, 2, 3...). Rank ${sortedPositions[i]} is invalid.`;
      }
    }

    const sortedByRank = [...activeEntries].sort((a, b) => Number(a.position) - Number(b.position));
    for (let i = 1; i < sortedByRank.length; i++) {
      const prevTime = Number(sortedByRank[i - 1].finishTimeSeconds);
      const currTime = Number(sortedByRank[i].finishTimeSeconds);
      if (currTime <= prevTime) {
        return `Finish times must be strictly ascending relative to rank. Finisher at Rank ${sortedByRank[i].position} (${currTime}s) cannot be faster than or equal to Rank ${sortedByRank[i - 1].position} (${prevTime}s).`;
      }
    }

    return null;
  };

  const handleResultChange = (
    participantId: number, 
    field: "position" | "finishTimeSeconds", 
    value: string
  ) => {
    const updated = results.map(r => {
      if (r.participantId === participantId) {
        let parsed: number | "";
        if (value === "") {
          parsed = "";
        } else {
          parsed = Number(value);
          if (isNaN(parsed) || parsed < 0) parsed = "";
        }
        return { ...r, [field]: parsed };
      }
      return r;
    });
    setResults(updated);

    const error = checkStandingsError(updated);
    setValidationError(error);
  };

  const handleNextStep = async () => {
    try {
      setActionLoading(true);

      if (race.status === "FINISHED") {
        const error = checkStandingsError(results);
        if (error) {
          setValidationError(error);
          setActionLoading(false);
          return;
        }
        setValidationError(null);

        // Submit standings first
        await submitRaceResults(raceId, results);
        
        // Submit report summary if drafted
        if (reportSummary.trim()) {
          await submitRefereeReport(raceId, {
            title: `Official Steward Standings Report - Race ${race.code}`,
            summary: reportSummary
          });
        }
      }

      const nextStatus = await transitionRaceState(raceId);
      setRace(prev => ({ ...prev, status: nextStatus }));
    } catch (err) {
      alert("Verification Guard: Cannot transition. Make sure all checks are fully processed and valid.");
    } finally {
      setActionLoading(false);
    }
  };

  // Mock AI Speech-to-Text Simulator
  const triggerMockSpeechToText = () => {
    if (isTyping || aiActive) return;
    setAiActive(true);
    setReportSummary("");
    
    setTimeout(() => {
      setAiActive(false);
      setIsTyping(true);
      
      const fullText = `Steward official observation: Race initiated smoothly. Weather conditions dry sandy turf. At meter 400, horse Thunderstrike (Jockey Julian Sterling) shifted lane abruptly, causing minor collision warnings. Jockey Sterling made corrective adjustments. At meter 1800, horse Golden Arrow showed spectacular sprint speed. No major fouls detected; race concluded securely. Position entries verified as accurate.`;
      
      let index = 0;
      const typeSpeed = 15;
      const timer = setInterval(() => {
        setReportSummary(prev => prev + fullText[index]);
        index++;
        if (index >= fullText.length - 1) {
          clearInterval(timer);
          setIsTyping(false);
        }
      }, typeSpeed);
    }, 2500);
  };

  const quickTags = [
    "Lane Intrusion at meter 400",
    "Excessive whip warning logged",
    "Late gate exit observed",
    "Minor collision at final corner",
    "Jockey warning - unsteady seat"
  ];

  const handleAddTag = (tag: string) => {
    setReportSummary(prev => {
      const space = prev.trim() ? " " : "";
      return prev.trim() + space + `[Incident: ${tag}].`;
    });
  };

  const handleLogViolation = async (participant: ParticipantVerification, severity: "LOW" | "MEDIUM" | "HIGH", description: string) => {
    try {
      const violation: ViolationEntry = {
        offenderId: participant.participantId,
        severity,
        description
      };
      await submitViolation(raceId, violation);
      setViolations(prev => [...prev, violation]);
      setActiveInfractionPopover(null);
    } catch (err) {
      // Fallback
      const violation: ViolationEntry = {
        offenderId: participant.participantId,
        severity,
        description
      };
      setViolations(prev => [...prev, violation]);
      setActiveInfractionPopover(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-800/10 border-t-[#004d3d] animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-4 border-amber-500/10 border-b-amber-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
        </div>
        <div className="text-slate-500 font-semibold text-sm tracking-widest uppercase">Initializing Officiating Console...</div>
      </div>
    );
  }

  const currentStepIndex = STEPS.indexOf(race.status);
  const isTransitionDisabled = race.status === "PRE_CHECKING" && participants.some(p => p.status === "PENDING");
  
  // Custom audio waveform elements
  const waveformBars = Array.from({ length: 12 });

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 font-sans antialiased text-slate-800 p-2 lg:p-6 bg-slate-50/50 min-h-screen">
      
      {/* Dynamic Keyframe Injection for premium custom animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes wave-bounce {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1.4); }
        }
        .audio-bar {
          animation: wave-bounce 1.2s ease-in-out infinite;
          transform-origin: bottom;
        }
        .audio-bar:nth-child(2n) { animation-delay: 0.15s; }
        .audio-bar:nth-child(3n) { animation-delay: 0.3s; }
        .audio-bar:nth-child(4n) { animation-delay: 0.45s; }
        .audio-bar:nth-child(5n) { animation-delay: 0.6s; }
        
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        .pulse-active {
          animation: pulse-ring 2s infinite ease-in-out;
        }
      `}} />

      {/* LEFT SIDEBAR - Steward Info Panel */}
      <aside className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
        
        {/* Steward Profile & Identity */}
        <div className="bg-[#004d3d] text-white rounded-2xl p-6 shadow-lg border border-[#003d30] overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -translate-y-8 translate-x-8"></div>
          <div className="flex items-center gap-3.5 mb-5 relative z-10">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold text-lg shadow-inner">
              S
            </div>
            <div>
              <h3 className="text-xs text-emerald-300 font-bold tracking-widest uppercase">STEWARD CHIEF</h3>
              <p className="text-sm font-bold text-white tracking-wide">Race Referee Console</p>
            </div>
          </div>

          <div className="space-y-3.5 border-t border-emerald-800/60 pt-4 text-xs relative z-10">
            <div className="flex justify-between items-center text-emerald-100">
              <span className="opacity-75">Steward Role:</span>
              <strong className="text-white font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Official Steward
              </strong>
            </div>
            <div className="flex justify-between items-center text-emerald-100">
              <span className="opacity-75">Licence ID:</span>
              <strong className="text-white font-mono">LIC-2026-9938</strong>
            </div>
            <div className="flex justify-between items-center text-emerald-100">
              <span className="opacity-75">Assigned Station:</span>
              <strong className="text-white font-medium">Turf Tower C</strong>
            </div>
          </div>
        </div>

        {/* Race Specifications Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">RACE DATA</h3>
            <span className="text-[9px] font-mono font-bold text-[#004d3d] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100/50">
              {race.code}
            </span>
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900 leading-snug">{race.name}</h4>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              May 29, 2026 - Season Derby
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-50 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase">DISTANCE</span>
              <strong className="text-slate-800 text-sm font-semibold">{race.distanceMeters} Meters</strong>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase">TRACK STATE</span>
              <strong className="text-slate-800 text-sm font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Sand / Dry Sand
              </strong>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase">OFFICIALS</span>
              <strong className="text-slate-800 text-sm font-semibold">3 Members</strong>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase">WEATHER</span>
              <strong className="text-slate-800 text-sm font-semibold">Sunny / 28°C</strong>
            </div>
          </div>

          {/* Simple Race Course Track Map Graphic */}
          <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-3 flex flex-col gap-2">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Turf Path Diagram</span>
            <div className="h-16 relative bg-slate-900/5 rounded-lg border border-slate-200/50 flex items-center justify-center overflow-hidden">
              {/* Virtual Oval Track SVG */}
              <svg className="w-11/12 h-5/6 text-[#004d3d]/20" viewBox="0 0 160 80" fill="none" stroke="currentColor" strokeWidth="6">
                <rect x="10" y="10" width="140" height="60" rx="30" />
              </svg>
              <svg className="w-11/12 h-5/6 absolute text-[#004d3d] opacity-40 animate-pulse" viewBox="0 0 160 80" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5">
                <rect x="10" y="10" width="140" height="60" rx="30" />
              </svg>
              <div className="absolute left-6 text-[8px] font-bold text-slate-400 uppercase tracking-widest">Paddock</div>
              <div className="absolute right-6 text-[8px] font-bold text-[#004d3d] uppercase tracking-widest font-mono">FINISH</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONSOLE CANVAS */}
      <div className="flex-1 bg-white border border-slate-200 rounded-3xl shadow-sm p-6 lg:p-8 flex flex-col gap-6 relative overflow-hidden">
        
        {/* Glow Header Panel */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-5 gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-950 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#004d3d] flex items-center justify-center text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              Steward Officiating Console
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">Professional secure panel governing real-time safety verification & race stand.</p>
          </div>
          
          <Link 
            to="/referee" 
            className="self-start sm:self-auto text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 hover:-translate-y-0.5 active:scale-95 shadow-xs"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Exit Console
          </Link>
        </div>

        {/* PROGRESS STEPPER - Premium horizontal sequence */}
        <div className="flex flex-nowrap items-center px-4 py-5 bg-slate-50 rounded-2xl border border-slate-100 overflow-x-auto gap-4 scrollbar-none">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isActive = idx === currentStepIndex;
            return (
              <div key={step} className="flex items-center shrink-0 last:flex-none">
                <div className="flex items-center gap-2.5 relative">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 border ${
                      isCompleted 
                        ? "bg-[#004d3d] border-[#004d3d] text-white shadow-md shadow-[#004d3d]/10 scale-95" 
                        : isActive 
                          ? "border-[#004d3d] text-[#004d3d] font-black bg-white shadow-md ring-4 ring-[#004d3d]/15 scale-105" 
                          : "bg-white border-slate-200 text-slate-400"
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : idx + 1}
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[10px] uppercase font-black tracking-widest ${
                      isActive ? "text-[#004d3d]" : isCompleted ? "text-slate-600 font-bold" : "text-slate-400"
                    }`}>
                      {step.replace("_", " ")}
                    </span>
                    <span className="text-[8px] text-slate-400 leading-none">
                      {idx === 0 && "Time Check"}
                      {idx === 1 && "Safety Gate"}
                      {idx === 2 && "Stall Lineup"}
                      {idx === 3 && "Running"}
                      {idx === 4 && "Timing Desk"}
                      {idx === 5 && "Submission"}
                    </span>
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`h-[2px] w-8 sm:w-12 mx-3 transition-all duration-500 rounded-full ${
                    idx < currentStepIndex ? "bg-[#004d3d]" : "bg-slate-200"
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* DYNAMIC CANVAS AREA - switch-case wrapper for race.status */}
        <div className="bg-[#fdfdfd] border border-slate-200/60 rounded-3xl p-6 lg:p-8 min-h-[380px] relative transition-all duration-300 shadow-sm flex flex-col justify-between">
          
          {/* VIEW 1: SCHEDULED */}
          {race.status === "SCHEDULED" && (
            <div className="text-center py-12 space-y-6 max-w-lg mx-auto flex flex-col items-center">
              <div className="w-16 h-16 bg-[#004d3d]/5 text-[#004d3d] border border-[#004d3d]/10 rounded-2xl flex items-center justify-center shadow-inner relative">
                <div className="absolute inset-0 rounded-2xl border-2 border-[#004d3d]/25 pulse-active"></div>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Race is Scheduled</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Lượt chạy đang trong trạng thái chờ. Hệ thống kiểm tra an toàn pre-check mở khóa tự động trong phạm vi 30 phút trước thời gian xuất phát.
                </p>
              </div>
              <div className="inline-flex items-center gap-2.5 bg-[#fcfaf2] border border-[#d4af37]/20 font-mono text-xs font-bold px-5 py-3 rounded-2xl text-slate-700 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-ping"></span>
                Time to Activation: <span className="text-[#004d3d] font-black">00:24:15</span>
              </div>
            </div>
          )}

          {/* VIEW 2: PRE_CHECKING */}
          {race.status === "PRE_CHECKING" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3.5 gap-2">
                <div>
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#004d3d]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 0A48.536 48.536 0 0112 3m0 0c2.917 0 5.747.294 8.5.862m-21 10.398c0-.552.448-1 1-1h6.25a1 1 0 011 1v3.83a1 1 0 001 1h2.01a1 1 0 001-1v-3.83a1 1 0 011-1H20a1 1 0 011 1v3.83a1 1 0 01-1 1h-6.25a1 1 0 01-1-1v-3.83a1 1 0 00-1-1H9.76a1 1 0 00-1 1v3.83a1 1 0 01-1 1H3a1 1 0 01-1-1v-3.83z" />
                    </svg>
                    Veterinary & Weight Check-in
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Verify safety conditions, gear setups, and jockey target weights below.</p>
                </div>
                <span className="text-[10px] bg-red-50 text-rose-700 font-extrabold px-3 py-1.5 border border-rose-100 rounded-xl tracking-wider uppercase">
                  Guard Active: 0% PENDING ENFORCED
                </span>
              </div>

              {/* Roster Table */}
              <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs bg-white">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                      <th className="p-4 font-black">Gate Stall / Horse Info</th>
                      <th className="p-4 font-black">Assigned Jockey</th>
                      <th className="p-4 text-center font-black">Gear Verified</th>
                      <th className="p-4 text-center font-black">Health Verified</th>
                      <th className="p-4 text-center font-black">Steward status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p, idx) => (
                      <tr key={p.participantId} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        
                        {/* Horse Details with visual stall ID */}
                        <td className="p-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center border border-slate-200">
                              #{idx + 1}
                            </span>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-950 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                </svg>
                                {p.horseName}
                              </span>
                              <span className="text-[10px] text-slate-400">RFID Verified</span>
                            </div>
                          </div>
                        </td>

                        {/* Jockey details and weight */}
                        <td className="p-4 text-slate-700 font-medium">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800">{p.jockeyName}</span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <svg className="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="9" />
                                <path d="M12 7v5l3 3" />
                              </svg>
                              Weight: {p.jockeyWeight} kg
                            </span>
                          </div>
                        </td>

                        {/* Custom Gear Toggle Switch */}
                        <td className="p-4 text-center">
                          <div className="inline-flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => handleCheckboxChange(idx, "gearOk")}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#004d3d]/20 ${
                                p.gearOk ? "bg-[#004d3d]" : "bg-slate-200"
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                  p.gearOk ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>
                        </td>

                        {/* Custom Health Toggle Switch */}
                        <td className="p-4 text-center">
                          <div className="inline-flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => handleCheckboxChange(idx, "healthOk")}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#004d3d]/20 ${
                                p.healthOk ? "bg-[#004d3d]" : "bg-slate-200"
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                  p.healthOk ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>
                        </td>

                        {/* Dropdown status selector */}
                        <td className="p-4 text-center">
                          <select
                            value={p.status}
                            onChange={(e) => handleStatusChange(idx, e.target.value as any)}
                            className={`border rounded-xl px-2.5 py-1.5 text-[10px] font-black tracking-wider focus:outline-none focus:ring-2 focus:ring-[#004d3d]/10 cursor-pointer transition-all ${
                              p.status === "PASSED" 
                                ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                                : p.status === "FAILED"
                                  ? "bg-rose-50 border-rose-200 text-rose-800 animate-pulse"
                                  : "bg-amber-50 border-amber-200 text-amber-800"
                            }`}
                          >
                            <option value="PASSED">PASSED</option>
                            <option value="FAILED">FAILED</option>
                            <option value="PENDING">PENDING</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Warning Notice if unverified participants remain */}
              {isTransitionDisabled && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <div>
                    <h5 className="text-xs font-black text-amber-800 uppercase tracking-wide">Checks Incomplete</h5>
                    <p className="text-[11px] text-amber-700 leading-relaxed mt-0.5">
                      Cần hoàn thành xác nhận an toàn cho tất cả thí sinh. Các thí sinh ở trạng thái PENDING phải được cập nhật thành PASSED hoặc FAILED.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: READY */}
          {race.status === "READY" && (
            <div className="text-center py-8 space-y-6 max-w-2xl mx-auto flex flex-col items-center">
              
              <div className="w-16 h-16 bg-emerald-50 text-[#004d3d] border border-emerald-100 rounded-2xl flex items-center justify-center shadow-md relative">
                <div className="absolute inset-0 rounded-2xl border-4 border-emerald-500/25 pulse-active"></div>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 8.41a14.98 14.98 0 00-6.16 12.12A14.98 14.98 0 0015.59 14.37zm0 0L12 10.78" />
                </svg>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Track Gate is Ready</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Tất cả các cặp nài và ngựa đã hoàn thành kiểm tra thủ tục an toàn. Lượt chạy đã sẵn sàng xuất phát. Thí sinh bị FAILED đã tự động rút lui (SCRATCHED).
                </p>
              </div>

              {/* Starting Stalls Board */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-left shadow-xs w-full space-y-3.5">
                <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">STARTING LINEUP GATES</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {participants.map((p, idx) => {
                    const isPassed = p.status === "PASSED";
                    return (
                      <div 
                        key={p.participantId} 
                        className={`rounded-xl p-3 border text-xs flex flex-col justify-between h-20 transition-all ${
                          isPassed 
                            ? "bg-white border-slate-200 hover:border-emerald-500/40 shadow-xs" 
                            : "bg-slate-100/70 border-slate-200 text-slate-400 relative overflow-hidden"
                        }`}
                      >
                        {/* Scratched visual overlay background striped lines */}
                        {!isPassed && (
                          <div className="absolute inset-0 opacity-5 select-none pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0px, #000 4px, transparent 4px, transparent 8px)' }}></div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className={`w-5 h-5 rounded-md text-[9px] font-black flex items-center justify-center border ${
                            isPassed 
                              ? "bg-emerald-50 text-[#004d3d] border-emerald-200" 
                              : "bg-slate-200 text-slate-500 border-slate-300"
                          }`}>
                            G{idx+1}
                          </span>
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            isPassed 
                              ? "bg-emerald-100/50 text-[#004d3d]" 
                              : "bg-rose-100/50 text-rose-600"
                          }`}>
                            {isPassed ? "APPROVED" : "SCRATCHED"}
                          </span>
                        </div>
                        <div className="font-bold text-slate-900 truncate mt-2">
                          {p.horseName}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: ONGOING */}
          {race.status === "ONGOING" && (
            <div className="space-y-6">
              
              {/* Slate Stopwatch Board */}
              <div className="bg-[#111c19] border border-[#003d30] rounded-3xl p-6 text-center space-y-2 shadow-2xl relative overflow-hidden">
                <div className="absolute top-3 left-4 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  <span className="text-[9px] font-black tracking-widest text-[#004d3d] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">
                    LIVE TIMING RECORD
                  </span>
                </div>
                <div className="text-5xl font-mono font-black tracking-widest text-emerald-400 tabular-nums">
                  {stopwatchTime}
                </div>
                <p className="text-[10px] text-emerald-300/60 font-semibold tracking-wide">Stopwatch running with millisecond accuracy</p>
              </div>

              {/* Simulated Turf Track Animation */}
              <div className="bg-emerald-850 bg-gradient-to-r from-[#003d30] to-[#004d3d] border border-[#002e24] rounded-2xl p-5 shadow-inner space-y-3">
                <div className="flex justify-between items-center text-[10px] text-emerald-100 font-extrabold uppercase tracking-wider">
                  <span>Track Progression Visualizer</span>
                  <span className="font-mono text-emerald-300 font-black">{ongoingProgress}% completed</span>
                </div>
                <div className="h-20 bg-emerald-950/80 border border-emerald-900 rounded-xl relative overflow-hidden flex flex-col justify-around py-1">
                  
                  {/* Visual Lane tracks */}
                  <div className="absolute inset-0 opacity-20 flex flex-col justify-between py-2 pointer-events-none">
                    <div className="h-px bg-white border-dashed border-t"></div>
                    <div className="h-px bg-white border-dashed border-t"></div>
                    <div className="h-px bg-white border-dashed border-t"></div>
                  </div>

                  {/* Horizontal visual scrolling elements for APPROVED horses */}
                  {participants.filter(p => p.status === "PASSED").map((p, index) => {
                    // Stagger spacing slightly to simulate active running
                    const offset = (p.participantId % 3) * 3 - 3;
                    const horseProgress = Math.min(100, Math.max(5, ongoingProgress + offset));
                    return (
                      <div 
                        key={p.participantId} 
                        className="relative h-4 transition-all duration-300 ease-out" 
                        style={{ left: `${horseProgress}%`, marginLeft: '-16px' }}
                      >
                        <div className="absolute flex items-center gap-1.5">
                          {/* Horse Token */}
                          <div className="w-5.5 h-5.5 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] flex items-center justify-center shadow-lg border border-white">
                            {p.participantId}
                          </div>
                          {ongoingProgress < 100 && (
                            <span className="text-[7px] font-mono text-emerald-100 font-bold bg-[#111c19]/60 px-1 rounded truncate max-w-[60px]">
                              {p.horseName}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Quick Incident Grid */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    Steward Infraction Logger
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">Record lane issues or whip fouls dynamically</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                  {participants.filter(p => p.status === "PASSED").map(p => {
                    const horseViolations = violations.filter(v => v.offenderId === p.participantId);
                    return (
                      <div key={p.participantId} className="relative">
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-xs hover:border-red-200 hover:shadow-sm transition-all duration-300">
                          <div>
                            <div className="text-xs font-black text-slate-950 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              {p.horseName}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium mt-0.5">{p.jockeyName}</div>
                            
                            {/* Infraction tags listed directly on card */}
                            {horseViolations.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {horseViolations.map((v, i) => (
                                  <span 
                                    key={i} 
                                    className={`text-[8px] font-extrabold px-2 py-0.5 rounded border ${
                                      v.severity === "HIGH" 
                                        ? "bg-red-50 text-red-700 border-red-200" 
                                        : v.severity === "MEDIUM" 
                                          ? "bg-amber-50 text-amber-700 border-amber-200" 
                                          : "bg-slate-50 text-slate-700 border-slate-200"
                                    }`}
                                  >
                                    {v.severity}: {v.description.substring(0, 10)}...
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => setActiveInfractionPopover(activeInfractionPopover === p.participantId ? null : p.participantId)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-3 py-2 border border-rose-200 rounded-xl text-[10px] transition-all flex items-center gap-1.5 hover:-translate-y-0.5 active:scale-95 shadow-2xs cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                            Flag Foul
                          </button>
                        </div>

                        {/* Dropdown popover list */}
                        {activeInfractionPopover === p.participantId && (
                          <div className="absolute right-0 top-12 z-25 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 w-64 space-y-2.5 animate-fade-in border-t-2 border-t-[#004d3d]">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex justify-between items-center">
                              <span>Incident Severity Classification</span>
                              <button onClick={() => setActiveInfractionPopover(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <button 
                                onClick={() => handleLogViolation(p, "LOW", "Whip violation")}
                                className="text-left text-xs hover:bg-slate-50 px-2.5 py-2 rounded-xl text-slate-700 font-semibold border border-transparent hover:border-slate-100 flex justify-between items-center"
                              >
                                <span>Excessive Whip (Low)</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              </button>
                              <button 
                                onClick={() => handleLogViolation(p, "MEDIUM", "Lane intrusion")}
                                className="text-left text-xs hover:bg-slate-50 px-2.5 py-2 rounded-xl text-slate-700 font-semibold border border-transparent hover:border-slate-100 flex justify-between items-center"
                              >
                                <span>Lane Intrusion (Med)</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              </button>
                              <button 
                                onClick={() => handleLogViolation(p, "HIGH", "Dangerous block")}
                                className="text-left text-xs hover:bg-slate-50 px-2.5 py-2 rounded-xl text-slate-700 font-semibold border border-transparent hover:border-slate-100 flex justify-between items-center text-red-600"
                              >
                                <span>Dangerous Block (High)</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 5: FINISHED */}
          {race.status === "FINISHED" && (
            <div className="space-y-6">
              
              {/* Section Header */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#004d3d]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013-3V9m-3 9.75a3 3 0 01-3-3V3m0 12.75a3 3 0 003-3V9m-3 9.75h-3m3 0a3 3 0 003-3V9m-12 6.75a3 3 0 01-3-3V9m3 5.75a3 3 0 003-3V3m0 9.75a3 3 0 01-3-3V9m3 5.75h3m-3 0a3 3 0 01-3-3V9m3-6h3m-3 0a3 3 0 00-3 3v3" />
                  </svg>
                  Timing and Ranking Entry Sheet
                </h3>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-xl">
                  Entry Mode
                </span>
              </div>

              {/* Roster entries split layout: entries on left, real-time podium on right */}
              <div className="flex flex-col xl:flex-row gap-6">
                
                {/* List of inputs */}
                <div className="flex-1 space-y-3.5">
                  {results.map((p) => {
                    const isScratched = p.status === "WITHDRAWN";
                    return (
                      <div 
                        key={p.participantId} 
                        className={`flex gap-4 items-center border rounded-2xl p-4 transition-all ${
                          isScratched 
                            ? "bg-slate-50/50 border-slate-100 opacity-60 text-slate-400 select-none" 
                            : "bg-white border-slate-200 hover:border-slate-350 hover:shadow-2xs"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-black text-slate-950 flex items-center gap-1.5">
                            {p.horseName}
                            {isScratched && (
                              <span className="text-[8px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                                Scratched
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-semibold mt-0.5">{p.jockeyName}</div>
                        </div>

                        {/* Rank Position input */}
                        <div className="w-24">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Rank Position</label>
                          <input
                            type="number"
                            disabled={isScratched}
                            value={p.position}
                            onChange={(e) => handleResultChange(p.participantId, "position", e.target.value)}
                            placeholder="1"
                            className="w-full border border-slate-200 focus:border-[#004d3d] focus:ring-2 focus:ring-[#004d3d]/10 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 text-center"
                          />
                        </div>

                        {/* Time duration in seconds input */}
                        <div className="w-36">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Time (Seconds)</label>
                          <input
                            type="number"
                            step="0.001"
                            disabled={isScratched}
                            value={p.finishTimeSeconds}
                            onChange={(e) => handleResultChange(p.participantId, "finishTimeSeconds", e.target.value)}
                            placeholder="92.405"
                            className="w-full border border-slate-200 focus:border-[#004d3d] focus:ring-2 focus:ring-[#004d3d]/10 rounded-xl px-3 py-2 text-xs font-bold font-mono focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 text-center"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right side live sorted podium visualizer */}
                <div className="w-full xl:w-72 bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shrink-0 flex flex-col justify-between">
                  <div className="space-y-3">
                    <h4 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">LIVE PODIUM SORTING</h4>
                    <div className="flex flex-col gap-2">
                      {results
                        .filter(r => r.status === "FINISHED" && r.position !== "")
                        .sort((a, b) => Number(a.position) - Number(b.position))
                        .map((r, i) => (
                          <div 
                            key={r.participantId} 
                            className="bg-white border border-slate-200/60 rounded-xl p-3 flex items-center justify-between shadow-3xs"
                          >
                            <div className="flex items-center gap-2.5">
                              {/* Custom podium medallion styles */}
                              <span className={`w-6 h-6 rounded-full text-[9px] font-black flex items-center justify-center border ${
                                r.position === 1 
                                  ? "bg-amber-100 text-amber-850 border-amber-300 shadow-sm" 
                                  : r.position === 2 
                                    ? "bg-slate-100 text-slate-700 border-slate-350"
                                    : r.position === 3 
                                      ? "bg-orange-100 text-orange-800 border-orange-300"
                                      : "bg-slate-50 text-slate-500 border-slate-200"
                              }`}>
                                {r.position}
                              </span>
                              <div className="min-w-0">
                                <div className="text-xs font-black text-slate-950 truncate max-w-[120px]">{r.horseName}</div>
                                <div className="text-[9px] font-mono text-slate-500 font-bold leading-none">{r.finishTimeSeconds} seconds</div>
                              </div>
                            </div>
                            
                            {/* Gold medal visual star for rank 1 */}
                            {r.position === 1 && (
                              <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                              </svg>
                            )}
                          </div>
                        ))}
                      {results.filter(r => r.status === "FINISHED" && r.position !== "").length === 0 && (
                        <div className="text-center py-8 text-[11px] text-slate-400 font-medium">Enter ranks on the left to see live podium sorting.</div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-200/60 pt-4 mt-4 space-y-1.5">
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                      <span>Total Finishers:</span>
                      <strong className="text-slate-800 font-mono">{results.filter(r => r.status === "FINISHED").length}</strong>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                      <span>Withdrawn:</span>
                      <strong className="text-rose-650 font-mono">{results.filter(r => r.status === "WITHDRAWN").length}</strong>
                    </div>
                  </div>
                </div>

              </div>

              {/* Dynamic Standing Order Verification Warning Card */}
              {validationError && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3.5 shadow-sm">
                  <svg className="w-5.5 h-5.5 text-rose-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <div>
                    <h5 className="text-xs font-black text-rose-800 uppercase tracking-wide">Standing Order Discrepancy</h5>
                    <p className="text-[11px] text-rose-700 leading-relaxed mt-0.5 font-semibold">
                      {validationError}
                    </p>
                  </div>
                </div>
              )}

              {/* AI REPORT LOGGER WITH OSCILLATING SOUND WAVES */}
              <div className="space-y-3.5 border-t border-slate-200 pt-5">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    Steward Official Observations & Reports
                  </label>
                  <button
                    onClick={triggerMockSpeechToText}
                    disabled={aiActive || isTyping}
                    className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-[10px] font-black border transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 shadow-2xs disabled:cursor-not-allowed ${
                      aiActive 
                        ? "bg-red-50 border-red-200 text-red-600 animate-pulse shadow-sm" 
                        : "bg-[#004d3d]/5 border-[#004d3d]/20 text-[#004d3d] hover:bg-[#004d3d]/10"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 003-3v-6a3 3 0 00-6 0v6a3 3 0 003 3z" />
                    </svg>
                    {aiActive ? "Listening..." : "Speak to Voice AI"}
                  </button>
                </div>

                {/* Oscillating sound wave panel */}
                {aiActive && (
                  <div className="flex gap-2 justify-center items-center h-14 bg-slate-900 border border-slate-950 rounded-2xl shadow-inner px-4">
                    <div className="flex gap-1 items-end h-8">
                      {waveformBars.map((_, i) => (
                        <span key={i} className="audio-bar w-1 bg-emerald-400 rounded-full h-full"></span>
                      ))}
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-black ml-3 tracking-widest uppercase">RECORDING AUDIO IN REAL-TIME</span>
                  </div>
                )}

                {/* Quick preset incidents tags */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase shrink-0 py-1 mr-1">Suggested Incidents:</span>
                  {quickTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddTag(tag)}
                      className="bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-lg text-[9px] px-2.5 py-1 text-slate-600 font-bold transition-all hover:scale-102 active:scale-97 cursor-pointer"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>

                <textarea
                  value={reportSummary}
                  onChange={(e) => setReportSummary(e.target.value)}
                  placeholder="Use the voice dictation tool above to auto-generate findings, tap suggested tags, or draft incidents manually..."
                  className="w-full border border-slate-200/80 rounded-2xl p-4 text-xs font-semibold focus:outline-none focus:border-[#004d3d] focus:ring-2 focus:ring-[#004d3d]/10 min-h-[110px] shadow-2xs leading-relaxed"
                />
              </div>

            </div>
          )}

          {/* VIEW 6: RESULT_SUBMITTED */}
          {race.status === "RESULT_SUBMITTED" && (
            <div className="space-y-6">
              
              {/* Lock screen top state */}
              <div className="text-center py-6 space-y-4 max-w-md mx-auto flex flex-col items-center">
                <div className="w-16 h-16 bg-emerald-50 text-[#004d3d] border border-emerald-100 rounded-2xl flex items-center justify-center shadow-md">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Console is Fully Locked</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Kết quả đã được ghi nhận. Toàn bộ các thông số kiểm tra, thời gian, thứ hạng đã được đông băng và chuyển đến Admin phê duyệt.
                  </p>
                </div>
              </div>

              {/* Secure Receipt Document Panel */}
              <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 relative overflow-hidden max-w-xl mx-auto border-t-4 border-t-[#004d3d]">
                
                {/* Visual Cryptographic Hash Barcode Stamp */}
                <div className="absolute top-4 right-4 flex flex-col items-end opacity-20">
                  <svg className="w-24 h-6 text-slate-800" viewBox="0 0 100 20" fill="currentColor">
                    <rect x="0" width="3" height="20"/>
                    <rect x="5" width="1" height="20"/>
                    <rect x="8" width="4" height="20"/>
                    <rect x="14" width="2" height="20"/>
                    <rect x="18" width="1" height="20"/>
                    <rect x="21" width="3" height="20"/>
                    <rect x="26" width="1" height="20"/>
                    <rect x="30" width="5" height="20"/>
                    <rect x="37" width="2" height="20"/>
                    <rect x="41" width="1" height="20"/>
                    <rect x="44" width="3" height="20"/>
                    <rect x="49" width="4" height="20"/>
                    <rect x="55" width="2" height="20"/>
                    <rect x="59" width="1" height="20"/>
                    <rect x="62" width="5" height="20"/>
                    <rect x="69" width="2" height="20"/>
                    <rect x="73" width="1" height="20"/>
                    <rect x="76" width="3" height="20"/>
                    <rect x="81" width="4" height="20"/>
                    <rect x="87" width="1" height="20"/>
                    <rect x="90" width="3" height="20"/>
                    <rect x="95" width="5" height="20"/>
                  </svg>
                  <span className="text-[6px] font-mono font-bold uppercase mt-1">Hash: STWD-SECURE-9ea7</span>
                </div>

                <div className="border-b border-slate-100 pb-3 mb-4">
                  <h4 className="text-xs font-black text-slate-900 tracking-wider uppercase">Official Turf Standings Sheet</h4>
                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">GENERATED: MAY 29, 2026 11:00 AM</p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-50 pb-1.5">
                    <span className="text-slate-400">Race Code:</span>
                    <strong className="text-slate-800 font-mono">{race.code}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-1.5">
                    <span className="text-slate-400">Official Race:</span>
                    <strong className="text-slate-800">{race.name}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-1.5">
                    <span className="text-slate-400">Referee Head:</span>
                    <strong className="text-[#004d3d]">Official Head Steward</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-1.5">
                    <span className="text-slate-400">Verification Status:</span>
                    <strong className="text-emerald-700">SUBMITTED TO BOARD</strong>
                  </div>
                </div>

                {/* Final podium preview list */}
                <div className="mt-5 space-y-2">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">Final Positions</span>
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3 divide-y divide-slate-100">
                    {results
                      .filter(r => r.status === "FINISHED")
                      .sort((a, b) => Number(a.position) - Number(b.position))
                      .map((r) => (
                        <div key={r.participantId} className="flex justify-between items-center py-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-700 w-4">{r.position}.</span>
                            <span className="font-bold text-slate-950">{r.horseName}</span>
                          </div>
                          <span className="font-mono text-slate-500 text-[11px] font-bold">{r.finishTimeSeconds}s</span>
                        </div>
                      ))}
                    {results.filter(r => r.status === "FINISHED").length === 0 && (
                      <div className="text-center py-3 text-[10px] text-slate-400">No active finishers recorded.</div>
                    )}
                  </div>
                </div>

                {/* Export panel mock actions */}
                <div className="mt-6 flex gap-3">
                  <button 
                    onClick={() => {
                      setShowExportModal(true);
                      setExportSuccess(false);
                    }}
                    className="flex-1 bg-slate-950 hover:bg-slate-850 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 hover:-translate-y-0.5 active:scale-95 shadow-md cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Print Standings Sheet
                  </button>
                  <button 
                    onClick={() => {
                      setShowExportModal(true);
                      setExportSuccess(false);
                    }}
                    className="flex-1 bg-white border border-slate-300 hover:border-slate-450 hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 hover:-translate-y-0.5 active:scale-95 shadow-2xs cursor-pointer"
                  >
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Export Standings PDF
                  </button>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* PERSISTENT ACTION FOOTER */}
        {race.status !== "RESULT_SUBMITTED" && (
          <div className="flex flex-col sm:flex-row justify-between sm:items-center border-t border-slate-100 pt-5 gap-3.5">
            <div className="text-xs text-slate-500 font-semibold">
              Current Officiating Mode: <strong className="text-[#004d3d] uppercase tracking-wider font-extrabold">{race.status.replace("_", " ")}</strong>
            </div>
            
            <button
              onClick={handleNextStep}
              disabled={actionLoading || isTransitionDisabled || !!validationError}
              className="bg-[#004d3d] hover:bg-[#00372b] disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold px-7 py-3.5 rounded-2xl text-xs transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-97 disabled:active:scale-100 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              )}
              {actionLoading 
                ? "Processing Transition..." 
                : race.status === "FINISHED" 
                  ? "Finalize & Submit Standings" 
                  : "Advance Officiating Step"}
            </button>
          </div>
        )}

      </div>

      {/* MOCK EXPORT MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative">
            <button 
              onClick={() => setShowExportModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-black cursor-pointer"
            >
              ✕
            </button>
            
            {!exportSuccess ? (
              <div className="text-center space-y-4 py-4 flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#004d3d] flex items-center justify-center shadow-inner">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-black text-slate-900">Compile Export Credentials</h4>
                  <p className="text-xs text-slate-500">Securely compiling race logs, timing positions, and steward incident reports into an encrypted PDF receipt.</p>
                </div>
                <button 
                  onClick={() => {
                    setExportSuccess(true);
                    setTimeout(() => {
                      setShowExportModal(false);
                    }, 1800);
                  }}
                  className="w-full bg-[#004d3d] hover:bg-[#00372b] text-white font-extrabold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 hover:-translate-y-0.5 active:scale-95 shadow-md cursor-pointer"
                >
                  Generate Official Ledger
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4 py-4 flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-sm animate-pulse">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-black text-emerald-800">Ledger Download Started</h4>
                  <p className="text-xs text-slate-500">PDF successfully compiled and downloaded to local downloads directory.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
