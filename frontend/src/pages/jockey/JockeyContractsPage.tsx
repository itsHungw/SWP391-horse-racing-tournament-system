import { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronRight, Download, FileText, XCircle } from "lucide-react";

import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { JockeyLayout } from "../../layouts/JockeyLayout";
import { jockeyContracts, type ContractStatus, type JockeyContract } from "./jockeyWorkspaceData";

function contractInitials(stable: string) {
  return stable
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2);
}

function statusLabel(status: ContractStatus) {
  if (status === "COMMITTED") return "Committed";
  if (status === "REJECTED") return "Rejected";
  return "Pending";
}

function statusClasses(status: ContractStatus) {
  if (status === "COMMITTED") return "border-emerald-200 bg-emerald-50 text-[#006d5b]";
  if (status === "REJECTED") return "border-red-200 bg-red-50 text-red-700";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

export function JockeyContractsPage() {
  useDocumentTitle("Jockey contracts");
  const [contracts, setContracts] = useState<JockeyContract[]>(jockeyContracts);
  const [selectedContractId, setSelectedContractId] = useState(jockeyContracts[0]?.id ?? "");

  const selectedContract = contracts.find((contract) => contract.id === selectedContractId) ?? contracts[0];

  const updateStatus = (contract: JockeyContract, status: ContractStatus) => {
    setContracts((current) => current.map((item) => (item.id === contract.id ? { ...item, status } : item)));
    setSelectedContractId(contract.id);
  };

  const pendingCount = contracts.filter((contract) => contract.status === "PENDING").length;
  const committedCount = contracts.filter((contract) => contract.status === "COMMITTED").length;
  const acceptDisabled = !selectedContract || selectedContract.hasConflict || selectedContract.status !== "PENDING";

  return (
    <JockeyLayout>
      <section aria-labelledby="contracts-title" className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-[#006d5b]">Tournament Assignment Contract</p>
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 id="contracts-title" className="text-4xl font-black tracking-tight text-slate-950">
                Contracts
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-500">
                Scan stable offers quickly, then open the contract detail before committing to a championship assignment.
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
                <dt className="text-xs font-black uppercase tracking-[0.12em] text-amber-800">Pending</dt>
                <dd className="mt-1 text-2xl font-black text-slate-950">{pendingCount}</dd>
              </div>
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
                <dt className="text-xs font-black uppercase tracking-[0.12em] text-[#006d5b]">Committed</dt>
                <dd className="mt-1 text-2xl font-black text-slate-950">{committedCount}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
          <section aria-labelledby="contract-list-title" className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h2 id="contract-list-title" className="text-lg font-black text-slate-950">
                  Contract Inbox
                </h2>
                <p className="mt-1 text-sm font-bold text-slate-500">{contracts.length} assignment offers</p>
              </div>
              <FileText className="h-5 w-5 text-[#006d5b]" aria-hidden="true" />
            </div>

            <ul aria-label="Contract list" className="mt-4 space-y-3">
              {contracts.map((contract) => {
                const isSelected = selectedContract?.id === contract.id;
                return (
                  <li key={contract.id}>
                    <button
                      aria-current={isSelected ? "true" : undefined}
                      className={[
                        "w-full rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:border-[#006d5b]/40 hover:bg-emerald-50/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]",
                        isSelected ? "border-[#006d5b] bg-emerald-50/70 shadow-sm" : "border-slate-200 bg-white",
                      ].join(" ")}
                      onClick={() => setSelectedContractId(contract.id)}
                      type="button"
                    >
                      <span className="flex items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#006d5b]/20 bg-white text-sm font-black text-[#006d5b]">
                          {contractInitials(contract.stable)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={[
                              "inline-flex rounded-md border px-2 py-1 text-xs font-black uppercase tracking-[0.12em]",
                              statusClasses(contract.status),
                            ].join(" ")}
                          >
                            {statusLabel(contract.status)}
                          </span>
                          <span className="mt-2 block text-base font-black text-slate-950">Contract from {contract.stable}</span>
                          <span className="mt-1 block text-sm font-bold text-slate-500">
                            {contract.horse} - {contract.championship}
                          </span>
                          <span className="mt-3 flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.1em] text-slate-500">
                            <span>{contract.rounds} rounds</span>
                            <span>Deadline {contract.responseDeadline}</span>
                          </span>
                        </span>
                        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {selectedContract && (
            <section
              aria-label="Contract Detail"
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-28 xl:self-start"
            >
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-[#006d5b]/20 bg-emerald-50 text-lg font-black text-[#006d5b]">
                    {contractInitials(selectedContract.stable)}
                  </span>
                  <div>
                    <span
                      className={[
                        "inline-flex rounded-md border px-2 py-1 text-xs font-black uppercase tracking-[0.12em]",
                        statusClasses(selectedContract.status),
                      ].join(" ")}
                    >
                      {statusLabel(selectedContract.status)}
                    </span>
                    <h2 className="mt-3 text-2xl font-black text-slate-950">Contract Detail</h2>
                    <p className="mt-1 text-sm font-bold text-slate-500">
                      {selectedContract.stable} - {selectedContract.owner}
                    </p>
                  </div>
                </div>
                <FileText className="h-6 w-6 text-[#006d5b]" aria-hidden="true" />
              </div>

              <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <dt className="font-bold text-slate-500">Horse</dt>
                  <dd className="mt-1 font-black text-slate-950">{selectedContract.horse}</dd>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <dt className="font-bold text-slate-500">Championship</dt>
                  <dd className="mt-1 font-black text-slate-950">{selectedContract.championship}</dd>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <dt className="font-bold text-slate-500">Season</dt>
                  <dd className="mt-1 font-black text-slate-950">{selectedContract.season}</dd>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <dt className="font-bold text-slate-500">Response deadline</dt>
                  <dd className="mt-1 font-black text-slate-950">{selectedContract.responseDeadline}</dd>
                </div>
              </dl>

              <section className="mt-4 rounded-md border border-slate-200 bg-white p-4" aria-label="Owner message">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Owner Message</p>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-700">{selectedContract.message}</p>
              </section>

              <section className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-4" aria-label="Assignment terms">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">Assignment Terms</p>
                <ul className="mt-3 space-y-2 text-sm font-bold text-slate-700">
                  {selectedContract.terms.map((term) => (
                    <li className="flex gap-2" key={term}>
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#006d5b]" aria-hidden="true" />
                      <span>{term}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                <Download className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <span className="text-sm font-black text-slate-800">{selectedContract.agreementFileName}</span>
                <button
                  className="ml-auto min-h-11 rounded-md px-3 text-sm font-black text-[#006d5b] hover:bg-white hover:text-[#004d3d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
                  type="button"
                >
                  View PDF
                </button>
              </div>

              {selectedContract.hasConflict && selectedContract.status === "PENDING" && (
                <p
                  className="mt-4 flex gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black leading-6 text-amber-900"
                  role="status"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>You already committed to another horse in this championship.</span>
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#006d5b] px-5 text-sm font-black text-white hover:bg-[#004d3d] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
                  disabled={acceptDisabled}
                  onClick={() => updateStatus(selectedContract, "COMMITTED")}
                  type="button"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Accept Contract
                </button>
                <button
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border border-red-200 bg-white px-5 text-sm font-black text-red-800 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
                  disabled={selectedContract.status !== "PENDING"}
                  onClick={() => updateStatus(selectedContract, "REJECTED")}
                  type="button"
                >
                  <XCircle className="h-4 w-4" aria-hidden="true" />
                  Reject
                </button>
              </div>
            </section>
          )}
        </div>
      </section>
    </JockeyLayout>
  );
}
