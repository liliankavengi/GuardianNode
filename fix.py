import os

targets = [
    "C:\\Users\\kaven\\package.json",
    "C:\\Users\\kaven\\package-lock.json"
]

for t in targets:
    if os.path.exists(t):
        os.remove(t)
        print(f"Removed {t}")
