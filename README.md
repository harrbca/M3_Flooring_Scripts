# M3_Flooring_Scripts
M3 H5 Scripts for the flooring industry

## Passing Arguments to BH_Uppercase

BH_Uppercase is a script that uppercases user input for specific M3 H5 input fields. You can control which fields are affected by passing a comma-separated list of arguments to the script.

### Argument syntax
- Comma-separated values, spaces around items are allowed and ignored.
- Arguments are case-insensitive.
- General pattern:
  - Optional program code (e.g., MMS001, OIS101, CRS610)
  - Optional keyword NO_DEFAULTS
  - Zero or more field IDs (e.g., MMITDS, WRCUNM)

### Defaults by program
If you do not pass any arguments, the script detects the current program from the main panel header and uses its default field list.

Built-in defaults:
- MMS001: MMITDS, MMFUDS
- OIS101: OBALUN, OBSPUN
- CRS610: WRCUNM, WRCUA1, WRCUA2, WRCUA3, WRCUA4

### Special keyword: NO_DEFAULTS
- Include NO_DEFAULTS to disable the built-in defaults for the chosen/detected program. Only the field IDs you list after it will be used.

### How the parser works (from BH_Uppercase.js)
- The args string is split by commas.
- If the first argument matches a known program in the defaults table, it overrides the detected program.
- If NO_DEFAULTS appears next, defaults are disabled.
- All remaining arguments are treated as additional field IDs to uppercase.

### Examples
1) Use detected program defaults (no args)
- Args: (leave empty)
- Effect: Uses the built-in defaults for the program shown in the H5 header (e.g., MMS001/E uses MMITDS, MMFUDS).

2) Override to MMS001 and keep defaults
- Args: MMS001
- Effect: Uses MMS001 defaults (MMITDS, MMFUDS), regardless of the detected program.

3) Override to OIS101, disable defaults, and specify fields
- Args: OIS101, NO_DEFAULTS, OBSPUN
- Effect: Only OBSPUN is uppercased.

4) Keep detected program, add extra fields
- Args: WRCUA1, WRCUA4
- Effect: Uses detected program defaults and also uppercases WRCUA1 and WRCUA4 (duplicates are ignored).

5) Explicit MMS001 with added fields
- Args: MMS001, MMFUDS, MMALUN
- Effect: Uses MMS001 defaults (MMITDS, MMFUDS). MMFUDS is already included; MMALUN is added.

### Where to set the arguments
- In the M3 H5 scripting environment, set the script parameter/arguments string for BH_Uppercase to the comma-separated value you need. For example: `MMS001, NO_DEFAULTS, MMITDS`.

### Notes
- If no valid program can be detected and no valid override is provided, the script logs an error and does nothing.
