NATION: RISE TO POWER — POLITICAL DATASET
Dataset version: 1.0
Generation date: 2026-10-24
Provenance: Fully synthetic, procedurally generated game data. No official electoral boundaries, real candidate biographies, or real-person histories are represented.

CONTENTS
- NATION_CANDIDATES_AND_PARTIES.xlsx: multi-sheet workbook.
- CANDIDATES.csv: 45,000 candidate profiles.
- POLITICAL_PARTIES.csv: 34 fictional parties from the user-provided list.
- PARTY_LEADERSHIP.csv: initial leadership roles.
- PARTY_STATE_UNITS.csv: party/state organisational units.
- CANDIDATE_AFFILIATIONS.csv: initial AI party affiliations.
- CONSTITUENCIES.csv: fictional seed constituencies (3 per state/UT; not official).
- ELECTION_CANDIDATURES.csv: intentionally empty schema; no candidates are nominated at game start.
- DATA_DICTIONARY.csv: field-level definitions.
- VALIDATION_REPORT.csv and VALIDATION_REPORT.txt: automated validation results.
- STATES_REFERENCE is included in the workbook for stable state/UT IDs.

ID RULES
- Player pool: PC000001–PC012000. All begin with initial_party_id=NONE, membership=NONE, candidate status NOT_NOMINATED, government position NONE.
- AI pool: AI000001–AI033000. Most have an initial party; a minority start independent (NONE).
- Party IDs use stable keys; SPP and SPP-2 are distinct party IDs SPP and SPP2.
- IDs are permanent identifiers; never use row number as an identity.

SCALES AND UNITS
- Political and capability scores use integer 0–100.
- financial_capacity and regional_financial_capacity are fictional game credits, not INR.
- Dates use ISO 8601 YYYY-MM-DD. NONE is a sentinel string, not a null.
- state_id uses stable dataset IDs for Indian states/UTs. Constituencies are fictional and must not be presented as official geography or seat counts.

GENERATION METHOD
- Deterministic pseudorandom generation using a fixed seed (241024) for repeatability.
- Profiles use name vocabularies, fictional background templates, and varied score distributions.
- Candidate attributes are varied with bounded distributions; player candidates are not assigned stronger stats by design.
- This is a game-development baseline, not a calibrated political forecast. Tune distributions and rules with playtesting.
- Party strength values are synthetic balance parameters, not polling or factual claims.
- Initial leadership roles are held by AI candidates. Leadership does not imply elected office or cabinet appointment.
- Party-state units are generated selectively; not every party/state combination is included.

IMPORT NOTES
- Import CANDIDATES keyed by candidate_id and POLITICAL_PARTIES keyed by party_id.
- Resolve PARTY_LEADERSHIP and PARTY_STATE_UNITS references after master tables are loaded.
- Load CANDIDATE_AFFILIATIONS as relationship/history records, not candidate identity fields.
- ELECTION_CANDIDATURES is empty at initial state. Create records only after eligibility, nomination, and constituency rules pass.
- Treat NONE consistently as a sentinel, or convert it to null in application code.
- For mobile performance, load profiles on demand and simulate expensive behavior only for active political actors.

LIMITATIONS / REVIEW NOTES
- No official constituency data was sourced; included constituencies are explicitly fictional.
- Legal eligibility rules are not encoded as definitive law; implement jurisdiction-specific checks in game rules.
- Synthetic names may coincidentally resemble real names; identities and biographies are fictional.
- Runtime validation is still needed for compatible leadership roles, party switching, and candidature uniqueness.

NATION v0.0.7 UPDATE (2026-10-24)
- Candidate names replaced with coined Indian-inspired fictional names; IDs and all other attributes preserved.
- CONSTITUENCIES.csv rebuilt with 543 Lok Sabha and 4,123 Assembly records using LS-/AC- IDs.
- CONSTITUENCY_SEAT_COUNTS.csv records ECI baseline counts and source notes.
- Names and region assignments are fictional, not official ECI names or boundaries. See VALIDATION_REPORT.txt.
