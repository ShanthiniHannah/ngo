import pandas as pd
import random

random.seed(42)
data = []

for _ in range(1000):
    skill_match    = random.randint(0, 1)
    location_match = random.randint(0, 1)
    availability   = random.randint(0, 1)
    workload       = random.randint(0, 5)

    # Simulate realistic assignment decision:
    # Volunteer is assigned if skill matches AND they are available,
    # with lower chance if workload is high.
    if skill_match == 1 and availability == 1:
        assigned = 0 if workload >= 4 and random.random() < 0.6 else 1
    else:
        assigned = 0

    data.append([skill_match, location_match, availability, workload, assigned])

df = pd.DataFrame(data, columns=[
    "skill_match",
    "location_match",
    "availability",
    "workload",
    "assigned"
])

import os
os.makedirs("ml_model", exist_ok=True)
df.to_csv("ml_model/dataset.csv", index=False)
print(f"Dataset generated! {len(df)} rows saved to ml_model/dataset.csv")
