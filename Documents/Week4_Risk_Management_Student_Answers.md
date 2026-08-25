# ONLINE ACTIVITY – WEEK 4
# Risk Management in IT Auditing: Case Analysis

| Duration | 2 Hours | Difficulty | Hard |
|----------|---------|------------|------|
| Mode | Individual Online Activity | Total | 100 Points |

## Learning Objectives

- Identify potential IT risks and distinguish internal and external risks.
- Assess likelihood, impact, and overall risk level.
- Prioritize risks using a risk matrix.
- Recommend appropriate risk treatment strategies.
- Develop a basic risk management plan.

## CASE STUDY: The Security Incident at North Valley University

North Valley University uses a centralized Learning Management System (LMS) for students, faculty members, and administrators. The LMS stores student information, grades, submitted assignments, examination materials, faculty records, and other academic information.

During the previous month, several employees reported receiving phishing emails that appeared to come from the university's IT department. Two employees clicked the links and entered their usernames and passwords on a fake login page. Several employees are still using weak passwords, and some accounts do not have multi-factor authentication enabled.

At the same time, the LMS server has experienced unexpected interruptions. The IT department discovered that some server software has not been updated for several months because the system administrator has been prioritizing other tasks.

The university performs backups, but backups are performed only once a week. The latest backup is stored in the same building as the primary LMS server. A faculty member also accidentally deleted an important folder containing course materials. Restoring the files took several hours.

The university depends on an external cloud service for some online services, but there is no formal procedure for evaluating the security and availability of the third-party provider.

Finally, the university has experienced several short power interruptions. Although the servers have UPS devices, the IT department has not recently tested its disaster recovery procedures.

The university president has asked the IT auditor to conduct a risk assessment and prepare a basic risk management plan.

## STUDENT TASK

You are the IT Auditor assigned to North Valley University. Prepare an essay-based risk assessment and management recommendation based on the case.

---

# STUDENT ANSWERS

## PART I – Risk Identification (20 points)

Identify at least SIX IT risks. For each: (1) what the risk is, (2) source, (3) internal or external, (4) affected asset/operation.

| # | Risk | What it is | Source | Internal / External | Affected asset / operation |
|---|------|------------|--------|---------------------|----------------------------|
| 1 | Phishing and stolen login credentials | Fake IT emails; two staff entered usernames and passwords on a fake login page. | Outside attackers sent the emails; staff still clicked. | Mostly external (attack), but the human error is internal. | User accounts, LMS access, student records, grades, exam files. |
| 2 | Weak passwords and no MFA | Some accounts still use weak passwords. MFA is not on for everyone. | Internal – weak habits and incomplete security setup. | Internal | Faculty/admin accounts, LMS, personal and academic data. |
| 3 | Outdated LMS server software | Some server software was not updated for several months. | Internal – admin delayed patching because of other tasks. | Internal | LMS server security and uptime; class access for students and faculty. |
| 4 | Weak backup setup | Backups are only once a week and stored in the same building as the main server. | Internal – backup policy and storage location. | Internal | Course materials, grades, assignments, recovery after failure. |
| 5 | Accidental deletion of files | A faculty member deleted an important course folder. Restore took several hours. | Internal – user mistake plus slow recovery. | Internal | Course content, teaching, class continuity. |
| 6 | No review of third-party cloud service | The school uses an outside cloud service but has no formal check of its security and availability. | Vendor is external; missing procedure is the university’s fault. | Both (external vendor + internal gap) | Online services that depend on the cloud. |
| 7 | Untested disaster recovery / power | Short power cuts already happened. UPS exists, but DR was not tested recently. | Internal – no recent DR test. | Internal | Server uptime and recovery after a longer outage. |

## PART II – Risk Assessment (20 points)

Five most important risks, with ratings defended from the case.

| Risk | Likelihood | Impact | Overall | Why (from the case) |
|------|------------|--------|---------|---------------------|
| A. Phishing / stolen credentials | High | High | High | It already happened. Several staff got phishing emails and two entered their passwords. LMS holds grades, student info, and exams, so a stolen account is a big deal. |
| B. Weak passwords / no MFA | High | High | High | The case says several people still use weak passwords and some accounts have no MFA. That is common, not rare. It also makes phishing worse. |
| C. Outdated server software | Medium | High | High | No confirmed hack through the old software yet, so likelihood is medium. Impact is high because the LMS is the main system and it already had unexpected interruptions. |
| D. Weak backup (weekly + same building) | Medium | High | High | A folder was already deleted and restore took hours. Power cuts also happened. If something hits the building, a weekly backup in the same place may not be enough. |
| E. Untested DR / power interruptions | Medium | Medium | Medium | Power cuts already happened, so it is not just theoretical. Impact is medium for now because UPS is there and the cuts were short, but untested DR can make a longer outage worse. |

## PART III – Risk Matrix Analysis (15 points)

### 3 × 3 risk matrix (Likelihood × Impact)

| Likelihood \ Impact | Low | Medium | High |
|---------------------|-----|--------|------|
| **High** | — | — | A. Phishing / stolen credentials<br>B. Weak passwords / no MFA |
| **Medium** | — | E. Untested DR / power | C. Outdated server software<br>D. Weak backup setup |
| **Low** | — | — | — |

### Which risk should North Valley University address first, and why?

I think they should fix phishing and stolen credentials first, together with weak passwords and no MFA, because those two are connected.

The likelihood is already high. Staff received fake IT emails, and two people typed their passwords on a fake page. That is not only a possible risk. It already became an incident. Impact is also high because the LMS stores student information, grades, exams, and faculty records. If attackers still have those logins, they can read or change private academic data or mess up classes.

Compared with the other risks, this one can give outsiders access fast. Someone who is already inside can also do more damage while the server is still unpatched. Backup and DR are still important, but the way attackers are getting in right now is through people and weak login security. So first priority is stopping account takeover: awareness, password rules, and turning on MFA. After that, patching and better backups should come next.

## PART IV – Risk Treatment (20 points)

| Risk | Treatment | Why this treatment |
|------|-----------|--------------------|
| A. Phishing / stolen credentials | Reduce / Mitigate | They cannot avoid email. Accepting it is too risky after real incidents. Insurance does not stop the attack. Better to train people, filter emails, and reset the affected passwords. |
| B. Weak passwords / no MFA | Reduce / Mitigate | The school can control this. They can require stronger passwords and turn on MFA. Avoiding user accounts is not realistic. Accepting weak login security is not okay for an LMS with grades. |
| C. Outdated server software | Reduce / Mitigate | They should patch on a schedule. Turning off the LMS is not practical. Transfer does not fix unpatched servers. Leaving it months behind is too risky, especially with interruptions already happening. |
| D. Weak backup setup | Reduce / Mitigate | They can back up more often and keep one copy offsite. Accepting weekly same-building backups is weak after restore already took hours. Outsourcing backup can help, but they still need a better process. |
| E. Untested DR / power | Reduce / Mitigate | They already have UPS. Next step is testing DR and fixing gaps. Accepting untested recovery is not good. Avoiding power problems completely is hard. |

## PART V – IT Auditor’s Recommendation (15 points)

As the IT auditor for North Valley University, I recommend a focused 90-day plan so the school can reduce the most serious risks without waiting for a perfect long-term project.

First, cybersecurity and user awareness should start immediately. Since two employees already entered passwords on a fake login page, the university should reset those accounts, check for unusual LMS activity, and block the phishing domains if possible. Within the first month, all staff and faculty should get short phishing awareness training. This matters because technology alone cannot stop people from clicking. At the same time, the school should enforce stronger password rules and turn on multi-factor authentication for LMS and related systems. MFA is important here because even if someone falls for phishing again, the stolen password alone should not be enough to get in.

Second, system updates must become a real routine. The LMS software has not been updated for months because other tasks were prioritized. That delay increases the chance of bugs, downtime, and security holes. Within 90 days, IT should inventory missing patches, apply critical updates during planned maintenance windows, and assign a clear owner for monthly patching. This is appropriate because the LMS is central to teaching and already had unexpected interruptions.

Third, backup and recovery need improvement. Weekly backups in the same building are not enough, especially after a faculty member deleted course materials and restore took hours. The university should increase backup frequency (for example, daily for critical LMS data) and keep at least one copy offsite or in a separate location. They should also test restore procedures, not only backup jobs. Testing is needed because a backup that cannot be restored quickly still fails the school during an incident.

Fourth, third-party cloud services should not stay unchecked. The university depends on an external provider but has no formal evaluation process. In the next 90 days, IT and management should create a simple vendor checklist covering security controls, uptime history, support response, and data backup responsibilities. This is appropriate because if the cloud service fails or is breached, university operations can be affected even if the local LMS is fine.

Finally, business continuity should include a small disaster recovery drill. Power interruptions already happened, and UPS exists, but procedures were not tested recently. A tabletop or short failover test within 90 days will show what works and what is missing. After the test, IT should update the recovery steps and make sure roles are clear (who declares an incident, who restores, who communicates to faculty and students).

Overall, the university should treat the next 90 days as a risk-reduction sprint: stop account compromise first, then stabilize systems and recovery. These actions fit the case because the biggest problems already appeared in real incidents, not only in theory.

*(Word count: about 430)*

## PART VI – Final Risk Management Plan (10 points)

Required format:

| Risk | Likelihood | Impact | Risk Owner | Treatment | Mitigation Strategy | Monitoring |
|------|------------|--------|------------|-----------|---------------------|------------|
| Phishing / stolen LMS credentials | High | High | IT Security Officer / IT Director | Reduce / Mitigate | Reset affected passwords; short phishing training; better email filtering; tell staff to report suspicious emails. | Count phishing reports each month; review failed or strange logins every week. |
| Weak passwords and missing MFA | High | High | System Administrator / IT Director | Reduce / Mitigate | Require stronger passwords; turn on MFA for all LMS users; keep exceptions only if approved. | Check MFA enrollment every month; audit accounts that still have weak passwords. |
| Outdated LMS server software | Medium | High | System Administrator | Reduce / Mitigate | Apply overdue patches; set a monthly update schedule; write down maintenance windows. | Monthly patch report; watch server downtime and incidents. |
| Weak backup (weekly + same building) | Medium | High | IT Operations / Backup Admin | Reduce / Mitigate | Daily backups for important LMS data; keep one copy offsite; test restore at least once a quarter. | Check backup success logs daily; record restore test results every quarter. |
| Untested DR / power risk | Medium | Medium | IT Director / BC Lead | Reduce / Mitigate | Test UPS and DR steps within 90 days; update the recovery playbook; assign incident roles. | Review response after each power event; do a DR drill every 6 months. |
