import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Flag,
  Gauge,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Trophy,
  Users,
  UserCheck,
  UserRound,
  X,
  Megaphone,
  Undo2,
  Globe,
  Lock,
  Unlock,
  Pencil,
  Trash2,
} from "lucide-react";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { RaceMediaPanel } from "../../components/race-media/RaceMediaPanel";
import {
  approveOrganizerJockeyApplication,
  approveOrganizerTournamentRegistration,
  assignOrganizerRaceReferee,
  createOrganizerRace,
  deleteOrganizerRace,
  getLicensedReferees,
  getOrganizerTournament,
  getMyOrganizerTournaments,
  getOrganizerJockeyApplications,
  getOrganizerParticipants,
  getOrganizerRaces,
  getOrganizerRaceResults,
  getOrganizerTournamentRegistrations,
  getTournamentRefereeContracts,
  inviteReferee,
  lockOrganizerParticipants,
  unlockOrganizerParticipants,
  publishOrganizerRaceResults,
  rejectOrganizerJockeyApplication,
  rejectOrganizerTournamentRegistration,
  reopenOrganizerRaceResults,
  submitTournamentForApproval,
  terminateRefereeContract,
  updateOrganizerRace,
  updateOrganizerTournament,
  updateOrganizerTournamentStatus,
  confirmOrganizerRaceResults,
} from "../../api/racingApi";
import type {
  Race,
  RaceStatus,
  Tournament,
  TournamentParticipant,
  TournamentRegistration,
  JockeyPoolApplication,
  RefereeContract,
  RefereeDirectoryEntry,
  PublicRaceResult,
  RacePayload,
} from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";
import { getTournamentDateValidationError } from "../../utils/tournamentDateValidation";

type ChampionshipTab = "overview" | "applications" | "participants" | "rounds" | "standings" | "controls";
type ApplicationView = "horses" | "jockeys";

const secondaryChampionshipTabs: Array<{ key: Exclude<ChampionshipTab, "overview">; label: string }> = [
  { key: "applications", label: "Applications" },
  { key: "participants", label: "Participants" },
  { key: "rounds", label: "Rounds" },
  { key: "standings", label: "Standings" },
  { key: "controls", label: "Controls" },
];

const championshipPhases = ["Registration", "Pool Formation", "Assignment", "Racing", "Completed"];

const emptyRoundForm = {
  name: "",
  code: "",
  raceDateTime: "",
  distanceMeters: "",
  maxParticipants: "",
};

const raceStatusMeta: Record<string, { label: string; className: string; helper: string }> = {
  SCHEDULED: {
    label: "Scheduled",
    className: "border-slate-200 bg-slate-50 text-slate-700",
    helper: "Race card is scheduled and waiting for operational checks.",
  },
  CHECKING: {
    label: "Checking",
    className: "border-amber-200 bg-amber-50 text-amber-800",
    helper: "Participant readiness and race-day requirements are being checked.",
  },
  READY: {
    label: "Ready",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    helper: "Race is cleared for start.",
  },
  ONGOING: {
    label: "Ongoing",
    className: "border-blue-200 bg-blue-50 text-blue-800",
    helper: "Race is currently in progress.",
  },
  FINISHED: {
    label: "Finished",
    className: "border-indigo-200 bg-indigo-50 text-indigo-800",
    helper: "Race is finished and waiting for result submission.",
  },
  RESULT_SUBMITTED: {
    label: "Result submitted",
    className: "border-violet-200 bg-violet-50 text-violet-800",
    helper: "Result has been submitted and needs organizer confirmation.",
  },
  RESULT_CONFIRMED: {
    label: "Result confirmed",
    className: "border-cyan-200 bg-cyan-50 text-cyan-800",
    helper: "Result ready for publishing.",
  },
  PUBLISHED: {
    label: "Published",
    className: "border-emerald-200 bg-emerald-100 text-emerald-900",
    helper: "Published to standings and public result surfaces.",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "border-rose-200 bg-rose-50 text-rose-800",
    helper: "Race has been cancelled.",
  },
};

function formatRaceDate(value?: string) {
  if (!value) {
    return "Not scheduled";
  }
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getRaceStatusMeta(status: string) {
  return raceStatusMeta[status] ?? {
    label: status.replace("_", " "),
    className: "border-slate-200 bg-slate-50 text-slate-700",
    helper: "Race status is being tracked by operations.",
  };
}

function getChampionshipPhase(status: string) {
  switch (status) {
    case "DRAFT":
    case "PENDING_APPROVAL":
    case "APPROVED":
    case "OPEN_REGISTRATION":
      return "Registration";
    case "CLOSED_REGISTRATION":
      return "Pool Formation";
    case "PARTICIPANTS_LOCKED":
    case "SCHEDULE_PUBLISHED":
      return "Assignment";
    case "ONGOING":
      return "Racing";
    case "COMPLETED":
      return "Completed";
    default:
      return "Registration";
  }
}

function getBadgeStyle(status: string) {
  switch (status) {
    case "OPEN_REGISTRATION":
      return "border-emerald-200 bg-emerald-100 text-emerald-800";
    case "ONGOING":
      return "border-[#bb8a3c]/30 bg-[#bb8a3c]/10 text-[#8a6a1c]";
    case "COMPLETED":
      return "border-[#efe9dd] bg-[#efe9dd] text-[#6f665b]";
    case "POSTPONED":
      return "border-orange-200 bg-orange-100 text-orange-800";
    case "CLOSED_REGISTRATION":
      return "border-amber-200 bg-amber-100 text-amber-800";
    case "PARTICIPANTS_LOCKED":
      return "border-indigo-200 bg-indigo-50 text-indigo-800";
    case "SCHEDULE_PUBLISHED":
      return "border-sky-200 bg-sky-100 text-sky-800";
    default:
      return "border-slate-200 bg-slate-100 text-slate-800";
  }
}

function getChampionshipNextActionLabel(tournament: Tournament, race: Race | null) {
  switch (tournament.status) {
    case "DRAFT":
      return "Submit for Approval";
    case "PENDING_APPROVAL":
      return "Awaiting Admin Approval";
    case "APPROVED":
      return "Open Registration";
    case "OPEN_REGISTRATION":
      return "Review Applications";
    case "CLOSED_REGISTRATION":
      return "Lock Participants";
    case "PARTICIPANTS_LOCKED":
      return "Publish Schedule";
    case "SCHEDULE_PUBLISHED":
      return "Open Round Control Center";
    case "ONGOING":
      return "Open Round Control Center";
    case "COMPLETED":
      return "Review Leaderboard";
    default:
      return "Review Round Status";
  }
}

export function OrganizerTournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const championshipId = Number(id);

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [allTournaments, setAllTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ChampionshipTab>("overview");
  const [races, setRaces] = useState<Race[]>([]);
  const [raceLoading, setRaceLoading] = useState(false);
  const [raceError, setRaceError] = useState("");
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const [jockeyApplications, setJockeyApplications] = useState<JockeyPoolApplication[]>([]);
  const [jockeyApplicationLoading, setJockeyApplicationLoading] = useState(false);
  const [jockeyApplicationError, setJockeyApplicationError] = useState("");
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [participantLoading, setParticipantLoading] = useState(false);
  const [participantError, setParticipantError] = useState("");
  const [applicationView, setApplicationView] = useState<ApplicationView>("horses");
  const [horseProcessingId, setHorseProcessingId] = useState<number | null>(null);
  const [jockeyProcessingId, setJockeyProcessingId] = useState<number | null>(null);
  const [horseRejectReasons, setHorseRejectReasons] = useState<Record<number, string>>({});
  const [jockeyRejectReasons, setJockeyRejectReasons] = useState<Record<number, string>>({});
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null);
  const [roundControlOpen, setRoundControlOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
    registrationStartAt: "",
    registrationEndAt: "",
    maxHorses: "",
    maxHorsesPerOwner: "2",
    totalPrizePool: "0",
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showStatusModal, setShowStatusModal] = useState<{ show: boolean; targetStatus: string }>({
    show: false,
    targetStatus: "",
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showCreateRoundModal, setShowCreateRoundModal] = useState(false);
  const [roundForm, setRoundForm] = useState(emptyRoundForm);
  const [roundFormError, setRoundFormError] = useState("");
  const [creatingRound, setCreatingRound] = useState(false);
  const [lockingParticipants, setLockingParticipants] = useState(false);
  const [manageRoundRaceId, setManageRoundRaceId] = useState<number | null>(null);

  // Referee / officials management states
  const [contracts, setContracts] = useState<RefereeContract[]>([]);
  const [directory, setDirectory] = useState<RefereeDirectoryEntry[]>([]);
  const [loadingOfficials, setLoadingOfficials] = useState(false);
  const [officialsError, setOfficialsError] = useState("");
  const [refereeSearch, setRefereeSearch] = useState("");
  const [busyRefereeId, setBusyRefereeId] = useState<number | null>(null);

  // Search & Filters for Schedule Tab
  const [roundSearch, setRoundSearch] = useState("");
  const [roundStatusFilter, setRoundStatusFilter] = useState("ALL");
  const [highlightMissingReferees, setHighlightMissingReferees] = useState(false);

  useDocumentTitle(tournament ? `${tournament.name} | Organizer` : "Championship detail");

  const loadDetail = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const data = await getOrganizerTournament(championshipId);
      setTournament(data);
      setForm({
        name: data.name ?? "",
        code: data.code ?? "",
        description: data.description ?? "",
        location: data.location ?? "",
        startDate: data.startDate ? data.startDate.slice(0, 10) : "",
        endDate: data.endDate ? data.endDate.slice(0, 10) : "",
        registrationStartAt: data.registrationStartAt ? data.registrationStartAt.slice(0, 16) : "",
        registrationEndAt: data.registrationEndAt ? data.registrationEndAt.slice(0, 16) : "",
        maxHorses: data.maxHorses ? String(data.maxHorses) : "",
        maxHorsesPerOwner: String(data.maxHorsesPerOwner ?? 2),
        totalPrizePool: String(data.totalPrizePool ?? 0),
      });

      const list = await getMyOrganizerTournaments();
      setAllTournaments(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setErrorMsg(getApiErrorMessage(err, "Failed to load championship detail."));
    } finally {
      setLoading(false);
    }
  };

  const loadRaces = async () => {
    try {
      setRaceLoading(true);
      setRaceError("");
      const data = await getOrganizerRaces(championshipId);
      setRaces(Array.isArray(data) ? data : []);
      setSelectedRaceId((currentId) => {
        if (currentId && data.some((race) => race.id === currentId)) {
          return currentId;
        }
        return data[0]?.id ?? null;
      });
    } catch (err: any) {
      setRaceError(getApiErrorMessage(err, "Failed to load round control."));
    } finally {
      setRaceLoading(false);
    }
  };

  const loadRegistrations = async () => {
    try {
      setRegistrationLoading(true);
      setRegistrationError("");
      const data = await getOrganizerTournamentRegistrations(championshipId);
      setRegistrations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setRegistrationError(getApiErrorMessage(err, "Failed to load horse registrations."));
    } finally {
      setRegistrationLoading(false);
    }
  };

  const loadJockeyApplications = async () => {
    try {
      setJockeyApplicationLoading(true);
      setJockeyApplicationError("");
      const data = await getOrganizerJockeyApplications(championshipId);
      setJockeyApplications(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setJockeyApplicationError(getApiErrorMessage(err, "Failed to load jockey applications."));
    } finally {
      setJockeyApplicationLoading(false);
    }
  };

  const loadParticipants = async () => {
    try {
      setParticipantLoading(true);
      setParticipantError("");
      const data = await getOrganizerParticipants(championshipId);
      setParticipants(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setParticipantError(getApiErrorMessage(err, "Failed to load championship participants."));
    } finally {
      setParticipantLoading(false);
    }
  };

  const loadOfficials = async () => {
    try {
      setLoadingOfficials(true);
      setOfficialsError("");
      const [contractsData, dirData] = await Promise.all([
        getTournamentRefereeContracts(championshipId),
        getLicensedReferees(),
      ]);
      setContracts(Array.isArray(contractsData) ? contractsData : []);
      setDirectory(Array.isArray(dirData) ? dirData : []);
    } catch (err) {
      setOfficialsError(getApiErrorMessage(err, "Failed to load officials list."));
    } finally {
      setLoadingOfficials(false);
    }
  };

  useEffect(() => {
    if (championshipId) {
      void loadDetail();
    }
  }, [championshipId]);

  useEffect(() => {
    if (championshipId && ["overview", "rounds"].includes(activeTab)) {
      void loadRaces();
    }
  }, [activeTab, championshipId]);

  useEffect(() => {
    if (championshipId && ["overview", "applications"].includes(activeTab)) {
      void loadRegistrations();
      void loadJockeyApplications();
    }
  }, [activeTab, championshipId]);

  useEffect(() => {
    if (championshipId && ["participants", "standings"].includes(activeTab)) {
      void loadParticipants();
    }
  }, [activeTab, championshipId]);

  useEffect(() => {
    if (championshipId && ["rounds", "officials"].includes(activeTab)) {
      void loadOfficials();
    }
  }, [activeTab, championshipId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!form.name || !form.code || !form.location || !form.startDate || !form.endDate || !form.registrationStartAt || !form.registrationEndAt || form.totalPrizePool === "") {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    const dateValidationError = getTournamentDateValidationError(form);
    if (dateValidationError) {
      setErrorMsg(dateValidationError);
      return;
    }

    try {
      setSaving(true);
      await updateOrganizerTournament(championshipId, {
        ...form,
        maxHorses: form.maxHorses ? Number(form.maxHorses) : undefined,
        maxHorsesPerOwner: form.maxHorsesPerOwner ? Number(form.maxHorsesPerOwner) : 2,
        totalPrizePool: Number(form.totalPrizePool),
      });
      setSuccessMsg("Championship details updated successfully.");
      await loadDetail();
    } catch (err: any) {
      setErrorMsg(getApiErrorMessage(err, "Failed to update championship."));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusTransition = async () => {
    const { targetStatus } = showStatusModal;
    if (targetStatus === "SCHEDULE_PUBLISHED" && !schedulePublicationReady) {
      setShowStatusModal({ show: false, targetStatus: "" });
      setActiveTab("rounds");
      setHighlightMissingReferees(true);
      setErrorMsg(scheduleBlockReason || "Complete schedule readiness before publishing.");
      return;
    }

    try {
      setUpdatingStatus(true);
      if (tournament?.status === "DRAFT" && targetStatus === "PENDING_APPROVAL") {
        await submitTournamentForApproval(championshipId);
      } else {
        await updateOrganizerTournamentStatus(championshipId, targetStatus);
      }
      setShowStatusModal({ show: false, targetStatus: "" });
      setSuccessMsg(`Status updated successfully to ${targetStatus.replace("_", " ")}.`);
      await loadDetail();
    } catch (err: any) {
      setErrorMsg(getApiErrorMessage(err, "Failed to update championship status."));
      setShowStatusModal({ show: false, targetStatus: "" });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openManageRound = (race: Race) => {
    setManageRoundRaceId(race.id);
    setRefereeSearch("");
    setOfficialsError("");
  };

  const handleAssignReferee = async (race: Race, refereeId: number) => {
    try {
      setBusyRefereeId(refereeId);
      setOfficialsError("");
      const updatedRace = await assignOrganizerRaceReferee(race.id, refereeId);
      setRaces((currentRaces) =>
        currentRaces.map((currentRace) => (currentRace.id === updatedRace.id ? updatedRace : currentRace)),
      );
      setManageRoundRaceId(updatedRace.id);
      setSuccessMsg(`Referee assigned to ${race.name}.`);
    } catch (err) {
      setOfficialsError(getApiErrorMessage(err, "Failed to assign referee."));
    } finally {
      setBusyRefereeId(null);
    }
  };

  const handleApproveHorseRegistration = async (registration: TournamentRegistration) => {
    try {
      setHorseProcessingId(registration.id);
      setRegistrationError("");
      await approveOrganizerTournamentRegistration(registration.id);
      setSuccessMsg(`${registration.horseName} approved for this championship.`);
      setRegistrations((prev) =>
        prev.map((r) => (r.id === registration.id ? { ...r, status: "APPROVED", rejectionReason: undefined } : r))
      );
    } catch (err) {
      setRegistrationError(getApiErrorMessage(err, "Failed to approve horse registration."));
    } finally {
      setHorseProcessingId(null);
    }
  };

  const handleRejectHorseRegistration = async (registration: TournamentRegistration) => {
    const reason = horseRejectReasons[registration.id]?.trim();
    if (!reason) {
      setRegistrationError("Enter a rejection reason before rejecting this horse registration.");
      return;
    }

    try {
      setHorseProcessingId(registration.id);
      setRegistrationError("");
      await rejectOrganizerTournamentRegistration(registration.id, reason);
      setHorseRejectReasons((current) => ({ ...current, [registration.id]: "" }));
      setSuccessMsg(`${registration.horseName} registration rejected.`);
      setRegistrations((prev) =>
        prev.map((r) => (r.id === registration.id ? { ...r, status: "REJECTED", rejectionReason: reason } : r))
      );
    } catch (err) {
      setRegistrationError(getApiErrorMessage(err, "Failed to reject horse registration."));
    } finally {
      setHorseProcessingId(null);
    }
  };

  const handleApproveJockeyApplication = async (application: JockeyPoolApplication) => {
    try {
      setJockeyProcessingId(application.id);
      setJockeyApplicationError("");
      await approveOrganizerJockeyApplication(championshipId, application.id);
      setSuccessMsg(`${application.jockeyName} approved for the championship pool.`);
      await loadJockeyApplications();
    } catch (err) {
      setJockeyApplicationError(getApiErrorMessage(err, "Failed to approve jockey pool application."));
    } finally {
      setJockeyProcessingId(null);
    }
  };

  const handleRejectJockeyApplication = async (application: JockeyPoolApplication) => {
    const reason = jockeyRejectReasons[application.id]?.trim();
    if (!reason) {
      setJockeyApplicationError("Enter a rejection reason before rejecting this jockey application.");
      return;
    }

    try {
      setJockeyProcessingId(application.id);
      setJockeyApplicationError("");
      await rejectOrganizerJockeyApplication(championshipId, application.id, reason);
      setJockeyRejectReasons((current) => ({ ...current, [application.id]: "" }));
      setSuccessMsg(`${application.jockeyName} jockey pool application rejected.`);
      await loadJockeyApplications();
    } catch (err) {
      setJockeyApplicationError(getApiErrorMessage(err, "Failed to reject jockey pool application."));
    } finally {
      setJockeyProcessingId(null);
    }
  };

  const handleCreateRoundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoundFormError("");

    const distanceMeters = Number(roundForm.distanceMeters);
    const maxParticipants = Number(roundForm.maxParticipants);

    if (!roundForm.name || !roundForm.code || !roundForm.raceDateTime || !roundForm.distanceMeters || !roundForm.maxParticipants) {
      setRoundFormError("Please fill in all required round fields.");
      return;
    }

    if (distanceMeters < 1) {
      setRoundFormError("Distance must be greater than 0.");
      return;
    }

    if (maxParticipants < 2) {
      setRoundFormError("Max participants must be at least 2.");
      return;
    }

    if (tournament) {
      const raceDate = roundForm.raceDateTime.slice(0, 10);
      const start = tournament.startDate ? tournament.startDate.slice(0, 10) : "";
      const end = tournament.endDate ? tournament.endDate.slice(0, 10) : "";
      if (start && raceDate < start) {
        setRoundFormError(`Race date must not be before tournament start date (${start}).`);
        return;
      }
      if (end && raceDate > end) {
        setRoundFormError(`Race date must not be after tournament end date (${end}).`);
        return;
      }
    }

    try {
      setCreatingRound(true);
      const createdRound = await createOrganizerRace({
        tournamentId: championshipId,
        name: roundForm.name,
        code: roundForm.code,
        raceDateTime: roundForm.raceDateTime,
        distanceMeters,
        maxParticipants,
      });
      setSuccessMsg(`${createdRound.name} created successfully.`);
      setRoundForm(emptyRoundForm);
      setShowCreateRoundModal(false);
      setActiveTab("rounds");
      await loadRaces();
    } catch (err: any) {
      setRoundFormError(getApiErrorMessage(err, "Failed to create championship round."));
    } finally {
      setCreatingRound(false);
    }
  };

  const handleLockParticipants = async () => {
    try {
      setLockingParticipants(true);
      setErrorMsg("");
      setSuccessMsg("");
      const response = await lockOrganizerParticipants(championshipId);
      setSuccessMsg(
        response.createdParticipants > 0
          ? `${response.createdParticipants} participant pair${response.createdParticipants === 1 ? "" : "s"} locked.`
          : "No new accepted contracts were available for participant lock.",
      );
      setActiveTab("participants");
      await loadParticipants();
      await loadDetail();
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, "Failed to lock championship participants."));
    } finally {
      setLockingParticipants(false);
    }
  };

  const handleUnlockParticipants = async () => {
    try {
      setLockingParticipants(true);
      setErrorMsg("");
      setSuccessMsg("");
      await unlockOrganizerParticipants(championshipId);
      setSuccessMsg("Participants unlocked successfully.");
      setActiveTab("participants");
      await loadParticipants();
      await loadDetail();
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, "Failed to unlock championship participants."));
    } finally {
      setLockingParticipants(false);
    }
  };

  const handleInviteReferee = async (refereeId: number) => {
    try {
      setBusyRefereeId(refereeId);
      setOfficialsError("");
      await inviteReferee(championshipId, { refereeId });
      setSuccessMsg("Referee invitation sent successfully.");
      await loadOfficials();
    } catch (err) {
      setOfficialsError(getApiErrorMessage(err, "Failed to invite referee."));
    } finally {
      setBusyRefereeId(null);
    }
  };

  const handleTerminateContract = async (contractId: number, refereeId: number) => {
    if (!window.confirm("Are you sure you want to terminate this referee contract?")) return;
    try {
      setBusyRefereeId(refereeId);
      setOfficialsError("");
      await terminateRefereeContract(contractId);
      setSuccessMsg("Contract terminated.");
      await loadOfficials();
    } catch (err) {
      setOfficialsError(getApiErrorMessage(err, "Failed to terminate contract."));
    } finally {
      setBusyRefereeId(null);
    }
  };

  // Organizer race results flow
  const [raceActionLoadingId, setRaceActionLoadingId] = useState<number | null>(null);
  const handleConfirmResults = async (raceId: number) => {
    try {
      setRaceActionLoadingId(raceId);
      const updated = await confirmOrganizerRaceResults(raceId);
      setRaces((prev) => prev.map((r) => (r.id === raceId ? updated : r)));
      if (selectedRaceId === raceId) {
        setSelectedRaceId(updated.id);
      }
      setSuccessMsg("Results confirmed successfully.");
    } catch (err) {
      alert(getApiErrorMessage(err, "Could not confirm results."));
    } finally {
      setRaceActionLoadingId(null);
    }
  };

  const handlePublishResults = async (raceId: number) => {
    try {
      setRaceActionLoadingId(raceId);
      const updated = await publishOrganizerRaceResults(raceId);
      setRaces((prev) => prev.map((r) => (r.id === raceId ? updated : r)));
      if (selectedRaceId === raceId) {
        setSelectedRaceId(updated.id);
      }
      setSuccessMsg("Results published to leaderboard.");
    } catch (err) {
      alert(getApiErrorMessage(err, "Could not publish results."));
    } finally {
      setRaceActionLoadingId(null);
    }
  };

  const handleReopenResults = async (raceId: number, reason: string) => {
    try {
      setRaceActionLoadingId(raceId);
      const updated = await reopenOrganizerRaceResults(raceId, reason);
      setRaces((prev) => prev.map((r) => (r.id === raceId ? updated : r)));
      if (selectedRaceId === raceId) {
        setSelectedRaceId(updated.id);
      }
      setSuccessMsg("Results sent back to referee.");
    } catch (err) {
      alert(getApiErrorMessage(err, "Could not send results back."));
    } finally {
      setRaceActionLoadingId(null);
    }
  };

  if (loading && !tournament) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#bb8a3c] border-t-transparent" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-lg font-bold text-slate-700">Championship not found</p>
        <Link to="/organizer/tournaments" className="mt-4 inline-block font-bold text-[#bb8a3c] underline">
          Back to Championships
        </Link>
      </div>
    );
  }

  const isLocked = !["DRAFT", "POSTPONED"].includes(tournament.status);
  const canCreateRounds = !["SCHEDULE_PUBLISHED", "ONGOING", "COMPLETED"].includes(tournament.status);
  const currentPhase = getChampionshipPhase(tournament.status);
  const currentPhaseIndex = championshipPhases.indexOf(currentPhase);
  const selectedRace = races.find((race) => race.id === selectedRaceId) ?? races[0] ?? null;
  const selectedRaceMeta = selectedRace ? getRaceStatusMeta(selectedRace.status) : null;
  const publishedRaceCount = races.filter((race) => race.status === "PUBLISHED").length;
  const resultReadyCount = races.filter((race) => race.status === "RESULT_CONFIRMED").length;
  const activeRaceCount = races.filter((race) => ["CHECKING", "READY", "ONGOING"].includes(race.status)).length;
  const nextRound = races.find((race) => !["PUBLISHED", "CANCELLED"].includes(race.status)) ?? races[0] ?? null;
  const managedRound = races.find((race) => race.id === manageRoundRaceId) ?? null;
  const missingRefereeRounds = races.filter((race) => !race.refereeId);
  const allRoundsCreated = races.length > 0;
  const participantsLockedForSchedule = ["PARTICIPANTS_LOCKED", "SCHEDULE_PUBLISHED", "ONGOING", "COMPLETED"].includes(tournament.status);
  const lockedParticipantsCount = participants.filter((p) => p.status !== "PENDING_LOCK").length;
  const isCurrentlyLocked = participantsLockedForSchedule || (participants.length > 0 && participants.every((p) => p.status === "ACTIVE"));
  const canUnlock = !["SCHEDULE_PUBLISHED", "ONGOING", "COMPLETED"].includes(tournament.status);
  const officialParticipantsReady = lockedParticipantsCount > 0 || participantsLockedForSchedule;
  
  // Referee assigned rounds readiness check
  const activeRefereeCount = contracts.filter((c) => c.status === "ACTIVE").length;
  const schedulePublicationReady = allRoundsCreated && officialParticipantsReady && missingRefereeRounds.length === 0;
  const scheduleBlockReason = !allRoundsCreated
    ? "Create at least one round before publishing the schedule."
    : !officialParticipantsReady
      ? "Lock official participants before publishing the schedule."
      : missingRefereeRounds.length > 0
        ? `${missingRefereeRounds.length} round${missingRefereeRounds.length === 1 ? "" : "s"} missing referee assignment.`
        : "";

  const activeContractReferees = contracts.filter((c) => c.status === "ACTIVE");
  const getRefereeWorkload = (refId: number) => races.filter((race) => race.refereeId === refId).length;

  const filteredReferees = directory.filter((referee) => {
    const haystack = `${referee.fullName} ${referee.email}`.toLowerCase();
    return haystack.includes(refereeSearch.trim().toLowerCase());
  });

  const filteredRaces = races.filter((race) => {
    const haystack = `${race.name} ${race.code}`.toLowerCase();
    const matchesSearch = haystack.includes(roundSearch.trim().toLowerCase());
    const matchesStatus = roundStatusFilter === "ALL" || race.status === roundStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const participantCapacity = tournament.maxHorses ?? 0;
  const pendingRegistrations = registrations.filter((registration) => registration.status === "PENDING");
  const approvedRegistrations = registrations.filter((registration) => registration.status === "APPROVED");
  const pendingJockeyApplications = jockeyApplications.filter((application) => application.status === "PENDING");
  const approvedJockeyPool = jockeyApplications.filter((application) => application.status === "APPROVED_FOR_POOL");
  const sortedParticipants = [...participants].sort((first, second) => second.points - first.points);
  const currentRoundNumber = nextRound ? races.findIndex((race) => race.id === nextRound.id) + 1 : 0;
  const currentRoundLabel = nextRound ? `Round ${currentRoundNumber} of ${races.length}` : "No round scheduled";

  const participantsReadyLabel =
    tournament.status === "CLOSED_REGISTRATION"
      ? "Ready to lock"
      : tournament.status === "PARTICIPANTS_LOCKED"
        ? "Locked"
        : tournament.status === "SCHEDULE_PUBLISHED"
          ? "Schedule published"
          : `${lockedParticipantsCount} / ${participantCapacity || "Unset"}`;

  const registrationReadinessLabel = `${approvedRegistrations.length} horses approved, ${approvedJockeyPool.length} jockeys in pool`;
  const nextActionLabel = getChampionshipNextActionLabel(tournament, nextRound);

  const openRoundControlCenter = (race: Race | null = nextRound) => {
    if (race) {
      setSelectedRaceId(race.id);
    }
    setActiveTab("rounds");
    setRoundControlOpen(true);
  };

  const handleContinueOperations = () => {
    if (tournament.status === "DRAFT") {
      setShowStatusModal({ show: true, targetStatus: "PENDING_APPROVAL" });
      return;
    }

    if (tournament.status === "APPROVED") {
      setShowStatusModal({ show: true, targetStatus: "OPEN_REGISTRATION" });
      return;
    }

    if (tournament.status === "OPEN_REGISTRATION") {
      setActiveTab("applications");
      return;
    }

    if (tournament.status === "CLOSED_REGISTRATION") {
      void handleLockParticipants();
      return;
    }

    if (tournament.status === "COMPLETED") {
      setActiveTab("standings");
      return;
    }

    if (tournament.status === "PARTICIPANTS_LOCKED") {
      if (!schedulePublicationReady) {
        setActiveTab("rounds");
        setHighlightMissingReferees(true);
        return;
      }
      setShowStatusModal({ show: true, targetStatus: "SCHEDULE_PUBLISHED" });
      return;
    }

    if (races.length === 0) {
      setActiveTab("rounds");
      setRoundFormError("");
      setShowCreateRoundModal(true);
      return;
    }

    openRoundControlCenter();
  };

  const renderStatusActions = () => (
    <div className="flex flex-wrap gap-2">
      {tournament.status === "DRAFT" && (
        <button
          onClick={() => setShowStatusModal({ show: true, targetStatus: "PENDING_APPROVAL" })}
          className="rounded-md bg-[#bb8a3c] px-4 py-2 text-xs font-bold text-[#1c1816] hover:bg-[#cfa24f]"
        >
          Submit for Approval
        </button>
      )}

      {tournament.status === "APPROVED" && (
        <button
          onClick={() => setShowStatusModal({ show: true, targetStatus: "OPEN_REGISTRATION" })}
          className="rounded-md bg-[#bb8a3c] px-4 py-2 text-xs font-bold text-[#1c1816] hover:bg-[#cfa24f]"
        >
          Open Registration
        </button>
      )}

      {["OPEN_REGISTRATION", "CLOSED_REGISTRATION"].includes(tournament.status) && (
        isCurrentlyLocked ? (
          <button
            onClick={() => void handleUnlockParticipants()}
            disabled={!canUnlock || lockingParticipants}
            className="rounded-md bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {lockingParticipants ? "Unlocking..." : "Unlock Participants"}
          </button>
        ) : (
          <button
            onClick={() => void handleLockParticipants()}
            disabled={lockingParticipants}
            className="rounded-md bg-[#1c1816] px-4 py-2 text-xs font-bold text-[#f7f4ee] hover:bg-[#2a241f] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {lockingParticipants ? "Locking..." : "Lock Participants"}
          </button>
        )
      )}

      {tournament.status === "OPEN_REGISTRATION" && (
        <>
          <button
            onClick={() => setShowStatusModal({ show: true, targetStatus: "CLOSED_REGISTRATION" })}
            className="rounded-md bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700"
          >
            Close Registration
          </button>
          <button
            onClick={() => setShowStatusModal({ show: true, targetStatus: "POSTPONED" })}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Postpone
          </button>
        </>
      )}

      {tournament.status === "CLOSED_REGISTRATION" && (
        <button
          onClick={() => setShowStatusModal({ show: true, targetStatus: "POSTPONED" })}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
        >
          Postpone
        </button>
      )}

      {tournament.status === "PARTICIPANTS_LOCKED" && (
        <>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setShowStatusModal({ show: true, targetStatus: "SCHEDULE_PUBLISHED" })}
              disabled={!schedulePublicationReady}
              className="rounded-md bg-[#bb8a3c] px-4 py-2 text-xs font-bold text-[#1c1816] hover:bg-[#cfa24f] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
              title={schedulePublicationReady ? "Publish official race schedule" : scheduleBlockReason}
            >
              Publish Schedule
            </button>
            {!schedulePublicationReady && (
              <p className="max-w-[220px] text-[11px] font-semibold leading-4 text-amber-750">{scheduleBlockReason}</p>
            )}
          </div>
          <button
            onClick={() => setShowStatusModal({ show: true, targetStatus: "POSTPONED" })}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Postpone
          </button>
        </>
      )}

      {tournament.status === "SCHEDULE_PUBLISHED" && (
        <>
          <button
            onClick={() => setShowStatusModal({ show: true, targetStatus: "ONGOING" })}
            className="rounded-md bg-[#bb8a3c] px-4 py-2 text-xs font-bold text-[#1c1816] hover:bg-[#cfa24f]"
          >
            Start Championship
          </button>
          <button
            onClick={() => setShowStatusModal({ show: true, targetStatus: "POSTPONED" })}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Postpone
          </button>
        </>
      )}

      {tournament.status === "ONGOING" && (
        <button
          onClick={() => setShowStatusModal({ show: true, targetStatus: "COMPLETED" })}
          className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
        >
          Complete Championship
        </button>
      )}

      {tournament.status === "POSTPONED" && (
        <button
          onClick={() => setShowStatusModal({ show: true, targetStatus: "OPEN_REGISTRATION" })}
          className="rounded-md bg-[#bb8a3c] px-4 py-2 text-xs font-bold text-[#1c1816] hover:bg-[#cfa24f]"
        >
          Reopen Registration
        </button>
      )}
    </div>
  );

  const renderSetupForm = () => (
    <form onSubmit={handleSave} className="flex flex-col gap-6 rounded-lg border border-slate-200 bg-white p-5">
      <div>
        <p className="text-xs font-black uppercase tracking-wider text-[#bb8a3c]">Championship setup</p>
        <h2 className="mt-1 text-xl font-black text-slate-950">Championship Configuration</h2>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Backend entities remain tournament-based, but this workspace presents the season as a championship.
        </p>
      </div>

      {isLocked && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
          Championship setup can only be modified in draft or postponed status. Current status is{" "}
          {tournament.status.replace("_", " ").toLowerCase()}.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Championship Name *</label>
          <input
            type="text"
            required
            disabled={isLocked}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#bb8a3c] focus:outline-none focus:ring-2 focus:ring-[#bb8a3c]/20"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Championship Code *</label>
          <input
            type="text"
            required
            disabled={isLocked}
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#bb8a3c] focus:outline-none focus:ring-2 focus:ring-[#bb8a3c]/20"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Location *</label>
          <input
            type="text"
            required
            disabled={isLocked}
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#bb8a3c] focus:outline-none focus:ring-2 focus:ring-[#bb8a3c]/20"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Start Date *</label>
          <input
            type="date"
            required
            disabled={isLocked}
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#bb8a3c] focus:outline-none focus:ring-2 focus:ring-[#bb8a3c]/20"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">End Date *</label>
          <input
            type="date"
            required
            disabled={isLocked}
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#bb8a3c] focus:outline-none focus:ring-2 focus:ring-[#bb8a3c]/20"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Registration Start *</label>
          <input
            type="datetime-local"
            required
            disabled={isLocked}
            value={form.registrationStartAt}
            onChange={(e) => setForm({ ...form, registrationStartAt: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#bb8a3c] focus:outline-none focus:ring-2 focus:ring-[#bb8a3c]/20"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Registration End *</label>
          <input
            type="datetime-local"
            required
            disabled={isLocked}
            value={form.registrationEndAt}
            onChange={(e) => setForm({ ...form, registrationEndAt: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#bb8a3c] focus:outline-none focus:ring-2 focus:ring-[#bb8a3c]/20"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Max Horse Participants</label>
          <input
            type="number"
            disabled={isLocked}
            value={form.maxHorses}
            onChange={(e) => setForm({ ...form, maxHorses: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#bb8a3c] focus:outline-none focus:ring-2 focus:ring-[#bb8a3c]/20"
            placeholder="Unlimited"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Max Horses Per Owner</label>
          <input
            type="number"
            min={1}
            disabled={isLocked}
            value={form.maxHorsesPerOwner}
            onChange={(e) => setForm({ ...form, maxHorsesPerOwner: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#bb8a3c] focus:outline-none focus:ring-2 focus:ring-[#bb8a3c]/20"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Total Prize Pool (VND) *</label>
          <input
            type="number"
            min={0}
            required
            disabled={isLocked}
            value={form.totalPrizePool}
            onChange={(e) => setForm({ ...form, totalPrizePool: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#bb8a3c] focus:outline-none focus:ring-2 focus:ring-[#bb8a3c]/20"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Description</label>
          <textarea
            rows={3}
            disabled={isLocked}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#bb8a3c] focus:outline-none focus:ring-2 focus:ring-[#bb8a3c]/20"
          />
        </div>
      </div>

      <div className="flex items-center justify-end border-t border-slate-100 pt-4">
        {!isLocked && (
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-[#bb8a3c] px-5 py-2 text-sm font-bold text-[#1c1816] hover:bg-[#cfa24f] disabled:opacity-50"
          >
            {saving ? "Saving Changes..." : "Save Changes"}
          </button>
        )}
      </div>
    </form>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
        <Link to="/organizer/tournaments" className="hover:text-[#bb8a3c]">
          Championships
        </Link>
        <span>/</span>
        <span className="text-slate-800">{tournament.code || tournament.id}</span>
      </div>

      {errorMsg && (
        <div className="rounded-md border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-700">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="rounded-md border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          {successMsg}
        </div>
      )}

      {/* Control Status banner */}
      <div className="flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-black text-[#0d4a37]">Organizer Workspace</p>
          <p className="mt-0.5 text-xs font-semibold text-slate-600">
            You are the official organizer. You have full operational control to setup rounds, hire referees, approve applications, and ratify race results.
          </p>
        </div>
        <div className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-md bg-[#1c1816] px-4 text-xs font-black uppercase tracking-[0.12em] text-[#f7f4ee]">
          Full Control
        </div>
      </div>

      {/* Header Info Block */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="relative inline-block max-w-full">
              <select
                value={championshipId}
                onChange={(e) => navigate(`/organizer/tournaments/${e.target.value}`)}
                className="appearance-none inline-flex max-w-full items-center gap-2 rounded-md border border-slate-200 bg-slate-50 pl-3 pr-8 py-2 text-left text-sm font-black text-slate-950 focus:outline-none focus:ring-2 focus:ring-[#bb8a3c] cursor-pointer"
              >
                {allTournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className={`rounded-md border px-3 py-1.5 text-xs font-black uppercase tracking-wider ${getBadgeStyle(tournament.status)}`}>
                {tournament.status.replace("_", " ")}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {tournament.location} - Code {tournament.code}
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{tournament.name}</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
              {tournament.description || "Manage registrations, rounds, officials, and publishing results for this championship season."}
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-[560px]">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Current Phase</p>
              <p className="mt-1 text-lg font-black text-slate-950">{currentPhase}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Current Round</p>
              <p className="mt-1 text-lg font-black text-slate-950">{currentRoundLabel}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Participants</p>
              <p className="mt-1 text-lg font-black text-slate-950">{participantsReadyLabel}</p>
            </div>
            <div className="rounded-lg border border-[#bb8a3c]/25 bg-[#bb8a3c]/5 p-3">
              <p className="text-[11px] font-black uppercase tracking-wider text-[#bb8a3c]">Next Action</p>
              <p className="mt-1 text-lg font-black text-slate-950">{nextActionLabel}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-600">
            Review stats and take action to drive the championship lifecycle forward.
          </p>
          {tournament.status !== "COMPLETED" && (
            <button
              type="button"
              onClick={handleContinueOperations}
              disabled={lockingParticipants}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#bb8a3c] px-5 text-sm font-black text-[#1c1816] transition hover:bg-[#cfa24f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bb8a3c] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {lockingParticipants ? "Locking Participants..." : nextActionLabel}
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-5">
          {championshipPhases.map((phase, index) => {
            const isComplete = index < currentPhaseIndex;
            const isCurrent = index === currentPhaseIndex;
            return (
              <div key={phase} className="min-w-0">
                <div
                  className={`h-2 rounded-full ${
                    isComplete || isCurrent ? "bg-[#bb8a3c]" : "bg-slate-200"
                  }`}
                />
                <p className={`mt-2 truncate text-[11px] font-black uppercase tracking-wide ${isCurrent ? "text-[#bb8a3c]" : "text-slate-500"}`}>
                  {phase}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs list */}
      <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
        <nav className="flex flex-col gap-2 text-sm font-bold lg:flex-row lg:items-center">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`min-h-11 rounded-md px-4 text-left text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bb8a3c] ${
              activeTab === "overview"
                ? "bg-slate-950 text-white shadow-sm"
                : "bg-slate-50 text-slate-800 hover:bg-slate-100"
            }`}
          >
            Overview
          </button>
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
            {secondaryChampionshipTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`min-h-11 shrink-0 rounded-md px-4 text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bb8a3c] ${
                  activeTab === tab.key
                    ? "bg-[#bb8a3c] text-[#1c1816]"
                    : "bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Tab Panels */}

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm space-y-5">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-[#bb8a3c]">Championship overview</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Command Center</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                Summary of the championship progress and required reviews.
              </p>
            </div>

            <div className="space-y-3">
              {(pendingRegistrations.length > 0 || pendingJockeyApplications.length > 0) && (
                <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-black text-amber-950">Needs attention</p>
                      <p className="mt-1 text-sm font-semibold text-amber-800">
                        {pendingRegistrations.length} horse registration{pendingRegistrations.length === 1 ? "" : "s"} and{" "}
                        {pendingJockeyApplications.length} jockey pool application{pendingJockeyApplications.length === 1 ? "" : "s"} pending review.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("applications")}
                    className="inline-flex min-h-10 items-center justify-center rounded-md bg-amber-700 px-4 text-xs font-black text-white hover:bg-amber-800"
                  >
                    Review Applications
                  </button>
                </div>
              )}

              <div className="flex items-start justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-black text-emerald-950">Current Phase</p>
                    <p className="mt-1 text-sm font-semibold text-emerald-800">{currentPhase}</p>
                  </div>
                </div>
                <span className="rounded-md border border-emerald-200 bg-white px-2 py-1 text-[11px] font-black uppercase text-emerald-800">
                  On Schedule
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <Flag className="h-5 w-5 text-slate-500" aria-hidden="true" />
                  <p className="mt-3 text-[11px] font-black uppercase tracking-wider text-slate-500">Current Round</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{currentRoundLabel}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{nextRound?.name ?? "Create a round in Rounds."}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <Users className="h-5 w-5 text-slate-500" aria-hidden="true" />
                  <p className="mt-3 text-[11px] font-black uppercase tracking-wider text-slate-500">Participants Readiness</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{participantsReadyLabel}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{registrationReadinessLabel}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <Trophy className="h-5 w-5 text-slate-500" aria-hidden="true" />
                  <p className="mt-3 text-[11px] font-black uppercase tracking-wider text-slate-500">Total Prize Pool</p>
                  <p className="mt-1 text-lg font-black text-[#bb8a3c]">{tournament.totalPrizePool ? tournament.totalPrizePool.toLocaleString() : "0"} VND</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Configured in controls.</p>
                </div>
              </div>

              <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-cyan-950">Result / Publish Readiness</p>
                    <p className="mt-1 text-sm font-semibold text-cyan-800">
                      {resultReadyCount} ready to publish, {publishedRaceCount} already published
                    </p>
                  </div>
                  <span className="rounded-md border border-cyan-200 bg-white px-2 py-1 text-[11px] font-black uppercase text-cyan-800">
                    Standings linked
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wider text-[#bb8a3c]">Next action</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">{nextActionLabel}</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              Quick shortcut to progress operations forward based on the current phase.
            </p>
            {tournament.status !== "COMPLETED" && (
              <button
                type="button"
                onClick={handleContinueOperations}
                disabled={lockingParticipants}
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-[#bb8a3c] px-5 text-sm font-black text-[#1c1816] transition hover:bg-[#cfa24f] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {lockingParticipants ? "Locking..." : "Continue Operations"}
              </button>
            )}
            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">Primary flow</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Setup details &amp; rounds &rarr; Approve applications &rarr; Lock participants &rarr; Hired Referees &rarr; Publish schedule &rarr; Confirm results &rarr; Done.
              </p>
            </div>
          </section>
        </section>
      )}

      {/* APPLICATIONS TAB */}
      {activeTab === "applications" && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 pb-5">
            <p className="text-xs font-black uppercase tracking-wider text-[#bb8a3c]">Entry review</p>
            <h2 className="text-2xl font-black text-slate-950">Championship Applications</h2>
            <p className="max-w-2xl text-sm font-medium leading-6 text-slate-500">
              Review horse registrations submitted by owners, and jockey pool applications from system jockeys.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Pending Horses", pendingRegistrations.length, "border-amber-200 bg-amber-50 text-amber-900"],
              ["Approved Horses", approvedRegistrations.length, "border-emerald-200 bg-emerald-50 text-emerald-900"],
              ["Pending Jockeys", pendingJockeyApplications.length, "border-amber-200 bg-amber-50 text-amber-900"],
              ["Approved Pool", approvedJockeyPool.length, "border-emerald-200 bg-emerald-50 text-emerald-900"],
            ].map(([label, value, className]) => (
              <div key={label} className={`rounded-lg border p-4 ${className}`}>
                <p className="text-[11px] font-black uppercase tracking-wider opacity-75">{label}</p>
                <p className="mt-2 text-2xl font-black">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            {[
              { key: "horses" as const, label: "Horse Registrations", Icon: ClipboardCheck },
              { key: "jockeys" as const, label: "Jockey Pool Applications", Icon: UserCheck },
            ].map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setApplicationView(key)}
                className={`inline-flex min-h-10 items-center gap-2 rounded-md px-4 text-sm font-black ${
                  applicationView === key
                    ? "bg-white text-[#bb8a3c] shadow-sm"
                    : "text-slate-600 hover:bg-white/70"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>

          {(registrationError || jockeyApplicationError) && (
            <div role="alert" className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
              {registrationError || jockeyApplicationError}
            </div>
          )}

          {applicationView === "horses" && registrationLoading ? (
            <div className="mt-5 space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-20 animate-pulse rounded-lg border border-slate-100 bg-slate-50" />
              ))}
            </div>
          ) : applicationView === "horses" && registrations.length === 0 ? (
            <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <ClipboardCheck className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
              <h3 className="mt-3 text-lg font-black text-slate-900">No horse registrations yet</h3>
            </div>
          ) : applicationView === "horses" ? (
            <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
              <div className="hidden bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500 md:grid md:grid-cols-[1.05fr_0.72fr_0.42fr_1.25fr] md:gap-4">
                <span>Horse</span>
                <span>Owner</span>
                <span>Status</span>
                <span>Review</span>
              </div>
              <div className="divide-y divide-slate-100">
                {registrations.map((registration) => (
                  <article
                    key={registration.id}
                    className="grid gap-3 px-4 py-3 text-sm md:grid-cols-[1.05fr_0.72fr_0.42fr_1.25fr] md:items-center md:gap-4"
                  >
                    <div>
                      <p className="font-black text-slate-950">{registration.horseName}</p>
                      {registration.note && (
                        <p className="mt-1 text-xs font-semibold text-slate-500">{registration.note}</p>
                      )}
                    </div>
                    <p className="font-semibold text-slate-600">{registration.ownerName || "Owner not assigned"}</p>
                    <span
                      className={`inline-flex h-7 w-fit items-center rounded-md border px-2 text-[11px] font-black uppercase tracking-wide ${
                        registration.status === "PENDING"
                          ? "border-amber-200 bg-amber-50 text-amber-800"
                          : registration.status === "APPROVED"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-rose-200 bg-rose-50 text-rose-800"
                      }`}
                    >
                      {registration.status}
                    </span>
                    <div>
                      {registration.status === "PENDING" ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="min-w-[180px] flex-1">
                            <span className="sr-only">Horse rejection reason</span>
                            <input
                              value={horseRejectReasons[registration.id] || ""}
                              placeholder="Reason if rejecting"
                              onChange={(event) =>
                                setHorseRejectReasons((current) => ({
                                  ...current,
                                  [registration.id]: event.target.value,
                                }))
                              }
                              className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold focus:border-[#bb8a3c] focus:outline-none focus:ring-2 focus:ring-[#bb8a3c]/20"
                            />
                          </label>
                          <button
                            type="button"
                            disabled={horseProcessingId === registration.id}
                            onClick={() => handleApproveHorseRegistration(registration)}
                            className="h-9 rounded-md bg-emerald-600 px-3 text-xs font-black text-white hover:bg-emerald-700"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={horseProcessingId === registration.id}
                            onClick={() => handleRejectHorseRegistration(registration)}
                            className="h-9 rounded-md border border-[#bb8a3c] px-3 text-xs font-black text-[#bb8a3c] hover:bg-rose-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                            {registration.status === "APPROVED" ? "Ready for pairing" : "Review closed"}
                          </p>
                          {registration.status === "REJECTED" && registration.rejectionReason && (
                            <p className="mt-1 text-xs font-bold text-rose-700">{registration.rejectionReason}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : jockeyApplicationLoading ? (
            <div className="mt-5 space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-20 animate-pulse rounded-lg border border-slate-100 bg-slate-50" />
              ))}
            </div>
          ) : jockeyApplications.length === 0 ? (
            <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <UserCheck className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
              <h3 className="mt-3 text-lg font-black text-slate-900">No jockey pool applications yet</h3>
            </div>
          ) : (
            <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
              <div className="hidden bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500 md:grid md:grid-cols-[0.95fr_0.55fr_0.9fr_1.25fr] md:gap-4">
                <span>Jockey</span>
                <span>Pool Status</span>
                <span>Message</span>
                <span>Review</span>
              </div>
              <div className="divide-y divide-slate-100">
                {jockeyApplications.map((application) => (
                  <article
                    key={application.id}
                    className="grid gap-3 px-4 py-3 text-sm md:grid-cols-[0.95fr_0.55fr_0.9fr_1.25fr] md:items-center md:gap-4"
                  >
                    <div>
                      <p className="font-black text-slate-950">{application.jockeyName}</p>
                      {application.jockeyEmail && (
                        <p className="mt-1 text-xs font-semibold text-slate-500">{application.jockeyEmail}</p>
                      )}
                    </div>
                    <span
                      className={`inline-flex h-7 w-fit items-center rounded-md border px-2 text-[11px] font-black uppercase tracking-wide ${
                        application.status === "PENDING"
                          ? "border-amber-200 bg-amber-50 text-amber-800"
                          : application.status === "APPROVED_FOR_POOL"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-rose-200 bg-rose-50 text-rose-800"
                      }`}
                    >
                      {application.status.replaceAll("_", " ")}
                    </span>
                    <p className="truncate text-sm font-semibold text-slate-600">{application.message || "No application message"}</p>
                    <div>
                      {application.status === "PENDING" ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="min-w-[180px] flex-1">
                            <span className="sr-only">Jockey rejection reason</span>
                            <input
                              value={jockeyRejectReasons[application.id] || ""}
                              placeholder="Reason if rejecting"
                              onChange={(event) =>
                                setJockeyRejectReasons((current) => ({
                                  ...current,
                                  [application.id]: event.target.value,
                                }))
                              }
                              className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold focus:border-[#bb8a3c] focus:outline-none focus:ring-2 focus:ring-[#bb8a3c]/20"
                            />
                          </label>
                          <button
                            type="button"
                            disabled={jockeyProcessingId === application.id}
                            onClick={() => handleApproveJockeyApplication(application)}
                            className="h-9 rounded-md bg-emerald-600 px-3 text-xs font-black text-white hover:bg-emerald-700"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={jockeyProcessingId === application.id}
                            onClick={() => handleRejectJockeyApplication(application)}
                            className="h-9 rounded-md border border-[#bb8a3c] px-3 text-xs font-black text-[#bb8a3c] hover:bg-rose-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                          {application.status === "APPROVED_FOR_POOL" ? "Visible to owners" : "Review closed"}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* PARTICIPANTS TAB */}
      {activeTab === "participants" && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 pb-5">
            <p className="text-xs font-black uppercase tracking-wider text-[#bb8a3c]">Championship roster status</p>
            <h2 className="text-2xl font-black text-slate-950">Championship Participants</h2>
            <p className="max-w-2xl text-sm font-medium leading-6 text-slate-500">
              Formed horse-jockey pairs from accepted owner-jockey contracts, awaiting official lock.
            </p>
          </div>

          {/* Participant Metrics Dashboard */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-5 mb-5">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Pairs Formed</p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {participants.length} <span className="text-sm font-semibold text-slate-500">/ {participantCapacity || "Unset"}</span>
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Locked (Official)</p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {participants.filter((p) => p.status === "ACTIVE").length}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-black uppercase tracking-wider text-[#bb8a3c]">Pending Lock</p>
              <p className="mt-2 text-2xl font-black text-amber-700">
                {participants.filter((p) => p.status === "PENDING_LOCK").length}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Available Slots</p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {participantCapacity ? Math.max(0, participantCapacity - participants.length) : "Unlimited"}
              </p>
            </div>
          </div>

          {/* Roster Pipeline Actions (Two independent columns) */}
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            {/* Step 1: Registration Control */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 flex flex-col justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#bb8a3c]">Registration Control</p>
                <h3 className="text-sm font-black text-slate-950 mt-1">Close Registration</h3>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Stop accepting new horse entries and jockey applications.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-650">Current Status:</span>
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[10px] font-black uppercase ${
                      tournament.status === "OPEN_REGISTRATION"
                        ? "border-emerald-250 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-slate-200 text-slate-600"
                    }`}
                  >
                    {tournament.status === "OPEN_REGISTRATION" ? "Open" : "Closed / Done"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                disabled={tournament.status !== "OPEN_REGISTRATION"}
                onClick={() => setShowStatusModal({ show: true, targetStatus: "CLOSED_REGISTRATION" })}
                className="mt-4 w-full rounded-md bg-amber-600 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-455 transition"
              >
                Close Registration
              </button>
            </div>

            {/* Step 2: Roster Participant Control */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 flex flex-col justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#bb8a3c]">Participant Control</p>
                <h3 className="text-sm font-black text-slate-950 mt-1">Lock Participants</h3>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Freeze accepted contract pairs into active championship participants.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-650">Current Status:</span>
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[10px] font-black uppercase ${
                      isCurrentlyLocked
                        ? "border-emerald-250 bg-emerald-50 text-emerald-800"
                        : "border-amber-250 bg-amber-50 text-amber-800"
                    }`}
                  >
                    {isCurrentlyLocked ? "Participants Locked" : "Pending Lock"}
                  </span>
                </div>
              </div>
              {isCurrentlyLocked ? (
                <button
                  type="button"
                  disabled={!canUnlock || lockingParticipants}
                  onClick={() => void handleUnlockParticipants()}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-md bg-rose-600 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 transition"
                >
                  <Unlock className="h-4 w-4" aria-hidden="true" />
                  {lockingParticipants ? "Unlocking..." : "Unlock Participants"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={
                    !["OPEN_REGISTRATION", "CLOSED_REGISTRATION"].includes(tournament.status) ||
                    lockingParticipants
                  }
                  onClick={() => void handleLockParticipants()}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-md bg-[#bb8a3c] py-2 text-xs font-black uppercase tracking-wider text-[#1c1816] hover:bg-[#cfa24f] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 transition"
                >
                  <UserCheck className="h-4 w-4" aria-hidden="true" />
                  {lockingParticipants ? "Locking..." : "Lock Participants"}
                </button>
              )}
            </div>
          </div>

          {participantError && (
            <div className="mt-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">
              {participantError}
            </div>
          )}

          {participantLoading ? (
            <div className="mt-5 grid gap-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-24 animate-pulse rounded-lg border border-slate-100 bg-slate-50" />
              ))}
            </div>
          ) : participants.length === 0 ? (
            <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <Users className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
              <h3 className="mt-3 text-lg font-black text-slate-900">No participants registered yet</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
                No horse-jockey contract pairings have been formed yet. Once owners hire jockeys and contracts are accepted, pairs will list here.
              </p>
            </div>
          ) : (
            <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
              <div className="grid grid-cols-[1.2fr_1fr_1fr_96px_140px] bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <span>Horse</span>
                <span>Jockey</span>
                <span>Owner</span>
                <span>Points</span>
                <span>Status</span>
              </div>
              {participants.map((participant) => (
                <article
                  key={participant.id}
                  className="grid grid-cols-1 gap-3 border-t border-slate-100 px-4 py-4 md:grid-cols-[1.2fr_1fr_1fr_96px_140px] md:items-center"
                >
                  <div>
                    <p className="text-sm font-black text-slate-950">{participant.horseName}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Reg #{participant.horseRegistrationId}</p>
                  </div>
                  <p className="text-sm font-bold text-slate-700">{participant.jockeyName}</p>
                  <p className="text-sm font-bold text-slate-700">{participant.ownerName}</p>
                  <p className="text-sm font-black text-slate-950">{participant.points} pts</p>
                  <span
                    className={`w-fit rounded-md border px-3 py-1 text-[11px] font-black uppercase tracking-wide ${
                      participant.status === "ACTIVE"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : participant.status === "PENDING_LOCK"
                          ? "border-amber-200 bg-amber-50 text-amber-800 animate-pulse"
                          : "border-slate-200 bg-slate-50 text-slate-750"
                    }`}
                  >
                    {participant.status.replace("_", " ")}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ROUNDS TAB */}
      {activeTab === "rounds" && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-[#bb8a3c]">Season timeline</p>
              <h2 className="text-2xl font-black text-slate-950">Championship Rounds</h2>
              <p className="max-w-2xl text-sm font-medium leading-6 text-slate-500">
                Setup rounds, assign referees, and oversee race operations.
              </p>
            </div>
            {canCreateRounds && (
              <button
                type="button"
                onClick={() => {
                  setRoundFormError("");
                  setShowCreateRoundModal(true);
                }}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Create Round
              </button>
            )}
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-lg font-black text-slate-950">Season Timeline</h3>
              <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Registration Opened", status: "OPEN_REGISTRATION" },
                  { label: "Registration Closed", status: "CLOSED_REGISTRATION" },
                  { label: "Participants Locked", status: "PARTICIPANTS_LOCKED" },
                  { label: "Schedule Published", status: "SCHEDULE_PUBLISHED" }
                ].map((item) => {
                  const statusOrder = [
                    "DRAFT",
                    "OPEN_REGISTRATION",
                    "CLOSED_REGISTRATION",
                    "PARTICIPANTS_LOCKED",
                    "SCHEDULE_PUBLISHED",
                    "ONGOING",
                    "COMPLETED"
                  ];
                  const currentIndex = statusOrder.indexOf(tournament.status);
                  const itemIndex = statusOrder.indexOf(item.status);
                  const isPassed = currentIndex >= itemIndex && currentIndex !== -1;

                  return (
                    <div
                      key={item.label}
                      className={`flex flex-col gap-2 rounded-md border p-3 ${
                        isPassed
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isPassed ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-slate-300 bg-slate-100" />
                        )}
                        <span className={`text-sm font-black ${isPassed ? "text-emerald-950" : "text-slate-500"}`}>
                          {item.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <aside
              className={`rounded-lg border p-4 ${
                schedulePublicationReady
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-600">Publication readiness</p>
                  <h3 className="mt-1 text-lg font-black text-slate-950">Schedule Publication</h3>
                </div>
                {schedulePublicationReady ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-700" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-amber-700" aria-hidden="true" />
                )}
              </div>

              <div className="mt-4 space-y-2">
                {[
                  { label: "Rounds created", complete: allRoundsCreated },
                  { label: "Participants locked", complete: officialParticipantsReady },
                  { label: "Referees assigned", complete: missingRefereeRounds.length === 0 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 rounded-md bg-white/80 px-3 py-2">
                    <span className="text-sm font-black text-slate-800">{item.label}</span>
                    <span
                      className={`rounded-md border px-2 py-1 text-[11px] font-black uppercase tracking-wide ${
                        item.complete
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-amber-200 bg-amber-50 text-amber-800"
                      }`}
                    >
                      {item.complete ? "Ready" : "Needed"}
                    </span>
                  </div>
                ))}
              </div>

              {!schedulePublicationReady && (
                <div className="mt-4 rounded-md border border-amber-200 bg-white/80 p-3">
                  <p className="text-sm font-black text-amber-950">Cannot publish schedule yet</p>
                  <p className="mt-1 text-sm font-semibold leading-5 text-amber-800">{scheduleBlockReason}</p>
                </div>
              )}
            </aside>
          </div>

          {races.length > 0 && (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  type="search"
                  value={roundSearch}
                  onChange={(e) => setRoundSearch(e.target.value)}
                  placeholder="Search rounds by name or code..."
                  className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-[#bb8a3c] focus:outline-none focus:ring-2 focus:ring-[#bb8a3c]/20"
                />
              </div>
              <select
                value={roundStatusFilter}
                onChange={(e) => setRoundStatusFilter(e.target.value)}
                className="rounded-md border border-slate-300 py-2 pl-3 pr-8 text-sm font-semibold text-slate-900 focus:border-[#bb8a3c] focus:outline-none focus:ring-2 focus:ring-[#bb8a3c]/20 sm:w-48"
              >
                <option value="ALL">All Statuses</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="CHECKING">Checking</option>
                <option value="READY">Ready</option>
                <option value="ONGOING">Ongoing</option>
                <option value="FINISHED">Finished</option>
                <option value="RESULT_SUBMITTED">Result Submitted</option>
                <option value="RESULT_CONFIRMED">Result Confirmed</option>
                <option value="PUBLISHED">Published</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          )}

          {raceLoading ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-32 animate-pulse rounded-lg border border-slate-100 bg-slate-50" />
              ))}
            </div>
          ) : races.length === 0 ? (
            <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <Flag className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
              <h3 className="mt-3 text-lg font-black text-slate-900">No rounds setup yet</h3>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRaces.map((race, index) => {
                const meta = getRaceStatusMeta(race.status);
                const isCurrent = race.id === nextRound?.id;
                const isMissingReferee = !race.refereeId;
                const shouldHighlight = highlightMissingReferees && isMissingReferee;

                return (
                  <article
                    key={race.id}
                    className={`rounded-lg border p-4 transition ${
                      shouldHighlight
                        ? "border-amber-300 bg-amber-50 ring-2 ring-amber-200"
                        : isCurrent
                          ? "border-[#bb8a3c]/30 bg-[#bb8a3c]/5"
                          : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Round {index + 1} • {race.code}</p>
                        <h3 className="mt-1 text-base font-black text-slate-950">{race.name}</h3>
                      </div>
                      <span className={`rounded-md border px-2 py-1 text-[11px] font-black uppercase tracking-wide ${meta.className}`}>
                        {meta.label}
                      </span>
                    </div>

                    <p className="mt-3 text-sm font-semibold text-slate-600">{formatRaceDate(race.raceDateTime)}</p>

                    <div className="mt-4 rounded-md border p-3 border-slate-200 bg-slate-50">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-[#bb8a3c]" aria-hidden="true" />
                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Referee</p>
                      </div>
                      <p className="mt-1 text-sm font-black text-slate-950">{race.refereeName ?? "Unassigned"}</p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openManageRound(race)}
                        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-50"
                      >
                        Manage
                      </button>
                      <button
                        type="button"
                        onClick={() => openRoundControlCenter(race)}
                        className="rounded-md bg-[#bb8a3c] px-3 py-1.5 text-xs font-black text-[#1c1816] hover:bg-[#cfa24f]"
                      >
                        Control Center
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Hire Referees / Directory Sub-section */}
          <div className="mt-10 border-t border-slate-200 pt-8">
            <OfficialsTab
              championshipId={championshipId}
              contracts={contracts}
              directory={directory}
              loadingContracts={loadingOfficials}
              busyRefereeId={busyRefereeId}
              setBusyRefereeId={setBusyRefereeId}
              onReload={loadOfficials}
            />
          </div>
        </section>
      )}

      {/* STANDINGS TAB */}
      {activeTab === "standings" && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 pb-5">
            <p className="text-xs font-black uppercase tracking-wider text-[#bb8a3c]">Leaderboard</p>
            <h2 className="text-2xl font-black text-slate-950">Standings</h2>
            <p className="max-w-2xl text-sm font-medium leading-6 text-slate-500">
              Ranking of championship participant pairs based on points earned across all rounds.
            </p>
          </div>

          {participants.length === 0 ? (
            <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <Trophy className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
              <h3 className="mt-3 text-lg font-black text-slate-900">No standings generated yet</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-slate-500">
                Standings will compute after results from race rounds are confirmed and published.
              </p>
            </div>
          ) : (
            <div className="mt-5 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
              {sortedParticipants.map((participant, index) => (
                <div key={participant.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-700">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-black text-slate-950">{participant.horseName}</p>
                      <p className="text-xs font-semibold text-slate-500">
                        Jockey: {participant.jockeyName} · Owner: {participant.ownerName}
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-black text-[#bb8a3c]">{participant.points} pts</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* CONTROLS TAB */}
      {activeTab === "controls" && (
        <div className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#bb8a3c]">Championship actions</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">Championship Controls</h2>
                <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500">
                  Manage statuses, open registration, or close championship.
                </p>
              </div>
              {renderStatusActions()}
            </div>
          </section>
          {renderSetupForm()}
        </div>
      )}

      {/* ROUND CONTROL CENTER DRAWER */}
      {roundControlOpen && selectedRace && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40" onClick={() => setRoundControlOpen(false)}>
          <aside
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-950 px-6 py-5 text-white">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#bb8a3c]">Round operations</p>
                <h2 className="mt-1 text-2xl font-black text-[#f7f4ee]">{selectedRace.name}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-300">
                  Review submitted results, confirm standings, or return to referee.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRoundControlOpen(false)}
                className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500">Basic Information</p>
                    <h3 className="mt-1 text-lg font-black text-slate-950">{selectedRace.code}</h3>
                  </div>
                  <span className={`rounded-md border px-3 py-1 text-[11px] font-black uppercase tracking-wide ${getRaceStatusMeta(selectedRace.status).className}`}>
                    {getRaceStatusMeta(selectedRace.status).label}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-md border border-slate-200 bg-white p-3">
                    <CalendarDays className="h-4 w-4 text-[#bb8a3c]" aria-hidden="true" />
                    <p className="mt-2 text-[11px] font-black uppercase tracking-wider text-slate-400">Race time</p>
                    <p className="mt-1 text-xs font-black text-slate-950">{formatRaceDate(selectedRace.raceDateTime)}</p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-white p-3">
                    <Gauge className="h-4 w-4 text-[#bb8a3c]" aria-hidden="true" />
                    <p className="mt-2 text-[11px] font-black uppercase tracking-wider text-slate-400">Distance</p>
                    <p className="mt-1 text-sm font-black text-slate-950">{selectedRace.distanceMeters.toLocaleString()} m</p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-white p-3">
                    <Users className="h-4 w-4 text-[#bb8a3c]" aria-hidden="true" />
                    <p className="mt-2 text-[11px] font-black uppercase tracking-wider text-slate-400">Field cap</p>
                    <p className="mt-1 text-sm font-black text-slate-950">{selectedRace.maxParticipants} participants</p>
                  </div>
                </div>
              </section>

              {/* Show race results summary if submitted */}
              {["RESULT_SUBMITTED", "RESULT_CONFIRMED", "PUBLISHED"].includes(selectedRace.status) ? (
                <section className="rounded-lg border border-slate-200 bg-white p-4">
                  <h3 className="text-base font-black text-slate-950 mb-3">Finishing Order Results</h3>
                  <RaceResultSummary raceId={selectedRace.id} />
                </section>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800">
                  Operational checks and results submission are managed by the assigned referee: <strong className="text-amber-950">{selectedRace.refereeName || "None assigned"}</strong>.
                </div>
              )}

              {/* Action buttons inside Control Drawer */}
              {selectedRace.status === "RESULT_SUBMITTED" && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <p className="text-sm font-black text-slate-950">Organizer Result Ratification</p>
                  <p className="text-xs font-semibold text-slate-500">
                    Verify placement results and points. You can confirm them or send back to referee if corrections are required.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={raceActionLoadingId === selectedRace.id}
                      onClick={() => handleConfirmResults(selectedRace.id)}
                      className="flex-1 rounded-md bg-emerald-700 py-2.5 text-xs font-black uppercase tracking-wide text-white hover:bg-emerald-800"
                    >
                      Confirm Results
                    </button>
                    <button
                      type="button"
                      disabled={raceActionLoadingId === selectedRace.id}
                      onClick={() => {
                        const reason = window.prompt("Reason to send results back to referee:");
                        if (reason?.trim()) {
                          void handleReopenResults(selectedRace.id, reason.trim());
                        }
                      }}
                      className="rounded-md border border-[#bb8a3c] px-4 py-2.5 text-xs font-black uppercase tracking-wide text-[#bb8a3c] hover:bg-[#bb8a3c]/5"
                    >
                      Send Back
                    </button>
                  </div>
                </div>
              )}

              {selectedRace.status === "RESULT_CONFIRMED" && (
                <div className="rounded-lg border border-slate-200 bg-[#bb8a3c]/5 p-4 space-y-3">
                  <p className="text-sm font-black text-slate-950">Publish Results</p>
                  <p className="text-xs font-semibold text-slate-500">
                    Ready to go live. Publishing will update points on the leaderboard standings.
                  </p>
                  <button
                    type="button"
                    disabled={raceActionLoadingId === selectedRace.id}
                    onClick={() => handlePublishResults(selectedRace.id)}
                    className="w-full rounded-md bg-[#bb8a3c] py-2.5 text-xs font-black uppercase tracking-wide text-[#1c1816] hover:bg-[#cfa24f]"
                  >
                    Publish to Leaderboard
                  </button>
                </div>
              )}

              <div className="space-y-4 pt-1">
                <RaceMediaPanel race={selectedRace} scope="organizer" accent="gold" kind="live" />
                <RaceMediaPanel race={selectedRace} scope="organizer" accent="gold" kind="highlight" />
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* MANAGE ROUND SIDEBAR (Referee Assignment Drawer) */}
      {managedRound && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40" onClick={() => setManageRoundRaceId(null)}>
          <aside
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#bb8a3c]">Round management</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  {managedRound.name}
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Referee assignment and round schedule metadata controls.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManageRoundRaceId(null)}
                className="rounded-md border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500">Basic information</p>
                    <h3 className="mt-1 text-lg font-black text-slate-950">{managedRound.code}</h3>
                  </div>
                  <span className={`rounded-md border px-3 py-1 text-[11px] font-black uppercase tracking-wide ${getRaceStatusMeta(managedRound.status).className}`}>
                    {getRaceStatusMeta(managedRound.status).label}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-md border border-slate-200 bg-white p-3">
                    <CalendarDays className="h-4 w-4 text-slate-500" aria-hidden="true" />
                    <p className="mt-2 text-[11px] font-black uppercase tracking-wider text-slate-400">Race time</p>
                    <p className="mt-1 text-xs font-black text-slate-950">{formatRaceDate(managedRound.raceDateTime)}</p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-white p-3">
                    <Gauge className="h-4 w-4 text-slate-500" aria-hidden="true" />
                    <p className="mt-2 text-[11px] font-black uppercase tracking-wider text-slate-400">Distance</p>
                    <p className="mt-1 text-sm font-black text-slate-950">{managedRound.distanceMeters.toLocaleString()} m</p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-white p-3">
                    <Users className="h-4 w-4 text-slate-500" aria-hidden="true" />
                    <p className="mt-2 text-[11px] font-black uppercase tracking-wider text-slate-400">Field cap</p>
                    <p className="mt-1 text-sm font-black text-slate-950">{managedRound.maxParticipants} participants</p>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-[#bb8a3c]">Assignments</p>
                    <h3 className="mt-1 text-lg font-black text-slate-950">Race Day Referee</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Assign an active hired referee to referee this round.
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-md border px-3 py-1 text-[11px] font-black uppercase tracking-wide ${
                      managedRound.refereeId
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-amber-200 bg-amber-50 text-amber-800"
                    }`}
                  >
                    {managedRound.refereeId ? "Assigned" : "Required"}
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-650">Select Hired Referee</p>
                  <div className="mt-3 space-y-2">
                    {activeContractReferees.length === 0 ? (
                      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                        <p className="text-sm font-black text-slate-700">No active referee contracts</p>
                        <p className="text-xs text-slate-500">Hire referees in the Timeline below first.</p>
                      </div>
                    ) : (
                      activeContractReferees.map((c) => {
                        const workload = getRefereeWorkload(c.refereeId);
                        const isAssigned = managedRound.refereeId === c.refereeId;

                        return (
                          <div
                            key={c.id}
                            className={`flex items-center justify-between rounded-md border p-3 ${
                              isAssigned ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"
                            }`}
                          >
                            <div>
                              <p className="text-sm font-bold text-slate-950">{c.refereeName}</p>
                              <p className="text-xs text-slate-500">{workload} assigned rounds</p>
                            </div>
                            <button
                              type="button"
                              disabled={isAssigned || busyRefereeId === c.refereeId}
                              onClick={() => handleAssignReferee(managedRound, c.refereeId)}
                              className="rounded bg-[#bb8a3c] px-3 py-1 text-xs font-bold text-[#1c1816] hover:bg-[#cfa24f]"
                            >
                              {isAssigned ? "Assigned" : "Assign"}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </section>
            </div>
          </aside>
        </div>
      )}

      {/* CREATE ROUND MODAL */}
      {showCreateRoundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-100 px-6 py-4">
              <p className="text-xs font-black uppercase tracking-wider text-[#bb8a3c]">Season setup</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">
                Create Championship Round
              </h2>
            </div>

            <form onSubmit={handleCreateRoundSubmit}>
              <div className="grid gap-4 p-6 sm:grid-cols-2">
                {roundFormError && (
                  <div className="sm:col-span-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">
                    {roundFormError}
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Round Name *</label>
                  <input
                    type="text"
                    required
                    value={roundForm.name}
                    onChange={(e) => setRoundForm({ ...roundForm, name: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#bb8a3c] focus:outline-none"
                    placeholder="Heritage Mile - Final"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Round Code *</label>
                  <input
                    type="text"
                    required
                    value={roundForm.code}
                    onChange={(e) => setRoundForm({ ...roundForm, code: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#bb8a3c] focus:outline-none"
                    placeholder="HERITAGE_FINAL"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Race Date And Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={roundForm.raceDateTime}
                    onChange={(e) => setRoundForm({ ...roundForm, raceDateTime: e.target.value })}
                    min={tournament?.startDate ? `${tournament.startDate.slice(0, 10)}T00:00` : undefined}
                    max={tournament?.endDate ? `${tournament.endDate.slice(0, 10)}T23:59` : undefined}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#bb8a3c] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Distance (meters) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={roundForm.distanceMeters}
                    onChange={(e) => setRoundForm({ ...roundForm, distanceMeters: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#bb8a3c] focus:outline-none"
                    placeholder="1600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Max Participants *</label>
                  <input
                    type="number"
                    min={2}
                    required
                    value={roundForm.maxParticipants}
                    onChange={(e) => setRoundForm({ ...roundForm, maxParticipants: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#bb8a3c] focus:outline-none"
                    placeholder="12"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setShowCreateRoundModal(false)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingRound}
                  className="rounded-md bg-[#bb8a3c] px-4 py-2 text-sm font-bold text-[#1c1816] hover:bg-[#cfa24f] disabled:opacity-50"
                >
                  {creatingRound ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIFE CYCLE TRANSITION MODAL */}
      {showStatusModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-black text-slate-900">Change Status</h2>
            <p className="mt-3 text-sm text-slate-600">
              Are you sure you want to transition this championship status to{" "}
              <strong>{showStatusModal.targetStatus.replace("_", " ")}</strong>?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowStatusModal({ show: false, targetStatus: "" })}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-55"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updatingStatus}
                onClick={handleStatusTransition}
                className="rounded-md bg-[#bb8a3c] px-4 py-2 text-sm font-bold text-[#1c1816] hover:bg-[#cfa24f] disabled:opacity-50"
              >
                {updatingStatus ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OFFICIALS TIMELINE COMPONENT (Hiring Referees)
// ─────────────────────────────────────────────────────────────────────────────
type OfficialsTabProps = {
  championshipId: number;
  contracts: RefereeContract[];
  directory: RefereeDirectoryEntry[];
  loadingContracts: boolean;
  busyRefereeId: number | null;
  setBusyRefereeId: any;
  onReload: () => Promise<void>;
};

function OfficialsTab({
  championshipId,
  contracts,
  directory,
  loadingContracts,
  busyRefereeId,
  setBusyRefereeId,
  onReload,
}: OfficialsTabProps) {
  const [refereeSearch, setRefereeSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const engagedRefereeIds = useMemo(
    () => new Set(contracts.filter((c) => c.status === "PENDING" || c.status === "ACTIVE").map((c) => c.refereeId)),
    [contracts],
  );

  const filteredDirectory = useMemo(() => {
    return directory.filter((r) => {
      const query = refereeSearch.trim().toLowerCase();
      return r.fullName.toLowerCase().includes(query) || (r.email && r.email.toLowerCase().includes(query));
    });
  }, [directory, refereeSearch]);

  const [showTerminateModal, setShowTerminateModal] = useState<{
    show: boolean;
    contractId: number | null;
    refereeId: number | null;
    refereeName: string;
  }>({
    show: false,
    contractId: null,
    refereeId: null,
    refereeName: "",
  });

  const handleInvite = async (refereeId: number) => {
    setBusyRefereeId(refereeId);
    setErrorMsg("");
    try {
      await inviteReferee(championshipId, { refereeId });
      await onReload();
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, "Could not invite referee."));
    } finally {
      setBusyRefereeId(null);
    }
  };

  const handleTerminateClick = (contractId: number, refereeId: number, refereeName: string) => {
    setShowTerminateModal({
      show: true,
      contractId,
      refereeId,
      refereeName,
    });
  };

  const confirmTerminate = async () => {
    if (showTerminateModal.contractId === null || showTerminateModal.refereeId === null) return;
    const { contractId, refereeId } = showTerminateModal;

    setShowTerminateModal({ show: false, contractId: null, refereeId: null, refereeName: "" });
    setBusyRefereeId(refereeId);
    setErrorMsg("");
    try {
      await terminateRefereeContract(contractId);
      await onReload();
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, "Could not terminate contract."));
    } finally {
      setBusyRefereeId(null);
    }
  };

  const contractBadge: Record<string, string> = {
    PENDING: "border-amber-200 bg-amber-50 text-amber-800",
    ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-800",
    DECLINED: "border-rose-200 bg-rose-50 text-rose-800",
    TERMINATED: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-black text-slate-950 mb-3 border-b border-slate-100 pb-3">Contracted Referees</h3>
        {errorMsg && (
          <div role="alert" className="mb-3 rounded border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
            {errorMsg}
          </div>
        )}
        {loadingContracts ? (
          <div className="h-40 animate-pulse bg-slate-100 rounded" />
        ) : contracts.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No referees engaged yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {contracts.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-bold text-slate-900">{c.refereeName}</p>
                  <span className={`inline-block rounded border px-2 py-0.5 mt-1 text-[10px] font-black uppercase ${contractBadge[c.status]}`}>
                    {c.status}
                  </span>
                </div>
                {(c.status === "ACTIVE" || c.status === "PENDING") && (
                  <button
                    type="button"
                    disabled={busyRefereeId === c.refereeId}
                    onClick={() => handleTerminateClick(c.id, c.refereeId, c.refereeName || "")}
                    className="rounded border border-rose-350 px-3 py-1.5 text-xs font-black text-rose-700 hover:bg-rose-50"
                  >
                    Terminate
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-black text-slate-950 mb-3 border-b border-slate-100 pb-3">Licensed Referees Directory</h3>
        <div className="mb-3 relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={refereeSearch}
            onChange={(e) => setRefereeSearch(e.target.value)}
            placeholder="Search directory..."
            className="w-full rounded border border-slate-200 py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:border-[#bb8a3c]"
          />
        </div>
        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
          {filteredDirectory.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No referees found.</p>
          ) : (
            filteredDirectory.map((r) => {
              const engaged = engagedRefereeIds.has(r.refereeId);
              return (
                <div key={r.refereeId} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-bold text-slate-800">{r.fullName}</p>
                    <p className="text-xs text-slate-500">
                      License: {r.licenseNumber || "—"} · {r.experienceYears || 0} yrs exp
                    </p>
                  </div>
                  {!engaged ? (
                    <button
                      type="button"
                      disabled={busyRefereeId === r.refereeId}
                      onClick={() => handleInvite(r.refereeId)}
                      className="rounded bg-[#bb8a3c] px-3 py-1 text-xs font-bold text-[#1c1816] hover:bg-[#cfa24f]"
                    >
                      Invite
                    </button>
                  ) : (
                    <span className="text-xs font-black uppercase text-emerald-700">Engaged</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {showTerminateModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-black text-slate-950">
                Terminate Referee Contract
              </h3>
            </div>
            <p className="mt-4 text-sm text-slate-500 leading-6">
              Are you sure you want to terminate the contract for referee <strong className="text-slate-800">{showTerminateModal.refereeName}</strong>? This action will remove them from all assigned rounds and cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowTerminateModal({ show: false, contractId: null, refereeId: null, refereeName: "" })}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmTerminate}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-black text-white hover:bg-rose-700 cursor-pointer"
              >
                Terminate Contract
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FINISHING ORDER SUMMARY WORKSPACE
// ─────────────────────────────────────────────────────────────────────────────
function RaceResultSummary({ raceId }: { raceId: number }) {
  const [result, setResult] = useState<PublicRaceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    getOrganizerRaceResults(raceId)
      .then((data) => active && setResult(data))
      .catch((err) => active && setError(getApiErrorMessage(err, "Failed to load order results.")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [raceId]);

  const sortedEntries = useMemo(() => {
    return [...(result?.entries ?? [])].sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
  }, [result]);

  const POSITION_TONE: Record<number, string> = {
    1: "bg-[#bb8a3c] text-[#1c1816]",
    2: "bg-[#c9c2b2] text-[#1c1816]",
    3: "bg-[#cd8b5e] text-white",
  };

  if (loading) return <div className="h-32 animate-pulse bg-slate-100 rounded" />;
  if (error) return <div className="text-xs font-semibold text-rose-700">{error}</div>;
  if (sortedEntries.length === 0) return <p className="text-center py-6 text-xs text-slate-500">No finisher times submitted yet.</p>;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-xs text-left">
        <thead>
          <tr className="bg-slate-50 font-black text-slate-500 uppercase tracking-wide">
            <th className="px-4 py-2">Pos</th>
            <th className="px-4 py-2">Horse / Jockey</th>
            <th className="px-4 py-2 text-right">Finish Time</th>
            <th className="px-4 py-2 text-right">Points</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sortedEntries.map((e, idx) => {
            const pos = e.position ?? idx + 1;
            const tone = POSITION_TONE[pos] ?? "bg-slate-100 text-slate-700";
            const finished = e.resultStatus === "FINISHED";

            return (
              <tr key={idx} className="hover:bg-slate-50/50">
                <td className="px-4 py-2">
                  <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${tone}`}>
                    {finished ? pos : "—"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <p className="font-bold text-slate-900">{e.horseName}</p>
                  <p className="text-[10px] text-slate-500">{e.jockeyName ?? "—"}</p>
                </td>
                <td className="px-4 py-2 text-right font-mono text-slate-800">
                  {finished ? (e.finishTimeSeconds != null ? `${e.finishTimeSeconds.toFixed(2)}s` : "—") : "DNF"}
                </td>
                <td className="px-4 py-2 text-right font-black text-slate-950">{e.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
