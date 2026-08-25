# Network Topology — Star-Tree Hybrid

Thesis-style **Network Topology** diagram for **AlertaraQC** (Barangay San Agustin pilot), matching the capstone **star-tree hybrid** format.

## Files

| File | Description |
|------|-------------|
| `42_Network_Topology.drawio` | Editable in [diagrams.net](https://app.diagrams.net) |
| `42_Network_Topology.svg` / `.png` | Export for Word manuscript |
| `my-app/docs/Network_Topology.png` | Thesis copy |

## Layout

**Center (star hub):** Hostinger VPS — Apache, PHP 8.2, Laravel 12

**8 branches (tree leaves):**

| Branch | Endpoints |
|--------|-----------|
| LGU Admin | Admin PC, Admin Laptop, Super Admin |
| Trainers | Lead Trainer, Assistant Trainer, Staff Terminal |
| Participants | Mobile, Desktop, Public Register |
| Evaluators | Evaluator PC, Attendance Tablet, Scoring Laptop |
| Data Store | MySQL 8.0, Session Store, File Storage |
| Email (SMTP) | OTP, Verify Email, Notifications *(external, dashed)* |
| AI & Media | Gemini, Cloudinary, PDF Assets *(external)* |
| Partner APIs | Group 6, CPSQC, Public QR Verify *(external)* |

## Regenerate

```bash
php Documents/network-topology/generate_network_topology.php
```

## Manuscript

**Section:** 3.6.1 Network Topology  
**Caption:** *Figure no. __ Network Topology — Star-Tree Hybrid Topology of the Disaster Preparedness Training and Simulation System (AlertaraQC).*

### Defense one-liner

> “Central Hostinger VPS serves all LGU clients over HTTPS; database and app co-locate on the VPS; partner systems connect via outbound HTTPS only.”

## Honest scope note

This is a **logical deployment topology** for the capstone pilot (single VPS), not a full LGU wide-area enterprise network. External nodes are shown as tree leaves to match the required diagram style.
