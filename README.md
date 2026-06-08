# Upper Midwest Plant Database

A sourced horticultural database for Upper Midwest / Chicago-region gardening,
emphasizing native plant ecology, CSR theory, and floristic quality metrics.

## Files

| Path | Description |
|------|-------------|
| `data/Plants_v4_master.csv` | Master database — ~1,229 plants, ~61 columns. **Source of truth.** |
| `routine/ROUTINE_PROMPT.md` | Prompt for the Claude Code Routine that runs automated MOBOT enrichment passes |
| `METHODOLOGY_and_caveats.md` | Data sources, methodology, dependability table, work queue |

## Automated enrichment

This repo is connected to a Claude Code Routine that runs daily. Each pass:
1. Scans the master CSV for native species with missing culture data
2. Looks up values from Missouri Botanical Garden Plant Finder + reputable botanical references
3. Fills blank cells only (never overwrites existing data)
4. Commits the updated CSV back

**Core rule:** no estimating or fabricating — only explicitly sourced values are recorded.

## Local scripts (optional)

If you want to regenerate the web viewer locally after pulling an updated CSV,
drop `regen_data.py`, `build_html5.py`, and `tkeys.json` into `scripts/` and run them in order.
