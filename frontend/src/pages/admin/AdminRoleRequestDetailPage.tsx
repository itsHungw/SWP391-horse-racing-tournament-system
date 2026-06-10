import { RoleRequestStatusBadge } from "../../components/RoleRequestStatusBadge";
import { RoleRequest } from "../../types/adminRoleRequest";

type Props = {
  request: RoleRequest;
  onApprove: () => void;
  onPassCv: () => void;
  onReject: () => void;
  onBack: () => void;
  processing: boolean;
};

const emptyValue = "Not provided";

function displayValue(value?: string | null) {
  return value?.trim() ? value : emptyValue;
}

function formatDate(value?: string | null) {
  if (!value) return emptyValue;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}


function CvReviewBadge({ status }: { status?: RoleRequest["cvReviewStatus"] }) {
  const passed = status === "PASSED";

  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-black ${
        passed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
      }`}
    >
      {passed ? "CV passed" : "CV not reviewed"}
    </span>
  );
}

export function AdminRoleRequestDetailPage({
  request,
  onApprove,
  onPassCv,
  onReject,
  onBack,
  processing,
}: Props) {
  const account = request.user;
  const accountName = account?.fullName || request.fullName;
  const accountEmail = account?.email || request.email;
  const accountId = account?.id || request.userId;
  const currentRoles = account?.roles?.length ? account.roles : [];

  return (
    <section aria-labelledby="admin-role-request-detail-title" className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-[#d8d8d8] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <button
          className="min-h-11 rounded-md border border-[#070f4f] bg-white px-4 text-sm font-black text-[#070f4f] hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]"
          onClick={onBack}
          type="button"
        >
          Back to queue
        </button>
        <span className="text-sm font-black text-slate-500">Request #{request.id}</span>
      </div>

      <div>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#b3193a]">
          Request detail
        </p>
        <h1 id="admin-role-request-detail-title" className="mt-2 text-4xl font-black tracking-tight">
          {accountName}
        </h1>
        <p className="mt-2 text-base text-slate-600">{accountEmail}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section
          className="rounded-lg border border-[#d8d8d8] bg-white p-6"
          aria-labelledby="account-section-title"
        >
          <h2 id="account-section-title" className="border-b border-[#ececec] pb-3 text-lg font-black">
            Account Information
          </h2>
          <div className="mt-4 space-y-5 text-sm">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Full name</dt>
                <dd className="mt-1 font-bold text-[#171717]">{accountName}</dd>
              </div>
              <div>
                <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">User ID</dt>
                <dd className="mt-1 font-bold text-[#171717]">#{accountId}</dd>
              </div>
              <div>
                <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Email</dt>
                <dd className="mt-1 break-all font-bold text-[#171717]">{accountEmail}</dd>
              </div>
              <div>
                <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Phone</dt>
                <dd className="mt-1 font-bold text-[#171717]">{displayValue(account?.phone)}</dd>
              </div>
              <div>
                <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Date of birth</dt>
                <dd className="mt-1 font-bold text-[#171717]">{formatDate(account?.dateOfBirth)}</dd>
              </div>
              <div>
                <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Gender</dt>
                <dd className="mt-1 font-bold text-[#171717]">{displayValue(account?.gender)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Address</dt>
                <dd className="mt-1 font-bold text-[#171717]">{displayValue(account?.address)}</dd>
              </div>
            </dl>



            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Current roles</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {currentRoles.length > 0 ? (
                  currentRoles.map((role) => (
                    <span key={role} className="rounded-md bg-[#070f4f] px-2.5 py-1 text-xs font-black text-white">
                      {role}
                    </span>
                  ))
                ) : (
                  <span className="text-sm font-bold text-slate-500">No roles reported</span>
                )}
              </div>
            </div>

            <dl className="grid gap-4 border-t border-[#ececec] pt-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Account status</dt>
                <dd className="mt-1 font-bold text-[#171717]">{displayValue(account?.status)}</dd>
              </div>
              <div>
                <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Request status</dt>
                <dd className="mt-2">
                  <RoleRequestStatusBadge status={request.status} />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">CV screening</dt>
                <dd className="mt-2">
                  <CvReviewBadge status={request.cvReviewStatus} />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Joined</dt>
                <dd className="mt-1 font-bold text-[#171717]">{formatDate(account?.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Last login</dt>
                <dd className="mt-1 font-bold text-[#171717]">{formatDate(account?.lastLoginAt)}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="rounded-lg border border-[#d8d8d8] bg-white p-6" aria-labelledby="role-section-title">
          <h2 id="role-section-title" className="border-b border-[#ececec] pb-3 text-lg font-black">
            Role Resume
          </h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Requested role</dt>
              <dd className="mt-1 font-black text-[#006d5b]">{request.requestedRole}</dd>
            </div>
            <div>
              <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Reason</dt>
              <dd className="mt-2 rounded-md border border-[#ececec] bg-[#fafafa] p-4 leading-6 text-slate-700">
                {request.reason || "No reason provided."}
              </dd>
            </div>
            {request.resumeUrl && (
              <div>
                <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Resume PDF</dt>
                <dd className="mt-1">
                  <a
                    className="break-all font-bold text-[#006d5b] underline"
                    href={request.resumeUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {request.resumeUrl}
                  </a>
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">CV screening</dt>
              <dd className="mt-2 rounded-md border border-[#ececec] bg-[#fafafa] p-4 leading-6 text-slate-700">
                <div className="flex flex-wrap items-center gap-2">
                  <CvReviewBadge status={request.cvReviewStatus} />
                  {request.cvReviewedAt && <span className="font-bold">on {formatDate(request.cvReviewedAt)}</span>}
                  {request.cvReviewedBy && <span className="font-bold">by {request.cvReviewedBy.fullName}</span>}
                </div>
                {request.cvReviewNote && <p className="mt-3 font-bold text-slate-600">{request.cvReviewNote}</p>}
              </dd>
            </div>
            {request.adminNote && (
              <div>
                <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Admin note</dt>
                <dd className="mt-2 rounded-md border border-rose-100 bg-rose-50 p-4 leading-6 text-rose-800">
                  {request.adminNote}
                </dd>
              </div>
            )}
          </dl>
        </section>
      </div>

      {request.status === "PENDING" && (
        <div className="flex flex-col justify-end gap-3 border-t border-[#d8d8d8] pt-5 sm:flex-row">
          {request.cvReviewStatus !== "PASSED" && (
            <button
              className="min-h-11 rounded-md border border-[#006d5b] bg-white px-6 text-sm font-black text-[#006d5b] shadow-sm hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={processing}
              onClick={onPassCv}
              type="button"
            >
              Pass CV Screening
            </button>
          )}
          <button
            className="min-h-11 rounded-md bg-[#b3193a] px-6 text-sm font-black text-white shadow-sm hover:bg-[#8f1430] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={processing}
            onClick={onReject}
            type="button"
          >
            Reject Request
          </button>
          <button
            className="min-h-11 rounded-md bg-[#006d5b] px-6 text-sm font-black text-white shadow-sm hover:bg-[#004d3d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={processing}
            onClick={onApprove}
            type="button"
          >
            {processing ? "Processing..." : "Approve Role"}
          </button>
        </div>
      )}
    </section>
  );
}
