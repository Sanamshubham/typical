import React, {
  useMemo,
  useState,
} from "react";

import FileUploader from "./components/FileUploader";
import ValidationDashboard from "./components/ValidationDashboard";

import { validateRows } from "./utils/validator";

import "./App.css";

function App() {
  const [fileData, setFileData] =
    useState(null);

  const [city, setCity] =
    useState("SELECT");

  // ==========================================================
  // VALIDATE CSV DATA
  // ==========================================================

  const validationResults = useMemo(() => {

    if (!fileData) {
      return [];
    }

    if (
      !Array.isArray(fileData.data)
    ) {
      console.error(
        "fileData.data is not an array:",
        fileData.data
      );

      return [];
    }

    return validateRows(
      fileData.data,
      city
    );

  }, [fileData, city]);

  // ==========================================================
  // FILE LOADED
  // ==========================================================

  const handleDataLoaded = (
    result
  ) => {

    console.log(
      "CSV result:",
      result
    );

    console.log(
      "CSV data array:",
      result?.data
    );

    if (
      !result ||
      !Array.isArray(result.data)
    ) {
      console.error(
        "Invalid CSV result:",
        result
      );

      return;
    }

    setFileData(result);
  };

  // ==========================================================
  // RESET
  // ==========================================================

  const handleReset = () => {
    setFileData(null);
  };

  return (
    <div className="app">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="app-header">

        <div className="brand">

          <div className="brand-icon">
            Q
          </div>

          <div>
            <h1>
              IQGeo Street Typical QC
            </h1>

            <p>
              Street Typical Cross-Section Validator
            </p>
          </div>

        </div>

        <div className="header-status">

          <span className="status-dot" />

        Empire Engineering Services

        </div>

        <label className="city-selector">

          <span>
            CITY - SELECT
          </span>

          <select
            value={city}
            onChange={(event) =>
              setCity(
                event.target.value
              )
            }
          >
            <option value="SELECT">
              SELECT
            </option>

            <option value="Shreveport">
              SHREVEPORT
            </option>

            <option value="Other">
              OTHER
            </option>
          </select>

        </label>

      </header>


      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="main-content">

        {!fileData ? (

          <section className="upload-page">

            {/* HERO */}

            <div className="hero">

              <span className="hero-label">
                IQGEO DATA QUALITY CONTROL
              </span>

              <h2>
                Validate your
                <br />
                street typical data
              </h2>

              <p>
                Upload your IQGeo exported
                CSV. Only Street Typical
                records are processed.
                Other Note types are
                automatically ignored.
              </p>

            </div>


            {/* UPLOAD */}

            <FileUploader
              onDataLoaded={
                handleDataLoaded
              }
            />


            {/* RULES */}

            <div className="rules-preview">

              <div className="rule-preview-card">

                <span>
                  01
                </span>

                <h3>
                  ROW Symmetry
                </h3>

                <p>
                  Checks ROW,
                  BOC-to-BOC and
                  ROW-to-BOC dimensions.
                </p>

              </div>


              <div className="rule-preview-card">

                <span>
                  02
                </span>

                <h3>
                  ROW → R/L
                </h3>

                <p>
                  5 ft automatically
                  passes. Other values
                  require a Note.
                </p>

              </div>


              <div className="rule-preview-card">

                <span>
                  03
                </span>

                <h3>
                  Utility Spacing
                </h3>

                <p>
                  Normal utilities
                  require minimum
                  1 ft spacing.
                </p>

              </div>


              <div className="rule-preview-card">

                <span>
                  04
                </span>

                <h3>
                  R/L Clearance
                </h3>

                <p>
                  R/L requires minimum
                  2 ft clearance except
                  approved exceptions.
                </p>

              </div>

            </div>

          </section>

        ) : (

          <ValidationDashboard

            results={
              validationResults
            }

            fileName={
              fileData.file?.name
            }

            totalRecords={
              fileData.totalRecords
            }

            ignoredRecords={
              fileData.ignoredRecords
            }

            city={
              city
            }

            onCityChange={
              setCity
            }

            streetTypicalRecords={
              fileData.streetTypicalRecords
            }

            onReset={
              handleReset
            }

          />

        )}

      </main>


      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="app-footer">

        Developed by Shubham Srivastav | shubhamsri505@gmail.com

      </footer>

    </div>
  );
}

export default App;