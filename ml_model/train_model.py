import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import pickle
import os

# ── Load dataset ──────────────────────────────────────────────────────────────
csv_path = os.path.join(os.path.dirname(__file__), "dataset.csv")
df = pd.read_csv(csv_path)

X = df[["skill_match", "location_match", "availability", "workload"]]
y = df["assigned"]

# ── Split ─────────────────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ── Train ─────────────────────────────────────────────────────────────────────
model = DecisionTreeClassifier(max_depth=5, random_state=42)
model.fit(X_train, y_train)

# ── Evaluate ──────────────────────────────────────────────────────────────────
y_pred   = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"Model Accuracy: {accuracy * 100:.2f}%")

# ── Save model ────────────────────────────────────────────────────────────────
model_path = os.path.join(os.path.dirname(__file__), "model.pkl")
with open(model_path, "wb") as f:
    pickle.dump({"model": model, "accuracy": round(accuracy * 100, 2)}, f)

print(f"Model saved to {model_path}")
