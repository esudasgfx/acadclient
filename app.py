import pandas as pd

# 1. Specify file name and sheet name
file_name = 'p6_schedule.xlsx' # 'data.xlsx'
sheet_to_read = 'WBS'  # Replace with your actual sheet name

# 2. Read the specific sheet into a pandas DataFrame
df = pd.read_excel(file_name, sheet_name=sheet_to_read)

# 3. Print the first 2 rows
print("--- First 2 Rows ---")
print(df.head(2))

