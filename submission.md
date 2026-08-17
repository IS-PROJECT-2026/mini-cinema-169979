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
 

[ ![milestone 1]( evidence\Milestone_1.png)]
[![milestone 2]( evidence\Milestone_2.png)]
[![milestone 3]( evidence\Milestone_3.png)]
[![milestone overview]( evidence\Milestone_overview.png)]


* **Caption:** [ These screenshots show the project milestones and the granular issues assigned to them for tracking feature development and project progress.]

### B. Project Board
 

[ ![project image](evidence\Project.png)]

* **Caption:** [ This screenshot shows the Mini Cinema project board with development issues organised dynamically into To Do, In Progress, and Done columns, allowing the progress of project tasks to be tracked.All issues have been completed and moved to the done column.]

### C. Branching Architecture
 

[![branches-image]( evidence\Branch.png)]

* **Caption:** [ This screenshot shows the project's branching architecture, using conventional feat/ and fix/ naming patterns to separate feature development from bug fixes.]

### D. Pull Requests & Traceability
 

[ evidence\PR_Traceability.png]

* **Caption:** [ This PR demonstrates traceability by linking PR #23 to issue #6, “Embed YouTube Iframe Player API,” which was automatically closed after the pull request was merged into main]

---

## 5. Merge Conflict Evidence

You must engineer **three merge conflicts**, each triggered by a **different cause** from those covered in the lecture. For Conflict 1, document the full resolution lifecycle. For Conflicts 2 and 3, provide the conflict marker screenshot and identify the cause.

> **Marks:** Conflict 1 full chronology (2 marks) · Conflict 2 (1 mark) · Conflict 3 (1 mark) · All three use distinct causes (1 mark) = **5 marks total**

---

### Conflict 1 — Full Chronology

**What cause did you use?** [Name the type of conflict cause from the lecture]

#### Step 1: Generating the Clash
*Screenshot showing the merge attempt and the conflict warning.*

[PASTE SCREENSHOT OF ATTEMPTED MERGE / TERMINAL WARNING HERE]

* **Caption:** [Describe which two branches collided and the warning received]

#### Step 2: Inside the Code Editor (Conflict Markers)
*Screenshot showing the raw, unresolved conflict markers (`<<<<<<< HEAD`, `=======`, `>>>>>>>`) in your editor.*

[PASTE SCREENSHOT OF RAW CONFLICT MARKERS HERE]

* **Caption:** [Explain what caused the dispute and your reasoning for the final version]

#### Step 3: Resolution & Clean Merge
*Screenshot of your clean Git history or completed PR showing the conflict was resolved and merged.*

[PASTE SCREENSHOT OF CLEAN RESOLUTION HERE]

* **Caption:** [Describe the final state after resolution]

---

### Conflict 2 — Different Cause

**What cause did you use?** [Name the type of conflict cause — must be different from Conflict 1]

**Why does this cause trigger a conflict?** [1–2 sentences explaining the mechanism]

[PASTE SCREENSHOT OF CONFLICT MARKERS FOR CONFLICT 2 HERE]

* **Caption:** [Brief description of the conflicting branches and file]

---

### Conflict 3 — Different Cause

**What cause did you use?** [Name the type of conflict cause — must be different from Conflicts 1 and 2]

**Why does this cause trigger a conflict?** [1–2 sentences explaining the mechanism]

[PASTE SCREENSHOT OF CONFLICT MARKERS FOR CONFLICT 3 HERE]

* **Caption:** [Brief description of the conflicting branches and file]

---
##
## 6. Feedback & Evaluation

To help improve this course for future engineering cohorts, please take 2 minutes to fill out the anonymous feedback form. Your honest review helps shape how this program is taught next semester!
- [ ] **Anonymous Evaluation Form:** [Course & Instructor Evaluation](https://forms.gle/YLybnsyXXErKEg3s9)

---
 
## Final Submission
 
Once your repository is complete, submit your work through the official submission form below. The form will **stop accepting responses after Monday, August 17th, 2026** — no late submissions will be accepted.
 
> **Submission Form:** [https://forms.gle/KrT4VxtFtkU3wtYu8](https://forms.gle/KrT4VxtFtkU3wtYu8)
