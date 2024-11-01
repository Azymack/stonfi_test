## Task 3

#### click op

```mermaid
flowchart LR
	A0(("User"))
	A1{"Clicker"}

	A0 --> |op: click|A1
	A1 -.-> |op: excesses|A0
```

#### add_user/remove_user op

```mermaid
flowchart LR
	A0(("User"))
	A1{"Clicker"}

	A0 --> |op: add_user/remove_user|A1
	A1 -.-> |op: excesses|A0
```

## Task 4

I have changed the workflow a little so that I can re-use it in the task 5.
vote_id, which is stored in the Tracker contract checks whether it's user's first vote(vote_id = 0 initially) or repetition (vote_id = new_vote_id), or change (vote_id != 0 && vote_id != new_vote_id)

```mermaid
flowchart LR
	A0(("User"))
	A1{"Clicker"}
	A2["User<br/>Tracker<br/><small>check vote history</small>"]

	A0 --> |op: vote|A1
	A1 --> |op: internal_vote|A2
	A2 --> |op: response with status code|A1
  A1 -.-> |op: excesses|A0
```

## Task 5

The workflow of Task 5 is almost same as in the Task 4. Only difference is how vote history is stored.(whether in Clicker contract's dictionary or individual Vote contracts)

#### initial vote

```mermaid
flowchart LR
	A0(("User"))
	A1{"Clicker"}
	A2["User<br/>Tracker"]
	A3("Vote<br/>Option<br/>1")

	A0 --> |index: 0<br/>op: vote|A1
	A1 --> |index: 1<br/>op: check_vote|A2
	A2 -.-> |index: 2<br/>op: route_vote|A1
	A1 --> |index: 3<br/>op: add_vote|A3
    A3 -.-> |index: 4<br/>op: excesses|A0

	linkStyle 0 stroke:#ff4747,color:#ff4747
	linkStyle 1 stroke:#ff4747,color:#ff4747
	linkStyle 2 stroke:#02dbdb,color:#02dbdb
	linkStyle 3 stroke:#ff4747,color:#ff4747
	linkStyle 4 stroke:#0400f0,color:#0400f0

```

#### change vote

```mermaid
flowchart LR
	A0(("User"))
	A1{"Clicker"}
	A2["User<br/>Tracker"]
	A3("Vote<br/>Option<br/>1")
	A4("Vote<br/>Option<br/>2")

	A0 --> |index: 0<br/>op: vote|A1
	A1 --> |index: 1<br/>op: check_vote|A2
	A2 -.-> |index: 2<br/>op: route_vote|A1
	A1 --> |index: 3<br/>op: remove_vote|A3
	A1 --> |index: 4<br/>op: add_vote|A4
    A3 -.-> |index: 5<br/>op: excesses|A0
    A4 -.-> |index: 6<br/>op: excesses|A0

	linkStyle 0 stroke:#ff4747,color:#ff4747
	linkStyle 1 stroke:#ff4747,color:#ff4747
	linkStyle 2 stroke:#02dbdb,color:#02dbdb
	linkStyle 3 stroke:#ff4747,color:#ff4747
	linkStyle 4 stroke:#ff4747,color:#ff4747
	linkStyle 5 stroke:#0400f0,color:#0400f0
	linkStyle 6 stroke:#0400f0,color:#0400f0
```
