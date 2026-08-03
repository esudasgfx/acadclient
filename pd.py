import pandas as pd

# List all public methods/attributes in pandas
methods = [method for method in dir(pd) if not method.startswith('_')]

print(f"Total methods found: {len(methods)}")
print("\nSample reader/writer methods in pandas:")
print([m for m in methods if 'read_' in m or 'to_' in m][:10])
