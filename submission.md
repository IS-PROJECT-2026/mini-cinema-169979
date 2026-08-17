# Project Submission Report

## 1. Student Details

- **Full Name:** [Nicole]
- **GitHub Username:** [NicoleMumo]
- **Email:** [nicole.mumo@strathmore.edu]

---

## 2. Deployed Project Link

- **Live GitHub Pages URL:** [https://is-project-2026.github.io/mini-cinema-169979/]
  

---

## 3. Reflection — Grounded in Your Git History
 

### A. Your Best Commit

 

- **Commit URL:** [ https://github.com/IS-PROJECT-2026/mini-cinema-169979/commit/65bb18c]
- **Why this one?** [  It uses the correct feat: tag, clearly describes the specific change made, and shows a real feature rather than a vague update.]

### B. A Mistake or Struggle

 
- **Link to the evidence:** [ https://github.com/IS-PROJECT-2026/mini-cinema-169979/pull/35]
- **What happened and how did you recover?** [ Pull Request #35 was merged into `main`, but after the merge, I realised that the functionality did not work as expected. I therefore reverted the merge, which caused the changes to appear again as a pull request. I later closed the pull request without merging it, restoring the `main` branch to a more functional state from before the changes introduced in PR #35.
]

### C. A Pull Request You're Proud Of

 

- **PR URL:** [ https://github.com/IS-PROJECT-2026/mini-cinema-169979/pull/24]
- **What did you check before merging?** [ I reviewed the changed files to confirm that the YouTube URL was correctly converted into a video ID, loaded into the player, and stored in Firebase. I also checked that the feature was tested and linked to Issue #7 before merging into `main`.
]

### D. One Thing You Would Do Differently
 

- **What would you change?** [ What would you change? I would require myself to fully test and review a feature in feat/9-sync-non-host-clients   branch before merging its pull request into main. This would reduce the risk of merging incomplete or faulty work into the main branch, as happened with PR #35. The unwanted commit was "fix:guest initial sync on join" which was in the feat/9-sync-non-host-clients and  was attached to PR 35 that I had to revert. ]
- **Link to the evidence of the original decision:** [  https://github.com/IS-PROJECT-2026/mini-cinema-169979/commit/a6ca99ec16bdaf025acfd523c78128d0b2d2932c] and 
[https://github.com/IS-PROJECT-2026/mini-cinema-169979/pull/35]

---

## 4. Screenshots of Key GitHub Features

 

> **CRITICAL FOR WORKING IMAGES:** Do not type manual folder paths. Edit this file directly on the GitHub web interface, click on the blank line below each prompt, and **paste (Ctrl+V / Cmd+V)** your screenshot. GitHub will automatically upload the file and generate a permanent, working image link for you.

### A. Milestones and Issues
 
<img width="1312" height="851" alt="image" src="https://github.com/user-attachments/assets/bea52dcc-4021-4c12-a998-fdc376cfbc80" />

 
 <img width="1340" height="885" alt="image" src="https://github.com/user-attachments/assets/0e718f50-f6d5-4a1f-80e7-0c8c05847d2a" />

<img width="1377" height="793" alt="image" src="https://github.com/user-attachments/assets/e24e14b5-a426-4fb4-b181-cb0e619f5b19" />

<img width="1311" height="663" alt="image" src="https://github.com/user-attachments/assets/88ef785d-1473-4c6d-bade-d463e0403c5c" />



* **Caption:** [ These screenshots show the project milestones and the granular issues assigned to them for tracking feature development and project progress.]

### B. Project Board
 
<img width="1223" height="899" alt="image" src="https://github.com/user-attachments/assets/3bc968a0-c636-4bf6-a052-f3eada9c9ec0" />



* **Caption:** [ This screenshot shows the Mini Cinema project board with development issues organised dynamically into To Do, In Progress, and Done columns, allowing the progress of project tasks to be tracked.All issues have been completed and moved to the done column.]

### C. Branching Architecture
 
 <img width="1424" height="957" alt="image" src="https://github.com/user-attachments/assets/427bb3c4-abdc-4018-ba24-7aace52fec31" />


* **Caption:** [ This screenshot shows the project's branching architecture, using conventional feat/ and fix/ naming patterns to separate feature development from bug fixes.]

### D. Pull Requests & Traceability
 

 <img width="1017" height="894" alt="image" src="https://github.com/user-attachments/assets/8329f022-2754-4317-84fe-db6612854b0d" />


* **Caption:** [ This PR demonstrates traceability by linking PR #23 to issue #6, “Embed YouTube Iframe Player API,” which was automatically closed after the pull request was merged into main]

---

## 5. Merge Conflict Evidence

You must engineer **three merge conflicts**, each triggered by a **different cause** from those covered in the lecture. For Conflict 1, document the full resolution lifecycle. For Conflicts 2 and 3, provide the conflict marker screenshot and identify the cause.

> **Marks:** Conflict 1 full chronology (2 marks) · Conflict 2 (1 mark) · Conflict 3 (1 mark) · All three use distinct causes (1 mark) = **5 marks total**

---

 
### Conflict 1 — Full Chronology

**What cause did you use?** Same-line edit conflict — two branches modified the exact same line of the same file in different ways.

#### Step 1: Generating the Clash
*Screenshot showing the merge attempt and the conflict warning.*

 <img width="800" height="537" alt="Screenshot 2026-08-17 232519" src="https://github.com/user-attachments/assets/d6bef699-9a65-4b06-91a8-fa4af13dd8b2" />


* **Caption:** Branches `feat/21-header-red` and `feat/22-header-blue` both changed line 85 of `css/style.css` (the h1 gradient color) — one to red, one to blue. Merging `feat/21-header-red` into `main` succeeded cleanly, but merging `feat/22-header-blue` immediately after produced `CONFLICT (content): Merge conflict in css/style.css`.

#### Step 2: Inside the Code Editor (Conflict Markers)
*Screenshot showing the raw, unresolved conflict markers (`<<<<<<< HEAD`, `=======`, `>>>>>>>`) in your editor.*

 <img width="800" height="537" alt="Screenshot 2026-08-17 232519" src="https://github.com/user-attachments/assets/9a837551-5287-4b50-8c3b-e3105de493c0" />


* **Caption:** The conflict markers show `HEAD` (the red gradient, `#f43f5e`, already merged from `feat/21-header-red`) against the incoming change from `feat/22-header-blue` (`#3b82f6`). I kept the red version, since it better matched the landing page's warmer accent palette.

#### Step 3: Resolution & Clean Merge
*Screenshot of your clean Git history or completed PR showing the conflict was resolved and merged.*

 <img width="473" height="446" alt="Screenshot 2026-08-17 232918" src="https://github.com/user-attachments/assets/80d1f7ca-5db0-4996-bb96-f3db6fbaa918" />


* **Caption:** Since `main` is a protected branch, the resolved conflict couldn't be pushed directly — it was pushed to `feat/21-22-resolve-conflict` and merged via Pull Request #51, which shows all 4 commits (the two gradient changes, the merge, and the conflict-resolution fix) merged cleanly into `main`.

---

### Conflict 2 — Different Cause

**What cause did you use?** Modify/delete conflict (block deletion vs. in-block edit) — one branch deleted an entire function block, while the other branch edited a line inside that same block.

**Why does this cause trigger a conflict?** Git could not automatically determine whether to keep, remove, or merge the fullscreen code, because `fix/23-remove-fullscreen` deleted the whole block from `js/main.js` while `fix/24-tweak-fullscreen` still contained an edited version of a line inside that same block. This is a fundamentally different cause from Conflict 1, which was a same-line edit-vs-edit clash — here the clash is between removing code entirely and modifying it.
 
 <img width="951" height="540" alt="Screenshot 2026-08-17 234618" src="https://github.com/user-attachments/assets/801a19a0-cadf-4502-ba56-bd913a59b16f" />
<img width="960" height="540" alt="Screenshot 2026-08-17 234551" src="https://github.com/user-attachments/assets/7d34c09d-698c-4448-ab9d-67e9e8a36391" />
<img width="953" height="488" alt="Screenshot 2026-08-17 234951" src="https://github.com/user-attachments/assets/894de02d-ba49-4f8a-8dd8-1ad7f0f7df8f" />


* **Caption:** Branches `fix/23-remove-fullscreen` (which deleted the custom fullscreen feature — `isFullscreenActive`, `enterFullscreen`, `exitFullscreen`, and their event listeners) and `fix/24-tweak-fullscreen` (which changed the fullscreen toggle button's label text) were merged into `main` one after another. Since `fix/24` still referenced code that no longer existed on `main`, Git raised `CONFLICT (content): Merge conflict in js/main.js`. The conflict was resolved by keeping the deletion — the fullscreen feature was intentionally removed, so all markers and the reintroduced block from `fix/24-tweak-fullscreen` were deleted, and the change was pushed via Pull Request #52 into `main`.

---

### Conflict 3 — Different Cause

**What cause did you use?** [Name the type of conflict cause — must be different from Conflicts 1 and 2]

**Why does this cause trigger a conflict?** [1–2 sentences explaining the mechanism]

[PASTE SCREENSHOT OF CONFLICT MARKERS FOR CONFLICT 3 HERE]

* **Caption:** [Brief description of the conflicting branches and file]

---
##
 
