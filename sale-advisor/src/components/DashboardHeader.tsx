"use client";

import { useState } from "react";
import NewLeadModal from "./NewLeadModal";

export default function DashboardHeader() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="header">
        <div>
          <h1>Welcome back, Logan 👋</h1>
          <div className="header-subtitle">
            Here&apos;s what&apos;s happening with Sale Advisor today
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary">Export Report</button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Lead</button>
        </div>
      </div>
      {showModal && <NewLeadModal onClose={() => setShowModal(false)} />}
    </>
  );
}
