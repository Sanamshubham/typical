import Papa from "papaparse";

/* ============================================================
   USER ID → USER NAME
   ============================================================ */

const USER_NAME_MAP = {
  vt5552: "Srivastav",
  mx0318: "Shad",
  sk9316: "Shahroj",
  vv2016: "Vishesh",
  jf0776: "Junaid",
  vs2976: "Vikas",
  hk2840: "Harsh",
  sx5983: "Suraj",
  sa0016: "Shubham",
  sx2670: "Sameer",
  va6422: "Vaibhav",
  nt601d: "Neha",
  ao0752: "Abhay",
  km203t: "Kumar",
  mv206q: "Manish",
  ps8919: "Priya",
  sx1142: "Shani",
  vr9195: "Vikas",
  dd3357: "Waseem",
};


/* ============================================================
   GET USER NAME
   ============================================================ */

export function getUserName(userId) {
  if (!userId) {
    return "Unknown User";
  }

  const id = String(userId)
    .trim()
    .toLowerCase();

  return USER_NAME_MAP[id] || "Unknown User";
}


/* ============================================================
   NORMALIZE TEXT
   ============================================================ */

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}


/* ============================================================
   STREET TYPICAL DETECTION
   ============================================================

   Detects:

   TYPICAL
   Typical
   typical
   STREET TYPICAL
   Street Typical
   street typical
   TYPICAL CROSS SECTION
   Typical Cross-Section

   Searches:
   - NOTES
   - TITLE
   - MYW_TITLE
   - MYW_SHORT_DESCRIPTION
   - REFERENCED_FEATURE
   - DETAILS

   Everything is converted to lowercase first,
   so CAPITAL / small / Mixed case all work.
   ============================================================ */

export function isStreetTypical(row) {
  const fields = [
    row?.NOTES,
    row?.TITLE,
    row?.MYW_TITLE,
    row?.MYW_SHORT_DESCRIPTION,
    row?.REFERENCED_FEATURE,
    row?.DETAILS,
  ];

  const text = fields
    .filter(
      (value) =>
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ""
    )
    .map((value) => normalizeText(value))
    .join(" ");

  return (
    text.includes("typical") ||
    text.includes("street typical") ||
     text.includes("typical details") ||
    text.includes("street typical cross-section") ||
    text.includes("street typical cross section")
  );
}


/* ============================================================
   EXTRACT IQGEO LINK
   ============================================================ */

export function extractIQGeoLink(row) {
  const possibleFields = [
    row?.MYWORLDLINK,
    row?.MYW_SHORT_DESCRIPTION,
    row?.DETAILS,
    row?.NOTES,
  ];

  for (const field of possibleFields) {
    if (!field) {
      continue;
    }

    const value = String(field).trim();

    /* --------------------------------------------
       Direct URL
       -------------------------------------------- */

    const directUrl = value.match(
      /https?:\/\/[^\s"'<>]+/i
    );

    if (directUrl) {
      return directUrl[0];
    }

    /* --------------------------------------------
       Markdown URL
       [text](https://...)
       -------------------------------------------- */

    const markdownUrl = value.match(
      /\[[^\]]*\]\((https?:\/\/[^)]+)\)/i
    );

    if (markdownUrl) {
      return markdownUrl[1];
    }

    /* --------------------------------------------
       Excel HYPERLINK
       HYPERLINK("url","text")
       -------------------------------------------- */

    const hyperlink = value.match(
      /HYPERLINK\s*\(\s*["'](https?:\/\/[^"']+)["']/i
    );

    if (hyperlink) {
      return hyperlink[1];
    }

    /* --------------------------------------------
       HTML href
       -------------------------------------------- */

    const htmlHref = value.match(
      /href\s*=\s*["'](https?:\/\/[^"']+)["']/i
    );

    if (htmlHref) {
      return htmlHref[1];
    }
  }

  return "";
}


/* ============================================================
   PARSE CSV
   ============================================================ */

export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(
        new Error("No CSV file selected.")
      );

      return;
    }

    Papa.parse(file, {
      header: true,

      skipEmptyLines: true,

      transformHeader: (header) =>
        String(header || "").trim(),

      complete: (results) => {
        try {
          /* --------------------------------------------
             Make sure data is an array
             -------------------------------------------- */

          const allRows = Array.isArray(
            results?.data
          )
            ? results.data
            : [];

          /* --------------------------------------------
             Add user name + IQGeo link
             -------------------------------------------- */

          const processedRows = allRows.map(
            (row) => {
              const modificationUser =
                getUserName(
                  row?.MODIFICATION_USER
                );

              const iqGeoLink =
                extractIQGeoLink(row);

              return {
                ...row,

                modificationUser,

                iqGeoLink,
              };
            }
          );

          /* --------------------------------------------
             ONLY STREET TYPICAL RECORDS
             -------------------------------------------- */

          const streetTypicalRows =
            processedRows.filter(
              (row) =>
                isStreetTypical(row)
            );

          /* --------------------------------------------
             Statistics
             -------------------------------------------- */

          const totalRecords =
            processedRows.length;

          const streetTypicalRecords =
            streetTypicalRows.length;

          const ignoredRecords =
            totalRecords -
            streetTypicalRecords;

          /* --------------------------------------------
             Console information
             -------------------------------------------- */

          console.log(
            "Total CSV records:",
            totalRecords
          );

          console.log(
            "Street Typical records:",
            streetTypicalRecords
          );

          console.log(
            "Ignored records:",
            ignoredRecords
          );

          console.log(
            "Street Typical rows:",
            streetTypicalRows
          );

          /* --------------------------------------------
             Return result
             -------------------------------------------- */

          resolve({
            file,

            data: streetTypicalRows,

            meta:
              results?.meta || {},

            errors:
              results?.errors || [],

            totalRecords,

            streetTypicalRecords,

            ignoredRecords,
          });
        } catch (error) {
          console.error(
            "CSV processing error:",
            error
          );

          reject(error);
        }
      },

      error: (error) => {
        console.error(
          "CSV parsing error:",
          error
        );

        reject(
          new Error(
            error?.message ||
              "Unable to parse CSV file."
          )
        );
      },
    });
  });
}