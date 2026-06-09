import { useEffect, useState } from "react";
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
} from "lucide-react";
import { AdminLayout } from "../../layouts/AdminLayout";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { assignAdminRaceReferee, createAdminRace, getAdminRaces, updateAdminRaceStatus } from "../../api/adminRaceApi";
import { getAdminUsers } from "../../api/adminUserApi";
import {
  CreateTournamentPayload,
  deleteTournament,
  getTournamentDetail,
  updateTournament,
  updateTournamentStatus,
} from "../../api/adminTournamentApi";
import {
  approveAdminJockeyPoolApplication,
  approveAdminTournamentRegistration,
  getAdminChampionshipParticipants,
  getAdminJockeyPoolApplications,
  getAdminTournamentRegistrations,
  lockAdminChampionshipParticipants,
  rejectAdminJockeyPoolApplication,
  rejectAdminTournamentRegistration,
} from "../../api/racingApi";
import type { Race, RaceStatus, Tournament, TournamentParticipant, TournamentRegistration } from "../../types/racing";
import type { JockeyPoolApplication } from "../../types/racing";
import type { AdminUserDetail } from "../../types/adminUser";
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
    helper: "Result has been submitted and needs admin confirmation.",
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

const raceNextActions: Record<string, { label: string; target: RaceStatus; icon: typeof Play } | undefined> = {
  SCHEDULED: { label: "Start checks", target: "CHECKING", icon: ClipboardCheck },
  CHECKING: { label: "Mark ready", target: "READY", icon: CheckCircle2 },
  READY: { label: "Start race", target: "ONGOING", icon: Play },
  ONGOING: { label: "Finish race", target: "FINISHED", icon: Flag },
  FINISHED: { label: "Submit results", target: "RESULT_SUBMITTED", icon: Trophy },
  RESULT_SUBMITTED: { label: "Confirm results", target: "RESULT_CONFIRMED", icon: CheckCircle2 },
  RESULT_CONFIRMED: { label: "Publish results", target: "PUBLISHED", icon: Trophy },
};

function formatRaceDate(value: string) {
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
      return "border-blue-200 bg-blue-100 text-blue-800";
    case "COMPLETED":
      return "border-purple-200 bg-purple-100 text-purple-800";
    case "POSTPONED":
      return "border-orange-200 bg-orange-100 text-orange-800";
    case "CLOSED_REGISTRATION":
      return "border-amber-200 bg-amber-100 text-amber-800";
    case "PARTICIPANTS_LOCKED":
      return "border-[#b3193a]/25 bg-[#b3193a]/10 text-[#b3193a]";
    case "SCHEDULE_PUBLISHED":
      return "border-sky-200 bg-sky-100 text-sky-800";
    default:
      return "border-slate-200 bg-slate-100 text-slate-800";
  }
}

function getNextActionLabel(race: Race | null) {
  if (!race) {
    return "Create Championship Round";
  }

  if (race.status === "SCHEDULED") {
    return "Start Operational Checks";
  }

  return raceNextActions[race.status]?.label ?? "Review Round Status";
}

function getChampionshipNextActionLabel(tournament: Tournament, race: Race | null) {
  switch (tournament.status) {
    case "OPEN_REGISTRATION":
      return "Review Applications";
    case "CLOSED_REGISTRATION":
      return "Lock Participants";
    case "PARTICIPANTS_LOCKED":
      return "Publish Schedule";
    case "SCHEDULE_PUBLISHED":
      return "Open Round Control Center";
    case "COMPLETED":
      return "Review Standings";
    default:
      return getNextActionLabel(race);
  }
}

export function AdminTournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const tournamentId = Number(id);

  const [tournament, setTournament] = useState<Tournament | null>(null);
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
  const [raceActionLoadingId, setRaceActionLoadingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateTournamentPayload>({
    name: "",
    code: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
    registrationStartAt: "",
    registrationEndAt: "",
    maxHorses: undefined,
    maxHorsesPerOwner: 2,
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
  const [referees, setReferees] = useState<AdminUserDetail[]>([]);
  const [refereeLoading, setRefereeLoading] = useState(false);
  const [refereeError, setRefereeError] = useState("");
  const [refereeSearch, setRefereeSearch] = useState("");
  const [assigningRefereeId, setAssigningRefereeId] = useState<number | null>(null);
  const [highlightMissingReferees, setHighlightMissingReferees] = useState(false);
  const [roundSearch, setRoundSearch] = useState("");
  const [roundStatusFilter, setRoundStatusFilter] = useState("ALL");

  useDocumentTitle(tournament ? `${tournament.name} championship` : "Championship detail");

  const loadDetail = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const data = await getTournamentDetail(tournamentId);
      setTournament(data);
      setForm({
        name: data.name,
        code: data.code || "",
        description: data.description || "",
        location: data.location || "",
        startDate: data.startDate || "",
        endDate: data.endDate || "",
        registrationStartAt: data.registrationStartAt || "",
        registrationEndAt: data.registrationEndAt || "",
        maxHorses: data.maxHorses || undefined,
        maxHorsesPerOwner: data.maxHorsesPerOwner ?? 2,
      });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to load championship detail.");
    } finally {
      setLoading(false);
    }
  };

  const loadRaces = async () => {
    try {
      setRaceLoading(true);
      setRaceError("");
      const data = await getAdminRaces({ tournamentId });
      setRaces(data);
      setSelectedRaceId((currentId) => {
        if (currentId && data.some((race) => race.id === currentId)) {
          return currentId;
        }
        return data[0]?.id ?? null;
      });
    } catch (err: any) {
      setRaceError(err.response?.data?.message || "Failed to load round control.");
    } finally {
      setRaceLoading(false);
    }
  };

  const loadRegistrations = async () => {
    try {
      setRegistrationLoading(true);
      setRegistrationError("");
      const data = await getAdminTournamentRegistrations();
      setRegistrations(data.filter((registration) => registration.tournamentId === tournamentId));
    } catch (err: any) {
      setRegistrationError(err.response?.data?.message || "Failed to load horse registrations.");
    } finally {
      setRegistrationLoading(false);
    }
  };

  const loadJockeyApplications = async () => {
    try {
      setJockeyApplicationLoading(true);
      setJockeyApplicationError("");
      const data = await getAdminJockeyPoolApplications(tournamentId);
      setJockeyApplications(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setJockeyApplicationError(err.response?.data?.message || "Failed to load jockey pool applications.");
    } finally {
      setJockeyApplicationLoading(false);
    }
  };

  const loadParticipants = async () => {
    try {
      setParticipantLoading(true);
      setParticipantError("");
      const data = await getAdminChampionshipParticipants(tournamentId);
      setParticipants(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setParticipantError(err.response?.data?.message || "Failed to load championship participants.");
    } finally {
      setParticipantLoading(false);
    }
  };

  const loadReferees = async () => {
    try {
      setRefereeLoading(true);
      setRefereeError("");
      const data = await getAdminUsers("", "", "REFEREE", 0, 100);
      setReferees(data.content ?? []);
    } catch (err) {
      setRefereeError(getApiErrorMessage(err, "Failed to load referees."));
    } finally {
      setRefereeLoading(false);
    }
  };

  useEffect(() => {
    if (tournamentId) {
      loadDetail();
    }
  }, [tournamentId]);

  useEffect(() => {
    if (tournamentId && ["overview", "rounds"].includes(activeTab)) {
      loadRaces();
    }
  }, [activeTab, tournamentId]);

  useEffect(() => {
    if (tournamentId && ["overview", "applications"].includes(activeTab)) {
      loadRegistrations();
      loadJockeyApplications();
    }
  }, [activeTab, tournamentId]);

  useEffect(() => {
    if (tournamentId && ["participants", "standings"].includes(activeTab)) {
      loadParticipants();
    }
  }, [activeTab, tournamentId]);

  useEffect(() => {
    if (activeTab === "rounds" && referees.length === 0) {
      void loadReferees();
    }
  }, [activeTab]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!form.name || !form.code || !form.location || !form.startDate || !form.endDate || !form.registrationStartAt || !form.registrationEndAt) {
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
      await updateTournament(tournamentId, {
        ...form,
        maxHorses: form.maxHorses ? Number(form.maxHorses) : undefined,
        maxHorsesPerOwner: form.maxHorsesPerOwner ? Number(form.maxHorsesPerOwner) : 2,
      });
      setSuccessMsg("Championship setup updated successfully.");
      loadDetail();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to update championship.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await deleteTournament(tournamentId);
      setShowDeleteModal(false);
      navigate("/admin/tournaments");
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to delete championship.");
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
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
      await updateTournamentStatus(tournamentId, targetStatus);
      setShowStatusModal({ show: false, targetStatus: "" });
      setSuccessMsg(`Status updated successfully to ${targetStatus.replace("_", " ")}.`);
      loadDetail();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to update championship status.");
      setShowStatusModal({ show: false, targetStatus: "" });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleRaceStatusTransition = async (race: Race, targetStatus: RaceStatus) => {
    try {
      setRaceActionLoadingId(race.id);
      setRaceError("");
      const updatedRace = await updateAdminRaceStatus(race.id, targetStatus);
      setRaces((currentRaces) =>
        currentRaces.map((currentRace) => (currentRace.id === updatedRace.id ? updatedRace : currentRace)),
      );
      setSelectedRaceId(updatedRace.id);
      setSuccessMsg(`${race.name} moved to ${targetStatus.replace("_", " ").toLowerCase()}.`);
    } catch (err: any) {
      setRaceError(err.response?.data?.message || "Failed to update race status.");
    } finally {
      setRaceActionLoadingId(null);
    }
  };

  const openManageRound = (race: Race) => {
    setManageRoundRaceId(race.id);
    setRefereeSearch("");
    setRefereeError("");
    if (referees.length === 0) {
      void loadReferees();
    }
  };

  const handleAssignReferee = async (race: Race, referee: AdminUserDetail) => {
    try {
      setAssigningRefereeId(referee.id);
      setRefereeError("");
      const updatedRace = await assignAdminRaceReferee(race.id, referee.id);
      setRaces((currentRaces) =>
        currentRaces.map((currentRace) => (currentRace.id === updatedRace.id ? updatedRace : currentRace)),
      );
      setManageRoundRaceId(updatedRace.id);
      setSuccessMsg(`${referee.fullName} assigned to ${race.name}.`);
    } catch (err) {
      setRefereeError(getApiErrorMessage(err, "Failed to assign referee."));
    } finally {
      setAssigningRefereeId(null);
    }
  };

  const handleApproveHorseRegistration = async (registration: TournamentRegistration) => {
    try {
      setHorseProcessingId(registration.id);
      setRegistrationError("");
      await approveAdminTournamentRegistration(registration.id);
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
      await rejectAdminTournamentRegistration(registration.id, reason);
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
      await approveAdminJockeyPoolApplication(tournamentId, application.id);
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
      await rejectAdminJockeyPoolApplication(tournamentId, application.id, reason);
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

    try {
      setCreatingRound(true);
      const createdRound = await createAdminRace({
        tournamentId,
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
      setRoundFormError(err.response?.data?.message || "Failed to create championship round.");
    } finally {
      setCreatingRound(false);
    }
  };

  const handleLockParticipants = async () => {
    try {
      setLockingParticipants(true);
      setErrorMsg("");
      setSuccessMsg("");
      const response = await lockAdminChampionshipParticipants(tournamentId);
      setSuccessMsg(
        response.createdParticipants > 0
          ? `${response.createdParticipants} participant pair${response.createdParticipants === 1 ? "" : "s"} locked from accepted contracts.`
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

  if (loading && !tournament) {
    return (
      <AdminLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#b3193a] border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  if (!tournament) {
    return (
      <AdminLayout>
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="text-lg font-bold text-slate-700">Championship not found</p>
          <Link to="/admin/tournaments" className="mt-4 inline-block font-bold text-[#b3193a] underline">
            Back to Championships
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const isLocked = !["DRAFT", "POSTPONED"].includes(tournament.status);
  const isDraft = tournament.status === "DRAFT";
  const currentPhase = getChampionshipPhase(tournament.status);
  const currentPhaseIndex = championshipPhases.indexOf(currentPhase);
  const selectedRace = races.find((race) => race.id === selectedRaceId) ?? races[0] ?? null;
  const selectedRaceMeta = selectedRace ? getRaceStatusMeta(selectedRace.status) : null;
  const selectedRaceAction = selectedRace ? raceNextActions[selectedRace.status] : undefined;
  const SelectedRaceActionIcon = selectedRaceAction?.icon;
  const publishedRaceCount = races.filter((race) => race.status === "PUBLISHED").length;
  const resultReadyCount = races.filter((race) => race.status === "RESULT_CONFIRMED").length;
  const activeRaceCount = races.filter((race) => ["CHECKING", "READY", "ONGOING"].includes(race.status)).length;
  const nextRound = races.find((race) => !["PUBLISHED", "CANCELLED"].includes(race.status)) ?? races[0] ?? null;
  const managedRound = races.find((race) => race.id === manageRoundRaceId) ?? null;
  const missingRefereeRounds = races.filter((race) => !race.refereeId);
  const allRoundsCreated = races.length > 0;
  const participantsLockedForSchedule = ["PARTICIPANTS_LOCKED", "SCHEDULE_PUBLISHED", "ONGOING", "COMPLETED"].includes(tournament.status);
  const lockedParticipantsCount = participants.filter((p) => p.status !== "PENDING_LOCK").length;
  const officialParticipantsReady = lockedParticipantsCount > 0 || participantsLockedForSchedule;
  const schedulePublicationReady = allRoundsCreated && officialParticipantsReady && missingRefereeRounds.length === 0;
  const scheduleBlockReason = !allRoundsCreated
    ? "Create at least one round before publishing the schedule."
    : !officialParticipantsReady
      ? "Lock official participants before publishing the schedule."
      : missingRefereeRounds.length > 0
        ? `${missingRefereeRounds.length} round${missingRefereeRounds.length === 1 ? "" : "s"} missing referee assignment.`
        : "";
  const filteredReferees = referees.filter((referee) => {
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
  const registrationReadinessLabel = `${approvedRegistrations.length} horses approved, ${approvedJockeyPool.length} jockeys in pool, ${tournament.maxHorsesPerOwner ?? 2} horses per owner`;
  const nextActionLabel = getChampionshipNextActionLabel(tournament, nextRound);
  const getRefereeWorkload = (refereeId: number) => races.filter((race) => race.refereeId === refereeId).length;

  const openRoundControlCenter = (race: Race | null = nextRound) => {
    if (race) {
      setSelectedRaceId(race.id);
    }
    setActiveTab("rounds");
    setRoundControlOpen(true);
  };

  const handleContinueOperations = () => {
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
          onClick={() => setShowStatusModal({ show: true, targetStatus: "OPEN_REGISTRATION" })}
          className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
        >
          Open Registration
        </button>
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
        <>
          <button
            onClick={() => void handleLockParticipants()}
            disabled={lockingParticipants}
            className="rounded-md bg-[#b3193a] px-4 py-2 text-xs font-bold text-white hover:bg-[#92122d] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {lockingParticipants ? "Locking..." : "Lock Participants"}
          </button>
          <button
            onClick={() => setShowStatusModal({ show: true, targetStatus: "POSTPONED" })}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Postpone
          </button>
        </>
      )}

      {tournament.status === "PARTICIPANTS_LOCKED" && (
        <>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setShowStatusModal({ show: true, targetStatus: "SCHEDULE_PUBLISHED" })}
              disabled={!schedulePublicationReady}
              className="rounded-md bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
              title={schedulePublicationReady ? "Publish official race schedule" : scheduleBlockReason}
            >
              Publish Schedule
            </button>
            {!schedulePublicationReady && (
              <p className="max-w-[220px] text-[11px] font-semibold leading-4 text-amber-700">{scheduleBlockReason}</p>
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
            className="rounded-md bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
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
          className="rounded-md bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700"
        >
          Complete Championship
        </button>
      )}

      {tournament.status === "POSTPONED" && (
        <button
          onClick={() => setShowStatusModal({ show: true, targetStatus: "OPEN_REGISTRATION" })}
          className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
        >
          Reopen Registration
        </button>
      )}
    </div>
  );

  const renderSetupForm = () => (
    <form onSubmit={handleSave} className="flex flex-col gap-6 rounded-lg border border-slate-200 bg-white p-5">
      <div>
        <p className="text-xs font-black uppercase tracking-wider text-[#b3193a]">Championship setup</p>
        <h2 className="mt-1 text-xl font-black text-slate-950">Championship Setup</h2>
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
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#b3193a] focus:outline-none focus:ring-2 focus:ring-[#b3193a]/20"
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
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#b3193a] focus:outline-none focus:ring-2 focus:ring-[#b3193a]/20"
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
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#b3193a] focus:outline-none focus:ring-2 focus:ring-[#b3193a]/20"
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
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#b3193a] focus:outline-none focus:ring-2 focus:ring-[#b3193a]/20"
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
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#b3193a] focus:outline-none focus:ring-2 focus:ring-[#b3193a]/20"
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
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#b3193a] focus:outline-none focus:ring-2 focus:ring-[#b3193a]/20"
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
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#b3193a] focus:outline-none focus:ring-2 focus:ring-[#b3193a]/20"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Max Horse Participants</label>
          <input
            type="number"
            disabled={isLocked}
            value={form.maxHorses || ""}
            onChange={(e) => setForm({ ...form, maxHorses: e.target.value ? Number(e.target.value) : undefined })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#b3193a] focus:outline-none focus:ring-2 focus:ring-[#b3193a]/20"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Max Horses Per Owner</label>
          <input
            type="number"
            min={1}
            disabled={isLocked}
            value={form.maxHorsesPerOwner || ""}
            onChange={(e) =>
              setForm({
                ...form,
                maxHorsesPerOwner: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#b3193a] focus:outline-none focus:ring-2 focus:ring-[#b3193a]/20"
          />
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Counts active pending and approved horse applications from the same owner.
          </p>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Description</label>
          <textarea
            rows={3}
            disabled={isLocked}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#b3193a] focus:outline-none focus:ring-2 focus:ring-[#b3193a]/20"
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        {isDraft ? (
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="rounded-md border border-rose-300 bg-white px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50"
          >
            Delete Championship
          </button>
        ) : (
          <div />
        )}

        {!isLocked && (
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-[#b3193a] px-5 py-2 text-sm font-bold text-white hover:bg-[#92122d] disabled:opacity-50"
          >
            {saving ? "Saving Changes..." : "Save Changes"}
          </button>
        )}
      </div>
    </form>
  );

  const renderRoundControlCenter = () => (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
      <aside
        aria-labelledby="control-center-title"
        aria-modal="true"
        role="dialog"
        className="flex h-full w-full max-w-5xl flex-col overflow-hidden bg-slate-50 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-[#b3193a]">Round operations</p>
            <h2 id="control-center-title" className="mt-1 text-2xl font-black text-slate-950">
              Round Control Center
            </h2>
            <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500">
              Operate championship rounds from scheduled checks through result publishing.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden gap-2 text-center md:flex">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                <p className="text-lg font-black leading-none text-slate-950">{races.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Rounds</p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5">
                <p className="text-lg font-black leading-none text-amber-800">{activeRaceCount}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Live ops</p>
              </div>
              <div className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5">
                <p className="text-lg font-black leading-none text-cyan-800">{resultReadyCount}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-cyan-700">Publish ready</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRoundControlOpen(false)}
              className="rounded-md border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              aria-label="Close control center"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col gap-5">

      {raceError && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
          {raceError}
        </div>
      )}

      {raceLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-lg border border-slate-100 bg-slate-50" />
          ))}
        </div>
      ) : races.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <Flag className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
          <h3 className="mt-3 text-lg font-black text-slate-900">No race rounds scheduled yet</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-slate-500">
            Create championship rounds before opening race-day operations. Each round can then move through checks,
            start, finish, result confirmation, and publishing.
          </p>
        </div>
      ) : (
        <div className="w-full">
          {selectedRace && selectedRaceMeta && (
            <section aria-labelledby="selected-race-title" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500">Selected round</p>
                  <h3 id="selected-race-title" className="mt-1 text-xl font-black text-slate-950">
                    {selectedRace.name}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{selectedRace.code}</p>
                </div>
                <span className={`w-fit rounded-md border px-3 py-1.5 text-xs font-black uppercase tracking-wide ${selectedRaceMeta.className}`}>
                  {selectedRaceMeta.label}
                </span>
              </div>

              <div className="grid gap-3 border-b border-slate-100 py-5 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <CalendarDays className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  <p className="mt-2 text-[11px] font-black uppercase tracking-wider text-slate-400">Race time</p>
                  <p className="mt-1 text-sm font-black text-slate-900">{formatRaceDate(selectedRace.raceDateTime)}</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <Gauge className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  <p className="mt-2 text-[11px] font-black uppercase tracking-wider text-slate-400">Distance</p>
                  <p className="mt-1 text-sm font-black text-slate-900">{selectedRace.distanceMeters.toLocaleString()} m</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <Trophy className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  <p className="mt-2 text-[11px] font-black uppercase tracking-wider text-slate-400">Field cap</p>
                  <p className="mt-1 text-sm font-black text-slate-900">{selectedRace.maxParticipants} participants</p>
                </div>
              </div>

              <div className="grid gap-4 py-5 lg:grid-cols-[1fr_0.9fr]">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-black text-slate-950">Operational state</p>
                      <p className="mt-1 text-sm font-medium leading-6 text-slate-600">{selectedRaceMeta.helper}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-sm font-black text-slate-950">Next operation</p>
                  {selectedRaceAction ? (
                    <div className="mt-3">
                      <button
                        type="button"
                        disabled={raceActionLoadingId === selectedRace.id}
                        onClick={() => handleRaceStatusTransition(selectedRace, selectedRaceAction.target)}
                        aria-label={`${selectedRaceAction.label} for ${selectedRace.name}`}
                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#b3193a] px-4 py-2 text-sm font-black text-white transition hover:bg-[#92122d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b3193a] focus-visible:ring-offset-2 disabled:opacity-60"
                      >
                        {SelectedRaceActionIcon && <SelectedRaceActionIcon className="h-4 w-4" aria-hidden="true" />}
                        {raceActionLoadingId === selectedRace.id ? "Updating..." : selectedRaceAction.label}
                      </button>
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        This moves the race to {selectedRaceAction.target.replace("_", " ").toLowerCase()}.
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm font-semibold text-slate-500">No manual operation is available for this state.</p>
                  )}
                </div>
              </div>

              {selectedRace.status === "RESULT_CONFIRMED" && (
                <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-cyan-700" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-black text-cyan-950">Result ready for publishing</p>
                      <p className="mt-1 text-sm font-medium text-cyan-800">
                        Publish only after result sheets and referee confirmation are complete.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      )}
          </div>
        </div>
      </aside>
    </div>
  );

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Link to="/admin/tournaments" className="hover:text-[#b3193a]">
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

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <button className="inline-flex max-w-full items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-black text-slate-950">
                <span className="truncate">{tournament.name}</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              </button>
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
                Manage the championship by current state, next action, round control, and standings update.
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
              <div className="rounded-lg border border-[#b3193a]/25 bg-[#b3193a]/5 p-3">
                <p className="text-[11px] font-black uppercase tracking-wider text-[#b3193a]">Next Action</p>
                <p className="mt-1 text-lg font-black text-slate-950">{nextActionLabel}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-600">
              Admin should continue from the next required round action, then publish results into standings.
            </p>
            <button
              type="button"
              onClick={handleContinueOperations}
              disabled={lockingParticipants}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#b3193a] px-5 text-sm font-black text-white transition hover:bg-[#92122d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b3193a] focus-visible:ring-offset-2"
            >
              {lockingParticipants ? "Locking Participants..." : "Continue Operations"}
            </button>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-5">
            {championshipPhases.map((phase, index) => {
              const isComplete = index < currentPhaseIndex;
              const isCurrent = index === currentPhaseIndex;
              return (
                <div key={phase} className="min-w-0">
                  <div
                    className={`h-2 rounded-full ${
                      isComplete || isCurrent ? "bg-[#b3193a]" : "bg-slate-200"
                    }`}
                  />
                  <p className={`mt-2 truncate text-[11px] font-black uppercase tracking-wide ${isCurrent ? "text-[#b3193a]" : "text-slate-500"}`}>
                    {phase}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
          <nav
            className="flex flex-col gap-2 text-sm font-bold lg:flex-row lg:items-center"
            aria-label="Championship secondary navigation"
          >
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`min-h-11 rounded-md px-4 text-left text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b3193a] focus-visible:ring-offset-2 ${
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
                  className={`min-h-11 shrink-0 rounded-md px-4 text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b3193a] focus-visible:ring-offset-2 ${
                    activeTab === tab.key
                      ? "bg-[#b3193a] text-white"
                      : "bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>
        </div>

        {activeTab === "overview" && (
          <section
            aria-label="Primary championship overview"
            className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]"
          >
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wider text-[#b3193a]">Championship overview</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Command Center</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                Start from the championship state, then continue to the one action that moves operations forward.
              </p>

              <div className="mt-5 space-y-3">
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
                      className="inline-flex min-h-10 items-center justify-center rounded-md bg-amber-700 px-4 text-xs font-black text-white hover:bg-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2"
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

                <div className="grid gap-3 sm:grid-cols-2">
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

                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-sm font-black text-slate-950">Secondary workspaces</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                    Use the navigation above for applications review, participant formation, round setup, standings, and
                    championship-level controls.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wider text-[#b3193a]">Next action</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">{nextActionLabel}</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                Continue directly into the current round control center. Controls stays reserved for championship-level
                lifecycle actions.
              </p>
              <button
                type="button"
                onClick={handleContinueOperations}
                disabled={lockingParticipants}
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-[#b3193a] px-5 text-sm font-black text-white transition hover:bg-[#92122d] disabled:cursor-not-allowed disabled:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b3193a] focus-visible:ring-offset-2"
              >
                {lockingParticipants ? "Locking Participants..." : "Continue Operations"}
              </button>
              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-950">Primary flow</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Overview to Round Control Center to Publish Results to Standings Updated.
                </p>
              </div>
            </section>
          </section>
        )}

        {activeTab === "applications" && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-5">
              <p className="text-xs font-black uppercase tracking-wider text-[#b3193a]">Entry review</p>
              <h2 className="text-2xl font-black text-slate-950">Championship Applications</h2>
              <p className="max-w-2xl text-sm font-medium leading-6 text-slate-500">
                Review both entry streams before participant pairs are locked: owner-submitted horses and jockeys applying
                to become selectable in this championship pool.
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
                { key: "jockeys" as const, label: "Jockey Pool", Icon: UserCheck },
              ].map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setApplicationView(key)}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-md px-4 text-sm font-black ${
                    applicationView === key
                      ? "bg-white text-[#b3193a] shadow-sm"
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
                <h3 className="mt-3 text-lg font-black text-slate-900">No horse registrations for this championship</h3>
                <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-slate-500">
                  Approved horses will appear here once owners register them for this championship.
                </p>
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
                        {registration.status.replace("_", " ")}
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
                                className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold focus:border-[#b3193a] focus:outline-none focus:ring-2 focus:ring-[#b3193a]/20"
                              />
                            </label>
                          <button
                            type="button"
                            disabled={horseProcessingId === registration.id}
                            onClick={() => handleApproveHorseRegistration(registration)}
                            className="h-9 rounded-md bg-emerald-600 px-3 text-xs font-black text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={horseProcessingId === registration.id}
                            onClick={() => handleRejectHorseRegistration(registration)}
                            className="h-9 rounded-md border border-[#b3193a] px-3 text-xs font-black text-[#b3193a] hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-slate-500">
                  Jockeys must apply to this championship pool before owners can select them for assignment contracts.
                </p>
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
                      <div className="flex items-center gap-3">
                        {application.jockeyAvatarUrl ? (
                          <img
                            alt=""
                            src={application.jockeyAvatarUrl}
                            className="h-11 w-11 rounded-md border border-slate-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-sm font-black text-slate-500">
                            {application.jockeyName?.slice(0, 1) || "J"}
                          </div>
                        )}
                        <div>
                          <p className="font-black text-slate-950">{application.jockeyName}</p>
                          {application.jockeyEmail && (
                            <p className="mt-1 text-xs font-semibold text-slate-500">{application.jockeyEmail}</p>
                          )}
                        </div>
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
                      <p className="truncate text-sm font-semibold text-slate-600" title={application.message || "No application message"}>
                        {application.message || "No application message"}
                      </p>
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
                                className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold focus:border-[#b3193a] focus:outline-none focus:ring-2 focus:ring-[#b3193a]/20"
                              />
                            </label>
                          <button
                            type="button"
                            disabled={jockeyProcessingId === application.id}
                            onClick={() => handleApproveJockeyApplication(application)}
                            className="h-9 rounded-md bg-emerald-600 px-3 text-xs font-black text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Approve Pool
                          </button>
                          <button
                            type="button"
                            disabled={jockeyProcessingId === application.id}
                            onClick={() => handleRejectJockeyApplication(application)}
                            className="h-9 rounded-md border border-[#b3193a] px-3 text-xs font-black text-[#b3193a] hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
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

        {activeTab === "participants" && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#b3193a]">Official horse and jockey pairs</p>
                <h2 className="text-2xl font-black text-slate-950">Championship Participants</h2>
                <p className="max-w-2xl text-sm font-medium leading-6 text-slate-500">
                  This is the official participant source of truth. Accepted contracts only become season participants after admin lock.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleLockParticipants()}
                disabled={lockingParticipants}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#b3193a] px-4 text-sm font-black text-white hover:bg-[#92122d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <UserCheck className="h-4 w-4" aria-hidden="true" />
                {lockingParticipants ? "Locking..." : "Lock Accepted Contracts"}
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Locked pairs</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{lockedParticipantsCount}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Capacity</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{participantCapacity || "Unset"}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Accepted contract lock</p>
                <p className="mt-2 text-sm font-black text-slate-950">
                  {lockedParticipantsCount > 0 ? "Participant roster established" : "Waiting for admin lock"}
                </p>
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
                <h3 className="mt-3 text-lg font-black text-slate-900">No official participants locked yet</h3>
                <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-slate-500">
                  Approve horse registrations, approve jockey pool applications, wait for accepted contracts, then lock participants.
                </p>
              </div>
            ) : (
              <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
                <div className="grid grid-cols-[1.2fr_1fr_1fr_96px_120px] bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <span>Horse</span>
                  <span>Jockey</span>
                  <span>Owner / Stable</span>
                  <span>Points</span>
                  <span>Status</span>
                </div>
                {participants.map((participant) => (
                  <article
                    key={participant.id}
                    className="grid grid-cols-1 gap-3 border-t border-slate-100 px-4 py-4 md:grid-cols-[1.2fr_1fr_1fr_96px_120px] md:items-center"
                  >
                    <div>
                      <p className="text-sm font-black text-slate-950">{participant.horseName}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">Registration #{participant.horseRegistrationId}</p>
                    </div>
                    <p className="text-sm font-bold text-slate-700">{participant.jockeyName}</p>
                    <p className="text-sm font-bold text-slate-700">{participant.ownerName}</p>
                    <p className="text-sm font-black text-slate-950">{participant.points} pts</p>
                    <span
                      className={`w-fit rounded-md border px-3 py-1 text-[11px] font-black uppercase tracking-wide ${
                        participant.status === "ACTIVE"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : participant.status === "DISQUALIFIED"
                            ? "border-rose-200 bg-rose-50 text-rose-800"
                            : participant.status === "PENDING_LOCK"
                              ? "border-amber-200 bg-amber-50 text-amber-800"
                              : "border-slate-200 bg-slate-50 text-slate-700"
                      }`}
                    >
                      {participant.status.replaceAll("_", " ")}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "rounds" && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#b3193a]">Season progression</p>
                <h2 className="text-2xl font-black text-slate-950">Championship Rounds</h2>
                <p className="max-w-2xl text-sm font-medium leading-6 text-slate-500">
                  Rounds are the season timeline. CRUD is setup; when the championship is ongoing, the primary action is
                  opening the round control center.
                </p>
              </div>
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
                          <span
                            className={`text-sm font-black ${
                              isPassed ? "text-emerald-950" : "text-slate-500"
                            }`}
                          >
                            {item.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <aside
                aria-labelledby="schedule-readiness-title"
                className={`rounded-lg border p-4 ${
                  schedulePublicationReady
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-600">Publication readiness</p>
                    <h3 id="schedule-readiness-title" className="mt-1 text-lg font-black text-slate-950">
                      Schedule Publication
                    </h3>
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
                    <p className="text-sm font-black text-amber-900">Cannot publish schedule yet</p>
                    <p className="mt-1 text-sm font-semibold leading-5 text-amber-800">{scheduleBlockReason}</p>
                    {missingRefereeRounds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setHighlightMissingReferees(true);
                          document.getElementById("missing-referee-round")?.scrollIntoView({ behavior: "smooth", block: "center" });
                        }}
                        className="mt-3 rounded-md border border-amber-300 bg-white px-3 py-2 text-xs font-black text-amber-800 hover:bg-amber-50"
                      >
                        Review missing rounds
                      </button>
                    )}
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
                    className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-[#b3193a] focus:outline-none focus:ring-2 focus:ring-[#b3193a]/20"
                  />
                </div>
                <select
                  value={roundStatusFilter}
                  onChange={(e) => setRoundStatusFilter(e.target.value)}
                  className="rounded-md border border-slate-300 py-2 pl-3 pr-8 text-sm font-semibold text-slate-900 focus:border-[#b3193a] focus:outline-none focus:ring-2 focus:ring-[#b3193a]/20 sm:w-48"
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
                <h3 className="mt-3 text-lg font-black text-slate-900">No championship rounds yet</h3>
                <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-slate-500">
                  Add rounds before the racing phase starts.
                </p>
              </div>
            ) : (
              <>
                {filteredRaces.length === 0 && races.length > 0 ? (
                  <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <Search className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
                    <h3 className="mt-3 text-lg font-black text-slate-900">No rounds found</h3>
                    <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-slate-500">
                      Try adjusting your search query or status filter.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredRaces.map((race) => {
                      const absoluteIndex = races.findIndex(r => r.id === race.id);
                  const meta = getRaceStatusMeta(race.status);
                  const isCurrent = race.id === nextRound?.id;
                  const isMissingReferee = !race.refereeId;
                  const shouldHighlight = highlightMissingReferees && isMissingReferee;
                  return (
                    <article
                      key={race.id}
                      id={isMissingReferee ? "missing-referee-round" : undefined}
                      className={`rounded-lg border p-4 transition ${
                        shouldHighlight
                          ? "border-amber-300 bg-amber-50 ring-2 ring-amber-200"
                          : isCurrent
                            ? "border-[#b3193a]/30 bg-[#b3193a]/5"
                            : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Round {absoluteIndex + 1} • {race.code}</p>
                          <h3 className="mt-1 text-base font-black text-slate-950">{race.name}</h3>
                        </div>
                        <span className={`rounded-md border px-2 py-1 text-[11px] font-black uppercase tracking-wide ${meta.className}`}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-slate-600">{formatRaceDate(race.raceDateTime)}</p>
                      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{meta.helper}</p>
                      <div
                        className={`mt-4 rounded-md border p-3 ${
                          race.refereeName ? "border-emerald-100 bg-emerald-50" : "border-amber-200 bg-amber-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <ShieldCheck className={`h-4 w-4 ${race.refereeName ? "text-emerald-700" : "text-amber-700"}`} aria-hidden="true" />
                          <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Referee</p>
                        </div>
                        <p className={`mt-1 text-sm font-black ${race.refereeName ? "text-emerald-950" : "text-amber-900"}`}>
                          {race.refereeName ?? "Unassigned"}
                        </p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-md bg-[#b3193a] px-3 py-2 text-xs font-black text-white hover:bg-[#92122d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b3193a] focus-visible:ring-offset-2"
                          onClick={() => openManageRound(race)}
                          aria-label={`Manage ${race.name}`}
                        >
                          Manage
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
                          onClick={() => openRoundControlCenter(race)}
                          aria-label={`Open control center for ${race.name}`}
                        >
                          Open Control Center
                        </button>
                        {race.status === "SCHEDULED" && (
                          <button
                            type="button"
                            className="rounded-md border border-rose-200 bg-white px-3 py-2 text-xs font-black text-rose-700 hover:bg-rose-50"
                          >
                            Delete Draft Round
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {activeTab === "standings" && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-5">
              <p className="text-xs font-black uppercase tracking-wider text-[#b3193a]">Points table</p>
              <h2 className="text-2xl font-black text-slate-950">Championship Standings</h2>
              <p className="max-w-2xl text-sm font-medium leading-6 text-slate-500">
                Championship standings update after published results, keeping admin focused on the season table instead
                of isolated race records.
              </p>
            </div>
            <div className="mt-5 space-y-3">
              {sortedParticipants.map((participant, index) => (
                <div key={participant.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-lg font-black text-slate-950">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-black text-slate-950">{participant.horseName}</p>
                      <p className="text-sm font-semibold text-slate-500">
                        {participant.jockeyName} / {participant.ownerName}
                      </p>
                    </div>
                  </div>
                  <p className="text-xl font-black text-slate-950">{participant.points} pts</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "controls" && (
          <div className="space-y-5">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-[#b3193a]">Admin actions</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">Championship Controls</h2>
                  <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500">
                    Controls are championship-level only. Round control starts from Overview or Rounds.
                  </p>
                </div>
                {renderStatusActions()}
              </div>
            </section>
            {renderSetupForm()}
          </div>
        )}
      </div>

      {managedRound && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
          <aside
            aria-labelledby="manage-round-title"
            aria-modal="true"
            role="dialog"
            className="flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#b3193a]">Round management</p>
                <h2 id="manage-round-title" className="mt-1 text-2xl font-black text-slate-950">
                  {managedRound.name}
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Referee assignment, schedule context, and race-day operations live here.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManageRoundRaceId(null)}
                className="rounded-md border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                aria-label="Close round management"
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
                    <p className="mt-1 text-sm font-black text-slate-950">{formatRaceDate(managedRound.raceDateTime)}</p>
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
                    <p className="text-xs font-black uppercase tracking-wider text-[#b3193a]">Assignments</p>
                    <h3 className="mt-1 text-lg font-black text-slate-950">Race Day Referee</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Referee assignment is required before publishing the official schedule.
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

                <div
                  className={`mt-4 rounded-md border p-4 ${
                    managedRound.refereeId ? "border-emerald-100 bg-emerald-50" : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-md ${
                        managedRound.refereeId ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-950">{managedRound.refereeName ?? "No referee assigned"}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-600">
                        {managedRound.refereeId
                          ? `${getRefereeWorkload(managedRound.refereeId)} assigned round${getRefereeWorkload(managedRound.refereeId) === 1 ? "" : "s"} in this championship`
                          : "Assign a race day official before schedule publication."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor="referee-search" className="block text-xs font-black uppercase tracking-wider text-slate-600">
                    Search referee
                  </label>
                  <div className="relative mt-2">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                    <input
                      id="referee-search"
                      type="search"
                      value={refereeSearch}
                      onChange={(event) => setRefereeSearch(event.target.value)}
                      placeholder="Search by name or email"
                      className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-[#b3193a] focus:outline-none focus:ring-2 focus:ring-[#b3193a]/20"
                    />
                  </div>
                </div>

                {refereeError && (
                  <div role="alert" className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">
                    {refereeError}
                  </div>
                )}

                <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
                  {refereeLoading ? (
                    [1, 2, 3].map((item) => (
                      <div key={item} className="h-16 animate-pulse rounded-md border border-slate-100 bg-slate-50" />
                    ))
                  ) : filteredReferees.length === 0 ? (
                    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                      <UserRound className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
                      <p className="mt-2 text-sm font-black text-slate-900">No referee found</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">Try another name or confirm the user has REFEREE role.</p>
                    </div>
                  ) : (
                    filteredReferees.map((referee) => {
                      const isAssigned = managedRound.refereeId === referee.id;
                      const workload = getRefereeWorkload(referee.id);
                      return (
                        <article
                          key={referee.id}
                          className={`flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between ${
                            isAssigned ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-sm font-black text-slate-700">
                              {referee.fullName
                                .split(" ")
                                .map((part) => part[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-950">{referee.fullName}</p>
                              <p className="mt-0.5 text-xs font-semibold text-slate-500">{referee.email}</p>
                              <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-slate-400">
                                REFEREE / {workload} assigned round{workload === 1 ? "" : "s"}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={isAssigned || assigningRefereeId === referee.id}
                            onClick={() => void handleAssignReferee(managedRound, referee)}
                            className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-emerald-200 disabled:bg-emerald-100 disabled:text-emerald-800"
                          >
                            {assigningRefereeId === referee.id ? "Assigning..." : isAssigned ? "Assigned" : "Assign"}
                          </button>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-wider text-[#b3193a]">Operations</p>
                <h3 className="mt-1 text-lg font-black text-slate-950">Round shortcuts</h3>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => {
                      setManageRoundRaceId(null);
                      setActiveTab("participants");
                    }}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
                  >
                    View Participants
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setManageRoundRaceId(null);
                      setActiveTab("rounds");
                    }}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
                  >
                    View Schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setManageRoundRaceId(null);
                      openRoundControlCenter(managedRound);
                    }}
                    className="rounded-md bg-[#b3193a] px-3 py-2 text-xs font-black text-white hover:bg-[#92122d]"
                  >
                    Open Control Center
                  </button>
                </div>
              </section>
            </div>
          </aside>
        </div>
      )}

      {showCreateRoundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            aria-labelledby="create-round-title"
            className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="border-b border-slate-100 px-6 py-4">
              <p className="text-xs font-black uppercase tracking-wider text-[#b3193a]">Season setup</p>
              <h2 id="create-round-title" className="mt-1 text-xl font-black text-slate-950">
                Create Championship Round
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Add one race event inside this championship season.
              </p>
            </div>

            <form onSubmit={handleCreateRoundSubmit}>
              <div className="grid gap-4 p-6 sm:grid-cols-2">
                {roundFormError && (
                  <div className="sm:col-span-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">
                    {roundFormError}
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label htmlFor="round-name" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Round Name *
                  </label>
                  <input
                    id="round-name"
                    type="text"
                    required
                    value={roundForm.name}
                    onChange={(e) => setRoundForm({ ...roundForm, name: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#b3193a] focus:outline-none focus:ring-2 focus:ring-[#b3193a]/20"
                    placeholder="Round 3 - Saigon Sprint"
                  />
                </div>

                <div>
                  <label htmlFor="round-code" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Round Code *
                  </label>
                  <input
                    id="round-code"
                    type="text"
                    required
                    value={roundForm.code}
                    onChange={(e) => setRoundForm({ ...roundForm, code: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#b3193a] focus:outline-none focus:ring-2 focus:ring-[#b3193a]/20"
                    placeholder="SUM_R3"
                  />
                </div>

                <div>
                  <label htmlFor="round-race-at" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Race Date And Time *
                  </label>
                  <input
                    id="round-race-at"
                    type="datetime-local"
                    required
                    value={roundForm.raceDateTime}
                    onChange={(e) => setRoundForm({ ...roundForm, raceDateTime: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#b3193a] focus:outline-none focus:ring-2 focus:ring-[#b3193a]/20"
                  />
                </div>

                <div>
                  <label htmlFor="round-distance" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Distance *
                  </label>
                  <input
                    id="round-distance"
                    type="number"
                    min={1}
                    required
                    value={roundForm.distanceMeters}
                    onChange={(e) => setRoundForm({ ...roundForm, distanceMeters: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#b3193a] focus:outline-none focus:ring-2 focus:ring-[#b3193a]/20"
                    placeholder="1600"
                  />
                  <p className="mt-1 text-xs font-semibold text-slate-500">Meters</p>
                </div>

                <div>
                  <label htmlFor="round-max-participants" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Max Participants *
                  </label>
                  <input
                    id="round-max-participants"
                    type="number"
                    min={2}
                    required
                    value={roundForm.maxParticipants}
                    onChange={(e) => setRoundForm({ ...roundForm, maxParticipants: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#b3193a] focus:outline-none focus:ring-2 focus:ring-[#b3193a]/20"
                    placeholder="12"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateRoundModal(false);
                    setRoundFormError("");
                  }}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingRound}
                  className="rounded-md bg-[#b3193a] px-4 py-2 text-sm font-bold text-white hover:bg-[#92122d] disabled:opacity-50"
                >
                  {creatingRound ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-black text-rose-600">Delete Championship</h2>
            <p className="mt-3 text-sm text-slate-600">
              Are you sure you want to delete <strong>{tournament.name}</strong>? This action will completely remove it
              from the system.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteConfirm}
                className="rounded-md bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updatingStatus}
                onClick={handleStatusTransition}
                className="rounded-md bg-[#b3193a] px-4 py-2 text-sm font-bold text-white hover:bg-[#92122d] disabled:opacity-50"
              >
                {updatingStatus ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {roundControlOpen && renderRoundControlCenter()}
    </AdminLayout>
  );
}
