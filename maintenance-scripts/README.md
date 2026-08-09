# Maintenance Scripts

This folder contains scripts used to analyze, merge, and consolidate projects into the `projects/` directory.

## Scripts

| Script | Purpose |
|:---|:---|
| `analyze.js` | Scans projects/, newprojects/, py/ and saves a JSON snapshot of all directories and files |
| `analyze_details.js` | Detailed file-by-file comparison of overlapping project directories |
| `plan_merges.js` | Identifies matching/duplicate projects across the three directories |
| `check_ids.js` | Reads and prints the `id` and `title` fields from all project JSON files |
| `check_vascage.js` | Inspects VASCAGE/VitalSense JSON files to identify duplicates |
| `query_analysis.js` | Queries the saved analysis snapshot for specific project comparisons |
| `execute_consolidation.js` | **Main script** — Merges all projects, generates missing JSONs, cleans up old dirs |

## How to use for future projects

When you add new projects in a temporary folder and want to consolidate them:

1. **Run `analyze.js`** to get a fresh snapshot of all directories.
2. **Run `plan_merges.js`** to see what overlaps and what is new.
3. **Update `execute_consolidation.js`** with the new project entries in the `CONSOLIDATIONS` array.
4. **Run `execute_consolidation.js`** to perform the merge.
5. **Run `node js/update_projects.js`** to rebuild the compiled output.
6. **Run `node js/update_projects.js --test`** to validate everything.
