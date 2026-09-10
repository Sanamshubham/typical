// ============================================================
// IQGEO STREET TYPICAL VALIDATOR
// ============================================================


// ============================================================
// NORMALIZE KEY
// ============================================================

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}


// ============================================================
// PARSE FEET
// ============================================================

export function parseFeet(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return [];
  }

  const text = String(value).trim();

  if (
    !text ||
    text.toLowerCase() === "none" ||
    text === "-"
  ) {
    return [];
  }

  return text
    .split(",")
    .map((item) => item.trim())
    .map((item) => {

      const match = item.match(
        /-?\d+(?:\.\d+)?/
      );

      return match
        ? Number(match[0])
        : null;
    })
    .filter(
      (number) =>
        number !== null &&
        Number.isFinite(number)
    );
}


// ============================================================
// PARSE DETAILS HTML
// ============================================================

export function parseDetails(details) {

  const result = {};

  if (!details) {
    return result;
  }

  const cleanText =
    String(details)

      .replace(
        /<br\s*\/?>/gi,
        "\n"
      )

      .replace(
        /<\/div>/gi,
        "\n"
      )

      .replace(
        /<div[^>]*>/gi,
        "\n"
      )

      .replace(
        /<[^>]*>/g,
        ""
      );

  const lines =
    cleanText.split(/\r?\n/);


  lines.forEach((line) => {

    const match =
      line.match(
        /^\s*([^:]+?)\s*:\s*(.*?)\s*$/
      );

    if (!match) {
      return;
    }

    const key =
      normalizeKey(
        match[1]
      );

    const value =
      match[2].trim();

    result[key] = value;

  });


  return result;
}


// ============================================================
// GET FIELD
// ============================================================

function getField(
  details,
  names
) {

  for (const name of names) {

    const key =
      normalizeKey(name);

    if (
      details[key] !== undefined &&
      details[key] !== null
    ) {
      return details[key];
    }

  }

  return "";
}


// ============================================================
// GET NUMBER
// ============================================================

function getNumber(
  details,
  names
) {

  const value =
    getField(
      details,
      names
    );

  const parsed =
    parseFeet(value);

  if (
    parsed.length === 0
  ) {
    return null;
  }

  return parsed[0];
}


// ============================================================
// CHECK R/L FIELD
// ============================================================

function isRLField(key) {

  const normalized =
    normalizeKey(key);

  return (

    normalized ===
      "BOC TO R L"

    ||

    normalized ===
      "BOC TO RL"

    ||

    normalized.includes(
      "TO R L"
    )

    ||

    normalized.includes(
      "TO RL"
    )

  );
}


// ============================================================
// R/L CLEARANCE EXCEPTIONS
// ============================================================
//
// These utilities do NOT require the special
// 2 ft R/L clearance rule.
//
// TELCO HH
// TELCOMH
// EX PED
// TELCO PED
//
// ============================================================

function isRLClearanceException(
  utilityName
) {

  const name =
    normalizeKey(
      utilityName
    );

  const exceptions = [

    "TELCO HH",

    "TELCOMH",

    "EX PED",

    "TELCO PED",

  ];

  return exceptions.includes(
    name
  );
}


// ============================================================
// GET UTILITY POSITIONS
// ============================================================

function getUtilityPositions(
  details
) {

  const utilities = [];


  Object.entries(
    details
  ).forEach(
    ([key, value]) => {

      const normalized =
        normalizeKey(key);


      // Only BOC TO fields
      if (
        !normalized.startsWith(
          "BOC TO"
        )
      ) {
        return;
      }


      // Ignore BOC TO BOC
      if (
        normalized ===
        "BOC TO BOC"
      ) {
        return;
      }


      const positions =
        parseFeet(value);


      if (
        positions.length === 0
      ) {
        return;
      }


      // ------------------------------------------------------
      // R/L
      // ------------------------------------------------------

      if (
        isRLField(key)
      ) {

        positions.forEach(
          (position) => {

            utilities.push({

              name: "R/L",

              position,

              isRL: true,

            });

          }
        );

        return;
      }


      // ------------------------------------------------------
      // NORMAL UTILITY
      // ------------------------------------------------------

      positions.forEach(
        (position) => {

          utilities.push({

            name: key,

            position,

            isRL: false,

          });

        }
      );

    }
  );


  return utilities.sort(
    (a, b) =>
      a.position - b.position
  );
}


// ============================================================
// VALIDATE SINGLE ROW
// ============================================================

export function validateRow(
  row,
  rowIndex = 0,
  city = "Other"
) {

  // ==========================================================
  // DETAILS
  // ==========================================================

  const details =
    parseDetails(
      row?.details ||
      row?.DETAILS ||
      ""
    );


  const issues = [];


  // ==========================================================
  // BASIC DATA
  // ==========================================================

  const streetName =
    getField(
      details,
      [
        "STREET NAME",
        "STREET",
        "ROAD NAME",
      ]
    ) ||
    `Row ${rowIndex + 1}`;


  const plat =
    getField(
      details,
      [
        "PLAT",
      ]
    );


  // ==========================================================
  // ROW
  // ==========================================================

  const rowWidth =
    getNumber(
      details,
      [
        "ROW",
        "ROW WIDTH",
        "RIGHT OF WAY",
      ]
    );


  // ==========================================================
  // RW TO BOC / ROW TO BOC
  // ==========================================================
  //
  // Both names are supported.
  //
  // ==========================================================

  const rowToBoc =
    getNumber(
      details,
      [
        "RW TO BOC",
        "RW-TO-BOC",
        "ROW TO BOC",
        "ROW-TO-BOC",
      ]
    );


  // ==========================================================
  // BOC TO BOC
  // ==========================================================

  const bocToBoc =
    getNumber(
      details,
      [
        "BOC TO BOC",
        "BOC-TO-BOC",
      ]
    );


  // ==========================================================
  // BOC TO R/L
  // ==========================================================

  const bocToRL =
    getNumber(
      details,
      [
        "BOC TO R/L",
        "BOC TO RL",
        "BOC-TO-R/L",
        "BOC-TO-RL",
      ]
    );


  // ==========================================================
  // RW TO R/L / ROW TO R/L
  // ==========================================================

  const rowToRL =
    getNumber(
      details,
      [
        "RW TO R/L",
        "RW TO RL",
        "RW-TO-R/L",
        "RW-TO-RL",
        "ROW TO R/L",
        "ROW TO RL",
        "ROW-TO-R/L",
        "ROW-TO-RL",
      ]
    );


  // ==========================================================
  // NOTE
  // ==========================================================

  const note =
    getField(
      details,
      [
        "NOTE",
        "NOTES",
        "COMMENT",
        "COMMENTS",
      ]
    );


  // ==========================================================
  // RULE 1
  // ROW SYMMETRY
  // ==========================================================
  //
  // Formula:
  //
  // ROW TO BOC =
  // (ROW - BOC TO BOC) / 2
  //
  // ==========================================================

  if (
    rowWidth !== null &&
    bocToBoc !== null &&
    rowToBoc !== null
  ) {

    const expected =
      (
        rowWidth -
        bocToBoc
      ) / 2;


    const difference =
      Math.abs(
        expected -
        rowToBoc
      );


    if (
      difference > 0.001
    ) {

      issues.push({

        type: "ERROR",

        rule:
          "ROW Symmetry",

        message:
          `ROW symmetry mismatch. ` +
          `Expected RW/ROW TO BOC = ` +
          `${expected.toFixed(2)} ft, ` +
          `but found ${rowToBoc} ft.`,

      });

    }

  }


  // ==========================================================
  // RULE 2
  // ROW/RW TO R/L = 1 FT in Shreveport, 5 FT elsewhere
  // ==========================================================
  //
  // Shreveport violations are always ERROR, including when a Note exists.
  // Other cities retain the existing Note-based warning behavior.
  //
  // ==========================================================

  if (
    rowToRL !== null
  ) {

    const requiredRL =
      city === "Shreveport"
        ? 1
        : 5;

    const isRequiredFeet =
      Math.abs(
        Math.abs(rowToRL) - requiredRL
      ) <= 0.001;


    if (
      !isRequiredFeet
    ) {

      const hasNote =
        Boolean(
          note &&
          String(note).trim()
        );


      if (city === "Shreveport" || !hasNote) {

        issues.push({

          type: "ERROR",

          rule:
            `RW to R/L ${requiredRL}-Foot Rule`,

          message:
            `RW TO R/L is ${rowToRL} ft. ` +
            `Required value is ${requiredRL} ft` +
            (city === "Shreveport"
              ? "."
              : " and no Note was provided."),

        });

      } else {

        issues.push({

          type: "WARNING",

          rule:
            "RW to R/L 5-Foot Rule",

          message:
            `RW TO R/L is ${rowToRL} ft instead of 5 ft. ` +
            `Note: ${note}`,

        });

      }

    }

  }


  // ==========================================================
  // NEW RULE 3
  // BOC TO R/L CALCULATION
  // ==========================================================
  //
  // REQUIRED FORMULA:
  //
  // BOC TO R/L =
  // |RW TO BOC - RW TO R/L|
  //
  // Positive / Negative signs are ignored.
  //
  // Examples:
  //
  // RW TO BOC = 10
  // RW TO R/L = 5
  // Expected BOC TO R/L = 5
  //
  // RW TO BOC = -10
  // RW TO R/L = 5
  // Expected BOC TO R/L = 5
  //
  // RW TO BOC = 10
  // RW TO R/L = -5
  // Expected BOC TO R/L = 5
  //
  // ==========================================================

  if (
    rowToBoc !== null &&
    rowToRL !== null &&
    bocToRL !== null
  ) {

    const expectedBocToRL =
      Math.abs(
        Math.abs(rowToBoc) -
        Math.abs(rowToRL)
      );


    const actualBocToRL =
      Math.abs(
        bocToRL
      );


    const difference =
      Math.abs(
        expectedBocToRL -
        actualBocToRL
      );


    if (
      difference > 0.001
    ) {

      issues.push({

        type: "ERROR",

        rule:
          "BOC to R/L Calculation",

        message:
          `BOC TO R/L mismatch. ` +
          `Expected ${expectedBocToRL.toFixed(2)} ft ` +
          `from RW TO BOC (${rowToBoc} ft) ` +
          `and RW TO R/L (${rowToRL} ft), ` +
          `but found ${actualBocToRL} ft.`,

      });

    }

  }


  // ==========================================================
  // GET ALL UTILITIES
  // ==========================================================

  const utilityPositions =
    getUtilityPositions(
      details
    );


  // ==========================================================
  // RULE 4
  // NORMAL UTILITY SPACING
  // ==========================================================
  //
  // Minimum = 1 ft
  //
  // R/L excluded.
  //
  // ==========================================================

  for (
    let index = 0;
    index <
      utilityPositions.length - 1;
    index++
  ) {

    const current =
      utilityPositions[index];

    const next =
      utilityPositions[
        index + 1
      ];


    // R/L is handled
    // by separate rule.
    if (
      current.isRL ||
      next.isRL
    ) {
      continue;
    }


    const spacing =
      Math.abs(
        next.position -
        current.position
      );


    // --------------------------------------------------------
    // OVERLAP
    // --------------------------------------------------------

    if (
      spacing < 0.001
    ) {

      issues.push({

        type: "ERROR",

        rule:
          "Utility Overlap",

        message:
          `${current.name} and ${next.name} are both ` +
          `located at ${current.position} ft from BOC.`,

      });

      continue;
    }


    // --------------------------------------------------------
    // LESS THAN 1 FT
    // --------------------------------------------------------

    if (
      spacing < 1
    ) {

      issues.push({

        type: "ERROR",

        rule:
          "Utility Spacing",

        message:
          `${current.name} (${current.position} ft) and ` +
          `${next.name} (${next.position} ft) are only ` +
          `${spacing.toFixed(2)} ft apart. ` +
          `Minimum spacing is 1.0 ft.`,

      });

    }

  }


  // ==========================================================
  // RULE 5
  // R/L CLEARANCE
  // ==========================================================
  //
  // Normal minimum = 2 ft
  //
  // Exceptions:
  //
  // TELCO HH
  // TELCOMH
  // EX PED
  // TELCO PED
  //
  // ==========================================================

  const rlUtilities =
    utilityPositions.filter(
      (utility) =>
        utility.isRL
    );


  const otherUtilities =
    utilityPositions.filter(
      (utility) =>
        !utility.isRL
    );


  rlUtilities.forEach(
    (rl) => {

      otherUtilities.forEach(
        (other) => {

          // --------------------------------------------------
          // EXCEPTION
          // --------------------------------------------------

          if (
            isRLClearanceException(
              other.name
            )
          ) {
            return;
          }


          const distance =
            Math.abs(
              rl.position -
              other.position
            );


          // --------------------------------------------------
          // OVERLAP
          // --------------------------------------------------

          if (
            distance < 0.001
          ) {

            issues.push({

              type: "ERROR",

              rule:
                "R/L Utility Overlap",

              message:
                `R/L and ${other.name} are both located at ` +
                `${rl.position} ft from BOC. ` +
                `R/L requires minimum 2.0 ft clearance.`,

            });

            return;
          }


          // --------------------------------------------------
          // LESS THAN 2 FT
          // --------------------------------------------------

          if (
            distance < 2
          ) {

            issues.push({

              type: "ERROR",

              rule:
                "R/L Utility Spacing",

              message:
                `R/L at ${rl.position} ft and ` +
                `${other.name} at ${other.position} ft are only ` +
                `${distance.toFixed(2)} ft apart. ` +
                `R/L requires minimum 2.0 ft clearance.`,

            });

          }

        }
      );

    }
  );


  // ==========================================================
  // REMOVE DUPLICATE ISSUES
  // ==========================================================

  const uniqueIssues =
    issues.filter(
      (issue, index, array) => {

        return (
          index ===
          array.findIndex(
            (item) =>
              item.type ===
                issue.type &&

              item.rule ===
                issue.rule &&

              item.message ===
                issue.message
          )
        );

      }
    );


  // ==========================================================
  // FINAL STATUS
  // ==========================================================

  const hasError =
    uniqueIssues.some(
      (issue) =>
        issue.type ===
        "ERROR"
    );


  const hasWarning =
    uniqueIssues.some(
      (issue) =>
        issue.type ===
        "WARNING"
    );


  let status =
    "PASS";


  if (
    hasError
  ) {

    status =
      "FAIL";

  } else if (
    hasWarning
  ) {

    status =
      "WARNING";

  }


  // ==========================================================
  // RETURN RESULT
  // ==========================================================

  return {

    rowIndex,

    streetName,

    plat,

    uniqueId:
      row?.uniqueId ||
      row?.["UNIQUE ID"] ||
      "",

    modificationUser:
      row?.modificationUser ||
      "Unknown User",

    iqGeoLink:
      row?.iqGeoLink ||
      "",

    rowWidth,

    rowToBoc,

    bocToBoc,

    bocToRL,

    rowToRL,

    note,

    utilityPositions,

    details,

    issues:
      uniqueIssues,

    status,

    raw:
      row,

  };
}


// ============================================================
// VALIDATE ALL ROWS
// ============================================================
//
// IMPORTANT:
// This is a NORMAL FUNCTION.
// It is NOT a React component.
//
// ============================================================

export function validateRows(
  rows = [],
  city = "Other"
) {

  // ----------------------------------------------------------
  // Safety check
  // ----------------------------------------------------------

  if (
    !Array.isArray(rows)
  ) {

    console.error(
      "validateRows expected an array, received:",
      rows
    );

    return [];
  }


  // ----------------------------------------------------------
  // Validate every row
  // ----------------------------------------------------------

  return rows.map(
    (row, index) =>
      validateRow(
        row,
        index,
        city
      )
  );
}


export default validateRows;