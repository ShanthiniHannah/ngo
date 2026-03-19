import pandas as pd
import random

def generate():
    random.seed(42)
    data = []

    for _ in range(1000):
        skill_match    = random.randint(0, 1)
        location_match = random.randint(0, 1)
        availability   = random.randint(0, 1)
        workload       = random.randint(0, 5)

        # Simulate realistic assignment decision:
        if skill_match == 1 and availability == 1:
            assigned = 0 if workload >= 4 and random.random() < 0.6 else 1
        else:
            assigned = 0

        data.append([skill_match, location_match, availability, workload, assigned])

    df = pd.DataFrame(data, columns=[
        "skill_match", "location_match", "availability", "workload", "assigned"
    ])

    base_dir = os.path.dirname(__file__)
    os.makedirs(base_dir, exist_ok=True)
    csv_path = os.path.join(base_dir, "dataset.csv")
    df.to_csv(csv_path, index=False)
    print(f"Dataset generated! {len(df)} rows saved to {csv_path}")

if __name__ == '__main__':
    generate()

