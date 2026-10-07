import React from "react";
import BrandingPatientHistorySubTab from "./branding/BrandingPatientHistorySubTab";

export default function PatientVisitsTab({
    selectedHospital,
    hospitals = [],
    notify,
    isHi = false,
    getAuthHeaders,
    hospitalVisitsData,
    handleDownloadVisitHistory,
    fetchHospitalDeepDive,
}) {
    const currentHosp = selectedHospital || (hospitals && hospitals[0]) || null;

    return (
        <BrandingPatientHistorySubTab
            currentHosp={currentHosp}
            notify={notify}
            isHi={isHi}
            getAuthHeaders={getAuthHeaders}
            hospitalVisitsData={hospitalVisitsData}
            handleDownloadVisitHistory={handleDownloadVisitHistory}
            fetchHospitalDeepDive={fetchHospitalDeepDive}
        />
    );
}
