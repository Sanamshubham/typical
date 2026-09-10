import React, {
  useRef,
  useState,
} from "react";

import {
  parseCSV,
} from "../utils/csvParser";

function FileUploader({
  onDataLoaded,
}) {
  const inputRef =
    useRef(null);

  const [
    dragging,
    setDragging,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /* ==========================================================
     PROCESS FILE
     ========================================================== */

  const processFile =
    async (file) => {
      setError("");

      if (!file) {
        return;
      }

      if (
        !file.name
          .toLowerCase()
          .endsWith(".csv")
      ) {
        setError(
          "Please upload a CSV file."
        );

        return;
      }

      try {
        setLoading(true);

        const result =
          await parseCSV(
            file
          );

        if (
          result.streetTypicalRecords ===
          0
        ) {
          setError(
            "No Street Typical records were found in this CSV."
          );

          return;
        }

        onDataLoaded({
          file,

          data:
            result.data,

          meta:
            result.meta,

          errors:
            result.errors,

          totalRecords:
            result.totalRecords,

          streetTypicalRecords:
            result.streetTypicalRecords,

          ignoredRecords:
            result.ignoredRecords,
        });
      } catch (error) {
        console.error(error);

        setError(
          error.message ||
            "Unable to process CSV."
        );
      } finally {
        setLoading(false);
      }
    };

  /* ==========================================================
     FILE CHANGE
     ========================================================== */

  const handleFileChange =
    (event) => {
      const file =
        event.target.files?.[0];

      processFile(file);

      event.target.value = "";
    };

  /* ==========================================================
     DROP
     ========================================================== */

  const handleDrop =
    (event) => {
      event.preventDefault();

      setDragging(false);

      const file =
        event.dataTransfer
          .files?.[0];

      processFile(file);
    };

  return (
    <div className="uploader-wrapper">
      <div
        className={`drop-zone ${
          dragging
            ? "dragging"
            : ""
        }`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={
          handleDrop
        }
      >
        <div className="upload-icon">
          📂
        </div>

        <h3>
          Upload IQGeo CSV
        </h3>

        <p>
          Drag & drop your
          IQGeo exported CSV
          here
        </p>

        <span>or</span>

        <button
          type="button"
          className="upload-button"
          disabled={loading}
          onClick={() =>
            inputRef.current?.click()
          }
        >
          {loading
            ? "Processing..."
            : "Choose CSV File"}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={
            handleFileChange
          }
        />

        <small>
          Only Street Typical
          records will be
          processed
        </small>
      </div>

      {error && (
        <div className="upload-error">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}

export default FileUploader;