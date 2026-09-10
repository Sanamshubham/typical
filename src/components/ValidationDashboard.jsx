import React, {
  useMemo,
  useState,
} from "react";

/* ============================================================
   STATUS BADGE
   ============================================================ */

function StatusBadge({
  status,
}) {
  const safeStatus =
    status || "PASS";

  const className =
    safeStatus === "PASS"
      ? "status-pass"
      : safeStatus === "FAIL"
      ? "status-fail"
      : "status-warning";

  return (
    <span
      className={`status-badge ${className}`}
    >
      {safeStatus}
    </span>
  );
}


/* ============================================================
   ISSUE
   ============================================================ */

function IssueItem({
  issue,
}) {
  if (!issue) {
    return null;
  }

  return (
    <div
      className={`issue-item ${
        issue.type === "ERROR"
          ? "issue-error"
          : "issue-warning"
      }`}
    >
      <div className="issue-header">

        <strong>
          {issue.rule}
        </strong>

        <span>
          {issue.type}
        </span>

      </div>

      <div className="issue-message">
        {issue.message}
      </div>
    </div>
  );
}


/* ============================================================
   FORMAT VALUE
   ============================================================ */

function formatFeet(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  return `${value} ft`;
}


/* ============================================================
   MAIN DASHBOARD
   ============================================================ */

function ValidationDashboard({
  results = [],
  fileName = "",
  onReset,
  city = "SELECT",
  onCityChange,
  totalRecords = 0,
  ignoredRecords = 0,
}) {

  const [filter, setFilter] =
    useState("ALL");

  const [search, setSearch] =
    useState("");


  /* ==========================================================
     SAFETY
     ========================================================== */

  const safeResults =
    Array.isArray(results)
      ? results
      : [];


  /* ==========================================================
     SUMMARY
     ========================================================== */

  const summary =
    useMemo(() => {

      const pass =
        safeResults.filter(
          (item) =>
            item?.status ===
            "PASS"
        ).length;


      const fail =
        safeResults.filter(
          (item) =>
            item?.status ===
            "FAIL"
        ).length;


      const warning =
        safeResults.filter(
          (item) =>
            item?.status ===
            "WARNING"
        ).length;


      return {

        total:
          safeResults.length,

        pass,

        fail,

        warning,

      };

      }, [safeResults]);


  /* ==========================================================
     FILTER + SEARCH
     ========================================================== */

  const filteredResults =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();


      return safeResults.filter(
        (result) => {

          /* --------------------------------------------------
             STATUS
             -------------------------------------------------- */

          const statusMatch =
            filter === "ALL" ||
            result?.status ===
              filter;


          if (!statusMatch) {
            return false;
          }


          /* --------------------------------------------------
             SEARCH
             -------------------------------------------------- */

          if (!query) {
            return true;
          }


          const streetName =
            String(
              result?.streetName ||
              ""
            ).toLowerCase();


          const uniqueId =
            String(
              result?.uniqueId ||
              ""
            ).toLowerCase();


          const modificationUser =
            String(
              result?.modificationUser ||
              ""
            ).toLowerCase();


          return (

            streetName.includes(
              query
            ) ||

            uniqueId.includes(
              query
            ) ||

            modificationUser.includes(
              query
            )

          );

        }
      );

    }, [
      safeResults,
      filter,
      search,
    ]);


  /* ==========================================================
     RENDER
     ========================================================== */

  return (

    <section className="dashboard">

      {/* ======================================================
          TOP
          ====================================================== */}

      <div className="dashboard-top">

        <div>

          <span className="dashboard-label">
            STREET TYPICAL QC
          </span>

          <h2>
            Validation Results
          </h2>

          <p>
            {fileName ||
              "IQGeo CSV"}
          </p>

        </div>


        <button
          type="button"
          className="reset-button"
          onClick={onReset}
        >
          ← Upload Another CSV
        </button>

      </div>


      {/* ======================================================
          SUMMARY
          ====================================================== */}

      <div className="summary-grid">

        <div className="summary-card">

          <span>
            Total Street Typical
          </span>

          <strong>
            {summary.total}
          </strong>

        </div>


        <div className="summary-card summary-pass">

          <span>
            PASS
          </span>

          <strong>
            {summary.pass}
          </strong>

        </div>


        <div className="summary-card summary-fail">

          <span>
            FAIL
          </span>

          <strong>
            {summary.fail}
          </strong>

        </div>


        <div className="summary-card summary-warning">

          <span>
            WARNING
          </span>

          <strong>
            {summary.warning}
          </strong>

        </div>

      </div>


      {/* ======================================================
          IMPORT INFO
          ====================================================== */}

      <div className="import-info">

        <div>

          <strong>
            {totalRecords ||
              safeResults.length}
          </strong>

          <span>
            CSV Records
          </span>

        </div>


        <div>

          <strong>
            {safeResults.length}
          </strong>

          <span>
            Street Typical
          </span>

        </div>


        <div>

          <strong>
            {ignoredRecords || 0}
          </strong>

          <span>
            Other Notes Ignored
          </span>

        </div>

      </div>


      {/* ======================================================
          TOOLBAR
          ====================================================== */}

      <div className="toolbar">

        <div className="filters">

          {[
            "ALL",
            "PASS",
            "FAIL",
            "WARNING",
          ].map(
            (item) => (

              <button
                type="button"
                key={item}
                className={
                  filter === item
                    ? "filter-active"
                    : ""
                }
                onClick={() =>
                  setFilter(item)
                }
              >
                {item}
              </button>

            )
          )}

        </div>


        <div className="search-box">

          <span>
            🔍
          </span>

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search street, ID or user..."
          />

        </div>

      </div>


      {/* ======================================================
          TABLE
          
          STRICT DISPLAY ORDER:
          
          1. Street Name
          2. Unique ID
          3. Modified User
          4. ROW
          5. ROW → BOC
          6. BOC → BOC
          7. BOC → R/L
          8. ROW → R/L
          9. Status
          10. IQGeo
          
          ====================================================== */}

      <div className="table-wrapper">

        <table className="results-table">

          <thead>

            <tr>

              <th>
                Street Name
              </th>

              <th>
                Unique ID
              </th>

              <th>
                Modified User
              </th>

              <th>
                ROW
              </th>

              <th>
                ROW → BOC
              </th>

              <th>
                BOC → BOC
              </th>

              <th>
                BOC → R/L
              </th>

              <th>
                ROW → R/L
              </th>

              <th>
                Status
              </th>

              <th>
                IQGeo
              </th>

            </tr>

          </thead>


          <tbody>

            {/* ==================================================
                NO DATA
                ================================================== */}

            {filteredResults.length === 0 ? (

              <tr>

                <td
                  colSpan="10"
                  className="empty-state"
                >
                  No records found.
                </td>

              </tr>

            ) : (

              filteredResults.map(
                (result, resultIndex) => (

                  <React.Fragment
                    key={
                      `${result?.uniqueId || "record"}-${result?.rowIndex ?? resultIndex}`
                    }
                  >

                    {/* ==========================================
                        MAIN DATA ROW
                        ========================================== */}

                    <tr>

                      {/* ------------------------------------------
                          1. STREET NAME
                          ------------------------------------------ */}

                      <td>

                        <strong>
                          {result?.streetName ||
                            "-"}
                        </strong>


                        {result?.plat && (

                          <small className="plat-text">

                            PLAT{" "}

                            {result.plat}

                          </small>

                        )}

                      </td>


                      {/* ------------------------------------------
                          2. UNIQUE ID
                          ------------------------------------------ */}

                      <td>

                        <span className="id-badge">

                          {result?.uniqueId ||
                            "-"}

                        </span>

                      </td>


                      {/* ------------------------------------------
                          3. MODIFIED USER
                          
                          ONLY NAME
                          NEVER RAW USER ID
                          ------------------------------------------ */}

                      <td>

                        <span className="user-badge">

                          {result?.modificationUser ||
                            "Unknown User"}

                        </span>

                      </td>


                      {/* ------------------------------------------
                          4. ROW
                          ------------------------------------------ */}

                      <td>

                        {formatFeet(
                          result?.rowWidth
                        )}

                      </td>


                      {/* ------------------------------------------
                          5. ROW → BOC
                          ------------------------------------------ */}

                      <td>

                        {formatFeet(
                          result?.rowToBoc
                        )}

                      </td>


                      {/* ------------------------------------------
                          6. BOC → BOC
                          ------------------------------------------ */}

                      <td>

                        {formatFeet(
                          result?.bocToBoc
                        )}

                      </td>


                      {/* ------------------------------------------
                          7. BOC → R/L
                          ------------------------------------------ */}

                      <td>

                        {formatFeet(
                          result?.bocToRL
                        )}

                      </td>


                      {/* ------------------------------------------
                          8. ROW → R/L
                          ------------------------------------------ */}

                      <td>

                        {formatFeet(
                          result?.rowToRL
                        )}

                      </td>


                      {/* ------------------------------------------
                          9. STATUS
                          ------------------------------------------ */}

                      <td>

                        <StatusBadge
                          status={
                            result?.status
                          }
                        />

                      </td>


                      {/* ------------------------------------------
                          10. IQGEO
                          ------------------------------------------ */}

                      <td>

                        {result?.iqGeoLink ? (

                          <a
                            href={
                              result.iqGeoLink
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="iqgeo-button"
                          >
                            Open IQGeo ↗
                          </a>

                        ) : (

                          <span className="no-link">
                            No Link
                          </span>

                        )}

                      </td>

                    </tr>


                    {/* ==================================================
                        ISSUES
                        ================================================== */}

                    {Array.isArray(
                      result?.issues
                    ) &&
                    result.issues.length > 0 && (

                      <tr className="issues-row">

                        <td
                          colSpan="10"
                        >

                          <div className="issues-container">

                            {result.issues.map(
                              (
                                issue,
                                issueIndex
                              ) => (

                                <IssueItem
                                  key={
                                    `${result?.uniqueId || resultIndex}-issue-${issueIndex}`
                                  }
                                  issue={
                                    issue
                                  }
                                />

                              )
                            )}

                          </div>

                        </td>

                      </tr>

                    )}


                    {/* ==================================================
                        UTILITY DETAILS
                        ================================================== */}

                    {Array.isArray(
                      result?.utilityPositions
                    ) &&
                    result.utilityPositions.length > 0 && (

                      <tr className="utility-row">

                        <td
                          colSpan="10"
                        >

                          <div className="utility-container">

                            <strong>
                              Utility Positions:
                            </strong>


                            <div className="utility-list">

                              {result.utilityPositions.map(
                                (
                                  utility,
                                  utilityIndex
                                ) => (

                                  <span
                                    key={
                                      `${result?.uniqueId || resultIndex}-utility-${utilityIndex}`
                                    }
                                    className={
                                      utility?.isRL
                                        ? "utility-chip utility-rl"
                                        : "utility-chip"
                                    }
                                  >

                                    {utility?.isRL
                                      ? "R/L"
                                      : utility?.name ||
                                        "Utility"}

                                    {" "}

                                    {utility?.position ??
                                      "-"}

                                    {" "}
                                    ft

                                  </span>

                                )
                              )}

                            </div>

                          </div>

                        </td>

                      </tr>

                    )}

                  </React.Fragment>

                )

              )

            )}

          </tbody>

        </table>

      </div>

    </section>

  );
}


export default ValidationDashboard;