
import pandas as pd

file_name = 'p6_schedule.xlsx'
sheet_to_read = 'Activities'

# Read the P6 Activities sheet
df = pd.read_excel(file_name, sheet_name=sheet_to_read)

# Print specific columns for the first 2 rows
print("--- Primavera P6 Schedule Sample (First 2 Rows) ---")
print(df[['Activity ID', 'Activity Name', 'Start Date', 'Budgeted Cost']].head(2))
